import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { notFound } from '@/lib/api-response'
import { toCsv, csvResponse } from '@/lib/csv'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request, 'customer')
  if (error) return error

  const customer = await prisma.customer.findUnique({ where: { id: user!.id }, select: { cardId: true } })
  if (!customer?.cardId) return notFound('No card assigned')

  const days = Math.min(365, Math.max(1, parseInt(request.nextUrl.searchParams.get('days') || '30', 10) || 30))
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  from.setHours(0, 0, 0, 0)

  const events = await prisma.analyticsEvent.findMany({
    where: { cardId: customer.cardId, createdAt: { gte: from } },
    orderBy: { createdAt: 'desc' },
    take: 20000,
  })

  const rows = events.map((e) => ({
    createdAt: e.createdAt.toISOString(),
    type: e.type,
    device: e.device || '',
    session: e.sessionId || '',
    referrer: e.referrer || '',
    metadata: e.metadata || '',
  }))

  const csv = toCsv(
    [
      { key: 'createdAt', label: 'Timestamp' },
      { key: 'type', label: 'Event' },
      { key: 'device', label: 'Device' },
      { key: 'session', label: 'Session' },
      { key: 'referrer', label: 'Referrer' },
      { key: 'metadata', label: 'Metadata' },
    ],
    rows
  )

  return csvResponse(csv, `my-analytics-${days}d-${new Date().toISOString().slice(0, 10)}.csv`)
}
