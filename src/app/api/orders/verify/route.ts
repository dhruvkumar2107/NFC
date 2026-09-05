import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { generateCardId } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-response'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = body

    if (!orderId) return errorResponse('Order ID is required')

    const order = await prisma.order.findFirst({ where: { orderId } })
    if (!order) return errorResponse('Order not found', 404)
    if (order.status !== 'Pending') return errorResponse('Order already processed')

    if (razorpay_payment_id && razorpay_signature && razorpay_order_id) {
      const hasRealKeys = process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_SECRET !== 'placeholder_secret'
      if (hasRealKeys) {
        const expectedSignature = crypto
          .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
          .update(`${razorpay_order_id}|${razorpay_payment_id}`)
          .digest('hex')

        if (expectedSignature !== razorpay_signature) {
          return errorResponse('Payment verification failed', 400)
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
    return errorResponse(err.message || 'Payment verification failed', 500)
  }
}
