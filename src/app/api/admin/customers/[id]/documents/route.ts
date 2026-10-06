import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { errorResponse } from '@/lib/api-response'
import { resolveFileBuffer, sanitizeDownloadName } from '@/lib/file-store'
import { ProfileDocumentEntry, parseJsonArray } from '@/lib/profile-media'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireAuth(request, 'admin')
    if (error) return error

    const customer = await prisma.customer.findUnique({ where: { id: params.id } })
    if (!customer) return errorResponse('Customer not found', 404)

    const documents = parseJsonArray<ProfileDocumentEntry>(customer.documents).filter(
      (d) => d && typeof d.url === 'string' && d.url
    )

    const url = new URL(request.url)
    const indexParam = url.searchParams.get('index')

    if (url.searchParams.get('zip') === '1') {
      if (documents.length === 0) return errorResponse('No documents to download', 404)

      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      const folder = zip.folder('documents')
      const taken = new Set<string>()
      let added = 0

      for (const doc of documents) {
        const resolved = await resolveFileBuffer(doc.url)
        if (!resolved) continue
        const base = sanitizeDownloadName(doc.name || 'document.pdf', 'pdf').replace(/\.pdf$/i, '')
        let candidate = `${base}.pdf`
        let counter = 2
        while (taken.has(candidate.toLowerCase())) {
          candidate = `${base}-${counter}.pdf`
          counter++
        }
        taken.add(candidate.toLowerCase())
        folder?.file(candidate, resolved.buffer)
        added++
      }

      if (added === 0) return errorResponse('Documents could not be loaded', 404)

      const content = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' })
      const filename = `${(customer.name || 'customer').replace(/[^a-z0-9]+/gi, '-')}-documents.zip`

      return new Response(content as unknown as BodyInit, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': content.byteLength.toString(),
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'no-store',
        },
      })
    }

    if (indexParam === null) {
      return Response.json({
        success: true,
        total: documents.length,
        documents: documents.map((d, i) => ({
          index: i,
          name: d.name,
          size: d.size,
          visibility: d.visibility || 'public',
          createdAt: d.createdAt,
        })),
      })
    }

    const index = parseInt(indexParam, 10)
    if (isNaN(index) || index < 0 || index >= documents.length) {
      return errorResponse('Invalid document index', 400)
    }

    const doc = documents[index]
    const resolved = await resolveFileBuffer(doc.url)
    if (!resolved) return errorResponse('Document could not be loaded', 404)

    const wantsDownload = url.searchParams.get('download') === '1'
    const filename = sanitizeDownloadName(doc.name, 'pdf')

    return new Response(new Uint8Array(resolved.buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${wantsDownload ? 'attachment' : 'inline'}; filename="${filename}"`,
        'Content-Length': resolved.buffer.length.toString(),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, max-age=300',
      },
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to load document', 500)
  }
}
