import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-guard'
import { getAnalyticsSummary } from '@/lib/analytics'

export const dynamic = 'force-dynamic'

function parseRange(sp: URLSearchParams): { from: Date; to: Date } {
  const now = new Date()
  const days = Math.min(365, Math.max(1, parseInt(sp.get('days') || '30', 10) || 30))
  let from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  let to = now
  const fromParam = sp.get('from')
  const toParam = sp.get('to')
  if (fromParam) {
    const d = new Date(fromParam)
    if (!Number.isNaN(d.getTime())) from = d
  }
  if (toParam) {
    const d = new Date(toParam)
    if (!Number.isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999)
      to = d
    }
  }
  from.setHours(0, 0, 0, 0)
  return { from, to }
}

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(request, 'admin')
  if (error) return error

  try {
    const sp = request.nextUrl.searchParams
    const { from, to } = parseRange(sp)

    let cardUuid: string | undefined
    const cardParam = sp.get('card')
    if (cardParam) {
      const card = await prisma.card.findUnique({ where: { cardId: cardParam }, select: { id: true } })
      if (card) cardUuid = card.id
    }

    const scope = cardUuid ? { cardId: cardUuid } : {}
    const range = { createdAt: { gte: from, lte: to } }

    const [summary, totalCards, activeCards, totalEnquiries, converted, emiCount, calcCount, visitAgg] = await Promise.all([
      getAnalyticsSummary({ cardId: cardUuid, from, to }),
      prisma.card.count(),
      prisma.card.count({ where: { status: 'Active' } }),
      prisma.enquiry.count({ where: { ...scope, ...range } }),
      prisma.enquiry.count({ where: { ...scope, ...range, status: 'converted' } }),
      prisma.emiCalculation.count({ where: { ...scope, ...range } }),
      prisma.emiCalculation.aggregate({ where: { ...scope, ...range }, _avg: { emi: true, price: true } }),
      prisma.analyticsEvent.aggregate({ where: { ...scope, ...range }, _count: { _all: true } }),
    ])

    const enquiryRate = summary.totalVisits > 0 ? (totalEnquiries / summary.totalVisits) * 100 : 0

    return successResponse({
      range: summary.range,
      cards: { total: totalCards, active: activeCards },
      visitors: { unique: summary.uniqueVisitors, visits: summary.totalVisits, events: visitAgg._count._all },
      engagement: summary.totals,
      leads: {
        total: totalEnquiries,
        converted,
        conversionRate: Number.isFinite(enquiryRate) ? Math.round(enquiryRate * 100) / 100 : 0,
      },
      emi: {
        calculations: emiCount,
        averageEmi: Math.round(calcCount._avg.emi || 0),
        averagePrice: Math.round(calcCount._avg.price || 0),
      },
      daily: summary.daily,
      topCards: summary.topCards,
      devices: summary.devices,
    })
  } catch (err: any) {
    return Response.json({ success: false, error: err.message || 'Failed to load analytics' }, { status: 500 })
  }
}
