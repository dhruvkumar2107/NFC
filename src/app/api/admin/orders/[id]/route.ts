import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { customer: true, employee: true, card: true, design: true },
    })
    if (!order) return errorResponse('Order not found', 404)
    return successResponse(order)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch order', 500)
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error
    const body = await request.json()
    const allowed: Record<string, boolean> = { status: true, commissionAmount: true, commissionPoints: true, attributionType: true }
    const safeData: Record<string, any> = {}
    for (const [k, v] of Object.entries(body)) { if (allowed[k]) safeData[k] = v }
    const updated = await prisma.order.update({ where: { id: params.id }, data: safeData })
    if (safeData.status === 'Delivered' && updated.cardId) {
      await prisma.card.update({ where: { id: updated.cardId }, data: { status: 'Delivered' } })
    }
    return successResponse(updated)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update order', 500)
  }
}
