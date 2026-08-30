import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { errorResponse } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    if (!code) return Response.json({ valid: false })

    const employee = await prisma.employee.findFirst({
      where: { referralLinkCode: code, status: 'active' },
      select: { employeeId: true, name: true, referralLinkCode: true },
    })

    if (!employee) return Response.json({ valid: false })
    return Response.json({ valid: true, employee })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to validate referral', 500)
  }
}
