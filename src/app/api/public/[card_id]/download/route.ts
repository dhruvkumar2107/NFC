import { NextRequest } from 'next/server'
import { errorResponse } from '@/lib/api-response'
import { loadPublicCardData } from '@/lib/public-card-data'
import {
  buildBundleZip,
  BundleLimitError,
  collectAssets,
  type BundleType,
} from '@/lib/download-bundle'
import { contentDisposition, formatFileSize } from '@/lib/file-store'
import { recordEvent, ANALYTICS_EVENTS } from '@/lib/analytics'
import { rateLimit, clientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const maxDuration = 120
export const runtime = 'nodejs'

const VALID_TYPES: BundleType[] = [
  'everything',
  'photos',
  'documents',
  'catalogues',
  'catalogue',
  'price_list',
  'brochure',
  'album',
  'qr',
]

export async function GET(request: NextRequest, { params }: { params: { card_id: string } }) {
  try {
    const ip = clientIp(request.headers)
    if (!rateLimit(`bundle:${ip}`, 10, 60_000)) {
      return errorResponse('Too many downloads. Please wait a minute and try again.', 429)
    }

    const rawType = (request.nextUrl.searchParams.get('type') || 'everything') as BundleType
    if (!VALID_TYPES.includes(rawType)) {
      return errorResponse('Unsupported download type', 400)
    }

    const data = await loadPublicCardData(params.card_id, request.url)
    if (!data) return errorResponse('Card not found', 404)

    // Fail fast (with a helpful message) when a requested bundle has no assets.
    const planned = collectAssets(data, rawType, request.nextUrl.searchParams.get('albumId') || undefined)
    const includeExtras = rawType === 'everything'
    if (planned.length === 0 && !includeExtras) {
      return errorResponse('Nothing to download for this selection yet.', 404)
    }

    const result = await buildBundleZip(data, rawType, {
      albumId: request.nextUrl.searchParams.get('albumId') || undefined,
      includeProfileExtras: includeExtras,
    })

    await recordEvent({
      cardId: data.card.id,
      type: ANALYTICS_EVENTS.ZIP_DOWNLOAD,
      sessionId: request.nextUrl.searchParams.get('s'),
      userAgent: request.headers.get('user-agent'),
      metadata: { bundle: rawType, files: result.fileCount, bytes: result.bytes },
    })

    return new Response(new Uint8Array(result.buffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': contentDisposition(result.filename),
        'Content-Length': String(result.bytes),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err: any) {
    if (err instanceof BundleLimitError) {
      return errorResponse(`${err.message} (max ${formatFileSize(150 * 1024 * 1024)})`, 413)
    }
    return errorResponse(err?.message || 'Failed to build download bundle', 500)
  }
}
