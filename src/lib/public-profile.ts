import { prisma } from './db'
import {
  AdminPhotoEntry,
  ProfileDocumentEntry,
  ProfileVideoEntry,
  parseJsonArray,
  isPublicVisibility,
} from './profile-media'

export interface PublicPhoto {
  url: string
  source: 'user' | 'admin'
}

export interface PublicDocument {
  url: string
  name: string
  size: number
  mime: string
  createdAt?: string
}

export interface PublicVideo {
  url: string
  name: string
  size: number
  mime: string
}

export async function loadProfileByCardId(cardId: string) {
  try {
    const card = await prisma.card.findUnique({ where: { cardId }, include: { design: true } })
    if (!card) return null
    const customer = await prisma.customer.findUnique({ where: { cardId: card.id } })
    if (!customer) return null
    return { card, customer }
  } catch {
    return null
  }
}

export async function loadProfileByNfc(nfcCardNumber: string) {
  try {
    const card = await prisma.card.findUnique({ where: { nfcCardNumber }, include: { design: true } })
    if (!card) return null
    const customer = await prisma.customer.findUnique({ where: { cardId: card.id } })
    if (!customer) return null
    return { card, customer }
  } catch {
    return null
  }
}

/** Everything published on the NFC profile: user gallery (max 10) + public admin gallery (max 30). */
export function buildPublicGallery(customer: {
  photos: string
  adminPhotos?: string | null
}): PublicPhoto[] {
  const userPhotos = parseJsonArray<string>(customer.photos).filter((p) => typeof p === 'string' && p)
  const adminPhotos = parseJsonArray<AdminPhotoEntry>(customer.adminPhotos)
    .filter((p) => p && typeof p.url === 'string' && p.url && isPublicVisibility(p.visibility))
    .map((p) => p.url)

  return [
    ...userPhotos.map((url) => ({ url, source: 'user' as const })),
    ...adminPhotos.map((url) => ({ url, source: 'admin' as const })),
  ]
}

/** Only documents explicitly published on the profile are exposed publicly. */
export function buildPublicDocuments(customer: {
  documents?: string | null
}): PublicDocument[] {
  return parseJsonArray<ProfileDocumentEntry>(customer.documents)
    .filter((d) => d && typeof d.url === 'string' && d.url && isPublicVisibility(d.visibility))
    .map((d) => ({
      url: d.url,
      name: d.name || 'document.pdf',
      size: Number(d.size) || 0,
      mime: 'application/pdf',
      createdAt: d.createdAt,
    }))
}

/** Videos published on the card profile. */
export function buildPublicVideos(customer: { videos?: string | null }): PublicVideo[] {
  return parseJsonArray<ProfileVideoEntry>(customer.videos)
    .filter((v) => v && typeof v.url === 'string' && v.url && isPublicVisibility(v.visibility))
    .map((v) => ({
      url: v.url,
      name: v.name || 'video.mp4',
      size: Number(v.size) || 0,
      mime: typeof v.mime === 'string' && v.mime ? v.mime : 'video/mp4',
    }))
}

export function publicFileUrl(cardId: string, kind: 'photo' | 'document' | 'video', index: number): string {
  return `/api/profile/${encodeURIComponent(cardId)}/file?kind=${kind}&i=${index}`
}

export function publicDownloadUrl(cardId: string, type: 'all' | 'photos' | 'documents'): string {
  return `/api/profile/${encodeURIComponent(cardId)}/download?type=${type}`
}

export interface PublicMediaAssets {
  photos: { url: string; source: 'user' | 'admin' }[]
  documents: { name: string; size: number; viewUrl: string; downloadUrl: string }[]
  videos: { name: string; size: number; mime: string; viewUrl: string; downloadUrl: string }[]
}

/** Gallery + documents + videos rendered on the public NFC profile (public files only). */
export function buildPublicMedia(cardId: string, customer: any): PublicMediaAssets {
  const gallery = buildPublicGallery(customer)
  const docs = buildPublicDocuments(customer)
  const videos = buildPublicVideos(customer)
  return {
    photos: gallery.map((photo, index) => ({
      url: publicFileUrl(cardId, 'photo', index),
      source: photo.source,
    })),
    documents: docs.map((doc, index) => {
      const viewUrl = publicFileUrl(cardId, 'document', index)
      return { name: doc.name, size: doc.size, viewUrl, downloadUrl: `${viewUrl}&download=1` }
    }),
    videos: videos.map((video, index) => {
      const viewUrl = publicFileUrl(cardId, 'video', index)
      return { name: video.name, size: video.size, mime: video.mime, viewUrl, downloadUrl: `${viewUrl}&download=1` }
    }),
  }
}

export { getSocialDisplay, getSocialUrl } from './social'
