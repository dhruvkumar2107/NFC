import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error
    const updated = await prisma.employee.update({ where: { id: params.id }, data: { status: 'inactive' } })
    return successResponse(updated)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to deactivate employee', 500)
  }
}