import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth(request, 'admin')
  if (error) return error
  const body = await request.json()
  const allowed = ['name','price','imageUrl','active']
  const safeData: Record<string, any> = {}
  for (const k of allowed) { if (body[k] !== undefined) safeData[k] = body[k] }
  const updated = await prisma.cardDesign.update({ where: { id: params.id }, data: safeData })
  return successResponse(updated)
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth(request, 'admin')
  if (error) return error
  const cardCount = await prisma.card.count({ where: { designId: params.id } })
  if (cardCount > 0) return errorResponse('Cannot delete design with existing cards')
  await prisma.cardDesign.delete({ where: { id: params.id } })
  return successResponse({ deleted: true })
}
