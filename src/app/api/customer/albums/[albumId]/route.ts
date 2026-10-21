import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, notFound } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-guard'
import { logActivity } from '@/lib/admin-log'

export const dynamic = 'force-dynamic'

async function loadAlbum(albumId: string, customerId: string) {
  return prisma.galleryAlbum.findFirst({
    where: { id: albumId, config: { card: { customer: { id: customerId } } } },
    include: { config: { select: { cardId: true } } },
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: { albumId: string } }
) {
  const { user, error } = await requireAuth(request, 'customer')
  if (error) return error

  const album = await loadAlbum(params.albumId, user!.id)
  if (!album) return notFound('Album not found')

  const media = await prisma.mediaItem.findMany({
    where: { albumId: params.albumId },
    orderBy: { sortOrder: 'asc' },
  })

  return successResponse({ ...album, media })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { albumId: string } }
) {
  const { user, error } = await requireAuth(request, 'customer')
  if (error) return error

  const album = await loadAlbum(params.albumId, user!.id)
  if (!album) return notFound('Album not found')

  await prisma.galleryAlbum.delete({ where: { id: params.albumId } })

  await logActivity({
    actorId: user!.id,
    actorRole: user!.role,
    action: 'album.delete',
    target: params.albumId,
  })

  return successResponse({ success: true })
}