import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
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
      if (from) where.orderDate.gte = new Date(from)
      if (to) where.orderDate.lte = new Date(to)
    }

    const orders = await prisma.order.findMany({
      where,
      include: { customer: true, employee: true, design: true },
      orderBy: { orderDate: 'desc' },
    })

    const employees = await prisma.employee.findMany({
      where: { status: 'active' },
      select: { id: true, employeeId: true, name: true },
    })

    const summary = employees.map((emp) => {
      const empOrders = orders.filter(o => o.employeeId === emp.id && o.status === 'Payment Received')
      return {
        employee: emp,
        totalSales: empOrders.length,
        totalRevenue: empOrders.reduce((s, o) => s + o.amount, 0),
        totalCommission: empOrders.reduce((s, o) => s + (o.commissionAmount || 0), 0),
      }
    })

    const directOrders = orders.filter(o => !o.employeeId && o.status === 'Payment Received')

    return successResponse({
      totalOrders: orders.length,
      totalRevenue: orders.filter(o => o.status === 'Payment Received').reduce((s, o) => s + o.amount, 0),
      summary,
      directSales: directOrders.length,
      orders,
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch sales report', 500)
  }
}