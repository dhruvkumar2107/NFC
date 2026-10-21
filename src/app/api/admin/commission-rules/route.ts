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

    const minCardsNum = Number(minCards)
    const commissionNum = Number(commissionPerCard)
    if (!Number.isFinite(minCardsNum) || !Number.isFinite(commissionNum)) {
      return errorResponse('Min cards and commission per card are required and must be numbers', 400)
    }

    let maxCardsNum: number | null = null
    if (maxCards !== undefined && maxCards !== null && maxCards !== '') {
      maxCardsNum = Number(maxCards)
      if (!Number.isFinite(maxCardsNum)) return errorResponse('Max cards must be a number', 400)
    }

    // pointsPerCard is an Int column; blank means "same as ₹ per card".
    const pointsSource =
      pointsPerCard === undefined || pointsPerCard === null || pointsPerCard === ''
        ? commissionNum
        : Number(pointsPerCard)
    const pointsNum = Number.isFinite(pointsSource) ? Math.round(pointsSource) : 0

    const rule = await prisma.commissionRule.create({
      data: {
        minCards: Math.round(minCardsNum),
        maxCards: maxCardsNum === null ? null : Math.round(maxCardsNum),
        commissionPerCard: commissionNum,
        pointsPerCard: pointsNum,
      },
    })
    return successResponse(rule)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create commission rule', 500)
  }
}
