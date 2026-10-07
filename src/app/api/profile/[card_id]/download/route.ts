import { NextRequest } from 'next/server'
import JSZip from 'jszip'
import { prisma } from '@/lib/db'
import { errorResponse } from '@/lib/api-response'
import { resolveFileBuffer, mimeToExt, sanitizeDownloadName } from '@/lib/file-store'
import { buildPublicGallery, buildPublicDocuments } from '@/lib/public-profile'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

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

async function addFileToFolder(zip: JSZip, folderName: string, url: string, baseName: string, taken: Set<string>): Promise<number> {
  const resolved = await resolveFileBuffer(url)
  if (!resolved) return 0
  const ext = mimeToExt(resolved.mime)
  const name = uniqueName(taken, baseName, ext)
  zip.folder(folderName)?.file(name, resolved.buffer)
  return 1
}

export async function GET(request: NextRequest, { params }: { params: { card_id: string } }) {
  try {
    const card = await prisma.card.findUnique({ where: { cardId: params.card_id } })
    if (!card) return errorResponse('Card not found', 404)

    const customer = await prisma.customer.findUnique({ where: { cardId: card.id } })
    if (!customer) return errorResponse('Profile not found', 404)

    const type = request.nextUrl.searchParams.get('type') || 'all'
    if (!['all', 'photos', 'documents'].includes(type)) {
      return errorResponse('Unsupported download type', 400)
    }

    const includePhotos = type === 'all' || type === 'photos'
    const includeDocuments = type === 'all' || type === 'documents'
    const includeProfile = type === 'all'

    const zip = new JSZip()
    const taken = new Set<string>()
    let added = 0

    if (includePhotos) {
      const gallery = buildPublicGallery(customer)
      for (let i = 0; i < gallery.length; i++) {
        added += await addFileToFolder(zip, 'photos', gallery[i].url, `photo-${String(i + 1).padStart(2, '0')}`, taken)
      }
    }

    if (includeProfile) {
      if (customer.logoUrl) {
        added += await addFileToFolder(zip, 'logos', customer.logoUrl, 'logo', taken)
      }
      const userPhotos = JSON.parse(customer.photos || '[]')
      if (userPhotos.length > 0) {
        added += await addFileToFolder(zip, 'profile-picture', userPhotos[0], 'profile-picture', taken)
      }
    }

    if (includeDocuments) {
      const documents = buildPublicDocuments(customer)
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i]
        const resolved = await resolveFileBuffer(doc.url)
        if (!resolved) continue
        const base = sanitizeDownloadName(doc.name, 'pdf').replace(/\.pdf$/i, '')
        const name = uniqueName(taken, base, 'pdf')
        zip.folder('documents')?.file(name, resolved.buffer)
        added++
      }
    }

    if (includeProfile) {
      let socialLinks: Record<string, string> = {}
      try { socialLinks = JSON.parse(customer.socialLinks || '{}') } catch { socialLinks = {} }

      const primaryNumber = customer.mobile || customer.whatsapp || ''

      const vcard = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${customer.name.split(' ').slice(1).join(' ') || ''};${customer.name.split(' ')[0] || ''};;;`,
        `FN:${customer.name}`,
        `NICKNAME:${customer.name}`,
        customer.company ? `ORG:${customer.company}${customer.college ? `;${customer.college}` : ''}` : customer.college ? `ORG:${customer.college}` : '',
        customer.designation ? `TITLE:${customer.designation}` : '',
        primaryNumber ? `TEL;TYPE=CELL,PREF:${primaryNumber}` : '',
        customer.mobile && customer.whatsapp && customer.mobile !== customer.whatsapp ? `TEL;TYPE=CELL:${customer.whatsapp}` : '',
        customer.email ? `EMAIL;TYPE=WORK,INTERNET:${customer.email}` : '',
        customer.website ? `URL:${customer.website}` : '',
        [customer.address, customer.taluk, customer.city, customer.state, customer.pincode].filter(Boolean).length ? `ADR;TYPE=WORK:;;${[customer.address, customer.taluk, customer.city, customer.state, customer.pincode].filter(Boolean).join(', ')};;;;` : '',
        customer.description ? `NOTE:${customer.description}` : '',
        socialLinks.instagram ? `X-INSTAGRAM:${socialLinks.instagram}` : '',
        socialLinks.facebook ? `X-FACEBOOK:${socialLinks.facebook}` : '',
        socialLinks.linkedin ? `X-LINKEDIN:${socialLinks.linkedin}` : '',
        socialLinks.twitter ? `X-TWITTER:${socialLinks.twitter}` : '',
        socialLinks.youtube ? `X-YOUTUBE:${socialLinks.youtube}` : '',
        'END:VCARD',
      ].filter(Boolean).join('\r\n')

      zip.folder('contact')?.file('contact.vcf', vcard)
      added++
    }

    if (added === 0) {
      return errorResponse(
        type === 'photos' ? 'No published photos to download' : type === 'documents' ? 'No published documents to download' : 'Nothing to download for this profile',
        404
      )
    }

    const content = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' })
    const safeName = sanitizeDownloadName(customer.name || 'profile', 'zip').replace(/\.zip$/i, '')
    const filename = `${safeName}-MySmartCard.zip`

    return new Response(content as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': content.byteLength.toString(),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Download failed', 500)
  }
}
