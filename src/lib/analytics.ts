import { prisma } from './db'

export const ANALYTICS_EVENTS = {
  CARD_VIEW: 'card_view',
  GALLERY_OPEN: 'gallery_open',
  IMAGE_DOWNLOAD: 'image_download',
  ZIP_DOWNLOAD: 'zip_download',
  CATALOGUE_DOWNLOAD: 'catalogue_download',
  CONTACT_DOWNLOAD: 'contact_download',
  WHATSAPP_CLICK: 'whatsapp_click',
  CALL_CLICK: 'call_click',
  EMI_CALCULATED: 'emi_calculated',
  ENQUIRY_SUBMITTED: 'enquiry_submitted',
  SHARE: 'share',
  PRODUCT_VIEW: 'product_view',
} as const

export type AnalyticsEventType = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS]

const VALID_EVENTS = new Set<string>(Object.values(ANALYTICS_EVENTS))

export function deviceCategory(userAgent: string | null | undefined): string {
  if (!userAgent) return 'unknown'
  const ua = userAgent.toLowerCase()
  if (/ipad|tablet|playbook|silk/.test(ua)) return 'tablet'
  if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/.test(ua)) return 'mobile'
  if (/bot|crawler|spider|slurp|bingpreview/.test(ua)) return 'bot'
  return 'desktop'
}

export interface RecordEventInput {
  cardId?: string | null
  type: string
  sessionId?: string | null
  referrer?: string | null
  userAgent?: string | null
  location?: string | null
  metadata?: Record<string, unknown>
}

/** Best-effort analytics write. Never throws so it cannot break a user action. */
export async function recordEvent(input: RecordEventInput): Promise<void> {
  try {
    if (!input.type || !VALID_EVENTS.has(input.type)) return
    await prisma.analyticsEvent.create({
      data: {
        cardId: input.cardId || null,
        type: input.type,
        sessionId: input.sessionId ? String(input.sessionId).slice(0, 64) : null,
        referrer: input.referrer ? String(input.referrer).slice(0, 512) : null,
        device: deviceCategory(input.userAgent),
        location: input.location ? String(input.location).slice(0, 120) : null,
        metadata: JSON.stringify(input.metadata || {}).slice(0, 4000),
      },
    })
  } catch {
    // analytics is non-critical
  }
}

export interface AnalyticsSummary {
  range: { from: string; to: string }
  totals: Record<string, number>
  uniqueVisitors: number
  totalVisits: number
  daily: { date: string; card_view: number; enquiry_submitted: number; image_download: number }[]
  topCards: { cardId: string; name: string; views: number }[]
  devices: { device: string; count: number }[]
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export async function getAnalyticsSummary(opts: {
  cardId?: string
  from: Date
  to: Date
}): Promise<AnalyticsSummary> {
  const where = {
    createdAt: { gte: opts.from, lte: opts.to },
    ...(opts.cardId ? { cardId: opts.cardId } : {}),
  }

  const [grouped, totalVisits, uniqueSessions, devices, daily, topCardsRaw] = await Promise.all([
    prisma.analyticsEvent.groupBy({ by: ['type'], where, _count: { _all: true } }),
    prisma.analyticsEvent.count({ where: { ...where, type: ANALYTICS_EVENTS.CARD_VIEW } }),
    prisma.analyticsEvent.findMany({
      where: { ...where, sessionId: { not: null } },
      distinct: ['sessionId'],
      select: { sessionId: true },
    }),
    prisma.analyticsEvent.groupBy({
      by: ['device'],
      where: { ...where, type: ANALYTICS_EVENTS.CARD_VIEW },
      _count: { _all: true },
    }),
    prisma.analyticsEvent.findMany({
      where: { ...where, type: { in: [ANALYTICS_EVENTS.CARD_VIEW, ANALYTICS_EVENTS.ENQUIRY_SUBMITTED, ANALYTICS_EVENTS.IMAGE_DOWNLOAD] } },
      select: { type: true, createdAt: true },
    }),
    prisma.analyticsEvent.groupBy({
      by: ['cardId'],
      where: { ...where, type: ANALYTICS_EVENTS.CARD_VIEW, cardId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { cardId: 'desc' } },
      take: 8,
    }),
  ])

  const totals: Record<string, number> = {}
  for (const g of grouped) totals[g.type] = g._count._all

  const dailyMap = new Map<string, { card_view: number; enquiry_submitted: number; image_download: number }>()
  const cursor = new Date(opts.from)
  cursor.setUTCHours(0, 0, 0, 0)
  while (cursor <= opts.to) {
    dailyMap.set(isoDay(cursor), { card_view: 0, enquiry_submitted: 0, image_download: 0 })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  for (const e of daily) {
    const key = isoDay(e.createdAt)
    if (!dailyMap.has(key)) continue
    const row = dailyMap.get(key)!
    if (e.type === ANALYTICS_EVENTS.CARD_VIEW) row.card_view++
    else if (e.type === ANALYTICS_EVENTS.ENQUIRY_SUBMITTED) row.enquiry_submitted++
    else if (e.type === ANALYTICS_EVENTS.IMAGE_DOWNLOAD) row.image_download++
  }

  const cardIds = topCardsRaw.map((t) => t.cardId).filter(Boolean) as string[]
  const cards = cardIds.length
    ? await prisma.card.findMany({ where: { id: { in: cardIds } }, include: { customer: { select: { name: true } } } })
    : []
  const cardMap = new Map(cards.map((c) => [c.id, c]))

  return {
    range: { from: opts.from.toISOString(), to: opts.to.toISOString() },
    totals,
    totalVisits,
    uniqueVisitors: uniqueSessions.length,
    daily: Array.from(dailyMap.entries()).map(([date, v]) => ({ date, ...v })),
    topCards: topCardsRaw.map((t) => {
      const card = t.cardId ? cardMap.get(t.cardId) : undefined
      return {
        cardId: card?.cardId || t.cardId || '—',
        name: card?.customer?.name || 'Unknown',
        views: t._count._all,
      }
    }),
    devices: devices.map((d) => ({ device: d.device || 'unknown', count: d._count._all })),
  }
}
