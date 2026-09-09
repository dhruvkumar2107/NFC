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

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({ where: { orderId } })
      if (!order) throw new Error('Order not found')

      if (order.status !== 'Pending') {
        const existingCard = await tx.card.findFirst({ where: { orderId: order.id } })
        return {
          alreadyProcessed: true,
          orderId: order.orderId,
          cardId: existingCard?.cardId || null,
          amount: order.amount,
          status: order.status,
        }
      }

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
        data: {
          cardId: card.id,
          ...(order.employeeId ? { soldByEmployeeId: order.employeeId } : {}),
        },
      })
      const commissionPoints = order.commissionPoints > 0 ? order.commissionPoints : (order.employeeId ? 100 : 0)
      const commissionAmount = (order.commissionAmount && order.commissionAmount > 0) ? order.commissionAmount : (order.employeeId ? 100 : 0)

      await tx.order.update({
        where: { id: order.id },
        data: {
          cardId: card.id,
          status: 'Payment Received',
          commissionPoints,
          commissionAmount,
          razorpayPaymentId: razorpay_payment_id || null,
          razorpayPaymentLinkId: razorpay_order_id || null,
        },
      })

      if (order.employeeId && commissionPoints > 0) {
        await tx.employee.update({
          where: { id: order.employeeId },
          data: {
            totalPoints: { increment: commissionPoints },
            availablePoints: { increment: commissionPoints },
          },
        })
        await tx.walletTransaction.create({
          data: {
            employeeId: order.employeeId,
            orderId: order.id,
            type: 'commission_earned',
            points: commissionPoints,
            description: `Commission for order ${orderId}: ${commissionPoints} points (₹${commissionAmount})`,
          },
        })
      }

      const customer = await tx.customer.findUnique({ where: { id: order.customerId! } })

      return {
        alreadyProcessed: false,
        orderId: order.orderId,
        cardId: card.cardId,
        amount: order.amount,
        design: order.designId,
        customerEmail: customer?.email,
        status: 'Payment Received',
      }
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

    return successResponse({
      orderId: result.orderId,
      cardId: result.cardId,
      amount: result.amount,
      design: result.design,
      customerEmail: result.customerEmail,
      status: result.status,
      message: 'Payment verified and order confirmed!',
    })
  } catch (err: any) {
    console.error('Verify error:', err.message, err.stack)
    if (err.message === 'Order not found') return errorResponse('Order not found', 404)
    return errorResponse(err.message || 'Payment verification failed', 500)
  }
}
