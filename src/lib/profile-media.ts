export const MAX_USER_PHOTOS = 10
export const MAX_ADMIN_PHOTOS = 30
export const MAX_DOCUMENTS = 20
export const MAX_ORDER_DOCUMENTS = 10
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
export const ACCEPTED_IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)$/i

export interface AdminPhotoEntry {
  url: string
  visibility?: string
  createdAt?: string
}

export interface ProfileDocumentEntry {
  url: string
  name: string
  size: number
  mime: string
  visibility?: string
  createdAt?: string
}

export type ValidationResult = { ok: true; value: any } | { ok: false; error: string }

function fail(error: string): ValidationResult {
  return { ok: false, error }
}

function pass(value: any): ValidationResult {
  return { ok: true, value }
}

export function parseJsonArray<T>(raw: string | null | undefined, fallback: T[] = []): T[] {
  if (!raw) return fallback
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : fallback
  } catch {
    return fallback
  }
}

export function isSafeMediaUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false
  const value = url.trim()
  if (!value) return false
  if (value.startsWith('data:image/')) return true
  if (value.startsWith('data:application/pdf')) return true
  if (value.startsWith('/uploads/')) return !value.includes('..')
  if (value.startsWith('/') && !value.startsWith('//')) return true
  if (value.startsWith('http://') || value.startsWith('https://')) return true
  return false
}

export function isImageValue(value: unknown): boolean {
  if (typeof value !== 'string') return false
  const v = value.trim()
  if (v.startsWith('data:')) return /^data:image\//i.test(v)
  if (v.startsWith('/uploads/')) return ACCEPTED_IMAGE_EXT.test(v)
  if (v.startsWith('http://') || v.startsWith('https://')) {
    try {
      return ACCEPTED_IMAGE_EXT.test(new URL(v).pathname)
    } catch {
      return false
    }
  }
  return false
}

export function isPdfValue(value: unknown): boolean {
  if (typeof value !== 'string') return false
  const v = value.trim()
  if (v.startsWith('data:')) return /^data:application\/pdf;base64,JVBERi/i.test(v)
  if (v.startsWith('/uploads/')) return /\.pdf$/i.test(v) && !v.includes('..')
  if (v.startsWith('http://') || v.startsWith('https://')) {
    try {
      return /\.pdf$/i.test(new URL(v).pathname)
    } catch {
      return false
    }
  }
  return false
}

export function validatePhotoList(input: unknown, max: number, label: string): ValidationResult {
  if (!Array.isArray(input)) return fail(`${label} must be a list`)
  if (input.length > max) return fail(`Maximum ${max} photos allowed (received ${input.length})`)
  for (const item of input) {
    if (typeof item !== 'string' || !item.trim()) return fail(`${label} contains an invalid entry`)
    if (!isSafeMediaUrl(item)) return fail(`${label} contains an unsupported file location`)
    if (!isImageValue(item)) return fail('Only JPG, JPEG, PNG and WebP images are allowed')
  }
  return pass(input.map((i) => String(i).trim()))
}

export function validateAdminPhotoList(input: unknown): ValidationResult {
  if (!Array.isArray(input)) return fail('Gallery photos must be a list')
  if (input.length > MAX_ADMIN_PHOTOS) {
    return fail(`Maximum ${MAX_ADMIN_PHOTOS} admin photos allowed (received ${input.length})`)
  }
  const cleaned: AdminPhotoEntry[] = []
  for (const raw of input) {
    const entry: any = typeof raw === 'string' ? { url: raw } : raw
    if (!entry || typeof entry !== 'object') return fail('Gallery contains an invalid entry')
    const url = typeof entry.url === 'string' ? entry.url.trim() : ''
    if (!url || !isSafeMediaUrl(url)) return fail('Gallery contains an unsupported file location')
    if (!isImageValue(url)) return fail('Only JPG, JPEG, PNG and WebP images are allowed')
    cleaned.push({
      url,
      visibility: entry.visibility === 'private' ? 'private' : 'public',
      createdAt: typeof entry.createdAt === 'string' ? entry.createdAt : new Date().toISOString(),
    })
  }
  return pass(cleaned)
}

export function sanitizeDocumentName(name: unknown, url: string): string {
  let base = typeof name === 'string' ? name.trim() : ''
  base = base.replace(/[\\/]/g, '').replace(/[\u0000-\u001f]/g, '').slice(0, 120)
  if (!base) {
    if (url.startsWith('data:')) {
      base = 'document.pdf'
    } else {
      try {
        base = decodeURIComponent(new URL(url, 'http://local').pathname.split('/').pop() || 'document.pdf')
      } catch {
        base = 'document.pdf'
      }
    }
  }
  if (!/\.pdf$/i.test(base)) base = `${base}.pdf`
  return base
}

function estimateDataUriSize(url: string): number {
  if (!url.startsWith('data:')) return 0
  const comma = url.indexOf(',')
  if (comma === -1) return 0
  const meta = url.slice(0, comma)
  const payload = url.slice(comma + 1)
  return meta.includes(';base64') ? Math.floor((payload.length * 3) / 4) : payload.length
}

export function validateDocumentList(input: unknown): ValidationResult {
  if (!Array.isArray(input)) return fail('Documents must be a list')
  if (input.length > MAX_DOCUMENTS) {
    return fail(`Maximum ${MAX_DOCUMENTS} documents allowed (received ${input.length})`)
  }
  const cleaned: ProfileDocumentEntry[] = []
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') return fail('Documents contain an invalid entry')
    const doc = raw as ProfileDocumentEntry
    const url = typeof doc.url === 'string' ? doc.url.trim() : ''
    if (!url || !isSafeMediaUrl(url)) return fail('Documents contain an unsupported file location')
    if (!isPdfValue(url)) return fail('Only PDF documents can be published on a profile')
    const size = Number(doc.size)
    cleaned.push({
      url,
      name: sanitizeDocumentName(doc.name, url),
      size: Number.isFinite(size) && size > 0 ? Math.round(size) : estimateDataUriSize(url),
      mime: 'application/pdf',
      visibility: doc.visibility === 'private' ? 'private' : 'public',
      createdAt: typeof doc.createdAt === 'string' ? doc.createdAt : new Date().toISOString(),
    })
  }
  return pass(cleaned)
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function isPublicVisibility(value?: string): boolean {
  return value !== 'private'
}
