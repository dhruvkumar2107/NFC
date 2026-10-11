import { NextRequest } from 'next/server'
import { successResponse } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-guard'
import { parseLeadsFilters, queryLeads } from '@/lib/leads-query'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(request, 'admin')
  if (error) return error

  const sp = request.nextUrl.searchParams
  const filters = parseLeadsFilters(sp)
  const cardUuid = sp.get('cardId') || ''

  const result = await queryLeads(filters, cardUuid ? { cardId: cardUuid } : {})
  return successResponse(result)
}
