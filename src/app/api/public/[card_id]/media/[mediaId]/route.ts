import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { errorResponse } from '@/lib/api-response'
import { resolveFileBuffer, sanitizeDownloadName } from '@/lib/file-store'
import { recordEvent, ANALYTICS_EVENTS } from '@/lib/analytics'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { card_id: string; mediaId: string } }) {
  try {
    const card = await prisma.card.findUnique({ where: { cardId: params.card_id }, select: { id: true } })
    if (!card) return errorResponse('Card not found', 404)

    const media = await prisma.mediaItem.findFirst({
      where: { id: params.mediaId, album: { config: { cardId: card.id }, public: true } },
    })
    if (!media || media.visibility === 'private') return errorResponse('Media not found', 404)

    const resolved = await resolveFileBuffer(media.url)
    if (!resolved) return errorResponse('File could not be loaded', 404)

    const wantsDownload = request.nextUrl.searchParams.get('download') === '1'
    if (wantsDownload) {
      await recordEvent({
        cardId: card.id,
        type: ANALYTICS_EVENTS.IMAGE_DOWNLOAD,
        sessionId: request.nextUrl.searchParams.get('s'),
        userAgent: request.headers.get('user-agent'),
        metadata: { mediaId: media.id },
      })
    }

    const base = sanitizeDownloadName(media.name || 'photo', 'jpg').replace(/\.[^.]+$/, '')
    const ext = (resolved.mime.split('/')[1] || 'jpg').replace('jpeg', 'jpg')
    const filename = `${base}.${ext}`
    const disposition = (wantsDownload ? 'attachment' : 'inline') + `; filename="${filename}"`

    return new Response(new Uint8Array(resolved.buffer), {
      headers: {
        'Content-Type': resolved.mime,
        'Content-Disposition': disposition,
        'Content-Length': resolved.buffer.length.toString(),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to load media', 500)
  }
}
