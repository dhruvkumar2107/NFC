import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error

    const cards = await prisma.card.findMany({
      include: { design: true, employee: true },
      orderBy: { createdAt: 'desc' },
    })

    const cardIds = cards.map(c => c.id)
    const customers = await prisma.customer.findMany({
      where: { cardId: { in: cardIds } },
    })
    const customerMap = new Map(customers.map(c => [c.cardId, c]))

    const enriched = cards.map(c => ({
      ...c,
      customer: customerMap.get(c.id) || null,
    }))

    return successResponse(enriched)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch cards', 500)
  }
}
