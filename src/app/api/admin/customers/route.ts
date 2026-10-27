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
    const search = searchParams.get('search')
    const where: any = {}
    if (search) {
      const q = search.trim()
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { mobile: { contains: q } },
        { company: { contains: q, mode: 'insensitive' } },
        { card: { cardId: { contains: q, mode: 'insensitive' } } },
        { card: { nfcCardNumber: { contains: q, mode: 'insensitive' } } },
      ]
    }
    const customers = await prisma.customer.findMany({
      where,
      select: {
        ...CUSTOMER_LIST_SELECT,
        card: { select: { id: true, cardId: true, nfcCardNumber: true, status: true } },
        orders: { select: { id: true, orderId: true, status: true, amount: true, createdAt: true }, orderBy: { createdAt: 'desc' } },
        employee: { select: { id: true, employeeId: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return successResponse(customers)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch customers', 500)
  }
}
