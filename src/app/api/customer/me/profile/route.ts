import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function PATCH(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request, 'customer')
    if (error) return error

    const body = await request.json()
    const {
      name, designation, company, college, mobile, whatsapp, email, website,
      socialLinks, logoUrl, paymentQrUrl, description, address, taluk, city, state, pincode, photos,
    } = body

    const clean = (v?: string) => (typeof v === 'string' && v.trim() ? v.trim() : null)
    const cleanedEmail = clean(email)

    const existing = await prisma.customer.findFirst({ where: { email: cleanedEmail || '___none___' , NOT: { id: user!.id } } })
    if (cleanedEmail && existing) return errorResponse('Email already registered')

    const updated = await prisma.customer.update({
      where: { id: user!.id },
      data: {
        name: clean(name) || undefined,
        designation: clean(designation) || undefined,
        company: clean(company) || undefined,
        college: clean(college) || undefined,
        mobile: clean(mobile) || undefined,
        whatsapp: clean(whatsapp) || undefined,
        email: cleanedEmail || undefined,
        website: clean(website) || undefined,
        socialLinks: socialLinks ? JSON.stringify(socialLinks) : undefined,
        logoUrl: clean(logoUrl) || undefined,
        paymentQrUrl: clean(paymentQrUrl) || undefined,
        description: clean(description) || undefined,
        address: clean(address) || undefined,
        taluk: clean(taluk) || undefined,
        city: clean(city) || undefined,
        state: clean(state) || undefined,
        pincode: clean(pincode) || undefined,
        photos: photos ? JSON.stringify(photos) : undefined,
      },
    })
    return successResponse(updated)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update profile', 500)
  }
}
