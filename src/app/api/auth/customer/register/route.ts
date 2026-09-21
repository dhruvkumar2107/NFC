import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, signToken } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const { name, email, mobile, password } = await request.json()
    if (!name || !mobile || !password) return errorResponse('Name, mobile number, and password are required')

    const existingMobile = await prisma.customer.findFirst({ where: { mobile } })
    if (existingMobile) return errorResponse('Phone number already registered')

    if (email) {
      const existingEmail = await prisma.customer.findUnique({ where: { email } })
      if (existingEmail) return errorResponse('Email already registered')
    }

    const passwordHash = await hashPassword(password)
    const customer = await prisma.customer.create({
      data: { name, email: email || null, mobile, passwordHash },
    })

    const token = await signToken({ id: customer.id, role: 'customer' })
    return successResponse({ token, customer: { id: customer.id, name: customer.name, mobile: customer.mobile } })
  } catch (err: any) {
    return errorResponse(err.message || 'Registration failed', 500)
  }
}
