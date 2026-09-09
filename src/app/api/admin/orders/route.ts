import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')

    const where: any = {}
    if (search) {
      where.OR = [
        { orderId: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { email: { contains: search } } },
        { employee: { name: { contains: search } } },
      ]
    }

    if (status === 'confirmed') {
      where.status = { in: ['Payment Received', 'Delivered'] }
    } else if (status === 'Payment Failed' || status === 'failed') {
      where.status = { in: ['Payment Failed', 'Failed'] }
    } else if (status) {
      where.status = status
    }

    const [orders, counts] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { customer: true, employee: true, card: true, design: true },
        orderBy: { orderDate: 'desc' },
      }),
      prisma.order.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
    ])

    const statusCounts: Record<string, number> = {}
    let confirmedCount = 0
    let failedCount = 0
    let allCount = 0

    for (const c of counts) {
      const count = c._count._all
      statusCounts[c.status] = count
      allCount += count
      if (c.status === 'Payment Received' || c.status === 'Delivered') {
        confirmedCount += count
      }
      if (c.status === 'Payment Failed' || c.status === 'Failed') {
        failedCount += count
      }
    }

    return successResponse({
      orders,
      counts: {
        all: allCount,
        confirmed: confirmedCount,
        failed: failedCount,
        pending: statusCounts['Pending'] || 0,
        delivered: statusCounts['Delivered'] || 0,
        cancelled: statusCounts['Cancelled'] || 0,
      },
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch orders', 500)
  }
}
