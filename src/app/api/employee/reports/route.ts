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
      include: { customer: true, design: true },
      orderBy: { orderDate: 'desc' },
    })

    const isConfirmed = (status: string) => status === 'Payment Received' || status === 'Delivered'
    const confirmedOrders = orders.filter(o => isConfirmed(o.status))
    const failedOrders = orders.filter(o => o.status === 'Payment Failed' || o.status === 'Failed')

    const totalSales = confirmedOrders.length
    const totalRevenue = confirmedOrders.reduce((sum, o) => sum + o.amount, 0)
    const totalCommission = confirmedOrders.reduce((sum, o) => sum + (o.commissionAmount || 0), 0)
    const deliveredCount = confirmedOrders.filter(o => o.status === 'Delivered').length

    return successResponse({
      totalSales,
      totalRevenue,
      totalCommission,
      deliveredCount,
      pendingCount: totalSales - deliveredCount,
      failedCount: failedOrders.length,
      allOrdersCount: orders.length,
      orders,
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch reports', 500)
  }
}