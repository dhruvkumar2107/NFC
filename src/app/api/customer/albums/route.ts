import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-guard'
import { logActivity } from '@/lib/admin-log'
import { MAX_ALBUM_MEDIA } from '@/lib/profile-media'

export const dynamic = 'force-dynamic'

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

  const albums = await prisma.galleryAlbum.findMany({
    where: { configId: config.id },
    include: {
      media: { orderBy: { sortOrder: 'asc' } },
    },
    orderBy: { sortOrder: 'asc' },
  })

  return successResponse(albums)
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth(request, 'customer')
  if (error) return error

  try {
    const config = await loadConfig(user!.id)
    if (!config) return errorResponse('No card configuration found.', 404)

    const body = await request.json().catch(() => ({}))
    const name = String(body.name || '').trim()
    if (!name) return errorResponse('Album name is required.', 400)

    const count = await prisma.galleryAlbum.count({ where: { configId: config.id } })
    const album = await prisma.galleryAlbum.create({
      data: {
        configId: config.id,
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        sortOrder: count,
      },
    })

    await logActivity({
      actorId: user!.id,
      actorRole: user!.role,
      action: 'album.create',
      target: album.id,
    })

    return successResponse(album, 201)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create album', 500)
  }
}