import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return Response.json({ success: false, error: 'No file uploaded' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const mime = file.type || 'image/jpeg'
    const url = `data:${mime};base64,${base64}`

    return Response.json({ success: true, url })
  } catch (err: any) {
    return Response.json({ success: false, error: err.message || 'Upload failed' }, { status: 500 })
  }
}
