import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api-response'
import crypto from 'crypto'
import razorpay from '@/lib/razorpay'
import { sendOrderConfirmationSMS } from '@/lib/sms'
import { fulfillPaidOrder } from '@/lib/orders'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = body

    if (!orderId) return errorResponse('Order ID is required')

    const order = await prisma.order.findFirst({ where: { orderId } })
    if (!order) return errorResponse('Order not found', 404)

    const hasRealKeys = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_SECRET !== 'placeholder_secret'

    if (hasRealKeys) {
      if (!razorpay_payment_id || !razorpay_signature || !razorpay_order_id) {
        return errorResponse('Payment data is required', 400)
      }

      // The payment must belong to this order's Razorpay order, otherwise a
      // payment made for one order could be replayed to confirm another.
      if (order.razorpayPaymentLinkId && order.razorpayPaymentLinkId !== razorpay_order_id) {
        return errorResponse('Payment does not match this order', 400)
      }

      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex')

      const signatureOk = expectedSignature === razorpay_signature
      if (!signatureOk || !order.razorpayPaymentLinkId) {
        try {
          const rpOrder = await razorpay.orders.fetch(razorpay_order_id)
          if (rpOrder.receipt !== order.orderId) {
            return errorResponse('Payment does not match this order', 400)
          }
          if (!signatureOk && !(rpOrder.status === 'paid' || Number(rpOrder.amount_paid) > 0)) {
            return errorResponse('Payment verification failed - invalid signature', 400)
          }
        } catch {
          return errorResponse('Payment verification failed - invalid signature', 400)
        }
      }
    }

    const result = await fulfillPaidOrder({
      orderDbId: order.id,
      razorpayPaymentId: razorpay_payment_id || null,
      razorpayOrderId: razorpay_order_id || null,
    })

    if (result.alreadyProcessed) {
      return successResponse({
        orderId: result.orderId,
        cardId: result.cardId,
        amount: result.amount,
        status: result.status,
        message: 'Order already processed',
      })
    }

    if (result.customerMobile && result.customerName) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      sendOrderConfirmationSMS({
        orderId: result.orderId,
        cardId: result.cardId!,
        design: result.designName,
        amount: result.amount,
        customerName: result.customerName,
        customerMobile: result.customerMobile,
        baseUrl,
      }).catch(err => console.error('SMS send error:', err))
    }

    return successResponse({
      orderId: result.orderId,
      cardId: result.cardId,
      amount: result.amount,
      design: result.designName,
      status: result.status,
      message: 'Payment verified and order confirmed!',
    })
  } catch (err: any) {
    console.error('Verify error:', err.message, err.stack)
    if (err.message === 'Order not found') return errorResponse('Order not found', 404)
    return errorResponse(err.message || 'Payment verification failed', 500)
  }
}
