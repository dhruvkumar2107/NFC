import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error

    const [totalCustomers, totalOrders, totalEmployees, totalCards, allOrders, allCards, pendingRedemptions, recentOrders, recentEmployees] = await Promise.all([
      prisma.customer.count(),
      prisma.order.count(),
      prisma.employee.count(),
      prisma.card.count(),
      prisma.order.findMany({ select: { amount: true, commissionAmount: true, employeeId: true, status: true, attributionType: true } }),
      prisma.card.findMany({ select: { status: true } }),
      prisma.redemptionRequest.count({ where: { status: 'pending' } }),
      prisma.order.findMany({ take: 10, orderBy: { orderDate: 'desc' }, include: { customer: { select: { name: true } }, employee: { select: { name: true, employeeId: true } } } }),
      prisma.employee.findMany({ take: 10, orderBy: { createdAt: 'desc' }, select: { id: true, employeeId: true, name: true, email: true, status: true, totalPoints: true, availablePoints: true } }),
    ])

    const totalRevenue = allOrders.filter(o => o.status === 'Delivered' || o.status === 'Payment Received').reduce((s, o) => s + o.amount, 0)
    const totalCommission = allOrders.filter(o => o.status === 'Delivered' || o.status === 'Payment Received').reduce((s, o) => s + (o.commissionAmount || 0), 0)
    const activeCards = allCards.filter(c => c.status === 'Active').length
    const pendingOrders = allOrders.filter(o => o.status === 'Pending').length
    const directSales = allOrders.filter(o => !o.employeeId).length
    const referredSales = allOrders.filter(o => !!o.employeeId).length

    const employeeStatsMap = new Map<string, { salesCount: number; revenue: number; commission: number }>()
    for (const o of allOrders) {
      if (!o.employeeId) continue
      const existing = employeeStatsMap.get(o.employeeId) || { salesCount: 0, revenue: 0, commission: 0 }
      existing.salesCount++
      existing.revenue += o.amount
      existing.commission += o.commissionAmount || 0
      employeeStatsMap.set(o.employeeId, existing)
    }

    const employees = await prisma.employee.findMany({ where: { id: { in: Array.from(employeeStatsMap.keys()) } }, select: { id: true, employeeId: true, name: true, totalPoints: true, availablePoints: true, status: true } })
    const employeeStats = employees.map(e => ({ ...e, ...(employeeStatsMap.get(e.id) || { salesCount: 0, revenue: 0, commission: 0 }) })).sort((a, b) => b.salesCount - a.salesCount)

    return successResponse({
      totalCustomers, totalOrders, totalEmployees, totalCards,
      totalRevenue, totalCommission, activeCards, pendingOrders,
      directSales, referredSales, pendingRedemptions,
      employeeStats, recentOrders, recentEmployees,
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch dashboard stats', 500)
  }
}
