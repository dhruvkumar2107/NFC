import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { errorResponse, successResponse } from '@/lib/api-response'
import { loadPublicCardData, galleryAssets, documentAssets } from '@/lib/public-card-data'
import { buildDownloadManifest } from '@/lib/download-bundle'
import { formatFileSize } from '@/lib/file-store'

export const dynamic = 'force-dynamic'

/**
 * Admin inventory of everything a customer's public download centre exposes.
 * Gives support staff a one-glance audit of what will be bundled into a ZIP.
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await requireAuth(request, 'admin')
    if (error) return error

    const card = await prisma.card.findUnique({
      where: { id: params.id },
      include: { customer: { select: { name: true } } },
    })
    if (!card) return errorResponse('Card not found', 404)

    const data = await loadPublicCardData(card.cardId, request.url)
    if (!data) return errorResponse('This card has no customer profile yet', 404)

    const manifest = buildDownloadManifest(data)
    const gallery = galleryAssets(data)
    const documents = documentAssets(data)

    const folders = [
      {
        folder: 'Profile',
        label: 'Business profile PDF + contact file',
        count: 2,
        size: 0,
      },
      {
        folder: 'Photos',
        label: 'Profile gallery photos',
        count: gallery.length,
        size: gallery.reduce((sum, a) => sum + (a.size || 0), 0),
      },
      ...data.albums.map((album) => ({
        folder: album.folder,
        label: `Album · ${album.albumName}`,
        count: album.photos.length,
        size: album.photos.reduce((sum, p) => sum + (p.size || 0), 0),
      })),
      {
        folder: 'Product-Catalogues',
        label: 'Catalogues & menus',
        count: data.catalogues.filter((c) => c.kind === 'catalogue' || c.kind === 'menu').length,
        size: data.catalogues.filter((c) => c.kind === 'catalogue' || c.kind === 'menu').reduce((s, c) => s + c.size, 0),
      },
      {
        folder: 'Price-Lists',
        label: 'Price lists',
        count: data.catalogues.filter((c) => c.kind === 'price_list').length,
        size: data.catalogues.filter((c) => c.kind === 'price_list').reduce((s, c) => s + c.size, 0),
      },
      {
        folder: 'Brochures',
        label: 'Brochures',
        count: data.catalogues.filter((c) => c.kind === 'brochure').length,
        size: data.catalogues.filter((c) => c.kind === 'brochure').reduce((s, c) => s + c.size, 0),
      },
      {
        folder: 'Other-Documents',
        label: 'Customer documents',
        count: documents.length,
        size: documents.reduce((sum, d) => sum + (d.size || 0), 0),
      },
      {
        folder: 'QR-Codes',
        label: 'Payment QR code',
        count: data.customer.paymentQrUrl ? 1 : 0,
        size: 0,
      },
    ].filter((f) => f.count > 0)

    const totalSize = folders.reduce((sum, f) => sum + f.size, 0)

    return successResponse({
      card: { id: card.id, cardId: card.cardId, nfcCardNumber: card.nfcCardNumber, status: card.status },
      customerName: card.customer?.name || data.customer.name,
      manifest,
      folders,
      totalSize,
      totalSizeLabel: formatFileSize(totalSize),
      base: `/api/public/${encodeURIComponent(card.cardId)}`,
      profileUrl: data.profileUrl,
    })
  } catch (err: any) {
    return errorResponse(err?.message || 'Failed to load download inventory', 500)
  }
}
