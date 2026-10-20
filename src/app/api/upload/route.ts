import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth-guard'
import { MAX_IMAGE_BYTES, MAX_DOCUMENT_BYTES, sanitizeDocumentName } from '@/lib/profile-media'
import { saveStoredFile, saveUploadChunk, assembleUploadChunks, cleanupUploadChunks } from '@/lib/stored-files'

const PDF_MIME_TYPES = ['application/pdf', 'application/x-pdf', 'application/octet-stream', '']

// Each request body must stay well under Vercel's 4.5MB function payload cap,
// so larger files are sent as 3MB chunks and assembled server-side.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_CHUNKS = 32

function fail(status: number, error: string, meta: Record<string, unknown> = {}) {
  // Diagnostic log for failed uploads. Never log file contents, tokens or secrets.
  console.warn('[upload] rejected', { status, reason: error, ...meta })
  return Response.json({ success: false, error }, { status })
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
  if (size > MAX_DOCUMENT_BYTES) return fail(413, 'Document too large. Maximum size is 10MB.', meta)
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
  if (size > MAX_IMAGE_BYTES) return fail(413, 'File too large. Max size is 20MB.', meta)
  if (mime && !mime.startsWith('image/')) {
    return fail(415, 'Invalid file type. Please upload an image file.', meta)
  }
  return null
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
    const originalName = kind === 'document'
      ? sanitizeDocumentName(rawName, '')
      : safeStoredName(rawName, `file-${Date.now()}`)
    const mime = String(formData.get('mimeType') || upload.type || '').toLowerCase()
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
          : validateImageMeta(mime, size, meta)
      if (metaError) return metaError

      const chunkBytes = Buffer.from(await upload.arrayBuffer())

      // Fast fail: the PDF header lives in the first chunk.
      if (kind === 'document' && idx === 0 && !looksLikePdf(chunkBytes)) {
        return fail(422, 'This file is not a valid PDF or appears to be corrupted.', meta)
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

    const imageMime = (mime || upload.type || 'image/jpeg').toLowerCase()
    const imageError = validateImageMeta(imageMime, size, meta)
    if (imageError) return imageError
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
