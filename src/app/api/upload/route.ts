import { NextRequest } from 'next/server'
import { join } from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { getAuthUser } from '@/lib/auth-guard'
import { MAX_IMAGE_BYTES, MAX_DOCUMENT_BYTES, sanitizeDocumentName } from '@/lib/profile-media'

// Detect Vercel environment - files written to /tmp cannot be served via HTTP on Vercel
const IS_VERCEL = !!process.env.VERCEL

const PDF_MIME_TYPES = ['application/pdf', 'application/x-pdf', 'application/octet-stream', '']

function fail(status: number, error: string, meta: Record<string, unknown> = {}) {
  // Diagnostic log for failed uploads. Never log file contents, tokens or secrets.
  console.warn('[upload] rejected', { status, reason: error, ...meta })
  return Response.json({ success: false, error }, { status })
}

function looksLikePdf(buffer: Buffer): boolean {
  if (buffer.length < 5) return false
  if (buffer.subarray(0, 5).toString('latin1') === '%PDF-') return true
  const head = buffer.subarray(0, 1024).toString('latin1')
  return head.includes('%PDF-')
}

async function persistFile(buffer: Buffer, filename: string, mime: string): Promise<string> {
  if (IS_VERCEL) {
    return `data:${mime};base64,${buffer.toString('base64')}`
  }
  const uploadDir = join(process.cwd(), 'public', 'uploads')
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true })
  }
  await writeFile(join(uploadDir, filename), buffer)
  return `/uploads/${filename}`
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
    const bytes = Buffer.from(await upload.arrayBuffer())
    const originalName = typeof upload.name === 'string' ? upload.name : ''
    const mime = (upload.type || '').toLowerCase()

    if (kind === 'document') {
      // Catalogue / brochure PDFs may be uploaded by an admin or a business owner.
      const user = await getAuthUser(request)
      if (!user) {
        return fail(401, 'Your session has expired. Please log in again and retry the upload.', { kind, size: bytes.length })
      }
      if (user.role !== 'admin' && user.role !== 'customer') {
        return fail(403, 'You do not have permission to upload documents.', { kind, size: bytes.length, role: user.role })
      }

      if (bytes.length === 0) {
        return fail(422, 'The selected file is empty.', { kind, size: 0, role: user.role })
      }
      if (bytes.length > MAX_DOCUMENT_BYTES) {
        return fail(413, 'Document too large. Maximum size is 10MB.', { kind, size: bytes.length, role: user.role })
      }

      const ext = (originalName.match(/\.([a-zA-Z0-9]+)$/)?.[1] || '').toLowerCase()
      if (ext && ext !== 'pdf') {
        return fail(415, 'Unsupported file type. Please upload a PDF document.', { kind, size: bytes.length, role: user.role })
      }
      if (!PDF_MIME_TYPES.includes(mime)) {
        return fail(415, 'Unsupported file type. Please upload a PDF document.', { kind, size: bytes.length, role: user.role })
      }
      if (!looksLikePdf(bytes)) {
        return fail(422, 'This file is not a valid PDF or appears to be corrupted.', { kind, size: bytes.length, role: user.role })
      }

      const safeName = sanitizeDocumentName(originalName, '')
      let url: string
      try {
        url = await persistFile(bytes, `${Date.now()}-${safeName.replace(/[^a-zA-Z0-9._-]/g, '_')}`, 'application/pdf')
      } catch {
        url = `data:application/pdf;base64,${bytes.toString('base64')}`
      }
      return Response.json({
        success: true,
        url,
        name: safeName,
        size: bytes.length,
        mime: 'application/pdf',
      })
    }

    // Image uploads (public profile photos, logos, QR codes)
    if (bytes.length === 0) return fail(422, 'The selected file is empty.', { kind })
    if (bytes.length > MAX_IMAGE_BYTES) {
      return fail(413, 'File too large. Max size is 20MB.', { kind, size: bytes.length })
    }

    // Accept image formats — MIME type must start with "image/"
    // Also allow empty MIME (some mobile browsers send blank type)
    const imageMime = upload.type || 'image/jpeg'
    if (imageMime && !imageMime.startsWith('image/')) {
      return fail(415, 'Invalid file type. Please upload an image file.', { kind, size: bytes.length })
    }

    const ext = imageMime.split('/')[1]?.replace('svg+xml', 'svg').replace('jpeg', 'jpg') || 'jpg'
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    try {
      const url = await persistFile(bytes, filename, imageMime)
      return Response.json({ success: true, url })
    } catch {
      // Fallback to base64 if disk write fails locally too
      const dataUrl = `data:${imageMime};base64,${bytes.toString('base64')}`
      return Response.json({ success: true, url: dataUrl })
    }
  } catch (err: any) {
    console.error('[upload] unexpected error', { message: err?.message })
    return Response.json({ success: false, error: err.message || 'Upload failed' }, { status: 500 })
  }
}
