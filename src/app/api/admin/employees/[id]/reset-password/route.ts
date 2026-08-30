import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { hashPassword } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error
    const { password } = await request.json()
    if (!password) return errorResponse('Password required')
    const passwordHash = await hashPassword(password)
    await prisma.employee.update({ where: { id: params.id }, data: { passwordHash } })
    return successResponse({ message: 'Password reset' })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to reset password', 500)
  }
}
