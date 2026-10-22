import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth-guard'
import {
  MAX_IMAGE_BYTES,
  MAX_DOCUMENT_BYTES,
  MAX_VIDEO_BYTES,
  sanitizeDocumentName,
  formatFileSize,
} from '@/lib/profile-media'
import { saveStoredFile, saveUploadChunk, assembleUploadChunks, cleanupUploadChunks } from '@/lib/stored-files'

const PDF_MIME_TYPES = ['application/pdf', 'application/x-pdf', 'application/octet-stream', '']
const VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v', 'video/ogg']
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov', 'm4v', 'ogv']

// Each request body must stay well under Vercel's 4.5MB function payload cap,
// so larger files are sent as 3MB chunks and assembled server-side.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_CHUNKS = 96

function fail(status: number, error: string, meta: Record<string, unknown> = {}) {
  // Diagnostic log for failed uploads. Never log file contents, tokens or secrets.
  console.warn('[upload] rejected', { status, reason: error, ...meta })
  return Response.json({ success: false, error }, { status })
}

/** Rejects content that only claims to be an image through its filename or MIME. */
function looksLikeImage(buffer: Buffer): boolean {
  if (buffer.length < 12) return false
  const b = buffer
  // JPEG
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return true
  // PNG
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return true
  // GIF
  if (b.subarray(0, 4).toString('latin1') === 'GIF8') return true
  // WebP (RIFF....WEBP)
  if (b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP') return true
  // BMP
  if (b[0] === 0x42 && b[1] === 0x4d) return true
  // TIFF
  if ((b[0] === 0x49 && b[1] === 0x49 && b[2] === 0x2a && b[3] === 0x00) ||
      (b[0] === 0x4d && b[1] === 0x4d && b[2] === 0x00 && b[3] === 0x2a)) return true
  // HEIC / HEIF / AVIF (ISO BMFF)
  if (b.subarray(4, 8).toString('latin1') === 'ftyp') {
    const brand = b.subarray(8, 12).toString('latin1').toLowerCase()
    if (['avif', 'avis', 'heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'].includes(brand)) return true
  }
  return false
}

function looksLikePdf(buffer: Buffer): boolean {
  if (buffer.length < 5) return false
  if (buffer.subarray(0, 5).toString('latin1') === '%PDF-') return true
  const head = buffer.subarray(0, Math.min(buffer.length, 1024)).toString('latin1')
  return head.includes('%PDF-')
}

function imageExtension(mime: string): string {
  return mime.split('/')[1]?.replace('svg+xml', 'svg').replace('jpeg', 'jpg') || 'jpg'
}

function safeStoredName(name: string, fallback: string): string {
  const cleaned = name
    .replace(/[\\/]/g, '')
    .replace(/[\u0000-\u001f]/g, '')
    .replace(/[<>:"|?*]/g, '')
    .trim()
    .slice(0, 120)
  return cleaned || fallback
}

function validateDocumentMeta(rawName: string, mime: string, size: number, meta: Record<string, unknown>): Response | null {
  if (size <= 0) return fail(422, 'The selected file is empty.', meta)
  if (size > MAX_DOCUMENT_BYTES) return fail(413, `Document too large. Maximum size is ${formatFileSize(MAX_DOCUMENT_BYTES)}.`, meta)
  const ext = (rawName.match(/\.([a-zA-Z0-9]+)$/)?.[1] || '').toLowerCase()
  if (ext && ext !== 'pdf') {
    return fail(415, 'Unsupported file type. Please upload a PDF document.', meta)
  }
  if (!PDF_MIME_TYPES.includes(mime)) {
    return fail(415, 'Unsupported file type. Please upload a PDF document.', meta)
  }
  return null
}

function validateImageMeta(mime: string, size: number, meta: Record<string, unknown>): Response | null {
  if (size <= 0) return fail(422, 'The selected file is empty.', meta)
  if (size > MAX_IMAGE_BYTES) return fail(413, `File too large. Maximum size is ${formatFileSize(MAX_IMAGE_BYTES)}.`, meta)
  if (mime === 'image/svg+xml') {
    return fail(415, 'SVG images are not supported. Please upload a JPG, PNG, WebP, GIF, BMP, HEIC, HEIF, AVIF or TIFF file.', meta)
  }
  if (mime && !mime.startsWith('image/')) {
    return fail(415, 'Invalid file type. Please upload an image file.', meta)
  }
  return null
}

function validateVideoMeta(rawName: string, mime: string, size: number, meta: Record<string, unknown>): Response | null {
  if (size <= 0) return fail(422, 'The selected video is empty.', meta)
  if (size > MAX_VIDEO_BYTES) return fail(413, `Video too large. Maximum size is ${formatFileSize(MAX_VIDEO_BYTES)}.`, meta)
  const ext = (rawName.match(/\.([a-zA-Z0-9]+)$/)?.[1] || '').toLowerCase()
  if (ext && !VIDEO_EXTENSIONS.includes(ext)) {
    return fail(415, 'Unsupported file type. Please upload an MP4, WebM or MOV video.', meta)
  }
  if (mime && !mime.startsWith('video/')) {
    return fail(415, 'Invalid file type. Please upload a video file.', meta)
  }
  if (mime && !VIDEO_MIME_TYPES.includes(mime)) {
    return fail(415, 'Unsupported video format. Please upload an MP4, WebM or MOV video.', meta)
  }
  return null
}

/** Builds the stored file name for a video, keeping a playable extension. */
function videoStoredName(rawName: string, mime: string): string {
  const cleaned = safeStoredName(rawName, '')
  if (/\.(mp4|webm|mov|m4v|ogv)$/i.test(cleaned)) return cleaned
  const ext = mime === 'video/webm' ? 'webm' : mime === 'video/quicktime' ? 'mov' : mime === 'video/x-m4v' ? 'm4v' : mime === 'video/ogg' ? 'ogv' : 'mp4'
  return `${cleaned || `video-${Date.now()}`}.${ext}`
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData().catch(() => null)
    if (!formData) return fail(422, 'Invalid upload request. Please try again.')

    const file = formData.get('file')
    const kind = String(formData.get('kind') || 'image')

    if (!file || typeof file === 'string' || typeof (file as File).arrayBuffer !== 'function') {
      return fail(422, 'No file was uploaded.', { kind })
    }

    const upload = file as File
    const rawName = String(formData.get('originalName') || upload.name || '')
    const mime = String(formData.get('mimeType') || upload.type || '').toLowerCase()
    const originalName =
      kind === 'document'
        ? sanitizeDocumentName(rawName, '')
        : kind === 'video'
          ? videoStoredName(rawName, mime)
          : safeStoredName(rawName, `file-${Date.now()}`)
    const totalSize = Number(formData.get('totalSize'))
    const uploadId = String(formData.get('uploadId') || '')
    const chunkIndexRaw = formData.get('chunkIndex')
    const chunked = UUID_RE.test(uploadId) && chunkIndexRaw !== null && chunkIndexRaw !== undefined

    // ---- document uploads: admin / business owner only ----
    if (kind === 'document') {
      const user = await getAuthUser(request)
      if (!user) {
        return fail(401, 'Your session has expired. Please log in again and retry the upload.', { kind, role: null })
      }
      if (user.role !== 'admin' && user.role !== 'customer') {
        return fail(403, 'You do not have permission to upload documents.', { kind, role: user.role })
      }
    }

    // ---- video uploads: any signed-in user (admin, employee or card owner) ----
    if (kind === 'video') {
      const user = await getAuthUser(request)
      if (!user) {
        return fail(401, 'Your session has expired. Please log in again and retry the upload.', { kind, role: null })
      }
    }

    // ---- image uploads: open to anonymous visitors too ----
    // The public order form uploads a logo and photos before an account exists,
    // so requiring a session here made every public order upload fail with 401.
    // Documents and videos still require an authenticated user above.

    // ---------------- chunked upload path ----------------
    if (chunked) {
      const idx = Number(chunkIndexRaw)
      const totalChunks = Number(formData.get('totalChunks'))
      const size = Number.isFinite(totalSize) ? Math.round(totalSize) : 0

      if (!Number.isInteger(idx) || !Number.isInteger(totalChunks) || idx < 0 || totalChunks < 1 || idx >= totalChunks || totalChunks > MAX_CHUNKS) {
        return fail(422, 'Invalid upload chunk. Please try again.', { kind, uploadId })
      }

      const meta = { kind, size, uploadId, chunk: `${idx + 1}/${totalChunks}` }
      const metaError =
        kind === 'document'
          ? validateDocumentMeta(rawName, mime, size, meta)
          : kind === 'video'
            ? validateVideoMeta(rawName, mime, size, meta)
            : validateImageMeta(mime, size, meta)
      if (metaError) return metaError

      const chunkBytes = Buffer.from(await upload.arrayBuffer())

      // Fast fail: the file signature lives in the first chunk.
      if (kind === 'document' && idx === 0 && !looksLikePdf(chunkBytes)) {
        return fail(422, 'This file is not a valid PDF or appears to be corrupted.', meta)
      }
      if (kind === 'image' && idx === 0 && !looksLikeImage(chunkBytes)) {
        return fail(422, 'This file is not a valid image or appears to be corrupted.', meta)
      }

      await saveUploadChunk(uploadId, idx, chunkBytes)

      if (idx < totalChunks - 1) {
        return Response.json({ success: true, partial: true, received: idx + 1, totalChunks })
      }

      const assembled = await assembleUploadChunks(uploadId, totalChunks)
      if (!assembled) {
        return fail(422, 'Upload incomplete. Please try again.', { kind, uploadId, size })
      }
      if (assembled.length !== size) {
        return fail(422, 'Upload corrupted. Please try again.', { kind, uploadId, size, received: assembled.length })
      }

      if (kind === 'document') {
        if (!looksLikePdf(assembled)) {
          return fail(422, 'This file is not a valid PDF or appears to be corrupted.', meta)
        }
        const saved = await saveStoredFile(originalName, 'application/pdf', assembled)
        await cleanupUploadChunks(uploadId)
        return Response.json({ success: true, url: saved.url, name: saved.name, size: saved.size, mime: saved.mime })
      }

      if (kind === 'video') {
        const videoMime = mime || 'video/mp4'
        const saved = await saveStoredFile(originalName, videoMime, assembled)
        await cleanupUploadChunks(uploadId)
        return Response.json({ success: true, url: saved.url, name: saved.name, size: saved.size, mime: saved.mime })
      }

      const imageMime = mime || 'image/jpeg'
      const name = originalName.match(/\.[a-z0-9]+$/i)
        ? originalName
        : `${originalName}-${Date.now()}.${imageExtension(imageMime)}`
      const saved = await saveStoredFile(name, imageMime, assembled)
      await cleanupUploadChunks(uploadId)
      return Response.json({ success: true, url: saved.url, name: saved.name, size: saved.size, mime: saved.mime })
    }

    // ---------------- single-request path ----------------
    const bytes = Buffer.from(await upload.arrayBuffer())
    const size = bytes.length
    const meta = { kind, size }

    if (kind === 'document') {
      const metaError = validateDocumentMeta(rawName, mime, size, meta)
      if (metaError) return metaError
      if (!looksLikePdf(bytes)) {
        return fail(422, 'This file is not a valid PDF or appears to be corrupted.', meta)
      }
      const saved = await saveStoredFile(originalName, 'application/pdf', bytes)
      return Response.json({ success: true, url: saved.url, name: saved.name, size: saved.size, mime: saved.mime })
    }

    if (kind === 'video') {
      const metaError = validateVideoMeta(rawName, mime, size, meta)
      if (metaError) return metaError
      const videoMime = mime || 'video/mp4'
      const saved = await saveStoredFile(originalName, videoMime, bytes)
      return Response.json({ success: true, url: saved.url, name: saved.name, size: saved.size, mime: saved.mime })
    }

    const imageMime = (mime || upload.type || 'image/jpeg').toLowerCase()
    const imageError = validateImageMeta(imageMime, size, meta)
    if (imageError) return imageError
    if (!looksLikeImage(bytes)) {
      return fail(422, 'This file is not a valid image or appears to be corrupted.', meta)
    }
    const filename = originalName.match(/\.[a-z0-9]+$/i)
      ? originalName
      : `${originalName}-${Date.now()}.${imageExtension(imageMime)}`
    const saved = await saveStoredFile(filename, imageMime, bytes)
    return Response.json({ success: true, url: saved.url, name: saved.name, size: saved.size, mime: saved.mime })
  } catch (err: any) {
    console.error('[upload] unexpected error', { message: err?.message })
    return Response.json({ success: false, error: err.message || 'Upload failed' }, { status: 500 })
  }
}
