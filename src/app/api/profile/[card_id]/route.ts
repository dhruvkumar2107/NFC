import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api-response'
import { buildPublicGallery, buildPublicDocuments, publicFileUrl, publicDownloadUrl } from '@/lib/public-profile'

export async function GET(_request: NextRequest, { params }: { params: { card_id: string } }) {
  try {
    const card = await prisma.card.findUnique({
      where: { cardId: params.card_id },
    })
    if (!card) return errorResponse('Card not found', 404)

    const customer = await prisma.customer.findUnique({
      where: { cardId: card.id },
    })
    if (!customer) return errorResponse('Customer not found', 404)

    const socialLinks = JSON.parse(customer.socialLinks || '{}')
    let photos: string[] = []
    try { photos = JSON.parse(customer.photos || '[]') } catch { photos = [] }

    const gallery = buildPublicGallery(customer)
    const documents = buildPublicDocuments(customer)

    return successResponse({
      cardId: card.cardId,
      name: customer.name,
      designation: customer.designation,
      company: customer.company,
      college: customer.college,
      email: customer.email,
      mobile: customer.mobile,
      whatsapp: customer.whatsapp,
      website: customer.website,
      socialLinks,
      photos,
      gallery: gallery.map((photo, index) => ({
        url: publicFileUrl(card.cardId, 'photo', index),
        source: photo.source,
      })),
      documents: documents.map((doc, index) => ({
        name: doc.name,
        size: doc.size,
        mime: doc.mime,
        viewUrl: publicFileUrl(card.cardId, 'document', index),
        downloadUrl: `${publicFileUrl(card.cardId, 'document', index)}&download=1`,
      })),
      downloadAllUrl: publicDownloadUrl(card.cardId, 'all'),
      downloadPhotosUrl: publicDownloadUrl(card.cardId, 'photos'),
      logoUrl: customer.logoUrl,
      description: customer.description,
      address: customer.address,
      taluk: customer.taluk,
      city: customer.city,
      state: customer.state,
      pincode: customer.pincode,
      country: customer.country,
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch profile', 500)
  }
}
