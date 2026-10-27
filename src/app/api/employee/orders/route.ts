import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { CUSTOMER_LIST_SELECT } from '@/lib/orders'
import { requireAuth } from '@/lib/auth-guard'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request, 'employee')
    if (error) return error

    const orders = await prisma.order.findMany({
      where: { employeeId: user!.id },
      include: {
        customer: { select: CUSTOMER_LIST_SELECT },
        card: { select: { id: true, cardId: true, nfcCardNumber: true, status: true } },
        design: { select: { id: true, name: true, price: true } },
      },
      orderBy: { orderDate: 'desc' },
    })
    return successResponse(orders)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch orders', 500)
  }
}