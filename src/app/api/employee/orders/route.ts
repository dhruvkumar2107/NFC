import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request, 'employee')
    if (error) return error

    const orders = await prisma.order.findMany({
      where: { employeeId: user!.id },
      include: { customer: true, card: true, design: true },
      orderBy: { orderDate: 'desc' },
    })
    return successResponse(orders)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch orders', 500)
  }
}