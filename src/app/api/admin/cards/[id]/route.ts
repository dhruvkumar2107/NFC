import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error
    const card = await prisma.card.findUnique({
      where: { id: params.id },
      include: { design: true, employee: true, order: { include: { customer: true } } },
    })
    if (!card) return errorResponse('Card not found', 404)
    const customer = await prisma.customer.findUnique({ where: { cardId: card.id } })
    return successResponse({ ...card, customer })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch card', 500)
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error
    const body = await request.json()
    const allowed = ['status','designId','activatedAt']
    const safeData: Record<string, any> = {}
    for (const k of allowed) { if (body[k] !== undefined) safeData[k] = body[k] }
    if (safeData.status === 'Active') safeData.activatedAt = new Date()
    const updated = await prisma.card.update({ where: { id: params.id }, data: safeData })
    return successResponse(updated)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update card', 500)
  }
}
