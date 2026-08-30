import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error
    const employee = await prisma.employee.findUnique({
      where: { id: params.id },
      include: { customers: true, orders: { include: { customer: true, design: true } } },
    })
    if (!employee) return errorResponse('Employee not found', 404)
    return successResponse(employee)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch employee', 500)
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error
    const body = await request.json()
    const allowed = ['name','email','mobile','territory','status']
    const safeData: Record<string, any> = {}
    for (const k of allowed) { if (body[k] !== undefined) safeData[k] = body[k] }
    const updated = await prisma.employee.update({ where: { id: params.id }, data: safeData })
    return successResponse(updated)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update employee', 500)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error
    await prisma.employee.delete({ where: { id: params.id } })
    return successResponse({ deleted: true })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to delete employee', 500)
  }
}
