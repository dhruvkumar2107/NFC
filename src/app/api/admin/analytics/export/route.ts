import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { toCsv, csvResponse } from '@/lib/csv'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(request, 'admin')
  if (error) return error

  const sp = request.nextUrl.searchParams
  const days = Math.min(365, Math.max(1, parseInt(sp.get('days') || '30', 10) || 30))
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  from.setHours(0, 0, 0, 0)
  const cardParam = sp.get('card')

  let cardUuid: string | undefined
  if (cardParam) {
    const card = await prisma.card.findUnique({ where: { cardId: cardParam }, select: { id: true } })
    if (card) cardUuid = card.id
  }

  const events = await prisma.analyticsEvent.findMany({
    where: { createdAt: { gte: from }, ...(cardUuid ? { cardId: cardUuid } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 20000,
  })

  const cardIds = Array.from(new Set(events.map((e) => e.cardId).filter(Boolean))) as string[]
  const cards = cardIds.length
    ? await prisma.card.findMany({ where: { id: { in: cardIds } }, select: { id: true, cardId: true } })
    : []
  const cardMap = new Map(cards.map((c) => [c.id, c.cardId]))

  const rows = events.map((e) => ({
    createdAt: e.createdAt.toISOString(),
    type: e.type,
    card: e.cardId ? cardMap.get(e.cardId) || e.cardId : '',
    device: e.device || '',
    session: e.sessionId || '',
    referrer: e.referrer || '',
    metadata: e.metadata || '',
  }))

  const csv = toCsv(
    [
      { key: 'createdAt', label: 'Timestamp' },
      { key: 'type', label: 'Event' },
      { key: 'card', label: 'Card' },
      { key: 'device', label: 'Device' },
      { key: 'session', label: 'Session' },
      { key: 'referrer', label: 'Referrer' },
      { key: 'metadata', label: 'Metadata' },
    ],
    rows
  )

  return csvResponse(csv, `analytics-${days}d-${new Date().toISOString().slice(0, 10)}.csv`)
}
