import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { generateCardId } from '@/lib/auth'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')

    if (!signature || !process.env.RAZORPAY_KEY_SECRET) {
      return new Response('Invalid request', { status: 400 })
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex')

    if (expectedSignature !== signature) {
      return new Response('Invalid signature', { status: 400 })
    }

    const event = JSON.parse(body)

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity
      const razorpayOrderId = payment.order_id
      const razorpayPaymentId = payment.id

      await prisma.$transaction(async (tx) => {
        const order = await tx.order.findFirst({
          where: { razorpayPaymentLinkId: razorpayOrderId },
        })

        if (!order || order.status !== 'Pending') return

        const cardIdNum = generateCardId()
        const card = await tx.card.create({
          data: {
            cardId: cardIdNum,
            orderId: order.id,
            soldByEmployeeId: order.employeeId,
            designId: order.designId,
            status: 'Pending',
          },
        })

        await tx.customer.update({
          where: { id: order.customerId! },
          data: { cardId: card.id },
        })

        await tx.order.update({
          where: { id: order.id },
          data: {
            cardId: card.id,
            status: 'Payment Received',
            razorpayPaymentId,
            razorpayPaymentLinkId: razorpayOrderId,
          },
        })

        if (order.employeeId && order.commissionPoints > 0) {
          await tx.employee.update({
            where: { id: order.employeeId },
            data: {
              totalPoints: { increment: order.commissionPoints },
              availablePoints: { increment: order.commissionPoints },
            },
          })
          await tx.walletTransaction.create({
            data: {
              employeeId: order.employeeId,
              orderId: order.id,
              type: 'commission_earned',
              points: order.commissionPoints,
              description: `Commission for order ${order.orderId}: ${order.commissionPoints} points (₹${order.commissionAmount})`,
            },
          })
        }
      })
    }

    if (event.event === 'payment.failed') {
      const payment = event.payload.payment.entity
      const razorpayOrderId = payment.order_id

      const order = await prisma.order.findFirst({
        where: { razorpayPaymentLinkId: razorpayOrderId },
      })

      if (order && order.status === 'Pending') {
        console.error('Payment failed for order:', order.orderId, {
          paymentId: payment.id,
          errorCode: payment.error_code,
          errorDescription: payment.error_description,
        })
      }
    }

    return new Response('OK', { status: 200 })
  } catch (err: any) {
    console.error('Webhook error:', err.message)
    return new Response('Internal error', { status: 500 })
  }
}
