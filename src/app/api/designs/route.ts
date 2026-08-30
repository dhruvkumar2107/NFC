import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function GET(_request: NextRequest) {
  try {
    const designs = await prisma.cardDesign.findMany({ where: { active: true }, orderBy: { price: 'asc' } })
    return successResponse(designs)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch designs', 500)
  }
}