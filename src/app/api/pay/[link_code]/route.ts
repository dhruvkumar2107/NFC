import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function GET(_request: NextRequest, { params }: { params: { link_code: string } }) {
  try {
    const employee = await prisma.employee.findFirst({
      where: { referralLinkCode: params.link_code, status: 'active' },
      select: { employeeId: true, referralLinkCode: true },
    })
    if (!employee) return errorResponse('Invalid referral link', 404)
    return successResponse(employee)
  } catch (err: any) {
    return errorResponse(err.message, 500)
  }
}