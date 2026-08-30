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
    if (status) where.status = status
    const orders = await prisma.order.findMany({
      where,
      include: { customer: true, employee: true, card: true, design: true },
      orderBy: { orderDate: 'desc' },
    })
    return successResponse(orders)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch orders', 500)
  }
}
