import { NextRequest } from 'next/server'
import { join } from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'

// Detect Vercel environment - files written to /tmp cannot be served via HTTP on Vercel
const IS_VERCEL = !!process.env.VERCEL

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return Response.json({ success: false, error: 'No file uploaded' }, { status: 400 })

    if (file.size > 20 * 1024 * 1024) {
      return Response.json({ success: false, error: 'File too large. Max size is 20MB.' }, { status: 400 })
    }

    // Accept all image formats — MIME type must start with "image/"
    // Also allow empty MIME (some mobile browsers send blank type)
    const mime = file.type || 'image/jpeg'
    if (mime && !mime.startsWith('image/')) {
      return Response.json({ success: false, error: 'Invalid file type. Please upload an image file.' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // On Vercel: always use base64 data URI (no writable public dir)
    if (IS_VERCEL) {
      const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`
      return Response.json({ success: true, url: dataUrl })
    }

    // Locally: try to save to public/uploads so Next.js can serve it
    const ext = mime.split('/')[1]?.replace('svg+xml', 'svg').replace('jpeg', 'jpg') || 'jpg'
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    try {
      const uploadDir = join(process.cwd(), 'public', 'uploads')
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true })
      }
      await writeFile(join(uploadDir, filename), buffer)
      return Response.json({ success: true, url: `/uploads/${filename}` })
    } catch {
      // Fallback to base64 if disk write fails locally too
      const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`
      return Response.json({ success: true, url: dataUrl })
    }
  } catch (err: any) {
    return Response.json({ success: false, error: err.message || 'Upload failed' }, { status: 500 })
  }
}
