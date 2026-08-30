import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error

    const { status } = await request.json()
    if (!['Active', 'Deactivated', 'Issued', 'Delivered'].includes(status)) {
      return errorResponse('Invalid status')
    }
    const updated = await prisma.card.update({
      where: { id: params.id },
      data: { status, activatedAt: status === 'Active' ? new Date() : undefined },
    })
    return successResponse(updated)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update card status', 500)
  }
}