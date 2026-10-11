import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { toCsv, csvResponse } from '@/lib/csv'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(request, 'admin')
  if (error) return error

  const sp = request.nextUrl.searchParams
  const status = sp.get('status') || ''
  const source = sp.get('source') || ''
  const q = (sp.get('q') || '').trim()
  const from = sp.get('from')
  const to = sp.get('to')

  const where: any = {}
  if (status) where.status = status
  if (source) where.source = source
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
    ]
  }
  if (from || to) {
    where.createdAt = {}
    if (from) where.createdAt.gte = new Date(from)
    if (to) where.createdAt.lte = new Date(to)
  }

  const leads = await prisma.enquiry.findMany({
    where,
    include: { card: { select: { cardId: true, customer: { select: { name: true, company: true } } } } },
    orderBy: { createdAt: 'desc' },
    take: 5000,
  })

  const rows = leads.map((l) => ({
    createdAt: l.createdAt.toISOString(),
    name: l.name,
    phone: l.phone || '',
    email: l.email || '',
    subject: l.subject || '',
    message: l.message || '',
    source: l.source,
    status: l.status,
    consent: l.consent ? 'yes' : 'no',
    cardId: l.card?.cardId || '',
    business: l.card?.customer?.name || '',
    company: l.card?.customer?.company || '',
  }))

  const csv = toCsv(
    [
      { key: 'createdAt', label: 'Date' },
      { key: 'name', label: 'Name' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'subject', label: 'Subject' },
      { key: 'message', label: 'Message' },
      { key: 'source', label: 'Source' },
      { key: 'status', label: 'Status' },
      { key: 'consent', label: 'Consent' },
      { key: 'cardId', label: 'Card' },
      { key: 'business', label: 'Business' },
      { key: 'company', label: 'Company' },
    ],
    rows
  )

  return csvResponse(csv, `leads-${new Date().toISOString().slice(0, 10)}.csv`)
}
