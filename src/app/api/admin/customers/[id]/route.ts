import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: { card: true, orders: true, employee: true },
    })
    if (!customer) return errorResponse('Customer not found', 404)
    return successResponse(customer)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch customer', 500)
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error
    const body = await request.json()
    const allowed = ['name','designation','company','mobile','whatsapp','email','website','socialLinks','location','upiId','profilePhotoUrl','logoUrl','description','type']
    const safeData: Record<string, any> = {}
    for (const k of allowed) { if (body[k] !== undefined) safeData[k] = body[k] }
    if (safeData.socialLinks && typeof safeData.socialLinks === 'object') safeData.socialLinks = JSON.stringify(safeData.socialLinks)
    const updated = await prisma.customer.update({ where: { id: params.id }, data: safeData })
    return successResponse(updated)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update customer', 500)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error
    await prisma.customer.delete({ where: { id: params.id } })
    return successResponse({ deleted: true })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to delete customer', 500)
  }
}
