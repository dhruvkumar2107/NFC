import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { hashPassword } from '@/lib/auth'
import { generateReferralCode } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-response'

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let pass = ''
  for (let i = 0; i < 10; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length))
  return pass
}

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { employeeId: { contains: search } },
      ]
    }
    const employees = await prisma.employee.findMany({
      where,
      include: { customers: true, orders: true },
      orderBy: { createdAt: 'desc' },
    })
    return successResponse(employees)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch employees', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error
    const body = await request.json()
    const { name, email, mobile, territory, password: customPassword } = body
    if (!name || !email) return errorResponse('Name and email are required')
    const existing = await prisma.employee.findUnique({ where: { email } })
    if (existing) return errorResponse('Email already exists')

    const maxEmployee = await prisma.employee.findFirst({
      orderBy: { employeeId: 'desc' },
      select: { employeeId: true },
    })
    let nextNum = 1
    if (maxEmployee) {
      const match = maxEmployee.employeeId.match(/MSC-SE-(\d+)/)
      if (match) nextNum = parseInt(match[1]) + 1
    }
    const employeeId = `MSC-SE-${String(nextNum).padStart(3, '0')}`
    const referralLinkCode = generateReferralCode(name) + '-' + Math.random().toString(36).slice(2, 6)
    const plainPassword = customPassword || generatePassword()
    const passwordHash = await hashPassword(plainPassword)
    const employee = await prisma.employee.create({
      data: { employeeId, name, email, mobile, territory, passwordHash, referralLinkCode },
    })
    return successResponse({
      ...employee,
      plainPassword,
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create employee', 500)
  }
}
