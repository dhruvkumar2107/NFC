import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api-response'
import { authorizeCardAccess } from '@/lib/card-access'
import { logActivity } from '@/lib/admin-log'
import { isPdfValue, isSafeMediaUrl } from '@/lib/profile-media'

export const dynamic = 'force-dynamic'

const KINDS = ['catalogue', 'price_list', 'brochure', 'menu']

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await authorizeCardAccess(request, params.id)
  if (error) return error
  const catalogues = await prisma.catalogueDocument.findMany({
    where: { config: { cardId: params.id } },
    orderBy: { sortOrder: 'asc' },
  })
  return successResponse(catalogues)
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { access, error } = await authorizeCardAccess(request, params.id)
  if (error) return error

  const body = await request.json().catch(() => ({}))
  const url = typeof body.url === 'string' ? body.url.trim() : ''
  if (!url || !isSafeMediaUrl(url) || !isPdfValue(url)) return errorResponse('A valid PDF is required.')
  const title = String(body.title || 'Document').trim().slice(0, 120)
  const kind = KINDS.includes(body.kind) ? body.kind : 'catalogue'

  const config = await prisma.cardBuilderConfig.upsert({ where: { cardId: params.id }, update: {}, create: { cardId: params.id } })
  const count = await prisma.catalogueDocument.count({ where: { configId: config.id } })
  const doc = await prisma.catalogueDocument.create({
    data: {
      configId: config.id,
      title,
      url,
      kind,
      size: Number.isFinite(Number(body.size)) ? Math.round(Number(body.size)) : 0,
      sortOrder: count,
      visibility: body.visibility === 'private' ? 'private' : 'public',
    },
  })
  await logActivity({ actorId: access!.user.id, actorRole: access!.user.role, action: 'catalogue.create', target: doc.id })
  return successResponse(doc, 201)
}
