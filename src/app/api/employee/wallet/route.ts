import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request, 'employee')
    if (error) return error

    const employee = await prisma.employee.findUnique({
      where: { id: user!.id },
      select: { totalPoints: true, redeemedPoints: true, availablePoints: true },
    })

    const transactions = await prisma.walletTransaction.findMany({
      where: { employeeId: user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const redemptions = await prisma.redemptionRequest.findMany({
      where: { employeeId: user!.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return successResponse({
      wallet: employee,
      transactions,
      redemptions,
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch wallet', 500)
  }
}
