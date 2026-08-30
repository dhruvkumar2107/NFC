import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { comparePassword, hashPassword } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error
    const { currentPassword, newPassword } = await request.json()
    if (!currentPassword || !newPassword) return errorResponse('Both passwords required')
    const admin = await prisma.admin.findUnique({ where: { id: user!.id } })
    if (!admin) return errorResponse('Admin not found')
    const valid = await comparePassword(currentPassword, admin.passwordHash)
    if (!valid) return errorResponse('Current password is incorrect')
    const passwordHash = await hashPassword(newPassword)
    await prisma.admin.update({ where: { id: user!.id }, data: { passwordHash } })
    return successResponse({ message: 'Password changed' })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to change password', 500)
  }
}
