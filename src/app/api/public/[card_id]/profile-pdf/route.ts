import { NextRequest } from 'next/server'
import { errorResponse } from '@/lib/api-response'
import { loadPublicCardData, businessName } from '@/lib/public-card-data'
import { buildBusinessProfilePdf } from '@/lib/pdf/business-profile'
import { contentDisposition, sanitizeBaseName } from '@/lib/file-store'
import { recordEvent, ANALYTICS_EVENTS } from '@/lib/analytics'
import { rateLimit, clientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const maxDuration = 120
export const runtime = 'nodejs'

export async function GET(request: NextRequest, { params }: { params: { card_id: string } }) {
  try {
    const ip = clientIp(request.headers)
    if (!rateLimit(`profile-pdf:${ip}`, 20, 60_000)) {
      return errorResponse('Too many requests. Please try again shortly.', 429)
    }

    const data = await loadPublicCardData(params.card_id, request.url)
    if (!data) return errorResponse('Card not found', 404)

    const pdf = await buildBusinessProfilePdf(data)
    const name = businessName(data.customer)
    const filename = `${sanitizeBaseName(name, 'Business')}_Complete_Profile.pdf`

    const isDownload = request.nextUrl.searchParams.get('download') !== '0'

    if (isDownload) {
      await recordEvent({
        cardId: data.card.id,
        type: ANALYTICS_EVENTS.CONTACT_DOWNLOAD,
        sessionId: request.nextUrl.searchParams.get('s'),
        userAgent: request.headers.get('user-agent'),
        metadata: { format: 'profile_pdf', bytes: pdf.length },
      })
    }

    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': contentDisposition(filename, isDownload ? 'attachment' : 'inline'),
        'Content-Length': String(pdf.length),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err: any) {
    return errorResponse(err?.message || 'Failed to generate business profile PDF', 500)
  }
}
