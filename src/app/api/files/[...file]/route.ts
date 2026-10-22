import { NextRequest } from 'next/server'
import { resolveStoredFile } from '@/lib/stored-files'
import { contentDisposition } from '@/lib/file-store'
import { streamedFileResponse, parseByteRange, rangedFileResponse } from '@/lib/stream-file'

export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(request: NextRequest, { params }: { params: { file: string[] } }) {
  const segments = params.file || []
  const id = segments[0] || ''
  if (!UUID_RE.test(id)) {
    return Response.json({ success: false, error: 'File not found' }, { status: 404 })
  }

  try {
    const file = await resolveStoredFile(id)
    if (!file) {
      return Response.json({ success: false, error: 'File not found' }, { status: 404 })
    }

    const urlName = segments[1] ? decodeURIComponent(segments[1]) : ''
    const name = urlName || file.name || 'file'
    const download = request.nextUrl.searchParams.get('download') === '1'
    const mime = file.mime || 'application/octet-stream'
    const headers = {
      'Content-Type': mime,
      'Content-Disposition': contentDisposition(name, download ? 'attachment' : 'inline'),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Accept-Ranges': 'bytes',
    }

    const range = parseByteRange(request.headers.get('range'), file.buffer.length)
    if (range) return rangedFileResponse(file.buffer, headers, range)

    return streamedFileResponse(file.buffer, headers)
  } catch (err: any) {
    console.error('[files] read failed', { id, message: err?.message })
    return Response.json({ success: false, error: 'File not found' }, { status: 404 })
  }
}
