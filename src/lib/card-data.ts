import { prisma } from './db'
import { CardSections, CardTheme, normalizeSections, normalizeTheme } from './builder'

export interface PublicMedia {
  id: string
  url: string
  thumbnailUrl: string | null
  name: string | null
  mime: string | null
  kind: 'image' | 'video'
}

export interface PublicAlbum {
  id: string
  name: string
  slug: string
  description: string | null
  photos: PublicMedia[]
}

export interface PublicProduct {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  mrp: number | null
  price: number | null
  discountPct: number | null
  stockStatus: string
  attributes: Record<string, string>
  categoryId: string | null
}

export interface PublicCatalogue {
  id: string
  title: string
  kind: string
  size: number
  url: string
}

export interface PublicEmiConfig {
  defaultRate: number
  minTenure: number
  maxTenure: number
  defaultTenure: number
  processingFee: number
  /** False when EMI is switched on but no terms were saved; the UI must not show the default figures as real terms. */
  configured: boolean
}

export interface PublicBuilderData {
  configured: boolean
  status: string
  industry: string
  slug: string | null
  logoUrl: string | null
  coverImage: string | null
  profileImage: string | null
  theme: CardTheme
  sections: CardSections
  albums: PublicAlbum[]
  products: PublicProduct[]
  categories: { id: string; name: string }[]
  catalogues: PublicCatalogue[]
  emi: PublicEmiConfig | null
}

export const DEFAULT_EMI_CONFIG: PublicEmiConfig = {
  defaultRate: 10,
  minTenure: 3,
  maxTenure: 60,
  defaultTenure: 12,
  processingFee: 0,
  configured: false,
}

/**
 * Public EMI data for a card. The admin-controlled `emiEnabled` flag is the only
 * switch: when it is off (or missing) nothing EMI-related is exposed.
 */
export function buildPublicEmi(config: any): PublicEmiConfig | null {
  if (config?.emiEnabled !== true) return null
  const e = config.emiConfig
  if (!e) return { ...DEFAULT_EMI_CONFIG }
  return {
    defaultRate: e.defaultRate ?? DEFAULT_EMI_CONFIG.defaultRate,
    minTenure: e.minTenure ?? DEFAULT_EMI_CONFIG.minTenure,
    maxTenure: e.maxTenure ?? DEFAULT_EMI_CONFIG.maxTenure,
    defaultTenure: e.defaultTenure ?? DEFAULT_EMI_CONFIG.defaultTenure,
    processingFee: e.processingFee ?? 0,
    configured: true,
  }
}

export async function getOrCreateBuilderConfig(cardId: string) {
  const existing = await prisma.cardBuilderConfig.findUnique({ where: { cardId } })
  if (existing) return existing
  return prisma.cardBuilderConfig.create({ data: { cardId } })
}

function safeParseObject(raw: string | null | undefined): Record<string, any> {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function buildPublicBuilderData(config: any): PublicBuilderData {
  const theme = normalizeTheme(config?.theme)
  const sections = normalizeSections(config?.sections)

  const albums: PublicAlbum[] = (config?.albums || [])
    .filter((a: any) => a && a.public !== false)
    .map((a: any) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      description: a.description || null,
      photos: (a.media || [])
        .filter((m: any) => m.visibility !== 'private')
        .map((m: any) => ({
          id: m.id,
          url: `/api/public/${encodeURIComponent(config.card.cardId)}/media/${m.id}`,
          thumbnailUrl: m.thumbnailUrl
            ? `/api/public/${encodeURIComponent(config.card.cardId)}/media/${m.id}?thumb=1`
            : null,
          name: m.name || null,
          mime: m.mime || null,
          kind: typeof m.mime === 'string' && m.mime.toLowerCase().startsWith('video/') ? 'video' : 'image',
        })),
    }))
    .filter((a: PublicAlbum) => a.photos.length > 0)

  const products: PublicProduct[] = (config?.products || [])
    .filter((p: any) => p && p.active !== false)
    .map((p: any) => {
      const attributes = safeParseObject(p.attributes)
      const clean: Record<string, string> = {}
      for (const [k, v] of Object.entries(attributes)) {
        if (typeof v === 'string' || typeof v === 'number') clean[k] = String(v)
      }
      return {
        id: p.id,
        name: p.name,
        description: p.description || null,
        imageUrl: p.imageUrl || null,
        mrp: p.mrp ?? null,
        price: p.price ?? null,
        discountPct: p.discountPct ?? null,
        stockStatus: p.stockStatus || 'in_stock',
        attributes: clean,
        categoryId: p.categoryId || null,
      }
    })

  const categories = (config?.categories || []).map((c: any) => ({ id: c.id, name: c.name }))

  const catalogues: PublicCatalogue[] = (config?.catalogues || [])
    .filter((c: any) => c && c.visibility !== 'private')
    .map((c: any) => ({
      id: c.id,
      title: c.title,
      kind: c.kind || 'catalogue',
      size: c.size || 0,
      url: `/api/public/${encodeURIComponent(config.card.cardId)}/catalogue/${c.id}`,
    }))

  const emi = buildPublicEmi(config)

  return {
    configured: true,
    status: config.status || 'draft',
    industry: config.industry || 'general',
    slug: config.slug || null,
    logoUrl: config.logoUrl || null,
    coverImage: config.coverImage || null,
    profileImage: config.profileImage || null,
    theme,
    sections,
    albums,
    products,
    categories,
    catalogues,
    emi,
  }
}

const BUILDER_INCLUDE = {
  card: true,
  emiConfig: true,
  albums: { include: { media: { orderBy: { sortOrder: 'asc' as const } } }, orderBy: { sortOrder: 'asc' as const } },
  products: { orderBy: { sortOrder: 'asc' as const } },
  categories: { orderBy: { sortOrder: 'asc' as const } },
  catalogues: { orderBy: { sortOrder: 'asc' as const } },
}

export async function loadBuilderConfigByCardId(cardId: string) {
  return prisma.cardBuilderConfig.findUnique({
    where: { cardId },
    include: BUILDER_INCLUDE,
  })
}

export async function loadBuilderConfigByCardUuid(cardUuid: string) {
  return prisma.cardBuilderConfig.findUnique({
    where: { cardId: cardUuid },
    include: BUILDER_INCLUDE,
  })
}

/**
 * Data for the public profile pages (NFC, /p/ and QR all resolve here).
 * Builder customisation is only exposed once published; EMI follows the admin
 * toggle on its own so it does not depend on the publish state.
 */
export async function loadPublicProfileConfig(cardUuid: string): Promise<{ builder: PublicBuilderData | null; emi: PublicEmiConfig | null }> {
  const config = await loadBuilderConfigByCardUuid(cardUuid)
  if (!config) return { builder: null, emi: null }
  return {
    builder: config.status === 'published' ? buildPublicBuilderData(config) : null,
    emi: buildPublicEmi(config),
  }
}
