import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { join } from 'path'
import { readFile } from 'fs/promises'

function decodeDataUri(dataUri: string): { buffer: Buffer; mime: string } | null {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return null
  return { buffer: Buffer.from(match[2], 'base64'), mime: match[1] }
}

function mimeToExt(mime: string): string {
  if (mime === 'image/png') return 'png'
  if (mime === 'image/gif') return 'gif'
  if (mime === 'image/webp') return 'webp'
  if (mime === 'image/svg+xml') return 'svg'
  return 'jpg'
}

async function fetchPhotoBuffer(url: string): Promise<{ buffer: Buffer; mime: string } | null> {
  try {
    if (url.startsWith('data:')) {
      const decoded = decodeDataUri(url)
      if (!decoded) return null
      return { buffer: decoded.buffer, mime: decoded.mime }
    }
    if (url.startsWith('/uploads/')) {
      const filePath = join(process.cwd(), 'public', url)
      const buffer = await readFile(filePath)
      return { buffer, mime: 'image/jpeg' }
    }
    const res = await fetch(url)
    if (!res.ok) return null
    const arrayBuffer = await res.arrayBuffer()
    return { buffer: Buffer.from(arrayBuffer), mime: res.headers.get('content-type') || 'image/jpeg' }
  } catch {
    return null
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error

    const customer = await prisma.customer.findUnique({ where: { id: params.id } })
    if (!customer) {
      return Response.json({ success: false, error: 'Customer not found' }, { status: 404 })
    }

    let photos: string[] = []
    try { photos = JSON.parse(customer.photos || '[]') } catch { photos = [] }

    const url = new URL(request.url)
    const indexParam = url.searchParams.get('index')
    const downloadAll = url.searchParams.get('all') === 'true'

    if (downloadAll) {
      const results: { index: number; filename: string; success: boolean }[] = []
      for (let i = 0; i < photos.length; i++) {
        const photoData = await fetchPhotoBuffer(photos[i])
        if (photoData) {
          results.push({ index: i, filename: `photo-${i + 1}.${mimeToExt(photoData.mime)}`, success: true })
        } else {
          results.push({ index: i, filename: `photo-${i + 1}`, success: false })
        }
      }
      return Response.json({ success: true, photos: results, total: photos.length })
    }

    if (indexParam === null) {
      return Response.json({
        success: true,
        total: photos.length,
        photos: photos.map((p, i) => ({ index: i, url: p.startsWith('data:') ? '(data URI)' : p })),
      })
    }

    const index = parseInt(indexParam, 10)

    if (index === -1) {
      if (!customer.logoUrl) {
        return Response.json({ success: false, error: 'No logo found' }, { status: 404 })
      }
      const logoData = await fetchPhotoBuffer(customer.logoUrl)
      if (!logoData) {
        return Response.json({ success: false, error: 'Could not fetch logo' }, { status: 404 })
      }
      const ext = mimeToExt(logoData.mime)
      return new Response(new Uint8Array(logoData.buffer), {
        headers: {
          'Content-Type': logoData.mime,
          'Content-Disposition': `attachment; filename="logo.${ext}"`,
          'Content-Length': logoData.buffer.length.toString(),
        },
      })
    }

    if (isNaN(index) || index < 0 || index >= photos.length) {
      return Response.json({ success: false, error: 'Invalid photo index' }, { status: 400 })
    }

    const photoData = await fetchPhotoBuffer(photos[index])
    if (!photoData) {
      return Response.json({ success: false, error: 'Could not fetch photo' }, { status: 404 })
    }

    const ext = mimeToExt(photoData.mime)
    const filename = `photo-${index + 1}.${ext}`

    return new Response(new Uint8Array(photoData.buffer), {
      headers: {
        'Content-Type': photoData.mime,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': photoData.buffer.length.toString(),
      },
    })
  } catch (err: any) {
    return Response.json({ success: false, error: err.message || 'Download failed' }, { status: 500 })
  }
}
