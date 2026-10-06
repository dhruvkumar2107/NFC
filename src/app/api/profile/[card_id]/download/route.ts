import { NextRequest } from 'next/server'
import JSZip from 'jszip'
import { prisma } from '@/lib/db'
import { errorResponse } from '@/lib/api-response'
import { resolveFileBuffer, mimeToExt, sanitizeDownloadName } from '@/lib/file-store'
import { buildPublicGallery, buildPublicDocuments } from '@/lib/public-profile'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

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
    const card = await prisma.card.findUnique({ where: { cardId: params.card_id } })
    if (!card) return errorResponse('Card not found', 404)

    const customer = await prisma.customer.findUnique({ where: { cardId: card.id } })
    if (!customer) return errorResponse('Profile not found', 404)

    const type = request.nextUrl.searchParams.get('type') || 'all'
    if (!['all', 'photos', 'documents'].includes(type)) {
      return errorResponse('Unsupported download type', 400)
    }

    const includePhotos = type === 'all' || type === 'photos'
    const includeDocuments = type === 'all' || type === 'documents'

    const zip = new JSZip()
    const taken = new Set<string>()
    let added = 0

    if (includePhotos) {
      const gallery = buildPublicGallery(customer)
      const folder = zip.folder('photos')
      for (let i = 0; i < gallery.length; i++) {
        const resolved = await resolveFileBuffer(gallery[i].url)
        if (!resolved) continue
        const ext = mimeToExt(resolved.mime)
        const name = uniqueName(taken, `photo-${String(i + 1).padStart(2, '0')}`, ext)
        folder?.file(name, resolved.buffer)
        added++
      }
    }

    if (includeDocuments) {
      const documents = buildPublicDocuments(customer)
      const folder = zip.folder('documents')
      for (let i = 0; i < documents.length; i++) {
        const resolved = await resolveFileBuffer(documents[i].url)
        if (!resolved) continue
        const base = sanitizeDownloadName(documents[i].name, 'pdf').replace(/\.pdf$/i, '')
        const name = uniqueName(taken, base, 'pdf')
        folder?.file(name, resolved.buffer)
        added++
      }
    }

    if (added === 0) {
      return errorResponse(
        type === 'photos' ? 'No published photos to download' : type === 'documents' ? 'No published documents to download' : 'Nothing to download for this profile',
        404
      )
    }

    const content = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' })
    const filename = `MySmartCard-${card.cardId}-${type}.zip`

    return new Response(content as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': content.byteLength.toString(),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Download failed', 500)
  }
}
