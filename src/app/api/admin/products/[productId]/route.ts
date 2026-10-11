import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, notFound } from '@/lib/api-response'
import { authorizeCardAccess } from '@/lib/card-access'
import { logActivity } from '@/lib/admin-log'
import { sanitizeAttributes } from '@/lib/product-utils'

export const dynamic = 'force-dynamic'

async function loadProduct(productId: string) {
  return prisma.product.findUnique({ where: { id: productId }, include: { config: { select: { cardId: true } } } })
}

export async function PATCH(request: NextRequest, { params }: { params: { productId: string } }) {
  const product = await loadProduct(params.productId)
  if (!product) return notFound('Product not found')
  const { access, error } = await authorizeCardAccess(request, product.config.cardId)
  if (error) return error

  const body = await request.json().catch(() => ({}))
  const data: any = {}
  if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim().slice(0, 160)
  if (typeof body.description === 'string') data.description = body.description.slice(0, 2000)
  if (typeof body.imageUrl === 'string' || body.imageUrl === null) data.imageUrl = body.imageUrl || null
  if ('mrp' in body) data.mrp = Number.isFinite(Number(body.mrp)) ? Number(body.mrp) : null
  if ('price' in body) data.price = Number.isFinite(Number(body.price)) ? Number(body.price) : null
  if ('discountPct' in body) data.discountPct = Number.isFinite(Number(body.discountPct)) ? Number(body.discountPct) : null
  if (typeof body.stockStatus === 'string' && ['in_stock', 'out_of_stock', 'pre_order'].includes(body.stockStatus)) data.stockStatus = body.stockStatus
  if (body.attributes && typeof body.attributes === 'object') data.attributes = JSON.stringify(sanitizeAttributes(body.attributes))
  if (typeof body.categoryId === 'string' || body.categoryId === null) data.categoryId = body.categoryId || null
  if (typeof body.active === 'boolean') data.active = body.active
  if (Number.isFinite(Number(body.sortOrder))) data.sortOrder = Math.round(Number(body.sortOrder))

  const updated = await prisma.product.update({ where: { id: params.productId }, data })
  await logActivity({ actorId: access!.user.id, actorRole: access!.user.role, action: 'product.update', target: params.productId })
  return successResponse(updated)
}

export async function DELETE(request: NextRequest, { params }: { params: { productId: string } }) {
  const product = await loadProduct(params.productId)
  if (!product) return notFound('Product not found')
  const { access, error } = await authorizeCardAccess(request, product.config.cardId)
  if (error) return error

  await prisma.product.delete({ where: { id: params.productId } })
  await logActivity({ actorId: access!.user.id, actorRole: access!.user.role, action: 'product.delete', target: params.productId })
  return successResponse({ deleted: true })
}
