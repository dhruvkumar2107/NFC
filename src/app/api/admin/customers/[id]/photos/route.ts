import { NextRequest } from 'next/server'
import JSZip from 'jszip'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { errorResponse } from '@/lib/api-response'
import { resolveFileBuffer, mimeToExt, sanitizeDownloadName } from '@/lib/file-store'
import { AdminPhotoEntry, parseJsonArray } from '@/lib/profile-media'

function uniqueName(taken: Set<string>, base: string, ext: string): string {
  let candidate = `${base}.${ext}`
  let counter = 2
  while (taken.has(candidate.toLowerCase())) {
    candidate = `${base}-${counter}.${ext}`
    counter++
  }
  taken.add(candidate.toLowerCase())
  return candidate
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireAuth(request, 'admin')
    if (error) return error

    const customer = await prisma.customer.findUnique({ where: { id: params.id } })
    if (!customer) {
      return Response.json({ success: false, error: 'Customer not found' }, { status: 404 })
    }

    const userPhotos = parseJsonArray<string>(customer.photos).filter((p) => typeof p === 'string' && p)
    const adminPhotos = parseJsonArray<AdminPhotoEntry>(customer.adminPhotos)
      .filter((p) => p && typeof p.url === 'string' && p.url)
      .map((p) => p.url)

    const url = new URL(request.url)
    const indexParam = url.searchParams.get('index')
    const downloadAll = url.searchParams.get('all') === 'true'
    const source = url.searchParams.get('source') || 'user'
    const wantsZip = url.searchParams.get('zip') === '1' || url.searchParams.get('zip') === 'true'

    const photos =
      source === 'admin' ? adminPhotos : source === 'all' ? [...userPhotos, ...adminPhotos] : userPhotos

    if (downloadAll && wantsZip) {
      if (photos.length === 0) return errorResponse('No photos to download', 404)
      const zip = new JSZip()
      const folder = zip.folder('photos')
      const taken = new Set<string>()
      let added = 0
      for (let i = 0; i < photos.length; i++) {
        const photoData = await resolveFileBuffer(photos[i])
        if (!photoData) continue
        const name = uniqueName(taken, `photo-${String(i + 1).padStart(2, '0')}`, mimeToExt(photoData.mime))
        folder?.file(name, photoData.buffer)
        added++
      }
      if (added === 0) return errorResponse('Photos could not be read', 404)
      const content = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' })
      const base = sanitizeDownloadName(customer.name || 'customer', 'zip').replace(/\.[^.]+$/, '')
      return new Response(new Uint8Array(content), {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${base}-photos.zip"`,
          'Content-Length': content.byteLength.toString(),
          'X-Content-Type-Options': 'nosniff',
        },
      })
    }

    if (downloadAll) {
      const results: { index: number; filename: string; success: boolean }[] = []
      for (let i = 0; i < photos.length; i++) {
        const photoData = await resolveFileBuffer(photos[i])
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
      const logoData = await resolveFileBuffer(customer.logoUrl)
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

    const photoData = await resolveFileBuffer(photos[index])
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
