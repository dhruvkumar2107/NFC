import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, notFound } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-guard'
import { parseLeadsFilters, queryLeads } from '@/lib/leads-query'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request, 'customer')
  if (error) return error

  const customer = await prisma.customer.findUnique({ where: { id: user!.id }, select: { cardId: true } })
  if (!customer?.cardId) return notFound('No card is assigned to your account yet.')

  const filters = parseLeadsFilters(request.nextUrl.searchParams)
  const result = await queryLeads(filters, { cardId: customer.cardId })
  return successResponse(result)
}
