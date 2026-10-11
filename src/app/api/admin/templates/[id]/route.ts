import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, notFound } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-guard'
import { logActivity } from '@/lib/admin-log'
import { normalizeSections, normalizeTheme } from '@/lib/builder'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAuth(request, 'admin')
  if (error) return error
  const template = await prisma.cardTemplate.findUnique({ where: { id: params.id } })
  if (!template) return notFound('Template not found')
  return successResponse(template)
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth(request, 'admin')
  if (error) return error

  const existing = await prisma.cardTemplate.findUnique({ where: { id: params.id } })
  if (!existing) return notFound('Template not found')

  const body = await request.json().catch(() => ({}))
  const data: any = {}
  if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim().slice(0, 80)
  if (typeof body.category === 'string') data.category = body.category.slice(0, 60)
  if (typeof body.description === 'string') data.description = body.description.slice(0, 300)
  if (typeof body.icon === 'string') data.icon = body.icon.slice(0, 40)
  if (typeof body.active === 'boolean') data.active = body.active

  if (body.theme || body.sections || body.fieldDefs) {
    let config: any = {}
    try { config = JSON.parse(existing.config || '{}') } catch { config = {} }
    if (body.theme) config.theme = normalizeTheme(body.theme)
    if (body.sections) config.sections = normalizeSections(body.sections)
    if (Array.isArray(body.fieldDefs)) config.fieldDefs = body.fieldDefs.slice(0, 30)
    data.config = JSON.stringify(config)
  }

  const updated = await prisma.cardTemplate.update({ where: { id: params.id }, data })
  await logActivity({ actorId: user!.id, actorRole: user!.role, action: 'template.update', target: params.id })
  return successResponse(updated)
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth(request, 'admin')
  if (error) return error
  const existing = await prisma.cardTemplate.findUnique({ where: { id: params.id } })
  if (!existing) return notFound('Template not found')
  if (existing.isSystem) return errorResponse('Built-in industry templates cannot be deleted. You can deactivate them instead.', 400)

  await prisma.cardTemplate.delete({ where: { id: params.id } })
  await logActivity({ actorId: user!.id, actorRole: user!.role, action: 'template.delete', target: params.id })
  return successResponse({ deleted: true })
}
