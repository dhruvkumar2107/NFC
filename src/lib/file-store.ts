import { readFile } from 'fs/promises'
import { join, normalize, extname } from 'path'

export interface ResolvedFile {
  buffer: Buffer
  mime: string
}

const EXTERNAL_FETCH_TIMEOUT_MS = 15000

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.vcf': 'text/vcard',
}

export function decodeDataUri(dataUri: string): { buffer: Buffer; mime: string } | null {
  const match = dataUri.match(/^data:([^;]+)(;base64)?,([\s\S]*)$/)
  if (!match) return null
  const [, mime, isBase64, payload] = match
  try {
    const buffer = isBase64 ? Buffer.from(payload, 'base64') : Buffer.from(decodeURIComponent(payload), 'utf8')
    return { buffer, mime: mime || 'application/octet-stream' }
  } catch {
    return null
  }
}

export function mimeToExt(mime: string): string {
  switch (mime) {
    case 'image/png': return 'png'
    case 'image/gif': return 'gif'
    case 'image/webp': return 'webp'
    case 'image/avif': return 'avif'
    case 'image/svg+xml': return 'svg'
    case 'application/pdf': return 'pdf'
    default: return 'jpg'
  }
}

export function guessMimeFromUrl(url: string): string {
  if (url.startsWith('data:')) {
    const match = url.match(/^data:([^;,]+)/)
    return match ? match[1] : 'application/octet-stream'
  }
  try {
    const ext = extname(new URL(url, 'http://local').pathname).toLowerCase()
    return MIME_BY_EXT[ext] || 'application/octet-stream'
  } catch {
    return 'application/octet-stream'
  }
}

function isSafeRelativePath(url: string): boolean {
  if (url.includes('..')) return false
  const normalized = normalize(url)
  return !normalized.startsWith('..')
}

/**
 * Resolves a stored media URL (data URI, local /uploads file or external URL)
 * into the raw bytes + mime type. Returns null when the file cannot be read.
 */
export async function resolveFileBuffer(url: string): Promise<ResolvedFile | null> {
  try {
    if (url.startsWith('data:')) return decodeDataUri(url)

    if (url.startsWith('/uploads/') && isSafeRelativePath(url)) {
      const filePath = join(process.cwd(), 'public', url)
      const buffer = await readFile(filePath)
      return { buffer, mime: guessMimeFromUrl(url) }
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), EXTERNAL_FETCH_TIMEOUT_MS)
      try {
        const res = await fetch(url, { signal: controller.signal, redirect: 'follow' })
        if (!res.ok) return null
        const arrayBuffer = await res.arrayBuffer()
        return {
          buffer: Buffer.from(arrayBuffer),
          mime: res.headers.get('content-type') || guessMimeFromUrl(url),
        }
      } finally {
        clearTimeout(timer)
      }
    }

    return null
  } catch {
    return null
  }
}

export function sanitizeDownloadName(name: string, fallbackExt: string): string {
  const cleaned = name
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100)
  if (!cleaned) return `file.${fallbackExt}`
  return cleaned
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
