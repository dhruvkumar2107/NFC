import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-guard'
import { logActivity } from '@/lib/admin-log'
import { normalizeSections, normalizeTheme } from '@/lib/builder'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(request, 'admin')
  if (error) return error

  const q = (request.nextUrl.searchParams.get('q') || '').trim()
  const category = request.nextUrl.searchParams.get('category') || ''
  const activeParam = request.nextUrl.searchParams.get('active')

  const where: any = {}
  if (q) where.OR = [{ name: { contains: q, mode: 'insensitive' } }, { industry: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }]
  if (category) where.category = category
  if (activeParam === 'true') where.active = true
  if (activeParam === 'false') where.active = false

  const templates = await prisma.cardTemplate.findMany({ where, orderBy: [{ isSystem: 'desc' }, { name: 'asc' }] })
  const categories = await prisma.cardTemplate.findMany({ distinct: ['category'], select: { category: true }, orderBy: { category: 'asc' } })
  return successResponse({ templates, categories: categories.map((c) => c.category) })
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth(request, 'admin')
  if (error) return error

  try {
    const body = await request.json().catch(() => ({}))
    const name = String(body.name || '').trim().slice(0, 80)
    if (!name) return errorResponse('Template name is required.')

    let industry = String(body.industry || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 40)
    if (!industry) industry = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 40)

    const exists = await prisma.cardTemplate.findUnique({ where: { industry } })
    if (exists) industry = `${industry}-${Math.random().toString(36).slice(2, 6)}`

    const config = {
      theme: normalizeTheme(body.theme),
      sections: normalizeSections(body.sections),
      fieldDefs: Array.isArray(body.fieldDefs) ? body.fieldDefs.slice(0, 30) : [],
    }

    const template = await prisma.cardTemplate.create({
      data: {
        name,
        industry,
        category: String(body.category || 'General').slice(0, 60),
        description: body.description ? String(body.description).slice(0, 300) : null,
        icon: body.icon ? String(body.icon).slice(0, 40) : 'grid',
        config: JSON.stringify(config),
        active: body.active !== false,
        isSystem: false,
      },
    })
    await logActivity({ actorId: user!.id, actorRole: user!.role, action: 'template.create', target: template.id, metadata: { name } })
    return successResponse(template, 201)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create template', 500)
  }
}
