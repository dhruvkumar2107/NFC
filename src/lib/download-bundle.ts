import JSZip from 'jszip'
import { resolveFileBuffer, mimeToExt, guessMimeFromUrl, sanitizeBaseName, formatFileSize } from './file-store'
import {
  PublicCardData,
  RawAsset,
  galleryAssets,
  documentAssets,
  catalogueAssetsByKind,
  businessName,
  kindFolder,
} from './public-card-data'
import { buildVCard, vCardFilename } from './vcard'
import { buildBusinessProfilePdf } from './pdf/business-profile'

export const MAX_BUNDLE_BYTES = 150 * 1024 * 1024
export const MAX_BUNDLE_FILES = 700

export type BundleType =
  | 'everything'
  | 'photos'
  | 'documents'
  | 'catalogues'
  | 'catalogue'
  | 'price_list'
  | 'brochure'
  | 'album'
  | 'qr'

export class BundleLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BundleLimitError'
  }
}

interface ZipAsset {
  url: string
  folder: string
  filename: string
}

interface ZipStatic {
  folder: string
  filename: string
  data: Buffer | Uint8Array | string
}

interface BuiltZip {
  buffer: Uint8Array
  filename: string
  fileCount: number
  bytes: number
  skipped: string[]
}

function assetToZip(asset: RawAsset, folder: string): ZipAsset {
  return { url: asset.url, folder, filename: asset.filename }
}

function albumAssets(data: PublicCardData, albumId?: string): ZipAsset[] {
  const out: ZipAsset[] = []
  for (const album of data.albums) {
    if (albumId && album.albumId !== albumId) continue
    for (const photo of album.photos) out.push(assetToZip(photo, album.folder))
  }
  return out
}

async function buildProfileExtras(data: PublicCardData): Promise<ZipStatic[]> {
  const name = businessName(data.customer)
  const extras: ZipStatic[] = []
  try {
    const pdf = await buildBusinessProfilePdf(data)
    extras.push({ folder: 'Profile', filename: `${name}_Complete_Profile.pdf`, data: pdf })
  } catch {
    // PDF failure must not block the ZIP
  }
  const vcard = buildVCard({
    ...data.customer,
    socialLinks: safeSocial(data),
    profileUrl: data.profileUrl,
    photoUrl: data.customer.logoUrl,
  })
  extras.push({ folder: 'Profile', filename: vCardFilename(name), data: vcard })
  return extras
}

function safeSocial(data: PublicCardData): Record<string, string> {
  try { return JSON.parse(data.customer.socialLinks || '{}') } catch { return {} }
}

function qrAssets(data: PublicCardData): ZipAsset[] {
  const out: ZipAsset[] = []
  if (data.customer.paymentQrUrl) {
    out.push({
      url: data.customer.paymentQrUrl,
      folder: 'QR-Codes',
      filename: `Payment-QR.${mimeToExt(guessMimeFromUrl(data.customer.paymentQrUrl))}`,
    })
  }
  return out
}

/** All downloadable assets for a given bundle type. */
export function collectAssets(data: PublicCardData, type: BundleType, albumId?: string): ZipAsset[] {
  const name = businessName(data.customer)
  switch (type) {
    case 'photos':
      return [
        ...galleryAssets(data).map((a) => assetToZip(a, 'Photos')),
        ...albumAssets(data),
      ]
    case 'album':
      return albumAssets(data, albumId)
    case 'documents':
      return documentAssets(data).map((a) => assetToZip(a, 'Other-Documents'))
    case 'catalogues':
    case 'catalogue':
      return catalogueAssetsByKind(data, ['catalogue', 'menu']).map((a) => assetToZip(a, kindFolder('catalogue')))
    case 'price_list':
      return catalogueAssetsByKind(data, ['price_list']).map((a) => assetToZip(a, kindFolder('price_list')))
    case 'brochure':
      return catalogueAssetsByKind(data, ['brochure']).map((a) => assetToZip(a, kindFolder('brochure')))
    case 'qr':
      return qrAssets(data)
    case 'everything':
    default:
      return [
        ...galleryAssets(data).map((a) => assetToZip(a, 'Photos')),
        ...albumAssets(data),
        ...documentAssets(data).map((a) => assetToZip(a, 'Other-Documents')),
        ...data.catalogues.map((c) => ({
          url: c.url,
          folder: kindFolder(c.kind),
          filename: `${sanitizeBaseName(c.title, 'document')}.pdf`,
        })),
        ...qrAssets(data),
      ]
  }
}

function uniqueName(taken: Set<string>, folder: string, filename: string): string {
  const base = filename.replace(/\.[^.]+$/, '') || 'file'
  const ext = filename.match(/\.([^.]+)$/)?.[1] || ''
  let candidate = filename
  let counter = 2
  while (taken.has(`${folder}/${candidate}`.toLowerCase())) {
    candidate = ext ? `${base}-${counter}.${ext}` : `${base}-${counter}`
    counter++
  }
  taken.add(`${folder}/${candidate}`.toLowerCase())
  return candidate
}

function buildReadme(data: PublicCardData, type: BundleType, included: number, skipped: string[], name: string): string {
  const hasPdf = type === 'everything'
  const lines = [
    `${data.customer.name} — MySmartCard Download Bundle`,
    '='.repeat(52),
    '',
    `Generated: ${new Date().toLocaleString('en-IN')}`,
    `Business: ${name}`,
    `Digital card: ${data.profileUrl}`,
    '',
    'Folder structure',
    '----------------',
    'Profile/            Complete profile PDF and contact (vCard) file',
    'Photos/             Gallery photos and album sub-folders',
    'Product-Catalogues/ Catalogues and menus (PDF)',
    'Price-Lists/        Price lists (PDF)',
    'Brochures/          Brochures (PDF)',
    'QR-Codes/           Payment QR code image (where configured)',
    'Other-Documents/    Additional PDF documents',
    '',
    `Files included: ${included}`,
    hasPdf ? 'A standalone copy of the business profile PDF was also downloaded separately.' : '',
    skipped.length ? `\nSome files could not be included (source unavailable):\n- ${skipped.join('\n- ')}` : '',
    '',
    'Powered by MySmartCard.net',
  ]
  return lines.filter((l) => l !== '').join('\n')
}

/** Streams every asset into a single ZIP archive. */
export async function buildBundleZip(
  data: PublicCardData,
  type: BundleType,
  options: { albumId?: string; includeProfileExtras?: boolean } = {}
): Promise<BuiltZip> {
  const name = businessName(data.customer)
  const zip = new JSZip()
  const taken = new Set<string>()
  const skipped: string[] = []
  let bytes = 0

  const assets = collectAssets(data, type, options.albumId)

  for (const asset of assets) {
    const resolved = await resolveFileBuffer(asset.url)
    if (!resolved) {
      skipped.push(asset.filename)
      continue
    }
    bytes += resolved.buffer.length
    if (bytes > MAX_BUNDLE_BYTES) {
      throw new BundleLimitError(
        `This download is larger than ${formatFileSize(MAX_BUNDLE_BYTES)}. Please download photos and documents separately.`
      )
    }
    const folder = zip.folder(asset.folder)
    folder?.file(uniqueName(taken, asset.folder, asset.filename), resolved.buffer)
  }

  let staticCount = 0
  if (options.includeProfileExtras) {
    const extras = await buildProfileExtras(data)
    for (const extra of extras) {
      const folder = zip.folder(extra.folder)
      folder?.file(uniqueName(taken, extra.folder, extra.filename), extra.data)
      if (typeof extra.data !== 'string') bytes += (extra.data as Buffer).length
      staticCount++
    }
    const readme = buildReadme(data, type, assets.length - skipped.length + staticCount, skipped, name)
    zip.file('README.txt', readme)
  }

  if (assets.length === 0 && staticCount === 0) {
    throw new BundleLimitError('Nothing to download for this profile yet.')
  }

  const content = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE', compressionOptions: { level: 6 } })

  const suffix =
    type === 'everything'
      ? 'Complete_Download'
      : type === 'documents'
        ? 'Documents'
        : type === 'photos'
          ? 'All_Photos'
          : type === 'catalogues' || type === 'catalogue'
            ? 'Catalogues'
            : type === 'price_list'
              ? 'Price_List'
              : type === 'brochure'
                ? 'Brochures'
                : type === 'album'
                  ? 'Album'
                  : 'QR_Codes'
  const filename = `${name}_${suffix}.zip`

  return {
    buffer: content,
    filename,
    fileCount: assets.length - skipped.length + staticCount + (options.includeProfileExtras ? 1 : 0),
    bytes: content.byteLength,
    skipped,
  }
}

export interface DownloadManifest {
  cardId: string
  name: string
  company: string | null
  profileUrl: string
  counts: {
    photos: number
    albums: number
    documents: number
    catalogues: number
    priceLists: number
    brochures: number
    qrCodes: number
    products: number
  }
  totalSize: number
  available: {
    profilePdf: boolean
    contact: boolean
    photos: boolean
    documents: boolean
    catalogues: boolean
    priceLists: boolean
    brochures: boolean
    paymentQr: boolean
    products: boolean
    gallery: boolean
    emi: boolean
    enquiry: boolean
    everything: boolean
  }
  albums: { id: string; name: string; count: number }[]
}

/** Lightweight description of what a visitor can download. */
export function buildDownloadManifest(data: PublicCardData): DownloadManifest {
  const gallery = galleryAssets(data)
  const documents = documentAssets(data)
  const catalogueCount = data.catalogues.filter((c) => c.kind === 'catalogue' || c.kind === 'menu').length
  const priceListCount = data.catalogues.filter((c) => c.kind === 'price_list').length
  const brochureCount = data.catalogues.filter((c) => c.kind === 'brochure').length
  const albumPhotoCount = data.albums.reduce((sum, a) => sum + a.photos.length, 0)
  const totalPhotos = gallery.length + albumPhotoCount

  const knownSize = [
    ...gallery.map((g) => g.size),
    ...data.albums.flatMap((a) => a.photos.map((p) => p.size)),
    ...documents.map((d) => d.size),
    ...data.catalogues.map((c) => c.size),
  ].reduce((sum, v) => sum + (v || 0), 0)

  const builder = data.builder
  const sections = builder?.sections.enabled || {}

  return {
    cardId: data.card.cardId,
    name: data.customer.name,
    company: data.customer.company,
    profileUrl: data.profileUrl,
    counts: {
      photos: totalPhotos,
      albums: data.albums.length,
      documents: documents.length,
      catalogues: catalogueCount,
      priceLists: priceListCount,
      brochures: brochureCount,
      qrCodes: data.customer.paymentQrUrl ? 1 : 0,
      products: builder?.products.length || 0,
    },
    totalSize: knownSize,
    available: {
      profilePdf: true,
      contact: Boolean(data.customer.mobile || data.customer.whatsapp || data.customer.email),
      photos: totalPhotos > 0,
      documents: documents.length > 0,
      catalogues: catalogueCount > 0,
      priceLists: priceListCount > 0,
      brochures: brochureCount > 0,
      paymentQr: Boolean(data.customer.paymentQrUrl),
      products: (builder?.products.length || 0) > 0,
      gallery: totalPhotos > 0,
      emi: Boolean(builder?.emi),
      enquiry: Boolean(sections.enquiry),
      everything: true,
    },
    albums: data.albums.map((a) => ({ id: a.albumId, name: a.albumName, count: a.photos.length })),
  }
}
