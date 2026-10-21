import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, notFound } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-guard'
import { logActivity } from '@/lib/admin-log'
import { MAX_VIDEOS, parseJsonArray, validateVideoList, type ProfileVideoEntry } from '@/lib/profile-media'

export const dynamic = 'force-dynamic'

async function loadCustomer(customerId: string) {
  return prisma.customer.findUnique({
    where: { id: customerId },
    select: { id: true, name: true, videos: true, cardId: true },
  })
}

function readVideos(raw: string | null | undefined): ProfileVideoEntry[] {
  return parseJsonArray<ProfileVideoEntry>(raw || '[]').filter(
    (v) => v && typeof v.url === 'string' && v.url,
  )
}

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request, 'customer')
  if (error) return error

  const customer = await loadCustomer(user!.id)
  if (!customer) return notFound('Customer not found')

  return successResponse({ videos: readVideos(customer.videos), max: MAX_VIDEOS })
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth(request, 'customer')
  if (error) return error

  try {
    const customer = await loadCustomer(user!.id)
    if (!customer) return notFound('Customer not found')

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
      actorId: user!.id,
      actorRole: user!.role,
      action: 'card.videos.add',
      target: customer.cardId,
      metadata: { count: incoming.value.length, total: videos.length },
    })

    return successResponse({ videos, max: MAX_VIDEOS }, 201)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to add videos', 500)
  }
}

export async function PUT(request: NextRequest) {
  const { user, error } = await requireAuth(request, 'customer')
  if (error) return error

  try {
    const customer = await loadCustomer(user!.id)
    if (!customer) return notFound('Customer not found')

    const body = await request.json().catch(() => ({}))
    const rawList = Array.isArray(body.videos) ? body.videos : []
    const checked = validateVideoList(rawList, MAX_VIDEOS)
    if (!checked.ok) return errorResponse(checked.error, 400)

    await prisma.customer.update({
      where: { id: customer.id },
      data: { videos: JSON.stringify(checked.value) },
    })

    await logActivity({
      actorId: user!.id,
      actorRole: user!.role,
      action: 'card.videos.update',
      target: customer.cardId,
      metadata: { count: checked.value.length },
    })

    return successResponse({ videos: checked.value, max: MAX_VIDEOS })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update videos', 500)
  }
}

export async function DELETE(request: NextRequest) {
  const { user, error } = await requireAuth(request, 'customer')
  if (error) return error

  try {
    const customer = await loadCustomer(user!.id)
    if (!customer) return notFound('Customer not found')

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
      actorId: user!.id,
      actorRole: user!.role,
      action: 'card.videos.remove',
      target: customer.cardId,
      metadata: { total: videos.length },
    })

    return successResponse({ videos, max: MAX_VIDEOS })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to remove video', 500)
  }
}