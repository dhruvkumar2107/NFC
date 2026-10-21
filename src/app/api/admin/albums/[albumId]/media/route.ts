import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, notFound } from '@/lib/api-response'
import { authorizeCardAccess } from '@/lib/card-access'
import { logActivity } from '@/lib/admin-log'
import { isMediaValue, isSafeMediaUrl, isVideoValue, guessVideoMime, MAX_ALBUM_MEDIA } from '@/lib/profile-media'

export const dynamic = 'force-dynamic'

async function loadAlbum(albumId: string) {
  return prisma.galleryAlbum.findUnique({ where: { id: albumId }, include: { config: { select: { cardId: true } } } })
}

export async function GET(request: NextRequest, { params }: { params: { albumId: string } }) {
  const album = await loadAlbum(params.albumId)
  if (!album) return notFound('Album not found')
  const { error } = await authorizeCardAccess(request, album.config.cardId)
  if (error) return error
  const media = await prisma.mediaItem.findMany({ where: { albumId: params.albumId }, orderBy: { sortOrder: 'asc' } })
  return successResponse(media)
}

export async function POST(request: NextRequest, { params }: { params: { albumId: string } }) {
  const album = await loadAlbum(params.albumId)
  if (!album) return notFound('Album not found')
  const { access, error } = await authorizeCardAccess(request, album.config.cardId)
  if (error) return error

  try {
    const body = await request.json().catch(() => ({}))
    const rawItems = Array.isArray(body.items) ? body.items : [body]
    const existing = await prisma.mediaItem.count({ where: { albumId: params.albumId } })
    if (existing >= MAX_ALBUM_MEDIA) {
      return errorResponse(`An album can hold up to ${MAX_ALBUM_MEDIA} items.`)
    }
    const created: any[] = []

    for (const item of rawItems.slice(0, MAX_ALBUM_MEDIA)) {
      const url = typeof item.url === 'string' ? item.url.trim() : ''
      if (!url || !isSafeMediaUrl(url) || !isMediaValue(url)) continue
      const isVideo = isVideoValue(url)
      const media = await prisma.mediaItem.create({
        data: {
          albumId: params.albumId,
          url,
          thumbnailUrl: typeof item.thumbnailUrl === 'string' ? item.thumbnailUrl : null,
          name: typeof item.name === 'string' ? item.name.slice(0, 160) : null,
          mime: typeof item.mime === 'string' && item.mime ? item.mime.slice(0, 60) : isVideo ? guessVideoMime(url) : 'image/jpeg',
          size: Number.isFinite(Number(item.size)) ? Math.round(Number(item.size)) : 0,
          width: Number.isFinite(Number(item.width)) ? Math.round(Number(item.width)) : null,
          height: Number.isFinite(Number(item.height)) ? Math.round(Number(item.height)) : null,
          sortOrder: existing + created.length,
          visibility: item.visibility === 'private' ? 'private' : 'public',
        },
      })
      created.push(media)
    }

    if (created.length === 0) return errorResponse('No valid images or videos to add.')
    await logActivity({ actorId: access!.user.id, actorRole: access!.user.role, action: 'media.create', target: params.albumId, metadata: { count: created.length } })
    return successResponse(created, 201)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to add media', 500)
  }
}
