import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { errorResponse } from '@/lib/api-response'

export async function GET(_request: NextRequest, { params }: { params: { card_id: string } }) {
  try {
    const card = await prisma.card.findUnique({
      where: { cardId: params.card_id },
    })
    if (!card) {
      return new Response('Card not found', { status: 404 })
    }

    const c = await prisma.customer.findUnique({
      where: { cardId: card.id },
    })
    if (!c) {
      return new Response('Customer not found', { status: 404 })
    }

    let socialLinks: Record<string, string> = {}
    try { socialLinks = JSON.parse(c.socialLinks || '{}') } catch { socialLinks = {} }

    const primaryNumber = c.mobile || c.whatsapp || ''

    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:${c.name.split(' ').slice(1).join(' ') || ''};${c.name.split(' ')[0] || ''};;;`,
      `FN:${c.name}`,
      `NICKNAME:${c.name}`,
      c.company ? `ORG:${c.company}${c.college ? `;${c.college}` : ''}` : c.college ? `ORG:${c.college}` : '',
      c.designation ? `TITLE:${c.designation}` : '',
      primaryNumber ? `TEL;TYPE=CELL,PREF:${primaryNumber}` : '',
      c.mobile && c.whatsapp && c.mobile !== c.whatsapp ? `TEL;TYPE=CELL:${c.whatsapp}` : '',
      c.email ? `EMAIL;TYPE=WORK,INTERNET:${c.email}` : '',
      c.website ? `URL:${c.website}` : '',
      [c.address, c.taluk, c.city, c.state, c.pincode].filter(Boolean).length ? `ADR;TYPE=WORK:;;${[c.address, c.taluk, c.city, c.state, c.pincode].filter(Boolean).join(', ')};;;;` : '',
      c.description ? `NOTE:${c.description}` : '',
      socialLinks.instagram ? `X-INSTAGRAM:${socialLinks.instagram}` : '',
      socialLinks.facebook ? `X-FACEBOOK:${socialLinks.facebook}` : '',
      socialLinks.linkedin ? `X-LINKEDIN:${socialLinks.linkedin}` : '',
      socialLinks.twitter ? `X-TWITTER:${socialLinks.twitter}` : '',
      socialLinks.youtube ? `X-YOUTUBE:${socialLinks.youtube}` : '',
      'END:VCARD',
    ].filter(Boolean).join('\r\n')

    const fileName = `${c.name.replace(/[^a-zA-Z0-9]/g, '_')}.vcf`

    return new Response(vcard, {
      headers: {
        'Content-Type': 'text/x-vcard; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to generate vCard', 500)
  }
}
