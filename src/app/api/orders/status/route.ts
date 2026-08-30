import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    if (!orderId) return errorResponse('Order ID is required')

    const order = await prisma.order.findFirst({
      where: { orderId },
      include: { customer: true, card: true, design: true },
    })
    if (!order) return errorResponse('Order not found', 404)

    return successResponse({
      orderId: order.orderId,
      cardId: order.card?.cardId,
      amount: order.amount,
      status: order.status,
      design: order.design?.name,
      customerEmail: order.customer?.email,
      customerName: order.customer?.name,
      customerMobile: order.customer?.mobile,
      customerWhatsapp: order.customer?.whatsapp,
      createdAt: order.createdAt,
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch order', 500)
  }
}
