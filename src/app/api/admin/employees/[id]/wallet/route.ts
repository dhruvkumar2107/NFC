import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error
    const employee = await prisma.employee.findUnique({ where: { id: params.id }, select: { totalPoints: true, redeemedPoints: true, availablePoints: true } })
    if (!employee) return errorResponse('Employee not found', 404)
    const transactions = await prisma.walletTransaction.findMany({ where: { employeeId: params.id }, orderBy: { createdAt: 'desc' }, take: 100 })
    return successResponse({ wallet: employee, transactions })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch employee wallet', 500)
  }
}
