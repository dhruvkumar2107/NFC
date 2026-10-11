import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, notFound, forbidden } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-guard'
import { logActivity } from '@/lib/admin-log'

export const dynamic = 'force-dynamic'

const STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost']

async function ownedLead(userId: string, leadId: string) {
  const customer = await prisma.customer.findUnique({ where: { id: userId }, select: { cardId: true } })
  if (!customer?.cardId) return { error: notFound('No card assigned') as Response, lead: null }
  const lead = await prisma.enquiry.findUnique({ where: { id: leadId } })
  if (!lead) return { error: notFound('Lead not found') as Response, lead: null }
  if (lead.cardId !== customer.cardId) return { error: forbidden('You do not have access to this lead') as Response, lead: null }
  return { error: null, lead }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth(request, 'customer')
  if (error) return error
  const { error: ownedError } = await ownedLead(user!.id, params.id)
  if (ownedError) return ownedError

  const lead = await prisma.enquiry.findUnique({
    where: { id: params.id },
    include: {
      notes: { orderBy: { createdAt: 'desc' } },
      card: { select: { cardId: true, customer: { select: { name: true, company: true } } } },
    },
  })
  return successResponse(lead)
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth(request, 'customer')
  if (error) return error
  const { error: ownedError } = await ownedLead(user!.id, params.id)
  if (ownedError) return ownedError

  const body = await request.json().catch(() => ({}))
  const data: any = {}
  if (typeof body.status === 'string') {
    if (!STATUSES.includes(body.status)) return errorResponse('Invalid status')
    data.status = body.status
  }
  if (Object.keys(data).length === 0) return errorResponse('Nothing to update.')

  const updated = await prisma.enquiry.update({ where: { id: params.id }, data })
  await logActivity({ actorId: user!.id, actorRole: user!.role, action: 'lead.update', target: params.id, metadata: data })
  return successResponse(updated)
}
