import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { emailTaken, findCustomersByContact, generateUniqueOrderId, withUniqueRetry } from '@/lib/orders'
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
    if (!cleanedMobile) return errorResponse('Mobile number is required')

    const profile = {
      name, designation: clean(designation), company: clean(company), college: clean(college),
      mobile: cleanedMobile, whatsapp: clean(whatsapp), website: clean(website),
      socialLinks: JSON.stringify(socialLinks || {}),
      address: clean(address), taluk: clean(taluk), city: clean(city), state: clean(state), pincode: clean(pincode),
      description: clean(description),
    }

    // Only a customer who has no card yet (an earlier unpaid checkout attempt)
    // is reused. Someone who already owns a card gets a new customer record, so
    // a second order never overwrites the first card's profile.
    const matches = await findCustomersByContact(cleanedMobile, cleanedEmail)
    let customer = matches.find(c => !c.cardId) || null

    const takenBy = await emailTaken(cleanedEmail)
    const emailForCustomer = takenBy && takenBy.id !== customer?.id ? undefined : cleanedEmail

    if (customer) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          ...profile,
          ...(emailForCustomer !== undefined ? { email: emailForCustomer } : {}),
          ...(cleanedLogo ? { logoUrl: cleanedLogo } : {}),
          ...(cleanedQr ? { paymentQrUrl: cleanedQr } : {}),
          ...(Array.isArray(validatedPhotos) && validatedPhotos.length > 0
            ? { photos: JSON.stringify(validatedPhotos) }
            : {}),
        },
        include: { card: { select: { cardId: true } } },
      })
    } else {
      const tempPassword = await hashPassword(cleanedMobile + '_mysmartcard_temp')
      customer = await prisma.customer.create({
        data: {
          ...profile,
          email: emailForCustomer ?? null,
          logoUrl: cleanedLogo, paymentQrUrl: cleanedQr,
          photos: JSON.stringify(validatedPhotos || []),
          soldByEmployeeId: null,
          passwordHash: tempPassword,
        },
        include: { card: { select: { cardId: true } } },
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

    const hasRazorpay = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_SECRET !== 'placeholder_secret')
    const razorpayKey = hasRazorpay ? (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || null) : null

    // Retrying checkout (closing the payment window and pressing Pay again)
    // continues the same order instead of creating another one.
    const openOrders = await prisma.order.findMany({
      where: { customerId: customer.id, status: { in: ['Pending', 'Payment Failed'] }, cardId: null },
      orderBy: { createdAt: 'desc' },
    })
    const reusable = openOrders.find(o =>
      o.designId === design.id && o.amount === design.price && o.razorpayPaymentLinkId &&
      Date.now() - o.createdAt.getTime() < 12 * 60 * 60 * 1000)
    const stale = openOrders.filter(o => o.id !== reusable?.id && o.status === 'Pending')
    if (stale.length > 0) {
      await prisma.order.updateMany({ where: { id: { in: stale.map(o => o.id) } }, data: { status: 'Cancelled' } })
    }

    let order
    if (reusable) {
      order = await prisma.order.update({
        where: { id: reusable.id },
        data: { employeeId, commissionAmount, commissionPoints, attributionType: resolvedAttributionType, status: 'Pending' },
      })
    } else {
      order = await withUniqueRetry(async () => prisma.order.create({
        data: {
          orderId: await generateUniqueOrderId(),
          customerId: customer!.id,
          employeeId,
          designId: design.id,
          amount: design.price,
          commissionAmount,
          commissionPoints,
          attributionType: resolvedAttributionType,
          status: 'Pending',
        },
      }))
    }

    let razorpayOrderId: string | null = order.razorpayPaymentLinkId

    if (hasRazorpay && !razorpayOrderId) {
      try {
        const razorpayOrder = await razorpay.orders.create({
          amount: Math.round(design.price * 100),
          currency: 'INR',
          receipt: order.orderId,
        })
        razorpayOrderId = razorpayOrder.id
        // Stored so the webhook can confirm the order even if the browser never
        // comes back from the payment window.
        order = await prisma.order.update({ where: { id: order.id }, data: { razorpayPaymentLinkId: razorpayOrderId } })
      } catch (e: any) {
        console.error('Razorpay order creation failed:', e.message)
        await prisma.order.update({ where: { id: order.id }, data: { status: 'Cancelled' } })
        return errorResponse('Payment gateway error. Please try again.', 500)
      }
    }

    return successResponse({
      orderId: order.orderId,
      razorpayOrderId: hasRazorpay ? razorpayOrderId : null,
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
