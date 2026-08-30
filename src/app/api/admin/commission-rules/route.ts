import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error
    const rules = await prisma.commissionRule.findMany({ orderBy: { minCards: 'asc' } })
    return successResponse(rules)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch commission rules', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error

    const body = await request.json()
    const { minCards, maxCards, commissionPerCard, pointsPerCard } = body
    const rule = await prisma.commissionRule.create({
      data: { minCards, maxCards, commissionPerCard, pointsPerCard: pointsPerCard || commissionPerCard },
    })
    return successResponse(rule)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create commission rule', 500)
  }
}
