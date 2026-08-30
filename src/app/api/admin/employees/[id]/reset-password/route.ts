import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { hashPassword } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-response'

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let pass = ''
  for (let i = 0; i < 10; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length))
  return pass
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error
    const { password: customPassword, autoGenerate } = await request.json()
    const plainPassword = autoGenerate ? generatePassword() : customPassword
    if (!plainPassword) return errorResponse('Password required')
    const passwordHash = await hashPassword(plainPassword)
    await prisma.employee.update({ where: { id: params.id }, data: { passwordHash } })
    return successResponse({ message: 'Password reset', plainPassword })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to reset password', 500)
  }
}
