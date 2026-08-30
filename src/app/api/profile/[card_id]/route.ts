import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function GET(_request: NextRequest, { params }: { params: { card_id: string } }) {
  try {
    const card = await prisma.card.findUnique({
      where: { cardId: params.card_id },
      include: { design: true },
    })
    if (!card) return errorResponse('Card not found', 404)

    const customer = await prisma.customer.findUnique({
      where: { cardId: card.id },
    })
    if (!customer) return errorResponse('Customer not found', 404)

    const socialLinks = JSON.parse(customer.socialLinks || '{}')
    let photos: string[] = []
    try { photos = JSON.parse(customer.photos || '[]') } catch { photos = [] }

    return successResponse({
      cardId: card.cardId,
      name: customer.name,
      designation: customer.designation,
      company: customer.company,
      email: customer.email,
      mobile: customer.mobile,
      whatsapp: customer.whatsapp,
      website: customer.website,
      socialLinks,
      photos,
      logoUrl: customer.logoUrl,
      description: customer.description,
      design: { name: card.design.name },
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch profile', 500)
  }
}
