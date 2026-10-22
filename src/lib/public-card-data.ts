import { prisma } from './db'
import { buildPublicBuilderData, type PublicBuilderData } from './card-data'
import { buildPublicGallery, buildPublicDocuments, type PublicPhoto, type PublicDocument } from './public-profile'
import { guessMimeFromUrl, mimeToExt, estimateUrlSize, sanitizeBaseName } from './file-store'
import {
  isPublicVisibility,
  parseAdminPhotoEntries,
  parseDocumentEntries,
  parsePhotoUrlList,
  type ProfileDocumentEntry,
} from './profile-media'

export interface PublicCard {
  id: string
  cardId: string
  nfcCardNumber: string | null
  status: string
}

export interface PublicCustomer {
  id: string
  name: string
  designation: string | null
  company: string | null
  college: string | null
  mobile: string | null
  whatsapp: string | null
  email: string | null
  website: string | null
  socialLinks: string
  address: string | null
  taluk: string | null
  city: string | null
  state: string | null
  pincode: string | null
  country: string | null
  upiId: string | null
  photos: string
  adminPhotos: string
  documents: string
  paymentQrUrl: string | null
  logoUrl: string | null
  description: string | null
  type: string
  updatedAt: Date
}

export interface AlbumAsset {
  albumId: string
  albumName: string
  albumSlug: string
  folder: string
  photos: RawAsset[]
}

export interface RawAsset {
  /** Storage URL that can be resolved to bytes server-side. */
  url: string
  label: string
  filename: string
  mime: string
  size: number
}

export interface CatalogueAsset {
  id: string
  title: string
  kind: string
  size: number
  url: string
}

export interface PublicCardData {
  card: PublicCard
  customer: PublicCustomer
  builder: PublicBuilderData | null
  configUpdatedAt: Date | null
  /** Flat gallery photos (user + admin public photos). */
  gallery: PublicPhoto[]
  albums: AlbumAsset[]
  documents: PublicDocument[]
  catalogues: CatalogueAsset[]
  /** Absolute URL used for links inside the generated PDF. */
  baseUrl: string
  profileUrl: string
}

const CARD_SELECT = { id: true, cardId: true, nfcCardNumber: true, status: true } as const

async function findCard(identifier: string): Promise<PublicCard | null> {
  const decoded = decodeURIComponent(identifier)
  const card = await prisma.card.findFirst({
    where: { OR: [{ cardId: decoded }, { id: decoded }, { nfcCardNumber: decoded }] },
    select: CARD_SELECT,
  })
  return card
}

function toCustomer(customer: any): PublicCustomer {
  return {
    id: customer.id,
    name: customer.name,
    designation: customer.designation ?? null,
    company: customer.company ?? null,
    college: customer.college ?? null,
    mobile: customer.mobile ?? null,
    whatsapp: customer.whatsapp ?? null,
    email: customer.email ?? null,
    website: customer.website ?? null,
    socialLinks: customer.socialLinks || '{}',
    address: customer.address ?? null,
    taluk: customer.taluk ?? null,
    city: customer.city ?? null,
    state: customer.state ?? null,
    pincode: customer.pincode ?? null,
    country: customer.country ?? null,
    upiId: customer.upiId ?? null,
    photos: customer.photos || '[]',
    adminPhotos: customer.adminPhotos || '[]',
    documents: customer.documents || '[]',
    paymentQrUrl: customer.paymentQrUrl ?? null,
    logoUrl: customer.logoUrl ?? null,
    description: customer.description ?? null,
    type: customer.type || 'individual',
    updatedAt: customer.updatedAt,
  }
}

function resolveBaseUrl(requestUrl?: string): string {
  const configured = process.env.NEXT_PUBLIC_BASE_URL
  if (configured) return configured.replace(/\/$/, '')
  if (requestUrl) {
    try {
      const u = new URL(requestUrl)
      return `${u.protocol}//${u.host}`
    } catch {
      /* ignore */
    }
  }
  return ''
}

/** Loads everything the public profile can expose for downloads. */
export async function loadPublicCardData(identifier: string, requestUrl?: string): Promise<PublicCardData | null> {
  const card = await findCard(identifier)
  if (!card) return null

  const customer = await prisma.customer.findUnique({ where: { cardId: card.id } })
  if (!customer) return null

  const config = await prisma.cardBuilderConfig.findUnique({
    where: { cardId: card.id },
    include: {
      card: true,
      emiConfig: true,
      albums: {
        where: { public: true },
        include: { media: { where: { visibility: { not: 'private' } }, orderBy: { sortOrder: 'asc' } } },
        orderBy: { sortOrder: 'asc' },
      },
      products: { orderBy: { sortOrder: 'asc' } },
      categories: { orderBy: { sortOrder: 'asc' } },
      catalogues: { where: { visibility: { not: 'private' } }, orderBy: { sortOrder: 'asc' } },
    },
  })

  const builder = config && config.status === 'published' ? buildPublicBuilderData(config) : null

  const gallery = buildPublicGallery(customer)
  const documents = buildPublicDocuments(customer)

  const albums: AlbumAsset[] = (config?.albums || [])
    .map((album: any) => {
      const folder = `Photos/${sanitizeBaseName(album.name, 'album')}`
      const photos: RawAsset[] = (album.media || []).map((m: any, idx: number) => {
        const mime = m.mime || guessMimeFromUrl(m.url)
        const ext = mimeToExt(mime)
        const rawName = typeof m.name === 'string' && m.name ? m.name.replace(/\.[^.]+$/, '') : `Photo_${idx + 1}`
        return {
          url: m.url,
          label: rawName,
          filename: `${sanitizeBaseName(rawName, `Photo_${idx + 1}`)}.${ext}`,
          mime,
          size: Number(m.size) || estimateUrlSize(m.url),
        }
      })
      return { albumId: album.id, albumName: album.name, albumSlug: album.slug, folder, photos }
    })
    .filter((a: AlbumAsset) => a.photos.length > 0)

  const catalogues: CatalogueAsset[] = (config?.catalogues || []).map((c: any) => ({
    id: c.id,
    title: c.title,
    kind: c.kind || 'catalogue',
    size: Number(c.size) || estimateUrlSize(c.url),
    url: c.url,
  }))

  const baseUrl = resolveBaseUrl(requestUrl)
  const profileUrl = card.nfcCardNumber
    ? `${baseUrl}/card/${card.nfcCardNumber}`
    : `${baseUrl}/p/${card.cardId}`

  return {
    card,
    customer: toCustomer(customer),
    builder,
    configUpdatedAt: config?.updatedAt ?? null,
    gallery,
    albums,
    documents,
    catalogues,
    baseUrl,
    profileUrl,
  }
}

/** Sanitised public gallery photos (user + admin) with metadata. */
export function galleryAssets(data: PublicCardData): RawAsset[] {
  const name = businessName(data.customer)
  return data.gallery.map((photo, index) => {
    const mime = guessMimeFromUrl(photo.url)
    const ext = mimeToExt(mime)
    const base = sanitizeBaseName(`${name}_Photo_${String(index + 1).padStart(2, '0')}`, `Photo_${index + 1}`)
    return {
      url: photo.url,
      label: `Photo ${index + 1}`,
      filename: `${base}.${ext}`,
      mime,
      size: estimateUrlSize(photo.url),
    }
  })
}

export function documentAssets(data: PublicCardData): RawAsset[] {
  return data.documents.map((doc, index) => {
    const base = sanitizeBaseName(doc.name.replace(/\.pdf$/i, ''), `Document_${index + 1}`)
    return {
      url: doc.url,
      label: doc.name,
      filename: `${base}.pdf`,
      mime: 'application/pdf',
      size: Number(doc.size) || estimateUrlSize(doc.url),
    }
  })
}

export function catalogueAssetsByKind(data: PublicCardData, kinds: string[]): RawAsset[] {
  return data.catalogues
    .filter((c) => kinds.includes(c.kind))
    .map((c) => ({
      url: c.url,
      label: c.title,
      filename: `${sanitizeBaseName(c.title, 'document')}.pdf`,
      mime: 'application/pdf',
      size: c.size,
    }))
}

export function businessName(customer: PublicCustomer): string {
  return sanitizeBaseName(customer.company || customer.name || 'Business', 'Business')
}

export function kindFolder(kind: string): string {
  switch (kind) {
    case 'brochure':
      return 'Brochures'
    case 'price_list':
      return 'Price-Lists'
    case 'menu':
    case 'catalogue':
    default:
      return 'Product-Catalogues'
  }
}

export function publicSocialLinks(customer: PublicCustomer): Record<string, string> {
  let links: Record<string, string> = {}
  try { links = JSON.parse(customer.socialLinks || '{}') } catch { links = {} }
  return links
}

export function publicUserPhotos(customer: PublicCustomer): string[] {
  return parsePhotoUrlList(customer.photos)
}

export function publicAdminPhotos(customer: PublicCustomer): string[] {
  return parseAdminPhotoEntries(customer.adminPhotos)
    .filter((p) => isPublicVisibility(p.visibility))
    .map((p) => p.url)
}

export function publicDocuments(customer: PublicCustomer): ProfileDocumentEntry[] {
  return parseDocumentEntries(customer.documents).filter((d) => isPublicVisibility(d.visibility))
}

export { PublicBuilderData }
