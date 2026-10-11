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

  const sp = request.nextUrl.searchParams
  const status = sp.get('status') || ''
  const source = sp.get('source') || ''
  const q = (sp.get('q') || '').trim()

  const where: any = { cardId: customer.cardId }
  if (status) where.status = status
  if (source) where.source = source
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
    ]
  }

  const leads = await prisma.enquiry.findMany({ where, orderBy: { createdAt: 'desc' }, take: 5000 })

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
    ],
    rows
  )

  return csvResponse(csv, `my-leads-${new Date().toISOString().slice(0, 10)}.csv`)
}
