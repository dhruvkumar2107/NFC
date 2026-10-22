import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { generateCardId, generateOrderId, generateNfcCardNumber, hashPassword } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-response'
import {
  MAX_ADMIN_PHOTOS,
  MAX_DOCUMENTS,
  MAX_ORDER_DOCUMENTS,
  MAX_VIDEOS,
  validateAdminPhotoList,
  validateDocumentList,
  validateVideoList,
  isImageValue,
  type AdminPhotoEntry,
  type ProfileDocumentEntry,
  type ProfileVideoEntry,
} from '@/lib/profile-media'

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

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request, 'admin')
    if (auth.error) return auth.error

    const body = await request.json()
    const {
      name, email, mobile, whatsapp, designation, company, college,
      website, address, taluk, city, state, pincode,
      socialLinks, logoUrl, paymentQrUrl, description,
      adminPhotos, documents, videos,
      designId, employeeId, amount,
    } = body

    if (!name || !designId) {
      return errorResponse('Name and design are required')
    }

    let validatedAdminPhotos: AdminPhotoEntry[] | undefined
    if (adminPhotos !== undefined) {
      const check = validateAdminPhotoList(coerceList(adminPhotos))
      if (!check.ok) return errorResponse(check.error, 400)
      validatedAdminPhotos = check.value
    }
    let validatedDocuments: ProfileDocumentEntry[] | undefined
    if (documents !== undefined) {
      const docs = coerceList(documents)
      if (Array.isArray(docs) && docs.length > MAX_ORDER_DOCUMENTS) {
        return errorResponse(`Maximum ${MAX_ORDER_DOCUMENTS} documents allowed for order (received ${docs.length})`, 400)
      }
      const check = validateDocumentList(docs)
      if (!check.ok) return errorResponse(check.error, 400)
      validatedDocuments = check.value
    }
    let validatedVideos: ProfileVideoEntry[] | undefined
    if (videos !== undefined) {
      const check = validateVideoList(coerceList(videos), MAX_VIDEOS)
      if (!check.ok) return errorResponse(check.error, 400)
      validatedVideos = check.value
    }

    const clean = (v?: string) => (typeof v === 'string' && v.trim() ? v.trim() : null)
    const cleanedMobile = clean(mobile)
    const cleanedEmail = clean(email)
    const cleanedLogo = clean(logoUrl)
    const cleanedQr = clean(paymentQrUrl)
    if (cleanedLogo && !isImageValue(cleanedLogo)) {
      return errorResponse('Profile picture must be a supported image file', 400)
    }
    if (cleanedQr && !isImageValue(cleanedQr)) {
      return errorResponse('Payment QR must be a supported image file', 400)
    }

    const design = await prisma.cardDesign.findUnique({ where: { id: designId } })
    if (!design) return errorResponse('Invalid card design')

    let customer = cleanedMobile ? await prisma.customer.findFirst({ where: { mobile: cleanedMobile } }) : null
    if (!customer && cleanedEmail) customer = await prisma.customer.findFirst({ where: { email: cleanedEmail } })
    if (customer) {
      // Only overwrite fields the admin actually provided. The order form starts
      // blank and never loads the existing profile, so persisting empty values
      // would silently wipe a returning customer's saved details and media.
      const updateData: Record<string, unknown> = {}
      const assignText = (key: string, value: string | null) => {
        if (value !== null) updateData[key] = value
      }
      assignText('name', clean(name))
      assignText('designation', clean(designation))
      assignText('company', clean(company))
      assignText('college', clean(college))
      assignText('mobile', cleanedMobile)
      assignText('whatsapp', clean(whatsapp))
      assignText('email', cleanedEmail)
      assignText('website', clean(website))
      assignText('address', clean(address))
      assignText('taluk', clean(taluk))
      assignText('city', clean(city))
      assignText('state', clean(state))
      assignText('pincode', clean(pincode))
      assignText('logoUrl', cleanedLogo)
      assignText('paymentQrUrl', cleanedQr)
      assignText('description', clean(description))

      if (socialLinks && typeof socialLinks === 'object' && Object.keys(socialLinks).length > 0) {
        updateData.socialLinks = JSON.stringify(socialLinks)
      }

      if (Array.isArray(validatedAdminPhotos) && validatedAdminPhotos.length > 0) {
        updateData.adminPhotos = JSON.stringify(validatedAdminPhotos)
      }

      if (Array.isArray(validatedDocuments) && validatedDocuments.length > 0) {
        updateData.documents = JSON.stringify(validatedDocuments)
      }

      const providedVideos = validatedVideos
      if (Array.isArray(providedVideos) && providedVideos.length > 0) {
        updateData.videos = JSON.stringify(providedVideos)
      }

      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: updateData,
      })
    } else {
      const tempPassword = await hashPassword((cleanedMobile || name) + '_mysmartcard_temp')
      customer = await prisma.customer.create({
        data: {
          name, designation: clean(designation), company: clean(company), college: clean(college),
          mobile: cleanedMobile, whatsapp: clean(whatsapp), email: cleanedEmail, website: clean(website),
          socialLinks: JSON.stringify(socialLinks || {}),
          address: clean(address), taluk: clean(taluk), city: clean(city), state: clean(state), pincode: clean(pincode),
          logoUrl: cleanedLogo, paymentQrUrl: cleanedQr, description: clean(description),
          adminPhotos: JSON.stringify(validatedAdminPhotos || []),
          documents: JSON.stringify(validatedDocuments || []),
          videos: JSON.stringify(validatedVideos || []),
          soldByEmployeeId: employeeId || null,
          passwordHash: tempPassword,
        },
      })
    }

    let commissionAmount = 0
    let commissionPoints = 0
    if (employeeId) {
      const activeRules = await prisma.commissionRule.findMany({
        where: { active: true },
        orderBy: { minCards: 'asc' },
      })
      if (activeRules.length > 0) {
        commissionAmount = activeRules[0].commissionPerCard
        commissionPoints = activeRules[0].pointsPerCard || activeRules[0].commissionPerCard
      } else {
        commissionAmount = 100
        commissionPoints = 100
      }
    }

    const orderId = generateOrderId()
    const cardIdNum = generateCardId()
    const nfcCardNumber = await generateNfcCardNumber()

    const orderAmount = amount || design.price

    const result = await prisma.$transaction(async (tx) => {
      const card = await tx.card.create({
        data: {
          cardId: cardIdNum,
          nfcCardNumber,
          soldByEmployeeId: employeeId || null,
          designId: design.id,
          status: 'Pending',
        },
      })

      const order = await tx.order.create({
        data: {
          orderId,
          customerId: customer!.id,
          employeeId: employeeId || null,
          cardId: card.id,
          designId: design.id,
          amount: orderAmount,
          commissionAmount,
          commissionPoints,
          attributionType: employeeId ? 'admin_manual' : 'direct',
          status: 'Payment Received',
        },
      })

      await tx.card.update({
        where: { id: card.id },
        data: { orderId: order.id },
      })

      await tx.customer.update({
        where: { id: customer!.id },
        data: {
          cardId: card.id,
          ...(employeeId ? { soldByEmployeeId: employeeId } : {}),
        },
      })

      if (employeeId && commissionPoints > 0) {
        await tx.employee.update({
          where: { id: employeeId },
          data: {
            totalPoints: { increment: commissionPoints },
            availablePoints: { increment: commissionPoints },
          },
        })
        await tx.walletTransaction.create({
          data: {
            employeeId,
            orderId: order.id,
            type: 'commission_earned',
            points: commissionPoints,
            description: `Commission for admin order ${orderId}: ${commissionPoints} points`,
          },
        })
      }

      return { orderId: order.orderId, cardId: card.cardId, nfcCardNumber: card.nfcCardNumber }
    })

    return successResponse({
      orderId: result.orderId,
      cardId: result.cardId,
      nfcCardNumber: result.nfcCardNumber,
      message: 'Order created successfully with card generated!',
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create order', 500)
  }
}
