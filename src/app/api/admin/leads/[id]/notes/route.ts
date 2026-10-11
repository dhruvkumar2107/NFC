import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, notFound } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-guard'
import { logActivity } from '@/lib/admin-log'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth(request, 'admin')
  if (error) return error
  const lead = await prisma.enquiry.findUnique({ where: { id: params.id }, select: { id: true } })
  if (!lead) return notFound('Lead not found')

  const body = await request.json().catch(() => ({}))
  const note = String(body.note || '').trim().slice(0, 2000)
  if (!note) return errorResponse('Note cannot be empty.')
  const followUpAt = body.followUpAt ? new Date(body.followUpAt) : null
  if (followUpAt && Number.isNaN(followUpAt.getTime())) return errorResponse('Invalid follow-up date.')

  const created = await prisma.leadNote.create({
    data: { enquiryId: params.id, author: user!.id, note, followUpAt },
  })
  await logActivity({ actorId: user!.id, actorRole: user!.role, action: 'lead.note', target: params.id })
  return successResponse(created, 201)
}
