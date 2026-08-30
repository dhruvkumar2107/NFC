import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error
    const designs = await prisma.cardDesign.findMany({ orderBy: { createdAt: 'desc' } })
    return successResponse(designs)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch designs', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error
    const body = await request.json()
    if (!body.name || !body.price) return errorResponse('Name and price are required')
    if (typeof body.price !== 'number' || body.price <= 0) return errorResponse('Price must be a positive number')
    const design = await prisma.cardDesign.create({
      data: {
        name: body.name,
        price: body.price,
        imageUrl: body.imageUrl || null,
        active: body.active ?? true,
      },
    })
    return successResponse(design)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create design', 500)
  }
}
