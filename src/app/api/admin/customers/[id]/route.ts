import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { successResponse, errorResponse } from '@/lib/api-response'
import {
  MAX_USER_PHOTOS,
  validatePhotoList,
  validateAdminPhotoList,
  validateDocumentList,
  isImageValue,
} from '@/lib/profile-media'

/** Accepts either a real array or the JSON string form of an array (round-tripped GET payload). */
function coerceList(value: unknown): unknown {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : value
    } catch {
      return value
    }
  }
  return value
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: { card: true, orders: true, employee: true },
    })
    if (!customer) return errorResponse('Customer not found', 404)
    return successResponse(customer)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch customer', 500)
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error
    const body = await request.json()
    const allowed = ['name','designation','company','college','mobile','whatsapp','email','website','socialLinks','address','taluk','city','state','pincode','logoUrl','paymentQrUrl','description','type','photos','adminPhotos','documents','upiId']
    const safeData: Record<string, any> = {}
    for (const k of allowed) { if (body[k] !== undefined) safeData[k] = body[k] }
    if (safeData.socialLinks && typeof safeData.socialLinks === 'object') safeData.socialLinks = JSON.stringify(safeData.socialLinks)

    if (safeData.photos !== undefined) {
      const check = validatePhotoList(coerceList(safeData.photos), MAX_USER_PHOTOS, 'Photos')
      if (!check.ok) return errorResponse(check.error, 400)
      safeData.photos = JSON.stringify(check.value)
    }
    if (safeData.adminPhotos !== undefined) {
      const check = validateAdminPhotoList(coerceList(safeData.adminPhotos))
      if (!check.ok) return errorResponse(check.error, 400)
      safeData.adminPhotos = JSON.stringify(check.value)
    }
    if (safeData.documents !== undefined) {
      const check = validateDocumentList(coerceList(safeData.documents))
      if (!check.ok) return errorResponse(check.error, 400)
      safeData.documents = JSON.stringify(check.value)
    }
    if (safeData.logoUrl !== undefined && typeof safeData.logoUrl === 'string' && safeData.logoUrl.trim() && !isImageValue(safeData.logoUrl)) {
      return errorResponse('Profile picture must be a JPG, JPEG, PNG or WebP image', 400)
    }
    if (safeData.paymentQrUrl !== undefined && typeof safeData.paymentQrUrl === 'string' && safeData.paymentQrUrl.trim() && !isImageValue(safeData.paymentQrUrl)) {
      return errorResponse('Payment QR must be a JPG, JPEG, PNG or WebP image', 400)
    }

    const clean = (v?: string) => (typeof v === 'string' && v.trim() ? v.trim() : null)
    if (safeData.email !== undefined) safeData.email = clean(safeData.email)
    if (safeData.email) {
      const existing = await prisma.customer.findFirst({ where: { email: safeData.email, NOT: { id: params.id } } })
      if (existing) return errorResponse('Email already registered')
    }
    const updated = await prisma.customer.update({ where: { id: params.id }, data: safeData })
    return successResponse(updated)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update customer', 500)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error
    await prisma.customer.delete({ where: { id: params.id } })
    return successResponse({ deleted: true })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to delete customer', 500)
  }
}
