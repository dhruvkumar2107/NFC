import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { errorResponse } from '@/lib/api-response'
import { resolveFileBuffer, mimeToExt, sanitizeDownloadName } from '@/lib/file-store'
import { buildPublicGallery, buildPublicDocuments } from '@/lib/public-profile'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { card_id: string } }) {
  try {
    const card = await prisma.card.findUnique({ where: { cardId: params.card_id } })
    if (!card) return errorResponse('Card not found', 404)

    const customer = await prisma.customer.findUnique({ where: { cardId: card.id } })
    if (!customer) return errorResponse('Profile not found', 404)

    const kind = request.nextUrl.searchParams.get('kind') || 'photo'
    const rawIndex = request.nextUrl.searchParams.get('i')
    const wantsDownload = request.nextUrl.searchParams.get('download') === '1'
    const index = rawIndex === null ? NaN : parseInt(rawIndex, 10)

    if (Number.isNaN(index)) return errorResponse('Missing file index', 400)

    let url: string | null = null
    let filename: string

    if (kind === 'photo') {
      const gallery = buildPublicGallery(customer)
      if (index < 0 || index >= gallery.length) return errorResponse('Photo not found', 404)
      url = gallery[index].url
      filename = `photo-${index + 1}`
    } else if (kind === 'document') {
      const documents = buildPublicDocuments(customer)
      if (index < 0 || index >= documents.length) return errorResponse('Document not found', 404)
      url = documents[index].url
      filename = sanitizeDownloadName(documents[index].name, 'pdf')
    } else {
      return errorResponse('Unsupported file kind', 400)
    }

    const resolved = await resolveFileBuffer(url)
    if (!resolved) return errorResponse('File could not be loaded', 404)

    const ext = kind === 'document' ? 'pdf' : mimeToExt(resolved.mime)
    const fullFilename = filename.includes('.') ? filename : `${filename}.${ext}`
    const disposition = (wantsDownload ? 'attachment' : 'inline') + `; filename="${fullFilename}"`

    return new Response(new Uint8Array(resolved.buffer), {
      headers: {
        'Content-Type': kind === 'document' ? 'application/pdf' : resolved.mime,
        'Content-Disposition': disposition,
        'Content-Length': resolved.buffer.length.toString(),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to load file', 500)
  }
}
