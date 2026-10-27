import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { CUSTOMER_LIST_SELECT } from '@/lib/orders'
import { requireAuth } from '@/lib/auth-guard'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const employeeId = searchParams.get('employee_id')

    const where: any = {}
    if (employeeId) where.employeeId = employeeId
    if (from || to) {
      where.orderDate = {}
      if (from) {
        const d = new Date(from)
        if (!Number.isNaN(d.getTime())) { d.setHours(0, 0, 0, 0); where.orderDate.gte = d }
      }
      if (to) {
        const d = new Date(to)
        if (!Number.isNaN(d.getTime())) { d.setHours(23, 59, 59, 999); where.orderDate.lte = d }
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: { customer: { select: CUSTOMER_LIST_SELECT }, employee: true, design: true },
      orderBy: { orderDate: 'desc' },
    })

    const employees = await prisma.employee.findMany({
      where: { status: 'active' },
      select: { id: true, employeeId: true, name: true },
    })

    const isConfirmed = (status: string) => status === 'Payment Received' || status === 'Delivered'
    const isFailed = (status: string) => status === 'Payment Failed' || status === 'Failed'

    const confirmedOrders = orders.filter(o => isConfirmed(o.status))
    const failedOrders = orders.filter(o => isFailed(o.status))

    const summary = employees.map((emp) => {
      const empOrders = confirmedOrders.filter(o => o.employeeId === emp.id)
      return {
        employee: emp,
        totalSales: empOrders.length,
        totalRevenue: empOrders.reduce((s, o) => s + o.amount, 0),
        totalCommission: empOrders.reduce((s, o) => s + (o.commissionAmount || 0), 0),
      }
    })

    const directOrders = confirmedOrders.filter(o => !o.employeeId)

    return successResponse({
      totalOrders: confirmedOrders.length, // Only confirmed sales
      totalRevenue: confirmedOrders.reduce((s, o) => s + o.amount, 0),
      totalCommission: confirmedOrders.reduce((s, o) => s + (o.commissionAmount || 0), 0),
      failedOrdersCount: failedOrders.length,
      allOrdersCount: orders.length,
      summary,
      directSales: directOrders.length,
      orders,
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch sales report', 500)
  }
}