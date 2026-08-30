import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { comparePassword, signToken } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const { employeeId, password } = await request.json()
    if (!employeeId || !password) return errorResponse('Employee ID and password are required')

    const employee = await prisma.employee.findUnique({ where: { employeeId } })
    if (!employee) return errorResponse('Invalid credentials')

    const valid = await comparePassword(password, employee.passwordHash)
    if (!valid) return errorResponse('Invalid credentials')
    if (employee.status !== 'active') return errorResponse('Account is inactive')

    const token = await signToken({ id: employee.id, role: 'employee' })
    return successResponse({ token, employee: { id: employee.id, employeeId: employee.employeeId, name: employee.name } })
  } catch (err: any) {
    return errorResponse(err.message || 'Login failed', 500)
  }
}