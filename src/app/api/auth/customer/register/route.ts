import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, signToken } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const { name, email, mobile, password } = await request.json()
    if (!name || !email || !password) return errorResponse('Name, email, and password are required')

    const existing = await prisma.customer.findUnique({ where: { email } })
    if (existing) return errorResponse('Email already registered')

    const passwordHash = await hashPassword(password)
    const customer = await prisma.customer.create({
      data: { name, email, mobile, passwordHash },
    })

    const token = await signToken({ id: customer.id, role: 'customer' })
    return successResponse({ token, customer: { id: customer.id, name: customer.name, email: customer.email } })
  } catch (err: any) {
    return errorResponse(err.message || 'Registration failed', 500)
  }
}