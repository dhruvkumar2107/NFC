import { prisma } from './db'

const SORTABLE = new Set(['createdAt', 'updatedAt', 'name', 'status'])

export interface LeadsFilters {
  status?: string
  source?: string
  q?: string
  from?: string | null
  to?: string | null
  sortBy?: string
  order?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface LeadsScope {
  /** When set, only leads attached to this card UUID are returned. */
  cardId?: string
}

export function parseLeadsFilters(sp: URLSearchParams): LeadsFilters {
  const sortByRaw = sp.get('sortBy') || ''
  return {
    status: sp.get('status') || '',
    source: sp.get('source') || '',
    q: (sp.get('q') || '').trim(),
    from: sp.get('from'),
    to: sp.get('to'),
    sortBy: SORTABLE.has(sortByRaw) ? sortByRaw : 'createdAt',
    order: sp.get('order') === 'asc' ? 'asc' : 'desc',
    page: Math.max(1, parseInt(sp.get('page') || '1', 10) || 1),
    pageSize: Math.min(100, Math.max(5, parseInt(sp.get('pageSize') || '25', 10) || 25)),
  }
}

export interface LeadsResult {
  leads: any[]
  total: number
  page: number
  pageSize: number
  counts: Record<string, number>
}

/** Shared lead query used by both the admin panel and the business-owner dashboard. */
export async function queryLeads(filters: LeadsFilters, scope: LeadsScope = {}): Promise<LeadsResult> {
  const { status, source, q, from, to, sortBy = 'createdAt', order = 'desc', page = 1, pageSize = 25 } = filters

  const where: any = {}
  if (scope.cardId) where.cardId = scope.cardId
  if (status) where.status = status
  if (source) where.source = source
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { subject: { contains: q, mode: 'insensitive' } },
    ]
  }
  if (from || to) {
    where.createdAt = {}
    if (from) where.createdAt.gte = new Date(from)
    if (to) where.createdAt.lte = new Date(to)
  }

  const [leads, total, statusGroups] = await Promise.all([
    prisma.enquiry.findMany({
      where,
      include: { card: { select: { cardId: true, customer: { select: { name: true } } } } },
      orderBy: { [sortBy]: order },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.enquiry.count({ where }),
    prisma.enquiry.groupBy({ by: ['status'], where: scope.cardId ? { cardId: scope.cardId } : {}, _count: { _all: true } }),
  ])

  const counts: Record<string, number> = {}
  for (const g of statusGroups) counts[g.status] = g._count._all

  return { leads, total, page, pageSize, counts }
}
