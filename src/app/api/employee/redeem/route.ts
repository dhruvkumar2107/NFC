import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request, 'employee')
    if (error) return error

    const { points, upiId, notes } = await request.json()
    if (!points || !Number.isInteger(points) || points <= 0) return errorResponse('Points must be a positive whole number')
    if (!upiId) return errorResponse('UPI ID is required for redemption')

    const result = await prisma.$transaction(async (tx) => {
      const employee = await tx.employee.findUnique({ where: { id: user!.id } })
      if (!employee) throw new Error('Employee not found')
      if (employee.availablePoints < points) {
        throw new Error(`Insufficient points. Available: ${employee.availablePoints}`)
      }

      const amount = points * 1

      const redemption = await tx.redemptionRequest.create({
        data: { employeeId: user!.id, points, amount, upiId, notes },
      })

      await tx.employee.update({
        where: { id: user!.id },
        data: {
          availablePoints: { decrement: points },
          redeemedPoints: { increment: points },
        },
      })

      await tx.walletTransaction.create({
        data: {
          employeeId: user!.id,
          type: 'redemption_request',
          points: -points,
          description: `Redemption request: ${points} points (₹${amount}) to ${upiId}`,
        },
      })

      return redemption
    })

    return successResponse(result)
  } catch (err: any) {
    return errorResponse(err.message || 'Redemption failed', 500)
  }
}
