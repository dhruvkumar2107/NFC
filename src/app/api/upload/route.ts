import { NextRequest } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { v4 as uuid } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return Response.json({ error: 'No file uploaded' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `${uuid()}.${ext}`
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    const filepath = join(uploadDir, filename)

    await writeFile(filepath, buffer)

    const url = `/uploads/${filename}`
    return Response.json({ success: true, url })
  } catch (err: any) {
    return Response.json({ error: err.message || 'Upload failed' }, { status: 500 })
  }
}
