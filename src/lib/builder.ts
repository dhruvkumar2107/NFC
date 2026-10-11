export type HeaderStyle = 'gradient' | 'solid' | 'glass'
export type LayoutStyle = 'classic' | 'modern' | 'compact'
export type FontStyle = 'sans' | 'serif' | 'rounded'

export interface CardTheme {
  primary: string
  secondary: string
  headerStyle: HeaderStyle
  layout: LayoutStyle
  font: FontStyle
  showLogo: boolean
}

export interface OfferEntry {
  title: string
  body?: string
  image?: string
  active?: boolean
}

export interface CustomSection {
  key: string
  title: string
  body: string
}

export interface CardSections {
  order: string[]
  enabled: Record<string, boolean>
  titles: Record<string, string>
  custom: CustomSection[]
  offers: OfferEntry[]
  fields: Record<string, string>
}

export interface SectionMeta {
  key: string
  label: string
  description: string
}

/** Canonical list of renderable card sections. */
export const SECTION_REGISTRY: SectionMeta[] = [
  { key: 'about', label: 'About', description: 'Business description / summary' },
  { key: 'offers', label: 'Offers & Promotions', description: 'Running offers and discounts' },
  { key: 'gallery', label: 'Photo Gallery', description: 'Albums with downloadable photos' },
  { key: 'menu', label: 'Menu', description: 'Food / service menu with prices' },
  { key: 'products', label: 'Products', description: 'Product cards with pricing' },
  { key: 'priceList', label: 'Price List', description: 'Compact price catalogue' },
  { key: 'catalogues', label: 'Catalogues & Brochures', description: 'Downloadable PDFs' },
  { key: 'emi', label: 'EMI Calculator', description: 'Instalment / finance calculator' },
  { key: 'hours', label: 'Opening Hours', description: 'Working hours' },
  { key: 'team', label: 'Our Team', description: 'Staff / trainer profiles' },
  { key: 'schedule', label: 'Schedule', description: 'Classes / timings' },
  { key: 'amenities', label: 'Amenities & Facilities', description: 'Facilities list' },
  { key: 'enquiry', label: 'Enquiry Form', description: 'Lead capture form' },
  { key: 'payment', label: 'Payment', description: 'UPI QR / payment link' },
]

export const DEFAULT_SECTION_ORDER = SECTION_REGISTRY.map((s) => s.key)

export function defaultTheme(): CardTheme {
  return {
    primary: '#4c6ef5',
    secondary: '#3b5bdb',
    headerStyle: 'gradient',
    layout: 'classic',
    font: 'sans',
    showLogo: true,
  }
}

export function defaultSections(): CardSections {
  const enabled: Record<string, boolean> = {}
  const titles: Record<string, string> = {}
  for (const s of SECTION_REGISTRY) {
    enabled[s.key] = ['about', 'gallery', 'enquiry', 'payment'].includes(s.key)
    titles[s.key] = s.label
  }
  return {
    order: [...DEFAULT_SECTION_ORDER],
    enabled,
    titles,
    custom: [],
    offers: [],
    fields: {},
  }
}

function asObject(raw: unknown): any {
  if (!raw) return {}
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  }
  return typeof raw === 'object' ? raw : {}
}

function hexOrDefault(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(value.trim()) ? value.trim() : fallback
}

export function normalizeTheme(raw: unknown): CardTheme {
  const o = asObject(raw)
  const d = defaultTheme()
  const header = ['gradient', 'solid', 'glass'].includes(o.headerStyle) ? o.headerStyle : d.headerStyle
  const layout = ['classic', 'modern', 'compact'].includes(o.layout) ? o.layout : d.layout
  const font = ['sans', 'serif', 'rounded'].includes(o.font) ? o.font : d.font
  return {
    primary: hexOrDefault(o.primary, d.primary),
    secondary: hexOrDefault(o.secondary, d.secondary),
    headerStyle: header,
    layout,
    font,
    showLogo: typeof o.showLogo === 'boolean' ? o.showLogo : d.showLogo,
  }
}

export function normalizeSections(raw: unknown): CardSections {
  const o = asObject(raw)
  const d = defaultSections()

  const validKeys = new Set(DEFAULT_SECTION_ORDER)
  let order = Array.isArray(o.order) ? o.order.filter((k: unknown) => typeof k === 'string' && validKeys.has(k)) : []
  for (const key of d.order) if (!order.includes(key)) order.push(key)

  const enabled: Record<string, boolean> = {}
  for (const key of DEFAULT_SECTION_ORDER) {
    enabled[key] = typeof o.enabled?.[key] === 'boolean' ? o.enabled[key] : d.enabled[key]
  }

  const titles: Record<string, string> = {}
  for (const s of SECTION_REGISTRY) {
    const t = o.titles?.[s.key]
    titles[s.key] = typeof t === 'string' && t.trim() ? t.trim().slice(0, 60) : s.label
  }

  const custom: CustomSection[] = Array.isArray(o.custom)
    ? o.custom
        .filter((c: any) => c && typeof c === 'object' && typeof c.title === 'string')
        .slice(0, 20)
        .map((c: any) => ({
          key: typeof c.key === 'string' && c.key ? c.key : `custom-${Math.random().toString(36).slice(2, 8)}`,
          title: String(c.title).slice(0, 60),
          body: typeof c.body === 'string' ? c.body.slice(0, 4000) : '',
        }))
    : []

  const offers: OfferEntry[] = Array.isArray(o.offers)
    ? o.offers
        .filter((x: any) => x && typeof x === 'object' && typeof x.title === 'string' && x.title.trim())
        .slice(0, 12)
        .map((x: any) => ({
          title: String(x.title).slice(0, 120),
          body: typeof x.body === 'string' ? x.body.slice(0, 500) : '',
          image: typeof x.image === 'string' ? x.image : '',
          active: x.active !== false,
        }))
    : []

  const fields: Record<string, string> = {}
  if (o.fields && typeof o.fields === 'object') {
    for (const [k, v] of Object.entries(o.fields)) {
      if (typeof v === 'string' && v.trim()) fields[String(k).slice(0, 40)] = String(v).slice(0, 4000)
    }
  }

  return { order, enabled, titles, custom, offers, fields }
}

export function isSectionEnabled(sections: CardSections, key: string): boolean {
  return sections.enabled[key] === true
}

export function applyTemplateConfig(config: unknown): { theme: CardTheme; sections: CardSections } {
  const o = asObject(config)
  return {
    theme: normalizeTheme(o.theme),
    sections: normalizeSections(o.sections),
  }
}

export const FONT_CLASS: Record<FontStyle, string> = {
  sans: 'font-sans',
  serif: 'font-serif',
  rounded: 'font-sans',
}
