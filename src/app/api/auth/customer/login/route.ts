import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { signToken } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const { name, phone } = await request.json()
    if (!name || !phone) return errorResponse('Name and phone number are required')

    const customer = await prisma.customer.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        mobile: phone,
      },
    })
    if (!customer) return errorResponse('No account found with this name and phone number')

    const token = await signToken({ id: customer.id, role: 'customer' })
    return successResponse({ token, customer: { id: customer.id, name: customer.name, email: customer.email, cardId: customer.cardId } })
  } catch (err: any) {
    return errorResponse(err.message || 'Login failed', 500)
  }
}
