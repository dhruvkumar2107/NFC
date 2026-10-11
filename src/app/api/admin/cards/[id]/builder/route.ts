import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api-response'
import { authorizeCardAccess } from '@/lib/card-access'
import { logActivity } from '@/lib/admin-log'
import { normalizeSections, normalizeTheme } from '@/lib/builder'

export const dynamic = 'force-dynamic'

const BUILDER_INCLUDE = {
  card: true,
  emiConfig: true,
  template: true,
  albums: { include: { media: { orderBy: { sortOrder: 'asc' as const } } }, orderBy: { sortOrder: 'asc' as const } },
  products: { orderBy: { sortOrder: 'asc' as const } },
  categories: { orderBy: { sortOrder: 'asc' as const } },
  catalogues: { orderBy: { sortOrder: 'asc' as const } },
}

async function getOrCreate(cardId: string) {
  const existing = await prisma.cardBuilderConfig.findUnique({ where: { cardId }, include: BUILDER_INCLUDE })
  if (existing) return existing
  await prisma.cardBuilderConfig.create({ data: { cardId } })
  return prisma.cardBuilderConfig.findUniqueOrThrow({ where: { cardId }, include: BUILDER_INCLUDE })
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { access, error } = await authorizeCardAccess(request, params.id)
  if (error) return error

  try {
    const config = await getOrCreate(params.id)
    const customer = await prisma.customer.findUnique({
      where: { cardId: params.id },
      select: { name: true, designation: true, company: true, mobile: true, whatsapp: true, email: true, logoUrl: true, description: true },
    })
    return successResponse({ config, customer, permissions: { isAdmin: access!.isAdmin } })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to load card builder', 500)
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { access, error } = await authorizeCardAccess(request, params.id)
  if (error) return error

  try {
    const body = await request.json().catch(() => ({}))
    await getOrCreate(params.id)

    const data: any = {}

    if (typeof body.slug === 'string') {
      const slug = body.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
      if (slug) {
        const taken = await prisma.cardBuilderConfig.findFirst({ where: { slug, cardId: { not: params.id } }, select: { id: true } })
        if (taken) return errorResponse('That URL slug is already in use.')
        data.slug = slug
      } else {
        data.slug = null
      }
    }

    if (typeof body.industry === 'string') data.industry = body.industry.slice(0, 40) || 'general'
    if (typeof body.status === 'string' && ['draft', 'published', 'unpublished'].includes(body.status)) {
      data.status = body.status
      if (body.status === 'published') data.publishedAt = new Date()
    }
    if (typeof body.logoUrl === 'string' || body.logoUrl === null) data.logoUrl = body.logoUrl
    if (typeof body.coverImage === 'string' || body.coverImage === null) data.coverImage = body.coverImage
    if (typeof body.profileImage === 'string' || body.profileImage === null) data.profileImage = body.profileImage
    if (typeof body.emiEnabled === 'boolean') data.emiEnabled = body.emiEnabled

    if (body.theme && typeof body.theme === 'object') data.theme = JSON.stringify(normalizeTheme(body.theme))
    if (body.sections && typeof body.sections === 'object') data.sections = JSON.stringify(normalizeSections(body.sections))

    let templateConfig: any = null
    if (typeof body.templateId === 'string') {
      const template = await prisma.cardTemplate.findUnique({ where: { id: body.templateId } })
      if (template) {
        data.templateId = template.id
        data.industry = template.industry
        try { templateConfig = JSON.parse(template.config || '{}') } catch { templateConfig = {} }
        if (body.applyTemplate) {
          data.theme = JSON.stringify(normalizeTheme(templateConfig.theme))
          const merged = normalizeSections(templateConfig.sections)
          const incoming = body.sections && typeof body.sections === 'object' ? body.sections : {}
          const incomingSections = normalizeSections(incoming)
          if (incoming.fields) merged.fields = incomingSections.fields
          data.sections = JSON.stringify(merged)
        }
      }
    } else if (body.templateId === null) {
      data.templateId = null
    }

    // EMI configuration
    if (body.emiConfig && typeof body.emiConfig === 'object') {
      const e = body.emiConfig
      const num = (v: any, d: number) => (Number.isFinite(Number(v)) ? Number(v) : d)
      const values = {
        defaultRate: Math.max(0, Math.min(100, num(e.defaultRate, 10))),
        minTenure: Math.max(1, Math.round(num(e.minTenure, 3))),
        maxTenure: Math.max(1, Math.round(num(e.maxTenure, 60))),
        defaultTenure: Math.max(1, Math.round(num(e.defaultTenure, 12))),
        processingFee: Math.max(0, num(e.processingFee, 0)),
      }
      const current = await prisma.cardBuilderConfig.findUnique({ where: { cardId: params.id }, select: { emiConfigId: true } })
      const emiConfig = current?.emiConfigId
        ? await prisma.emiConfig.update({ where: { id: current.emiConfigId }, data: values })
        : await prisma.emiConfig.create({ data: values })
      data.emiConfigId = emiConfig.id
    }

    const config = await prisma.cardBuilderConfig.update({ where: { cardId: params.id }, data, include: BUILDER_INCLUDE })

    await logActivity({
      actorId: access!.user.id,
      actorRole: access!.user.role,
      action: 'card.builder.update',
      target: params.id,
      metadata: { status: config.status, industry: config.industry },
    })

    return successResponse({ config })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to save card builder', 500)
  }
}
