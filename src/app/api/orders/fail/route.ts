import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, reason, paymentId } = body

    if (!orderId) {
      return errorResponse('Order ID is required', 400)
    }

    const order = await prisma.order.findFirst({
      where: { orderId },
    })

    if (!order) {
      return errorResponse('Order not found', 404)
    }

    // Only update if it hasn't already been marked as Payment Received or Delivered
    if (order.status === 'Payment Received' || order.status === 'Delivered') {
      return successResponse({
        orderId: order.orderId,
        status: order.status,
        message: 'Order already completed',
      })
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'Payment Failed',
        razorpayPaymentId: paymentId || order.razorpayPaymentId || null,
      },
    })

    return successResponse({
      orderId: updated.orderId,
      status: updated.status,
      message: 'Order marked as payment failed',
    })
  } catch (err: any) {
    console.error('Order fail route error:', err)
    return errorResponse(err.message || 'Failed to record payment failure', 500)
  }
}
