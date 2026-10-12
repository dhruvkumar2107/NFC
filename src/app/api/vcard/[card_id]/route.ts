import { NextRequest } from 'next/server'
import { errorResponse } from '@/lib/api-response'
import { loadPublicCardData, businessName } from '@/lib/public-card-data'
import { buildVCard, vCardFilename } from '@/lib/vcard'
import { contentDisposition } from '@/lib/file-store'

export const dynamic = 'force-dynamic'

function safeSocial(raw: string | null | undefined): Record<string, string> {
  try { return JSON.parse(raw || '{}') } catch { return {} }
}

export async function GET(request: NextRequest, { params }: { params: { card_id: string } }) {
  try {
    const data = await loadPublicCardData(params.card_id, request.url)
    if (!data) return new Response('Card not found', { status: 404 })

    const c = data.customer
    const vcard = buildVCard({
      ...c,
      socialLinks: safeSocial(c.socialLinks),
      profileUrl: data.profileUrl,
    })

    const isDownload = request.nextUrl.searchParams.get('download') === '1'
    const filename = vCardFilename(businessName(c))

    return new Response(vcard, {
      headers: {
        'Content-Type': 'text/vcard; charset=utf-8',
        ...(isDownload ? { 'Content-Disposition': contentDisposition(filename) } : {}),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err: any) {
    return errorResponse(err?.message || 'Failed to generate vCard', 500)
  }
}
