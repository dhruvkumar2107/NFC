import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, signToken } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const { name, email, mobile, password } = await request.json()
    if (!name) return errorResponse('Name is required')

    const mobileClean = typeof mobile === 'string' && mobile.trim() ? mobile.trim() : null
    const emailClean = typeof email === 'string' && email.trim() ? email.trim() : null

    if (mobileClean) {
      const existingMobile = await prisma.customer.findFirst({ where: { mobile: mobileClean } })
      if (existingMobile) return errorResponse('Phone number already registered')
    }

    if (emailClean) {
      const existingEmail = await prisma.customer.findUnique({ where: { email: emailClean } })
      if (existingEmail) return errorResponse('Email already registered')
    }

    const passwordHash = await hashPassword(password || name + '_mysmartcard_member')
    const customer = await prisma.customer.create({
      data: { name, email: emailClean, mobile: mobileClean, passwordHash },
    })

    const token = await signToken({ id: customer.id, role: 'customer' })
    return successResponse({ token, customer: { id: customer.id, name: customer.name, mobile: customer.mobile } })
  } catch (err: any) {
    return errorResponse(err.message || 'Registration failed', 500)
  }
}
