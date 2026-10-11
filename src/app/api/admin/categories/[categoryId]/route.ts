import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, notFound } from '@/lib/api-response'
import { authorizeCardAccess } from '@/lib/card-access'

export const dynamic = 'force-dynamic'

async function loadCategory(categoryId: string) {
  return prisma.productCategory.findUnique({ where: { id: categoryId }, include: { config: { select: { cardId: true } } } })
}

export async function PATCH(request: NextRequest, { params }: { params: { categoryId: string } }) {
  const category = await loadCategory(params.categoryId)
  if (!category) return notFound('Category not found')
  const { error } = await authorizeCardAccess(request, category.config.cardId)
  if (error) return error
  const body = await request.json().catch(() => ({}))
  const data: any = {}
  if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim().slice(0, 80)
  if (Number.isFinite(Number(body.sortOrder))) data.sortOrder = Math.round(Number(body.sortOrder))
  const updated = await prisma.productCategory.update({ where: { id: params.categoryId }, data })
  return successResponse(updated)
}

export async function DELETE(request: NextRequest, { params }: { params: { categoryId: string } }) {
  const category = await loadCategory(params.categoryId)
  if (!category) return notFound('Category not found')
  const { error } = await authorizeCardAccess(request, category.config.cardId)
  if (error) return error
  await prisma.productCategory.delete({ where: { id: params.categoryId } })
  return successResponse({ deleted: true })
}
