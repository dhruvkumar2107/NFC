import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api-response'
import { authorizeCardAccess } from '@/lib/card-access'
import { logActivity } from '@/lib/admin-log'

export const dynamic = 'force-dynamic'

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'album'
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await authorizeCardAccess(request, params.id)
  if (error) return error
  const albums = await prisma.galleryAlbum.findMany({
    where: { config: { cardId: params.id } },
    include: { media: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { sortOrder: 'asc' },
  })
  return successResponse(albums)
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { access, error } = await authorizeCardAccess(request, params.id)
  if (error) return error

  try {
    const body = await request.json().catch(() => ({}))
    const name = String(body.name || '').trim().slice(0, 80)
    if (!name) return errorResponse('Album name is required.')

    const config = await prisma.cardBuilderConfig.upsert({
      where: { cardId: params.id },
      update: {},
      create: { cardId: params.id },
    })
    const desc = body.description ? String(body.description).slice(0, 500) : null
    let base = slugify(name)
    let slug = base
    let n = 2
    while (await prisma.galleryAlbum.findFirst({ where: { configId: config.id, slug } })) {
      slug = `${base}-${n++}`
    }
    const count = await prisma.galleryAlbum.count({ where: { configId: config.id } })
    const album = await prisma.galleryAlbum.create({
      data: { configId: config.id, name, slug, description: desc, sortOrder: count, public: body.public !== false },
    })
    await logActivity({ actorId: access!.user.id, actorRole: access!.user.role, action: 'album.create', target: album.id, metadata: { name } })
    return successResponse(album, 201)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create album', 500)
  }
}
