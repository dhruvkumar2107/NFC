import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, notFound } from '@/lib/api-response'
import { authorizeCardAccess } from '@/lib/card-access'
import { logActivity } from '@/lib/admin-log'

export const dynamic = 'force-dynamic'

async function loadAlbum(albumId: string) {
  return prisma.galleryAlbum.findUnique({ where: { id: albumId }, include: { config: { select: { cardId: true } } } })
}

export async function PATCH(request: NextRequest, { params }: { params: { albumId: string } }) {
  const album = await loadAlbum(params.albumId)
  if (!album) return notFound('Album not found')
  const { access, error } = await authorizeCardAccess(request, album.config.cardId)
  if (error) return error

  const body = await request.json().catch(() => ({}))
  const data: any = {}
  if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim().slice(0, 80)
  if (typeof body.description === 'string') data.description = body.description.slice(0, 500)
  if (typeof body.public === 'boolean') data.public = body.public
  if (Number.isFinite(Number(body.sortOrder))) data.sortOrder = Math.round(Number(body.sortOrder))

  const updated = await prisma.galleryAlbum.update({ where: { id: params.albumId }, data })
  await logActivity({ actorId: access!.user.id, actorRole: access!.user.role, action: 'album.update', target: params.albumId })
  return successResponse(updated)
}

export async function DELETE(request: NextRequest, { params }: { params: { albumId: string } }) {
  const album = await loadAlbum(params.albumId)
  if (!album) return notFound('Album not found')
  const { access, error } = await authorizeCardAccess(request, album.config.cardId)
  if (error) return error

  await prisma.galleryAlbum.delete({ where: { id: params.albumId } })
  await logActivity({ actorId: access!.user.id, actorRole: access!.user.role, action: 'album.delete', target: params.albumId })
  return successResponse({ deleted: true })
}
