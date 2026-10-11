import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api-response'
import { authorizeCardAccess } from '@/lib/card-access'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await authorizeCardAccess(request, params.id)
  if (error) return error
  const categories = await prisma.productCategory.findMany({
    where: { config: { cardId: params.id } },
    orderBy: { sortOrder: 'asc' },
  })
  return successResponse(categories)
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await authorizeCardAccess(request, params.id)
  if (error) return error
  const body = await request.json().catch(() => ({}))
  const name = String(body.name || '').trim().slice(0, 80)
  if (!name) return errorResponse('Category name is required.')
  const config = await prisma.cardBuilderConfig.upsert({ where: { cardId: params.id }, update: {}, create: { cardId: params.id } })
  const count = await prisma.productCategory.count({ where: { configId: config.id } })
  const category = await prisma.productCategory.create({ data: { configId: config.id, name, sortOrder: count } })
  return successResponse(category, 201)
}
