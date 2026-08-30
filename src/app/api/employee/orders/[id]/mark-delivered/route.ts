import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error } = await requireAuth(request, 'employee')
    if (error) return error

    const order = await prisma.order.findUnique({ where: { id: params.id } })
    if (!order) return errorResponse('Order not found', 404)
    if (order.employeeId !== user!.id) return errorResponse('Not your order', 403)

    const updated = await prisma.order.update({
      where: { id: params.id },
      data: { status: 'Delivered' },
    })

    if (order.cardId) {
      await prisma.card.update({
        where: { id: order.cardId },
        data: { status: 'Delivered' },
      })
    }

    return successResponse(updated)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to mark order as delivered', 500)
  }
}