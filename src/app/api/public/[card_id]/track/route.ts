import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { errorResponse } from '@/lib/api-response'
import { recordEvent, ANALYTICS_EVENTS } from '@/lib/analytics'
import { rateLimit, clientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: { card_id: string } }) {
  try {
    const ip = clientIp(request.headers)
    if (!rateLimit(`track:${ip}`, 120, 60_000)) {
      return errorResponse('Too many requests', 429)
    }

    const card = await prisma.card.findUnique({ where: { cardId: params.card_id }, select: { id: true } })
    if (!card) return errorResponse('Card not found', 404)

    const body = await request.json().catch(() => ({}))
    const type = typeof body.type === 'string' ? body.type : ''
    if (!Object.values(ANALYTICS_EVENTS).includes(type as any)) {
      return errorResponse('Unsupported event type', 400)
    }

    const referrer = body.referrer || request.headers.get('referer') || null

    await recordEvent({
      cardId: card.id,
      type,
      sessionId: typeof body.sessionId === 'string' ? body.sessionId : null,
      referrer,
      userAgent: request.headers.get('user-agent'),
      location: body.location || null,
      metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : {},
    })

    return Response.json({ success: true })
  } catch {
    return Response.json({ success: true })
  }
}
