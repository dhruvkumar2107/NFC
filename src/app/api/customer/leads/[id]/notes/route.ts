import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, notFound } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-guard'
import { logActivity } from '@/lib/admin-log'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth(request, 'customer')
  if (error) return error

  const customer = await prisma.customer.findUnique({ where: { id: user!.id }, select: { cardId: true } })
  if (!customer?.cardId) return notFound('No card assigned')
  const lead = await prisma.enquiry.findUnique({ where: { id: params.id }, select: { id: true, cardId: true } })
  if (!lead || lead.cardId !== customer.cardId) return notFound('Lead not found')

  const body = await request.json().catch(() => ({}))
  const note = String(body.note || '').trim().slice(0, 2000)
  if (!note) return errorResponse('Note cannot be empty.')
  const followUpAt = body.followUpAt ? new Date(body.followUpAt) : null
  if (followUpAt && Number.isNaN(followUpAt.getTime())) return errorResponse('Invalid follow-up date.')

  const created = await prisma.leadNote.create({ data: { enquiryId: params.id, author: user!.id, note, followUpAt } })
  await logActivity({ actorId: user!.id, actorRole: user!.role, action: 'lead.note', target: params.id })
  return successResponse(created, 201)
}
