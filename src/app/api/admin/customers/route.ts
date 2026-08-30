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
    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { mobile: { contains: search } },
        { company: { contains: search } },
      ]
    }
    const customers = await prisma.customer.findMany({
      where,
      include: { card: true, orders: true, employee: true },
      orderBy: { createdAt: 'desc' },
    })
    return successResponse(customers)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch customers', 500)
  }
}
