import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { errorResponse, successResponse } from '@/lib/api-response'
import { recordEvent, ANALYTICS_EVENTS } from '@/lib/analytics'
import { rateLimit, clientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const MAX = { name: 120, phone: 20, email: 160, subject: 160, message: 4000 }

function clean(value: unknown, max: number): string {
  if (typeof value !== 'string') return ''
  return value.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max)
}

export async function POST(request: NextRequest, { params }: { params: { card_id: string } }) {
  try {
    const ip = clientIp(request.headers)
    if (!rateLimit(`enquiry:${ip}`, 8, 10 * 60_000)) {
      return errorResponse('Too many enquiries. Please try again later.', 429)
    }

    const card = await prisma.card.findUnique({
      where: { cardId: params.card_id },
      select: { id: true, builderConfig: { select: { id: true } } },
    })
    if (!card) return errorResponse('Card not found', 404)

    const body = await request.json().catch(() => ({}))
    const name = clean(body.name, MAX.name)
    const phone = clean(body.phone, MAX.phone)
    const email = clean(body.email, MAX.email)
    if (!name) return errorResponse('Please enter your name.')
    if (!phone && !email) return errorResponse('Please provide a phone number or email.')

    const source = ['card', 'emi', 'product', 'form', 'whatsapp'].includes(body.source) ? body.source : 'card'
    const emiData = body.emiData && typeof body.emiData === 'object' ? JSON.stringify(body.emiData).slice(0, 2000) : null

    const enquiry = await prisma.enquiry.create({
      data: {
        cardId: card.id,
        configId: card.builderConfig?.id || null,
        name,
        phone: phone || null,
        email: email || null,
        subject: clean(body.subject, MAX.subject) || null,
        message: clean(body.message, MAX.message) || null,
        source,
        productId: clean(body.productId, 64) || null,
        emiData,
        consent: body.consent === true,
      },
      select: { id: true, createdAt: true },
    })

    await recordEvent({
      cardId: card.id,
      type: ANALYTICS_EVENTS.ENQUIRY_SUBMITTED,
      sessionId: typeof body.sessionId === 'string' ? body.sessionId : null,
      userAgent: request.headers.get('user-agent'),
      metadata: { source },
    })

    return successResponse({ id: enquiry.id, createdAt: enquiry.createdAt })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to submit enquiry', 500)
  }
}
