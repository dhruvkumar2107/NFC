import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request, 'employee')
    if (error) return error

    // Only include confirmed customers and confirmed orders in employee profile overview
    const employee = await prisma.employee.findUnique({
      where: { id: user!.id },
      include: {
        customers: {
          where: {
            orders: {
              some: {
                employeeId: user!.id,
                status: { in: ['Payment Received', 'Delivered'] },
              },
            },
          },
        },
        orders: {
          where: {
            status: { in: ['Payment Received', 'Delivered'] },
          },
        },
      },
    })
    return successResponse(employee)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch employee profile', 500)
  }
}