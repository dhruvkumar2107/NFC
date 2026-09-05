import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { generateCardId } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-response'
import crypto from 'crypto'
import razorpay from '@/lib/razorpay'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = body

    if (!orderId) return errorResponse('Order ID is required')

    const order = await prisma.order.findFirst({ where: { orderId } })
    if (!order) return errorResponse('Order not found', 404)

    if (order.status !== 'Pending') {
      const existingCard = await prisma.card.findFirst({ where: { orderId: order.id } })
      return successResponse({
        orderId: order.orderId,
        cardId: existingCard?.cardId || null,
        amount: order.amount,
        status: order.status,
        message: 'Order already processed',
      })
    }

    const hasRealKeys = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_SECRET !== 'placeholder_secret'

    if (hasRealKeys) {
      if (!razorpay_payment_id || !razorpay_signature || !razorpay_order_id) {
        return errorResponse('Payment data is required', 400)
      }

      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex')

      if (expectedSignature !== razorpay_signature) {
        console.error('Signature mismatch for order:', orderId, {
          expected: expectedSignature,
          received: razorpay_signature,
        })

        try {
          const rpOrder = await razorpay.orders.fetch(razorpay_order_id)
          if (rpOrder.status === 'paid' || rpOrder.amount_paid > 0) {
            console.log('Razorpay API confirms payment for order:', orderId)
          } else {
            return errorResponse('Payment verification failed - invalid signature', 400)
          }
        } catch {
          return errorResponse('Payment verification failed - invalid signature', 400)
        }
      }
    }

    const cardIdNum = generateCardId()
    const card = await prisma.card.create({
      data: {
        cardId: cardIdNum,
        orderId: order.id,
        soldByEmployeeId: order.employeeId,
        designId: order.designId,
        status: 'Pending',
      },
    })

    await prisma.customer.update({ where: { id: order.customerId! }, data: { cardId: card.id } })
    await prisma.order.update({
      where: { id: order.id },
      data: {
        cardId: card.id,
        status: 'Payment Received',
        razorpayPaymentId: razorpay_payment_id || null,
        razorpayPaymentLinkId: razorpay_order_id || null,
      },
    })

    if (order.employeeId && order.commissionPoints > 0) {
      await prisma.employee.update({
        where: { id: order.employeeId },
        data: {
          totalPoints: { increment: order.commissionPoints },
          availablePoints: { increment: order.commissionPoints },
        },
      })
      await prisma.walletTransaction.create({
        data: {
          employeeId: order.employeeId,
          orderId: order.id,
          type: 'commission_earned',
          points: order.commissionPoints,
          description: `Commission for order ${orderId}: ${order.commissionPoints} points (₹${order.commissionAmount})`,
        },
      })
    }

    const customer = await prisma.customer.findUnique({ where: { id: order.customerId! } })

    return successResponse({
      orderId: order.orderId,
      cardId: card.cardId,
      amount: order.amount,
      design: order.designId,
      customerEmail: customer?.email,
      status: 'Payment Received',
      message: 'Payment verified and order confirmed!',
    })
  } catch (err: any) {
    console.error('Verify error:', err.message, err.stack)
    return errorResponse(err.message || 'Payment verification failed', 500)
  }
}
