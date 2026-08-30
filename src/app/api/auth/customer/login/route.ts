import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { comparePassword, signToken } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) return errorResponse('Email and password are required')

    const customer = await prisma.customer.findUnique({ where: { email } })
    if (!customer || !customer.passwordHash) return errorResponse('Invalid credentials')

    const valid = await comparePassword(password, customer.passwordHash)
    if (!valid) return errorResponse('Invalid credentials')

    const token = await signToken({ id: customer.id, role: 'customer' })
    return successResponse({ token, customer: { id: customer.id, name: customer.name, email: customer.email, cardId: customer.cardId } })
  } catch (err: any) {
    return errorResponse(err.message || 'Login failed', 500)
  }
}