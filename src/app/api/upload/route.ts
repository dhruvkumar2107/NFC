import { NextRequest } from 'next/server'
import { join } from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { requireAuth } from '@/lib/auth-guard'
import { MAX_IMAGE_BYTES, MAX_DOCUMENT_BYTES, sanitizeDocumentName } from '@/lib/profile-media'

// Detect Vercel environment - files written to /tmp cannot be served via HTTP on Vercel
const IS_VERCEL = !!process.env.VERCEL

function badRequest(error: string) {
  return Response.json({ success: false, error }, { status: 400 })
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
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const kind = String(formData.get('kind') || 'image')
    if (!file) return badRequest('No file uploaded')

    const bytes = Buffer.from(await file.arrayBuffer())
    const originalName = typeof file.name === 'string' ? file.name : ''

    if (kind === 'document') {
      // Documents (CV / brochure / portfolio PDFs) may only be uploaded by an admin.
      const { error } = await requireAuth(request, 'admin')
      if (error) return error

      if (bytes.length > MAX_DOCUMENT_BYTES) return badRequest('Document too large. Max size is 10MB.')
      if (!looksLikePdf(bytes)) return badRequest('Invalid file. Please upload a valid PDF document.')

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

    if (bytes.length > MAX_IMAGE_BYTES) return badRequest('File too large. Max size is 20MB.')

    // Accept image formats — MIME type must start with "image/"
    // Also allow empty MIME (some mobile browsers send blank type)
    const mime = file.type || 'image/jpeg'
    if (mime && !mime.startsWith('image/')) {
      return badRequest('Invalid file type. Please upload an image file.')
    }

    const ext = mime.split('/')[1]?.replace('svg+xml', 'svg').replace('jpeg', 'jpg') || 'jpg'
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    try {
      const url = await persistFile(bytes, filename, mime)
      return Response.json({ success: true, url })
    } catch {
      // Fallback to base64 if disk write fails locally too
      const dataUrl = `data:${mime};base64,${bytes.toString('base64')}`
      return Response.json({ success: true, url: dataUrl })
    }
  } catch (err: any) {
    return Response.json({ success: false, error: err.message || 'Upload failed' }, { status: 500 })
  }
}
