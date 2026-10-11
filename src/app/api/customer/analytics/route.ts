import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, notFound } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-guard'
import { getAnalyticsSummary } from '@/lib/analytics'

export const dynamic = 'force-dynamic'

function parseRange(sp: URLSearchParams): { from: Date; to: Date } {
  const now = new Date()
  const days = Math.min(365, Math.max(1, parseInt(sp.get('days') || '30', 10) || 30))
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  from.setHours(0, 0, 0, 0)
  return { from, to: now }
}

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request, 'customer')
  if (error) return error

  try {
    const customer = await prisma.customer.findUnique({ where: { id: user!.id }, select: { cardId: true } })
    if (!customer?.cardId) return notFound('No card is assigned to your account yet.')

    const { from, to } = parseRange(request.nextUrl.searchParams)
    const cardId = customer.cardId

    const [summary, totalEnquiries, converted, emiCount, calcAgg] = await Promise.all([
      getAnalyticsSummary({ cardId, from, to }),
      prisma.enquiry.count({ where: { cardId, createdAt: { gte: from, lte: to } } }),
      prisma.enquiry.count({ where: { cardId, createdAt: { gte: from, lte: to }, status: 'converted' } }),
      prisma.emiCalculation.count({ where: { cardId, createdAt: { gte: from, lte: to } } }),
      prisma.emiCalculation.aggregate({ where: { cardId, createdAt: { gte: from, lte: to } }, _avg: { emi: true, price: true } }),
    ])

    const rate = summary.totalVisits > 0 ? (totalEnquiries / summary.totalVisits) * 100 : 0

    return successResponse({
      range: summary.range,
      visitors: { unique: summary.uniqueVisitors, visits: summary.totalVisits, events: Object.values(summary.totals).reduce((a, b) => a + b, 0) },
      engagement: summary.totals,
      leads: { total: totalEnquiries, converted, conversionRate: Number.isFinite(rate) ? Math.round(rate * 100) / 100 : 0 },
      emi: { calculations: emiCount, averageEmi: Math.round(calcAgg._avg.emi || 0), averagePrice: Math.round(calcAgg._avg.price || 0) },
      daily: summary.daily,
      devices: summary.devices,
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to load analytics', 500)
  }
}
