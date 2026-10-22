import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { generateCardId, generateOrderId, hashPassword } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-response'
import { isImageValue, MAX_USER_PHOTOS, validatePhotoList } from '@/lib/profile-media'
import razorpay from '@/lib/razorpay'

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
    const body = await request.json()
    const {
      name: rawName, fullName, designation, company, college, mobile, whatsapp, email, website,
      socialLinks, address, taluk, city, state, pincode, logoUrl, paymentQrUrl, description,
      photos, designId, referralCode, attributionType,
    } = body

    const name = rawName || fullName

    if (!name || !designId) {
      return errorResponse('Name and design are required')
    }

    const clean = (v?: string) => (typeof v === 'string' && v.trim() ? v.trim() : null)

    let validatedPhotos: string[] | undefined
    if (photos !== undefined) {
      const check = validatePhotoList(coerceList(photos), MAX_USER_PHOTOS, 'Photos')
      if (!check.ok) return errorResponse(check.error, 400)
      validatedPhotos = check.value
    }

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

    let employeeId: string | null = null
    let resolvedAttributionType = attributionType || 'direct'
    if (referralCode) {
      const employee = await prisma.employee.findFirst({
        where: { referralLinkCode: referralCode, status: 'active' },
      })
      if (!employee) return errorResponse('Invalid or inactive referral code')
      employeeId = employee.id
      resolvedAttributionType = 'manual_code'
    } else {
      const defaultEmployee = await prisma.employee.findFirst({
        where: { isDefault: true, status: 'active' },
      })
      if (defaultEmployee) {
        employeeId = defaultEmployee.id
        resolvedAttributionType = 'direct'
      }
    }

    const cleanedMobile = clean(mobile)
    const cleanedEmail = clean(email)
    let customer = cleanedMobile ? await prisma.customer.findFirst({ where: { mobile: cleanedMobile } }) : null
    if (!customer && cleanedEmail) customer = await prisma.customer.findFirst({ where: { email: cleanedEmail } })
    if (customer) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          name, designation: clean(designation), company: clean(company), college: clean(college),
          mobile: cleanedMobile, whatsapp: clean(whatsapp), email: cleanedEmail, website: clean(website),
          socialLinks: JSON.stringify(socialLinks || {}),
          address: clean(address), taluk: clean(taluk), city: clean(city), state: clean(state), pincode: clean(pincode),
          description: clean(description),
          ...(cleanedLogo ? { logoUrl: cleanedLogo } : {}),
          ...(cleanedQr ? { paymentQrUrl: cleanedQr } : {}),
          ...(Array.isArray(validatedPhotos) && validatedPhotos.length > 0
            ? { photos: JSON.stringify(validatedPhotos) }
            : {}),
        },
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
          photos: JSON.stringify(validatedPhotos || []),
          soldByEmployeeId: null,
          passwordHash: tempPassword,
        },
      })
    }

    let commissionAmount = 0
    let commissionPoints = 0
    if (employeeId) {
      if (resolvedAttributionType === 'direct') {
        const defaultEmployee = await prisma.employee.findFirst({
          where: { id: employeeId, isDefault: true },
        })
        if (defaultEmployee && defaultEmployee.defaultCommissionAmount > 0) {
          commissionAmount = defaultEmployee.defaultCommissionAmount
          commissionPoints = defaultEmployee.defaultCommissionAmount
        }
      } else {
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
    }

    const orderId = generateOrderId()
    const order = await prisma.order.create({
      data: {
        orderId,
        customerId: customer.id,
        employeeId,
        designId: design.id,
        amount: design.price,
        commissionAmount,
        commissionPoints,
        attributionType: resolvedAttributionType,
        status: 'Pending',
      },
    })

    let razorpayOrderId: string | null = null
    let razorpayKey: string | null = null

    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_SECRET !== 'placeholder_secret') {
      try {
        const razorpayOrder = await razorpay.orders.create({
          amount: Math.round(design.price * 100),
          currency: 'INR',
          receipt: orderId,
        })
        razorpayOrderId = razorpayOrder.id
        razorpayKey = (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || null)
      } catch (e: any) {
        console.error('Razorpay order creation failed:', e.message)
        await prisma.order.update({ where: { id: order.id }, data: { status: 'Cancelled' } })
        return errorResponse('Payment gateway error. Please try again.', 500)
      }
    }

    return successResponse({
      orderId: order.orderId,
      razorpayOrderId,
      razorpayKey,
      amount: design.price,
      design: design.name,
      customerName: name,
      customerMobile: mobile,
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Order creation failed', 500)
  }
}
