import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error
    const redemptions = await prisma.redemptionRequest.findMany({
      include: { employee: { select: { employeeId: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return successResponse(redemptions)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch redemptions', 500)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error

    const { id, status, notes } = await request.json()
    if (!id || !status) return errorResponse('ID and status required')
    if (!['approved', 'rejected', 'paid'].includes(status)) return errorResponse('Invalid status')

    const redemption = await prisma.redemptionRequest.findUnique({ where: { id } })
    if (!redemption) return errorResponse('Redemption not found', 404)

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.redemptionRequest.update({
        where: { id },
        data: { status, notes, processedBy: user!.id, processedAt: new Date() },
      })

      if (status === 'rejected') {
        await tx.employee.update({
          where: { id: redemption.employeeId },
          data: {
            availablePoints: { increment: redemption.points },
            redeemedPoints: { decrement: redemption.points },
          },
        })
        await tx.walletTransaction.create({
          data: {
            employeeId: redemption.employeeId,
            type: 'redemption_rejected',
            points: redemption.points,
            description: `Redemption rejected: ${redemption.points} points returned`,
          },
        })
      }

      if (status === 'paid') {
        await tx.walletTransaction.create({
          data: {
            employeeId: redemption.employeeId,
            type: 'redemption_paid',
            points: 0,
            description: `Payment of ₹${redemption.amount} sent to ${redemption.upiId}`,
          },
        })
      }

      return updated
    })

    return successResponse(result)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update redemption', 500)
  }
}
