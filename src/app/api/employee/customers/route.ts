import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { CUSTOMER_LIST_SELECT } from '@/lib/orders'
import { requireAuth } from '@/lib/auth-guard'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request, 'employee')
    if (error) return error

    // Only show customers with at least one confirmed order (Payment Received or Delivered)
    const customers = await prisma.customer.findMany({
      where: {
        soldByEmployeeId: user!.id,
        orders: {
          some: {
            employeeId: user!.id,
            status: { in: ['Payment Received', 'Delivered'] },
          },
        },
      },
      select: {
        ...CUSTOMER_LIST_SELECT,
        card: { select: { id: true, cardId: true, nfcCardNumber: true, status: true } },
        orders: {
          where: { employeeId: user!.id },
          orderBy: { orderDate: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return successResponse(customers)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch customers', 500)
  }
}