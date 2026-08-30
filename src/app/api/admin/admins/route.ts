import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { hashPassword } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error
    const admins = await prisma.admin.findMany({ select: { id: true, name: true, email: true, createdAt: true }, orderBy: { createdAt: 'desc' } })
    return successResponse(admins)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch admins', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error
    const { name, email, password } = await request.json()
    if (!name || !email || !password) return errorResponse('Name, email, and password required')
    const existing = await prisma.admin.findUnique({ where: { email } })
    if (existing) return errorResponse('Email already exists')
    const passwordHash = await hashPassword(password)
    const admin = await prisma.admin.create({ data: { name, email, passwordHash } })
    return successResponse({ id: admin.id, name: admin.name, email: admin.email })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create admin', 500)
  }
}
