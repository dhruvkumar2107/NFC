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

    // Points are deducted when the request is submitted, and only returned on
    // rejection. Restrict transitions so a request can never be paid twice or
    // refunded after it was already rejected/paid.
    const allowedFrom: Record<string, string[]> = {
      approved: ['pending'],
      paid: ['pending', 'approved'],
      rejected: ['pending', 'approved'],
    }
    if (!allowedFrom[status].includes(redemption.status)) {
      return errorResponse(`This request is already ${redemption.status} and cannot be marked ${status}`, 409)
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Conditional update guarantees the transition only applies once, even
        // if two admins click at the same time.
        const updated = await tx.redemptionRequest.updateMany({
          where: { id, status: { in: allowedFrom[status] } },
          data: { status, notes, processedBy: user!.id, processedAt: new Date() },
        })
        if (updated.count === 0) throw new Error('CONFLICT')

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

        return tx.redemptionRequest.findUnique({ where: { id } })
      })

      return successResponse(result)
    } catch (err: any) {
      if (err.message === 'CONFLICT') return errorResponse('This request was already processed by someone else', 409)
      throw err
    }
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update redemption', 500)
  }
}
