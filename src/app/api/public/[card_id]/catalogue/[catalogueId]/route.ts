import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { errorResponse } from '@/lib/api-response'
import { resolveFileBuffer, sanitizeDownloadName } from '@/lib/file-store'
import { streamedFileResponse } from '@/lib/stream-file'
import { recordEvent, ANALYTICS_EVENTS } from '@/lib/analytics'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { card_id: string; catalogueId: string } }) {
  try {
    const card = await prisma.card.findUnique({ where: { cardId: params.card_id }, select: { id: true } })
    if (!card) return errorResponse('Card not found', 404)

    const doc = await prisma.catalogueDocument.findFirst({
      where: { id: params.catalogueId, config: { cardId: card.id } },
    })
    if (!doc || doc.visibility === 'private') return errorResponse('Catalogue not found', 404)

    const resolved = await resolveFileBuffer(doc.url)
    if (!resolved) return errorResponse('File could not be loaded', 404)

    const wantsDownload = request.nextUrl.searchParams.get('download') === '1'
    if (wantsDownload) {
      await recordEvent({
        cardId: card.id,
        type: ANALYTICS_EVENTS.CATALOGUE_DOWNLOAD,
        sessionId: request.nextUrl.searchParams.get('s'),
        userAgent: request.headers.get('user-agent'),
        metadata: { catalogueId: doc.id, kind: doc.kind },
      })
    }

    const filename = sanitizeDownloadName(doc.title || 'catalogue', 'pdf')
    const fullName = /\.pdf$/i.test(filename) ? filename : `${filename}.pdf`
    const disposition = (wantsDownload ? 'attachment' : 'inline') + `; filename="${fullName}"`

    return streamedFileResponse(resolved.buffer, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': disposition,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=3600',
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to load catalogue', 500)
  }
}
