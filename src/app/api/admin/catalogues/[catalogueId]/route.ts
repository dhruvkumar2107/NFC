import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, notFound } from '@/lib/api-response'
import { authorizeCardAccess } from '@/lib/card-access'
import { logActivity } from '@/lib/admin-log'
import { deleteStoredFileByUrl } from '@/lib/stored-files'

export const dynamic = 'force-dynamic'

const KINDS = ['catalogue', 'price_list', 'brochure', 'menu']

async function loadDoc(id: string) {
  return prisma.catalogueDocument.findUnique({ where: { id }, include: { config: { select: { cardId: true } } } })
}

export async function PATCH(request: NextRequest, { params }: { params: { catalogueId: string } }) {
  const doc = await loadDoc(params.catalogueId)
  if (!doc) return notFound('Document not found')
  const { access, error } = await authorizeCardAccess(request, doc.config.cardId)
  if (error) return error
  const body = await request.json().catch(() => ({}))
  const data: any = {}
  if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim().slice(0, 120)
  if (typeof body.kind === 'string' && KINDS.includes(body.kind)) data.kind = body.kind
  if (typeof body.visibility === 'string' && ['public', 'private'].includes(body.visibility)) data.visibility = body.visibility
  if (Number.isFinite(Number(body.sortOrder))) data.sortOrder = Math.round(Number(body.sortOrder))
  const updated = await prisma.catalogueDocument.update({ where: { id: params.catalogueId }, data })
  await logActivity({ actorId: access!.user.id, actorRole: access!.user.role, action: 'catalogue.update', target: params.catalogueId })
  return successResponse(updated)
}

export async function DELETE(request: NextRequest, { params }: { params: { catalogueId: string } }) {
  const doc = await loadDoc(params.catalogueId)
  if (!doc) return notFound('Document not found')
  const { access, error } = await authorizeCardAccess(request, doc.config.cardId)
  if (error) return error
  await prisma.catalogueDocument.delete({ where: { id: params.catalogueId } })
  await deleteStoredFileByUrl(doc.url)
  await logActivity({ actorId: access!.user.id, actorRole: access!.user.role, action: 'catalogue.delete', target: params.catalogueId })
  return successResponse({ deleted: true })
}
