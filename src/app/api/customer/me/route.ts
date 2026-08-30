import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request, 'customer')
    if (error) return error

    const customer = await prisma.customer.findUnique({
      where: { id: user!.id },
      include: { card: true, orders: true },
    })
    return successResponse(customer)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch profile', 500)
  }
}