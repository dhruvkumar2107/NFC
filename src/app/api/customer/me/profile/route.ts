import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function PATCH(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request, 'customer')
    if (error) return error

    const body = await request.json()
    const { name, designation, company, mobile, whatsapp, email, website, socialLinks, location, upiId, profilePhotoUrl, logoUrl, description } = body

    const updated = await prisma.customer.update({
      where: { id: user!.id },
      data: {
        name, designation, company, mobile, whatsapp, email, website,
        socialLinks: socialLinks ? JSON.stringify(socialLinks) : undefined,
        location, upiId, profilePhotoUrl, logoUrl, description,
      },
    })
    return successResponse(updated)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update profile', 500)
  }
}