import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error
    const admin = await prisma.admin.findUnique({
      where: { id: user!.id },
      select: { id: true, name: true, email: true, paymentQrUrl: true },
    })
    if (!admin) return errorResponse('Admin not found')
    return successResponse(admin)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch settings', 500)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error
    const body = await request.json()
    const allowed = ['paymentQrUrl']
    const safeData: Record<string, any> = {}
    for (const k of allowed) {
      if (body[k] !== undefined) safeData[k] = body[k]
    }
    if (Object.keys(safeData).length === 0) return errorResponse('No valid fields to update')
    const updated = await prisma.admin.update({
      where: { id: user!.id },
      data: safeData,
      select: { id: true, name: true, email: true, paymentQrUrl: true },
    })
    return successResponse(updated)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update settings', 500)
  }
}
