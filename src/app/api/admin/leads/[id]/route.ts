import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, notFound, errorResponse } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-guard'
import { logActivity } from '@/lib/admin-log'

export const dynamic = 'force-dynamic'

const STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost']

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAuth(request, 'admin')
  if (error) return error
  const lead = await prisma.enquiry.findUnique({
    where: { id: params.id },
    include: {
      notes: { orderBy: { createdAt: 'desc' } },
      card: { select: { id: true, cardId: true, status: true, customer: { select: { name: true, company: true, mobile: true } } } },
    },
  })
  if (!lead) return notFound('Lead not found')
  return successResponse(lead)
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth(request, 'admin')
  if (error) return error
  const lead = await prisma.enquiry.findUnique({ where: { id: params.id } })
  if (!lead) return notFound('Lead not found')

  const body = await request.json().catch(() => ({}))
  const data: any = {}
  if (typeof body.status === 'string') {
    if (!STATUSES.includes(body.status)) return errorResponse('Invalid status')
    data.status = body.status
  }
  if ('assignedTo' in body) {
    if (body.assignedTo === null || body.assignedTo === '') data.assignedTo = null
    else {
      const employee = await prisma.employee.findUnique({ where: { id: String(body.assignedTo) }, select: { id: true } })
      data.assignedTo = employee?.id || null
    }
  }

  const updated = await prisma.enquiry.update({ where: { id: params.id }, data })
  await logActivity({ actorId: user!.id, actorRole: user!.role, action: 'lead.update', target: params.id, metadata: data })
  return successResponse(updated)
}
