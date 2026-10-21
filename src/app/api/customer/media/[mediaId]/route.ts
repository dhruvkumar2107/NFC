import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, notFound } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-guard'
import { logActivity } from '@/lib/admin-log'

export const dynamic = 'force-dynamic'

async function loadMedia(mediaId: string, customerId: string) {
  return prisma.mediaItem.findFirst({
    where: { id: mediaId, album: { config: { card: { customer: { id: customerId } } } } },
    include: { album: { include: { config: { select: { cardId: true } } } } },
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { mediaId: string } }
) {
  const { user, error } = await requireAuth(request, 'customer')
  if (error) return error

  const media = await loadMedia(params.mediaId, user!.id)
  if (!media) return notFound('Media item not found')

  const body = await request.json().catch(() => ({}))
  const sortOrder = Number(body.sortOrder)
  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    return errorResponse('Invalid sortOrder', 400)
  }

  const updated = await prisma.mediaItem.update({
    where: { id: params.mediaId },
    data: { sortOrder },
  })

  return successResponse(updated)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { mediaId: string } }
) {
  const { user, error } = await requireAuth(request, 'customer')
  if (error) return error

  const media = await loadMedia(params.mediaId, user!.id)
  if (!media) return notFound('Media item not found')

  await prisma.mediaItem.delete({ where: { id: params.mediaId } })

  await logActivity({
    actorId: user!.id,
    actorRole: user!.role,
    action: 'media.delete',
    target: params.mediaId,
  })

  return successResponse({ success: true })
}