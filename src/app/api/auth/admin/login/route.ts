import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { comparePassword, signToken } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) return errorResponse('Email and password are required')

    const admin = await prisma.admin.findUnique({ where: { email } })
    if (!admin) return errorResponse('Invalid credentials')

    const valid = await comparePassword(password, admin.passwordHash)
    if (!valid) return errorResponse('Invalid credentials')

    const token = await signToken({ id: admin.id, role: 'admin' })
    return successResponse({ token, admin: { id: admin.id, name: admin.name, email: admin.email } })
  } catch (err: any) {
    return errorResponse(err.message || 'Login failed', 500)
  }
}