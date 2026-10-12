import { NextRequest } from 'next/server'
import { errorResponse } from '@/lib/api-response'
import { loadPublicCardData } from '@/lib/public-card-data'
import { buildDownloadManifest } from '@/lib/download-bundle'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { card_id: string } }) {
  try {
    const data = await loadPublicCardData(params.card_id, request.url)
    if (!data) return errorResponse('Card not found', 404)

    const manifest = buildDownloadManifest(data)
    return Response.json(manifest, {
      headers: { 'Cache-Control': 'public, max-age=30, s-maxage=60' },
    })
  } catch (err: any) {
    return errorResponse(err?.message || 'Failed to build download manifest', 500)
  }
}
