import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import crypto from 'crypto'
import razorpay from '@/lib/razorpay'
import { sendOrderConfirmationSMS } from '@/lib/sms'
import { fulfillPaidOrder } from '@/lib/orders'

// Orders created before the Razorpay order ID was stored are found through the
// receipt, which is always our own order ID.
async function findOrder(razorpayOrderId: string) {
  const order = await prisma.order.findFirst({ where: { razorpayPaymentLinkId: razorpayOrderId } })
  if (order) return order
  try {
    const rpOrder = await razorpay.orders.fetch(razorpayOrderId)
    if (rpOrder.receipt) return prisma.order.findFirst({ where: { orderId: rpOrder.receipt } })
  } catch (err: any) {
    console.error('Webhook: could not fetch Razorpay order', razorpayOrderId, err?.message)
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET

    if (!signature || !secret) {
      return new Response('Invalid request', { status: 400 })
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex')

    if (expectedSignature !== signature) {
      return new Response('Invalid signature', { status: 400 })
    }

    const event = JSON.parse(body)

    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const payment = event.payload.payment.entity
      const razorpayOrderId = payment.order_id
      if (!razorpayOrderId) return new Response('OK', { status: 200 })

      const order = await findOrder(razorpayOrderId)
      if (!order) {
        console.error('Webhook: no order for Razorpay order', razorpayOrderId)
        return new Response('OK', { status: 200 })
      }

      const result = await fulfillPaidOrder({
        orderDbId: order.id,
        razorpayPaymentId: payment.id,
        razorpayOrderId,
      })

      if (!result.alreadyProcessed && result.customerMobile) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        sendOrderConfirmationSMS({
          orderId: result.orderId,
          cardId: result.cardId!,
          nfcCardNumber: result.nfcCardNumber,
          design: result.designName,
          amount: result.amount,
          customerName: result.customerName,
          customerMobile: result.customerMobile,
          baseUrl,
        }).catch(err => console.error('SMS send error (webhook):', err))
      }
    }

    if (event.event === 'payment.failed') {
      const payment = event.payload.payment.entity
      const order = payment.order_id ? await findOrder(payment.order_id) : null

      if (order && order.status === 'Pending') {
        console.error('Payment failed for order:', order.orderId, {
          paymentId: payment.id,
          errorCode: payment.error_code,
          errorDescription: payment.error_description,
        })
        await prisma.order.updateMany({
          where: { id: order.id, status: 'Pending' },
          data: {
            status: 'Payment Failed',
            razorpayPaymentId: payment.id || null,
          },
        })
      }
    }

    return new Response('OK', { status: 200 })
  } catch (err: any) {
    console.error('Webhook error:', err.message)
    return new Response('Internal error', { status: 500 })
  }
}
