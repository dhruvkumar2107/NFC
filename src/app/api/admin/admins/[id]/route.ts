import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { hashPassword } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error
    const body = await request.json()
    const allowed = ['name', 'email']
    const safeData: Record<string, any> = {}
    for (const k of allowed) {
      if (body[k] !== undefined) safeData[k] = body[k]
    }
    if (body.password) {
      safeData.passwordHash = await hashPassword(body.password)
    }
    if (Object.keys(safeData).length === 0) return errorResponse('No valid fields to update')
    const updated = await prisma.admin.update({ where: { id: params.id }, data: safeData })
    return successResponse({ id: updated.id, name: updated.name, email: updated.email })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update admin', 500)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error
    if (user!.id === params.id) return errorResponse('Cannot delete yourself')
    await prisma.admin.delete({ where: { id: params.id } })
    return successResponse({ deleted: true })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to delete admin', 500)
  }
}
