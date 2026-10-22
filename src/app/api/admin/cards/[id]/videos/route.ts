import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, notFound } from '@/lib/api-response'
import { authorizeCardAccess } from '@/lib/card-access'
import { logActivity } from '@/lib/admin-log'
import { MAX_VIDEOS, parseVideoEntries, validateVideoList } from '@/lib/profile-media'

export const dynamic = 'force-dynamic'

async function loadCustomer(cardId: string) {
  return prisma.customer.findUnique({
    where: { cardId },
    select: { id: true, name: true, videos: true },
  })
}

function readVideos(raw: string | null | undefined) {
  return parseVideoEntries(raw)
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await authorizeCardAccess(request, params.id)
  if (error) return error

  const customer = await loadCustomer(params.id)
  if (!customer) return notFound('Customer not found for this card')

  return successResponse({ videos: readVideos(customer.videos), max: MAX_VIDEOS })
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { access, error } = await authorizeCardAccess(request, params.id)
  if (error) return error

  try {
    const customer = await loadCustomer(params.id)
    if (!customer) return notFound('Customer not found for this card')

    const body = await request.json().catch(() => ({}))
    const rawItems = Array.isArray(body.items) ? body.items : [body]
    if (rawItems.length === 0) return errorResponse('No videos to add.')

    const incoming = validateVideoList(rawItems, MAX_VIDEOS)
    if (!incoming.ok) return errorResponse(incoming.error, 400)

    const existing = readVideos(customer.videos)
    if (existing.length + incoming.value.length > MAX_VIDEOS) {
      return errorResponse(
        `Maximum ${MAX_VIDEOS} videos allowed per card (already ${existing.length}).`,
        400,
      )
    }

    const videos = [...existing, ...incoming.value]
    await prisma.customer.update({
      where: { id: customer.id },
      data: { videos: JSON.stringify(videos) },
    })

    await logActivity({
      actorId: access!.user.id,
      actorRole: access!.user.role,
      action: 'card.videos.add',
      target: params.id,
      metadata: { count: incoming.value.length, total: videos.length },
    })

    return successResponse({ videos, max: MAX_VIDEOS }, 201)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to add videos', 500)
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { access, error } = await authorizeCardAccess(request, params.id)
  if (error) return error

  try {
    const customer = await loadCustomer(params.id)
    if (!customer) return notFound('Customer not found for this card')

    const body = await request.json().catch(() => ({}))
    const rawList = Array.isArray(body.videos) ? body.videos : []
    const checked = validateVideoList(rawList, MAX_VIDEOS)
    if (!checked.ok) return errorResponse(checked.error, 400)

    await prisma.customer.update({
      where: { id: customer.id },
      data: { videos: JSON.stringify(checked.value) },
    })

    await logActivity({
      actorId: access!.user.id,
      actorRole: access!.user.role,
      action: 'card.videos.update',
      target: params.id,
      metadata: { count: checked.value.length },
    })

    return successResponse({ videos: checked.value, max: MAX_VIDEOS })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update videos', 500)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { access, error } = await authorizeCardAccess(request, params.id)
  if (error) return error

  try {
    const customer = await loadCustomer(params.id)
    if (!customer) return notFound('Customer not found for this card')

    const body = await request.json().catch(() => ({}))
    const existing = readVideos(customer.videos)
    const index = Number(body.index)
    const url = typeof body.url === 'string' ? body.url : ''

    let videos = existing
    if (Number.isInteger(index) && index >= 0 && index < existing.length) {
      videos = existing.filter((_, i) => i !== index)
    } else if (url) {
      videos = existing.filter((v) => v.url !== url)
    } else {
      return errorResponse('Specify the video index or url to remove.', 400)
    }

    await prisma.customer.update({
      where: { id: customer.id },
      data: { videos: JSON.stringify(videos) },
    })

    await logActivity({
      actorId: access!.user.id,
      actorRole: access!.user.role,
      action: 'card.videos.remove',
      target: params.id,
      metadata: { total: videos.length },
    })

    return successResponse({ videos, max: MAX_VIDEOS })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to remove video', 500)
  }
}
