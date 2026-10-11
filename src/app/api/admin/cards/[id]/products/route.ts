import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api-response'
import { authorizeCardAccess } from '@/lib/card-access'
import { logActivity } from '@/lib/admin-log'
import { sanitizeAttributes } from '@/lib/product-utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await authorizeCardAccess(request, params.id)
  if (error) return error
  const products = await prisma.product.findMany({
    where: { config: { cardId: params.id } },
    include: { category: { select: { id: true, name: true } } },
    orderBy: { sortOrder: 'asc' },
  })
  return successResponse(products)
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { access, error } = await authorizeCardAccess(request, params.id)
  if (error) return error

  try {
    const body = await request.json().catch(() => ({}))
    const items = Array.isArray(body.items) ? body.items : [body]
    const config = await prisma.cardBuilderConfig.upsert({ where: { cardId: params.id }, update: {}, create: { cardId: params.id } })
    const existing = await prisma.product.count({ where: { configId: config.id } })
    const created: any[] = []

    for (const item of items.slice(0, 100)) {
      const name = String(item.name || '').trim().slice(0, 160)
      if (!name) continue
      const product = await prisma.product.create({
        data: {
          configId: config.id,
          categoryId: typeof item.categoryId === 'string' && item.categoryId ? item.categoryId : null,
          name,
          description: item.description ? String(item.description).slice(0, 2000) : null,
          imageUrl: typeof item.imageUrl === 'string' && item.imageUrl ? item.imageUrl : null,
          mrp: Number.isFinite(Number(item.mrp)) ? Number(item.mrp) : null,
          price: Number.isFinite(Number(item.price)) ? Number(item.price) : null,
          discountPct: Number.isFinite(Number(item.discountPct)) ? Number(item.discountPct) : null,
          stockStatus: ['in_stock', 'out_of_stock', 'pre_order'].includes(item.stockStatus) ? item.stockStatus : 'in_stock',
          attributes: JSON.stringify(sanitizeAttributes(item.attributes)),
          sortOrder: existing + created.length,
          active: item.active !== false,
        },
      })
      created.push(product)
    }

    if (created.length === 0) return errorResponse('No valid products to add.')
    await logActivity({ actorId: access!.user.id, actorRole: access!.user.role, action: 'product.create', target: params.id, metadata: { count: created.length } })
    return successResponse(created, 201)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to add products', 500)
  }
}
