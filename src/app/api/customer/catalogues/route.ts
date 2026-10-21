import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-guard'
import { logActivity } from '@/lib/admin-log'
import { isPdfValue, isSafeMediaUrl } from '@/lib/profile-media'

export const dynamic = 'force-dynamic'

const KINDS = ['catalogue', 'price_list', 'brochure', 'menu']

async function loadConfig(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { cardId: true },
  })
  if (!customer?.cardId) return null

  const config = await prisma.cardBuilderConfig.findUnique({
    where: { cardId: customer.cardId },
    select: { id: true },
  })
  return config
}

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request, 'customer')
  if (error) return error

  const config = await loadConfig(user!.id)
  if (!config) return successResponse([])

  const catalogues = await prisma.catalogueDocument.findMany({
    where: { configId: config.id },
    orderBy: { sortOrder: 'asc' },
  })
  return successResponse(catalogues)
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth(request, 'customer')
  if (error) return error

  const config = await loadConfig(user!.id)
  if (!config) return errorResponse('No card configuration found.', 404)

  const body = await request.json().catch(() => ({}))
  const url = typeof body.url === 'string' ? body.url.trim() : ''
  if (!url || !isSafeMediaUrl(url) || !isPdfValue(url)) return errorResponse('A valid PDF is required.')
  const title = String(body.title || 'Document').trim().slice(0, 120)
  const kind = KINDS.includes(body.kind) ? body.kind : 'catalogue'

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
  await logActivity({ actorId: user!.id, actorRole: user!.role, action: 'catalogue.create', target: doc.id })
  return successResponse(doc, 201)
}