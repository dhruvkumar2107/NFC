import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employee_id')
    const type = searchParams.get('type')
    const where: any = {}
    if (employeeId) where.employeeId = employeeId
    if (type) where.type = type
    const transactions = await prisma.walletTransaction.findMany({
      where,
      include: { employee: { select: { employeeId: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    return successResponse(transactions)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch wallet transactions', 500)
  }
}
