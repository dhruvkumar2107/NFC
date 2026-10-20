import { NextRequest } from 'next/server'
import JSZip from 'jszip'
import { prisma } from '@/lib/db'
import { errorResponse } from '@/lib/api-response'
import { resolveFileBuffer, sanitizeDownloadName } from '@/lib/file-store'
import { streamedFileResponse } from '@/lib/stream-file'
import { recordEvent, ANALYTICS_EVENTS } from '@/lib/analytics'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

function uniqueName(taken: Set<string>, base: string, ext: string): string {
  let candidate = `${base}.${ext}`
  let counter = 2
  while (taken.has(candidate.toLowerCase())) {
    candidate = `${base}-${counter}.${ext}`
    counter++
  }
  taken.add(candidate.toLowerCase())
  return candidate
}

export async function GET(request: NextRequest, { params }: { params: { card_id: string } }) {
  try {
    const card = await prisma.card.findUnique({
      where: { cardId: params.card_id },
      include: { customer: { select: { name: true } } },
    })
    if (!card) return errorResponse('Card not found', 404)

    const albumId = request.nextUrl.searchParams.get('albumId')
    const includeCatalogues = request.nextUrl.searchParams.get('catalogues') === '1'

    const config = await prisma.cardBuilderConfig.findUnique({
      where: { cardId: card.id },
      include: {
        albums: {
          where: { public: true, ...(albumId ? { id: albumId } : {}) },
          include: { media: { where: { visibility: 'public' }, orderBy: { sortOrder: 'asc' } } },
          orderBy: { sortOrder: 'asc' },
        },
        catalogues: { where: { visibility: 'public' }, orderBy: { sortOrder: 'asc' } },
      },
    })
    if (!config) return errorResponse('Nothing to download', 404)

    const zip = new JSZip()
    const taken = new Set<string>()
    let added = 0

    for (const album of config.albums) {
      const folder = zip.folder(sanitizeDownloadName(album.name, 'album'))
      for (let i = 0; i < album.media.length; i++) {
        const item = album.media[i]
        const resolved = await resolveFileBuffer(item.url)
        if (!resolved) continue
        const base = sanitizeDownloadName(item.name || `${album.slug}-${i + 1}`, 'jpg').replace(/\.[^.]+$/, '')
        const ext = (resolved.mime.split('/')[1] || 'jpg').replace('jpeg', 'jpg')
        folder?.file(uniqueName(taken, base, ext), resolved.buffer)
        added++
      }
    }

    if (includeCatalogues) {
      const folder = zip.folder('catalogues')
      for (const doc of config.catalogues) {
        const resolved = await resolveFileBuffer(doc.url)
        if (!resolved) continue
        const base = sanitizeDownloadName(doc.title, 'catalogue').replace(/\.[^.]+$/, '')
        folder?.file(uniqueName(taken, base, 'pdf'), resolved.buffer)
        added++
      }
    }

    if (added === 0) return errorResponse('No published photos to download', 404)

    await recordEvent({
      cardId: card.id,
      type: ANALYTICS_EVENTS.ZIP_DOWNLOAD,
      sessionId: request.nextUrl.searchParams.get('s'),
      userAgent: request.headers.get('user-agent'),
      metadata: { albumId: albumId || 'all', files: added },
    })

    const content = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' })
    const safeName = sanitizeDownloadName(card.customer?.name || 'gallery', 'zip').replace(/\.zip$/i, '')
    const filename = `${safeName}-gallery.zip`

    return streamedFileResponse(content, {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Download failed', 500)
  }
}
