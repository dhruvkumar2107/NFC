import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, notFound } from '@/lib/api-response'
import { authorizeCardAccess } from '@/lib/card-access'
import { logActivity } from '@/lib/admin-log'

export const dynamic = 'force-dynamic'

async function loadMedia(mediaId: string) {
  return prisma.mediaItem.findUnique({
    where: { id: mediaId },
    include: { album: { include: { config: { select: { cardId: true } } } } },
  })
}

export async function PATCH(request: NextRequest, { params }: { params: { mediaId: string } }) {
  const media = await loadMedia(params.mediaId)
  if (!media) return notFound('Media not found')
  const { access, error } = await authorizeCardAccess(request, media.album.config.cardId)
  if (error) return error

  const body = await request.json().catch(() => ({}))
  const data: any = {}
  if (typeof body.name === 'string') data.name = body.name.slice(0, 160)
  if (typeof body.visibility === 'string' && ['public', 'private'].includes(body.visibility)) data.visibility = body.visibility
  if (Number.isFinite(Number(body.sortOrder))) data.sortOrder = Math.round(Number(body.sortOrder))
  if (typeof body.url === 'string' && body.url.trim()) data.url = body.url.trim()

  const updated = await prisma.mediaItem.update({ where: { id: params.mediaId }, data })
  await logActivity({ actorId: access!.user.id, actorRole: access!.user.role, action: 'media.update', target: params.mediaId })
  return successResponse(updated)
}

export async function DELETE(request: NextRequest, { params }: { params: { mediaId: string } }) {
  const media = await loadMedia(params.mediaId)
  if (!media) return notFound('Media not found')
  const { access, error } = await authorizeCardAccess(request, media.album.config.cardId)
  if (error) return error

  await prisma.mediaItem.delete({ where: { id: params.mediaId } })
  await logActivity({ actorId: access!.user.id, actorRole: access!.user.role, action: 'media.delete', target: params.mediaId })
  return successResponse({ deleted: true })
}
