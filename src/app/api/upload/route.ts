import { NextRequest } from 'next/server'
import { join } from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return Response.json({ success: false, error: 'No file uploaded' }, { status: 400 })

    if (file.size > 20 * 1024 * 1024) {
      return Response.json({ success: false, error: 'File too large. Max size is 20MB.' }, { status: 400 })
    }

    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'image/bmp', 'image/tiff', 'image/svg+xml', 'image/avif',
      'image/heic', 'image/heif', 'image/jpg'
    ]
    const isImage = file.type.startsWith('image/')
    if (!isImage && !allowedTypes.includes(file.type)) {
      return Response.json({ success: false, error: 'Invalid file type. Please upload an image file.' }, { status: 400 })
    }

    const ext = file.type.split('/')[1]
    const safeExt = ext === 'jpeg' ? 'jpg' : ext === 'svg+xml' ? 'svg' : ext === 'heic' ? 'heic' : ext === 'heif' ? 'heif' : ext
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDirs = [
      join(process.cwd(), 'public', 'uploads'),
      join('/tmp', 'uploads'),
    ]

    let saved = false
    for (const uploadDir of uploadDirs) {
      try {
        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true })
        }
        const filePath = join(uploadDir, filename)
        await writeFile(filePath, buffer)
        const url = `/uploads/${filename}`
        saved = true
        return Response.json({ success: true, url })
      } catch {
        continue
      }
    }

    if (!saved) {
      const dataUrl = `data:${file.type};base64,${buffer.toString('base64')}`
      return Response.json({ success: true, url: dataUrl })
    }
  } catch (err: any) {
    return Response.json({ success: false, error: err.message || 'Upload failed' }, { status: 500 })
  }
}
