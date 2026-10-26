import PDFDocument from 'pdfkit'
import QRCode from 'qrcode'
import { existsSync } from 'fs'
import { join } from 'path'
import {
  resolveFileBuffer,
  isEmbeddableImage,
  formatFileSize,
} from '../file-store'
import { formatInr } from '../emi'
import { businessName, PublicCardData } from '../public-card-data'
import { normalizeUrl } from '../vcard'

type Doc = PDFKit.PDFDocument

const PAGE = { width: 595.28, height: 841.89 }
const MARGIN = { left: 50, right: 50, top: 56, bottom: 64 }
const CONTENT_WIDTH = PAGE.width - MARGIN.left - MARGIN.right

interface Palette {
  primary: string
  secondary: string
  text: string
  muted: string
  border: string
  light: string
}

interface Ctx {
  doc: Doc
  y: number
  top: number
  bottomLimit: number
  palette: Palette
  fontBody: string
  fontBold: string
  toc: { title: string; page: number }[]
  paymentQr: Buffer | null
}
function resolveFontPath(names: string[]): string | null {
  for (const name of names) {
    const candidate = join(process.cwd(), 'public', 'fonts', name)
    if (existsSync(candidate)) return candidate
  }
  return null
}

function hex(color: string, fallback: string): string {
  return typeof color === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(color) ? color : fallback
}

async function qrPng(text: string, width = 256): Promise<Buffer | null> {
  try {
    if (!text) return null
    return await QRCode.toBuffer(text, { type: 'png', margin: 1, width, errorCorrectionLevel: 'M' })
  } catch {
    return null
  }
}

interface FetchedImage {
  buffer: Buffer
  mime: string
}

async function fetchEmbeddable(url?: string | null): Promise<FetchedImage | null> {
  if (!url) return null
  try {
    const resolved = await resolveFileBuffer(url)
    if (!resolved) return null
    if (!isEmbeddableImage(resolved.mime)) return null
    return resolved
  } catch {
    return null
  }
}

/* --------------------------- drawing primitives --------------------------- */

function measure(ctx: Ctx, text: string, width: number, size: number, bold: boolean): number {
  ctx.doc.font(bold ? ctx.fontBold : ctx.fontBody).fontSize(size)
  return ctx.doc.heightOfString(text, { width })
}

function ensureSpace(ctx: Ctx, height: number): void {
  if (ctx.y + height > ctx.bottomLimit) {
    ctx.doc.addPage()
    ctx.y = ctx.top
  }
}

interface DrawOptions {  size?: number
  bold?: boolean
  color?: string
  width?: number
  x?: number
  gap?: number
  align?: 'left' | 'center' | 'right' | 'justify'
  link?: string
}

function drawText(ctx: Ctx, text: string, opts: DrawOptions = {}): void {
  if (!text) return
  const size = opts.size ?? 10
  const bold = opts.bold ?? false
  const color = opts.color ?? ctx.palette.text
  const width = opts.width ?? CONTENT_WIDTH
  const x = opts.x ?? MARGIN.left
  const gap = opts.gap ?? 5
  const align = opts.align ?? 'left'

  const height = measure(ctx, text, width, size, bold)
  ensureSpace(ctx, height)
  ctx.doc.font(bold ? ctx.fontBold : ctx.fontBody).fontSize(size).fillColor(color)
  ctx.doc.text(text, x, ctx.y, { width, align, lineGap: 1.5 })
  if (opts.link) ctx.doc.link(x, ctx.y, width, height, opts.link)
  ctx.y += height + gap
}

function sectionHeading(ctx: Ctx, title: string): void {
  const h = 34
  ensureSpace(ctx, h)
  ctx.doc.rect(MARGIN.left, ctx.y + 3, 4, 16).fill(ctx.palette.primary)
  ctx.doc.font(ctx.fontBold).fontSize(15).fillColor(ctx.palette.text)
    .text(title, MARGIN.left + 12, ctx.y, { width: CONTENT_WIDTH - 12 })
  ctx.toc.push({ title, page: ctx.doc.bufferedPageRange().count })
  ctx.y += 24
  ctx.doc.moveTo(MARGIN.left, ctx.y).lineTo(PAGE.width - MARGIN.right, ctx.y).lineWidth(0.7).strokeColor(ctx.palette.border).stroke()
  ctx.y += 12
}

function subHeading(ctx: Ctx, title: string): void {
  ensureSpace(ctx, 24)
  ctx.doc.font(ctx.fontBold).fontSize(11.5).fillColor(ctx.palette.primary).text(title, MARGIN.left, ctx.y, { width: CONTENT_WIDTH })
  ctx.y = ctx.doc.y + 5
}

function divider(ctx: Ctx): void {
  ensureSpace(ctx, 14)
  ctx.y += 4
  ctx.doc.moveTo(MARGIN.left, ctx.y).lineTo(PAGE.width - MARGIN.right, ctx.y).lineWidth(0.5).strokeColor(ctx.palette.border).stroke()
  ctx.y += 10
}

function infoRow(ctx: Ctx, label: string, value: string | null | undefined, link?: string): void {
  if (!value) return
  const h = 30
  ensureSpace(ctx, h)
  ctx.doc.font(ctx.fontBold).fontSize(7.5).fillColor(ctx.palette.muted).text(label.toUpperCase(), MARGIN.left, ctx.y, { width: CONTENT_WIDTH, characterSpacing: 0.4 })
  ctx.y = ctx.doc.y + 1
  const textHeight = measure(ctx, value, CONTENT_WIDTH, 10.5, false)
  ctx.doc.font(ctx.fontBody).fontSize(10.5).fillColor(link ? ctx.palette.primary : ctx.palette.text).text(value, MARGIN.left, ctx.y, { width: CONTENT_WIDTH })
  if (link) ctx.doc.link(MARGIN.left, ctx.y, Math.min(CONTENT_WIDTH, ctx.doc.widthOfString(value) + 2), textHeight, link)
  ctx.y += textHeight + 7
}

function linkRow(ctx: Ctx, label: string, url: string): void {
  if (!url) return
  const text = `${label}  →`
  const h = measure(ctx, text, CONTENT_WIDTH, 10.5, false)
  ensureSpace(ctx, h + 6)
  ctx.doc.font(ctx.fontBody).fontSize(10.5).fillColor(ctx.palette.primary)
  ctx.doc.text(text, MARGIN.left, ctx.y, { width: CONTENT_WIDTH, underline: false })
  ctx.doc.link(MARGIN.left, ctx.y, Math.min(CONTENT_WIDTH, ctx.doc.widthOfString(text) + 2), h, url)
  ctx.y += h + 6
}

function bulletList(ctx: Ctx, text: string): void {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  for (const line of lines) {
    const h = measure(ctx, `•  ${line}`, CONTENT_WIDTH - 10, 10, false)
    ensureSpace(ctx, h + 3)
    ctx.doc.font(ctx.fontBody).fontSize(10).fillColor(ctx.palette.text)
      .text('•', MARGIN.left, ctx.y, { width: 12 })
    ctx.doc.text(line, MARGIN.left + 14, ctx.y, { width: CONTENT_WIDTH - 14 })
    ctx.y += h + 3
  }
  ctx.y += 3
}

/* ------------------------------- the builder ------------------------------- */

export async function buildBusinessProfilePdf(data: PublicCardData): Promise<Buffer> {
  const { customer, builder } = data
  const name = businessName(customer)
  const social = safeSocial(data)
  const theme = builder?.theme
  const palette: Palette = {
    primary: hex(theme?.primary || '#4c6ef5', '#4c6ef5'),
    secondary: hex(theme?.secondary || '#3b5bdb', '#3b5bdb'),
    text: '#111827',
    muted: '#6b7280',
    border: '#e5e7eb',
    light: '#f3f4f6',
  }

  const regularPath = resolveFontPath(['NotoSans-Regular.ttf'])
  const boldPath = resolveFontPath(['NotoSans-Bold.ttf'])
  const fontBody = regularPath ? 'Body' : 'Helvetica'
  const fontBold = boldPath ? 'Body-Bold' : 'Helvetica-Bold'

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: MARGIN.top, bottom: MARGIN.bottom, left: MARGIN.left, right: MARGIN.right },
    bufferPages: true,
    info: {
      Title: `${customer.name} — Business Profile`,
      Author: customer.company || customer.name,
      Subject: 'Digital business profile generated by MySmartCard.net',
      Creator: 'MySmartCard.net',
    },
  })

  if (regularPath) doc.registerFont('Body', regularPath)
  if (boldPath) doc.registerFont('Body-Bold', boldPath)

  const ctx: Ctx = {
    doc,
    y: MARGIN.top,
    top: MARGIN.top,
    bottomLimit: PAGE.height - MARGIN.bottom,
    palette,
    fontBody,
    fontBold,
    toc: [],
    paymentQr: null,
  }

  // Prefetch images and QR codes (in parallel) before laying out the document.
  const [logo, profilePhoto, profileQr, paymentQr, galleryImages] = await Promise.all([
    fetchEmbeddable(customer.logoUrl),
    fetchEmbeddable(firstPhoto(data.customer.photos)),
    qrPng(data.profileUrl, 300),
    buildPaymentQr(data),
    Promise.all(galleryAssetsLimited(data, 9).map(async (a) => ({ asset: a, image: await fetchEmbeddable(a.url) }))),
  ])
  ctx.paymentQr = paymentQr

  /* ------------------------------ cover page ------------------------------ */
  doc.rect(0, 0, PAGE.width, 210).fill(palette.primary)
  doc.rect(0, 210, PAGE.width, 6).fill(palette.secondary)

  doc.font(fontBold).fontSize(11).fillColor('#ffffff').fillOpacity(1)
  doc.text('DIGITAL BUSINESS PROFILE', MARGIN.left, 44, { characterSpacing: 1.5 })

  const avatar = profilePhoto || logo
  const coverTextX = avatar ? MARGIN.left + 96 : MARGIN.left
  const coverTextWidth = CONTENT_WIDTH - (avatar ? 96 : 130)
  if (avatar) {
    try {
      doc.save()
      doc.circle(MARGIN.left + 40, 118, 38).clip()
      doc.image(avatar.buffer, MARGIN.left + 2, 80, { fit: [76, 76], align: 'center', valign: 'center' })
      doc.restore()
      doc.circle(MARGIN.left + 40, 118, 38).lineWidth(3).strokeColor('#ffffff').stroke()
    } catch {
      // skip broken image
    }
  }
  doc.font(fontBold).fontSize(24).fillColor('#ffffff').text(customer.name || 'Business', coverTextX, 86, { width: coverTextWidth })
  const nameBottom = doc.y
  const sub = [customer.designation, customer.company || customer.college].filter(Boolean).join('  ·  ')
  if (sub) doc.font(fontBody).fontSize(11.5).fillColor('#eef2ff').text(sub, coverTextX, nameBottom + 6, { width: coverTextWidth })

  ctx.y = 250
  const tagline = customer.description?.split('\n')[0]?.slice(0, 160)
  if (tagline) drawText(ctx, tagline, { size: 12, color: palette.muted, gap: 10 })

  if (profileQr) {
    try {
      const qrX = PAGE.width - MARGIN.right - 104
      const qrY = 236
      doc.rect(qrX - 8, qrY - 8, 120, 138).fill(palette.light)
      doc.image(profileQr, qrX, qrY, { fit: [104, 104] })
      doc.font(fontBody).fontSize(7.5).fillColor(palette.muted).text('Scan to open the digital card', qrX - 6, qrY + 106, { width: 116, align: 'center' })
    } catch {
      // ignore
    }
  }

  ctx.y = Math.max(ctx.y, 388)
  divider(ctx)

  // Contact summary
  subHeading(ctx, 'Contact')
  const primaryPhone = customer.mobile || customer.whatsapp
  infoRow(ctx, 'Mobile', primaryPhone, primaryPhone ? `tel:${primaryPhone}` : undefined)
  if (customer.whatsapp && customer.whatsapp !== customer.mobile) {
    const wa = customer.whatsapp.replace(/[^0-9]/g, '')
    infoRow(ctx, 'WhatsApp', customer.whatsapp, `https://wa.me/${wa}`)
  }
  if (customer.email) infoRow(ctx, 'Email', customer.email, `mailto:${customer.email}`)
  if (customer.website) infoRow(ctx, 'Website', customer.website, normalizeUrl(customer.website))
  const address = [customer.address, customer.taluk, customer.city, customer.state, customer.pincode, customer.country]
    .filter(Boolean)
    .join(', ')
  if (address) {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    infoRow(ctx, 'Address', address, mapsUrl)
  }
  if (data.profileUrl) infoRow(ctx, 'Digital Card', data.profileUrl, data.profileUrl)

  /* ---------------------------- table of contents --------------------------- */
  const sections: { title: string; render: () => void }[] = []
  buildSections(sections, ctx, data, social, galleryImages)
  ctx.toc = []

  const wantsToc = sections.length >= 4
  let tocPageIndex = -1
  if (wantsToc) {
    doc.addPage()
    tocPageIndex = doc.bufferedPageRange().count - 1
    ctx.y = ctx.top
    doc.font(fontBold).fontSize(17).fillColor(palette.text).text('Contents', MARGIN.left, 70)
    ctx.y = 108
  }

  // Content starts on a fresh page when a table of contents is present.
  if (wantsToc) {
    doc.addPage()
    ctx.y = ctx.top
  }

  for (const section of sections) {
    section.render()
  }

  /* ------------------------------ fill the TOC ------------------------------ */
  if (wantsToc && tocPageIndex >= 0) {
    const totalPages = doc.bufferedPageRange().count
    const tocEntries = ctx.toc.map((entry) => ({
      title: entry.title,
      // pageNumber was captured relative to the whole document
      page: entry.page,
    }))
    doc.switchToPage(tocPageIndex)
    let ty = 116
    doc.font(fontBody).fontSize(11)
    for (const entry of tocEntries) {
      if (ty > PAGE.height - MARGIN.bottom) break
      doc.fillColor(palette.text).text(entry.title, MARGIN.left, ty, { width: CONTENT_WIDTH - 60 })
      doc.fillColor(palette.muted).text(String(entry.page), PAGE.width - MARGIN.right - 40, ty, { width: 40, align: 'right' })
      doc.moveTo(MARGIN.left, ty + 16).lineTo(PAGE.width - MARGIN.right, ty + 16).lineWidth(0.4).dash(1, { space: 3 }).strokeColor(palette.border).stroke().undash()
      ty += 24
    }
    doc.font(fontBody).fontSize(9).fillColor(palette.muted).text(`Generated ${formatDate()} · ${totalPages} pages`, MARGIN.left, ty + 10, { width: CONTENT_WIDTH })
  }

  /* ------------------------------- footers --------------------------------- */
  const range = doc.bufferedPageRange()
  const totalPages = range.count
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i)
    const savedBottom = doc.page.margins.bottom
    doc.page.margins.bottom = 0
    const fy = PAGE.height - 42
    doc.moveTo(MARGIN.left, fy).lineTo(PAGE.width - MARGIN.right, fy).lineWidth(0.5).strokeColor(palette.border).stroke()
    doc.font(fontBody).fontSize(8).fillColor(palette.muted)
    doc.text(`${name} · MySmartCard.net`, MARGIN.left, fy + 6, { width: CONTENT_WIDTH - 80 })
    doc.text(`Page ${i - range.start + 1} of ${totalPages}`, PAGE.width - MARGIN.right - 80, fy + 6, { width: 80, align: 'right' })
    doc.page.margins.bottom = savedBottom
  }

  return await finalize(doc)
}

/* ------------------------------- section list ------------------------------ */

function buildSections(
  sections: { title: string; render: () => void }[],
  ctx: Ctx,
  data: PublicCardData,
  social: Record<string, string>,
  galleryImages: { asset: { url: string; filename: string; label: string }; image: FetchedImage | null }[]
): void {
  const { customer, builder } = data
  const fields = builder?.sections.fields || {}
  const titles = builder?.sections.titles || {}
  const enabled = builder?.sections.enabled || {}

  if (social && Object.keys(social).filter((k) => social[k]).length) {
    sections.push({
      title: 'Social Media',
      render: () => {
        sectionHeading(ctx, 'Social Media')
        for (const [platform, url] of Object.entries(social)) {
          if (!url) continue
          linkRow(ctx, platformLabel(platform), normalizeUrl(url, platform))
        }
        ctx.y += 6
      },
    })
  }

  const about = fields.about || customer.description
  if (about) {
    sections.push({
      title: titles.about || 'About',
      render: () => {
        sectionHeading(ctx, titles.about || 'About the Business')
        drawText(ctx, about, { size: 10.5, gap: 10 })
      },
    })
  }

  if (fields.hours) {
    sections.push({
      title: titles.hours || 'Business Hours',
      render: () => {
        sectionHeading(ctx, titles.hours || 'Business Hours')
        bulletList(ctx, fields.hours)
      },
    })
  }

  if (builder?.sections.offers?.length) {
    const offers = builder.sections.offers.filter((o) => o.active !== false && o.title)
    if (offers.length) {
      sections.push({
        title: titles.offers || 'Offers',
        render: () => {
          sectionHeading(ctx, titles.offers || 'Offers & Promotions')
          for (const offer of offers) {
            subHeading(ctx, offer.title)
            if (offer.body) drawText(ctx, offer.body, { size: 10, color: ctx.palette.muted, gap: 8 })
          }
        },
      })
    }
  }

  if (builder?.products?.length) {
    sections.push({
      title: builder.sections.titles.products || 'Products & Services',
      render: () => renderProducts(ctx, data),
    })
  }

  const pricedCatalogues = data.catalogues.filter((c) => c.kind === 'price_list')
  if (pricedCatalogues.length) {
    sections.push({
      title: titles.priceList || 'Price List',
      render: () => {
        sectionHeading(ctx, titles.priceList || 'Price List')
        for (const c of pricedCatalogues) {
          linkRow(ctx, c.title, `${data.baseUrl}/api/public/${data.card.cardId}/catalogue/${c.id}`)
        }
      },
    })
  }

  const docCatalogues = data.catalogues.filter((c) => c.kind !== 'price_list')
  if (docCatalogues.length) {
    sections.push({
      title: titles.catalogues || 'Catalogues & Brochures',
      render: () => {
        sectionHeading(ctx, titles.catalogues || 'Catalogues & Brochures')
        for (const c of docCatalogues) {
          linkRow(ctx, `${c.title} (${kindLabel(c.kind)}${c.size ? ` · ${formatFileSize(c.size)}` : ''})`, `${data.baseUrl}/api/public/${data.card.cardId}/catalogue/${c.id}`)
        }
      },
    })
  }

  const totalGallery = galleryImages.length || data.gallery.length
  if (totalGallery > 0) {
    sections.push({
      title: titles.gallery || 'Photo Gallery',
      render: () => renderGallery(ctx, data, galleryImages),
    })
  }

  if (customer.paymentQrUrl || customer.upiId) {
    sections.push({
      title: titles.payment || 'Payment',
      render: () => renderPayment(ctx, data),
    })
  }

  if (data.emi) {
    const emi = data.emi
    sections.push({
      title: titles.emi || 'EMI Calculator',
      render: () => {
        sectionHeading(ctx, titles.emi || 'EMI / Finance Calculator')
        drawText(ctx, `Indicative finance options are available on the digital card.`, { size: 10, color: ctx.palette.muted, gap: 6 })
        if (emi.configured) {
          drawText(ctx, `Rate from ${emi.defaultRate}% p.a. · Tenure ${emi.minTenure}–${emi.maxTenure} months${emi.processingFee ? ` · Processing fee ${formatInr(emi.processingFee)}` : ''}`, { size: 10, gap: 8 })
        }
        linkRow(ctx, 'Calculate EMI', `${data.profileUrl}#msc-emi`)
      },
    })
  }

  if (enabled.enquiry) {
    sections.push({
      title: titles.enquiry || 'Enquiry',
      render: () => {
        sectionHeading(ctx, titles.enquiry || 'Enquiry & Ordering')
        const wa = (customer.whatsapp || customer.mobile || '').replace(/[^0-9]/g, '')
        if (wa) linkRow(ctx, 'Contact on WhatsApp', `https://wa.me/${wa}`)
        linkRow(ctx, 'Submit an Enquiry', `${data.profileUrl}#msc-enquiry`)
      },
    })
  }

  sections.push({
    title: 'Available Downloads',
    render: () => {
      sectionHeading(ctx, 'Available Downloads')
      const rows: string[] = []
      if (data.gallery.length || data.albums.length) rows.push(`${data.gallery.length + data.albums.reduce((s, a) => s + a.photos.length, 0)} gallery photos`)
      if (data.documents.length) rows.push(`${data.documents.length} document(s)`)
      if (data.catalogues.length) rows.push(`${data.catalogues.length} catalogue / brochure / price list(s)`)
      if (customer.paymentQrUrl) rows.push('Payment QR code')
      rows.push('Complete business profile PDF (this document)')
      rows.push('Contact file (.vcf)')
      bulletList(ctx, rows.join('\n'))
      linkRow(ctx, 'Open the full download centre', data.profileUrl)
    },
  })
}

function galleryAssetsLimited(data: PublicCardData, limit: number) {
  const flat = data.gallery.slice(0, limit).map((p, i) => ({
    url: p.url,
    filename: `Photo_${i + 1}.jpg`,
    label: `Photo ${i + 1}`,
  }))
  return flat
}

function renderProducts(ctx: Ctx, data: PublicCardData): void {
  const builder = data.builder!
  const products = builder.products
  const categories = builder.categories
  sectionHeading(ctx, builder.sections.titles.products || 'Products & Services')
  drawText(ctx, `${products.length} product${products.length === 1 ? '' : 's'} published. Prices in Indian Rupees.`, { size: 9.5, color: ctx.palette.muted, gap: 8 })

  const groups: { name: string; items: typeof products }[] = []
  const uncategorized = products.filter((p) => !p.categoryId)
  if (uncategorized.length) groups.push({ name: 'General', items: uncategorized })
  for (const cat of categories) {
    const items = products.filter((p) => p.categoryId === cat.id)
    if (items.length) groups.push({ name: cat.name, items })
  }
  // Any product referencing an unknown category
  const known = new Set(groups.flatMap((g) => g.items.map((p) => p.id)))
  const leftovers = products.filter((p) => !known.has(p.id))
  if (leftovers.length) groups.push({ name: 'Other', items: leftovers })

  for (const group of groups) {
    subHeading(ctx, group.name)
    for (const product of group.items) {
      const price = product.price != null ? formatInr(product.price) : ''
      const mrp = product.mrp != null && product.price != null && product.mrp > product.price ? formatInr(product.mrp) : ''
      const header = `${product.name}${price ? `   ${price}` : ''}${mrp ? `  (MRP ${mrp})` : ''}`
      drawText(ctx, header, { size: 10.5, bold: true, gap: 3 })
      if (product.description) drawText(ctx, product.description, { size: 9.5, color: ctx.palette.muted, gap: 3 })
      const attrs = Object.entries(product.attributes || {})
      if (attrs.length) drawText(ctx, attrs.map(([k, v]) => `${k}: ${v}`).join('  ·  '), { size: 9, color: ctx.palette.muted, gap: 3 })
      const stock = product.stockStatus === 'out_of_stock' ? 'Out of stock' : product.stockStatus === 'pre_order' ? 'Pre-order' : 'In stock'
      drawText(ctx, stock, { size: 8.5, color: ctx.palette.muted, gap: 4 })
      if (data.builder?.sections.enabled.enquiry) {
        linkRow(ctx, `Enquire about ${product.name}`, `${data.profileUrl}#msc-enquiry`)
      }
      divider(ctx)
    }
  }
}

function renderGallery(
  ctx: Ctx,
  data: PublicCardData,
  images: { asset: { url: string; filename: string; label: string }; image: FetchedImage | null }[]
): void {
  const title = data.builder?.sections.titles.gallery || 'Photo Gallery'
  sectionHeading(ctx, title)
  const totalPhotos = data.gallery.length + data.albums.reduce((s, a) => s + a.photos.length, 0)
  drawText(ctx, `${totalPhotos} photo${totalPhotos === 1 ? '' : 's'} available across ${data.albums.length || 1} collection(s). Download the full gallery as a ZIP from the card.`, { size: 9.5, color: ctx.palette.muted, gap: 8 })

  for (const album of data.albums) {
    subHeading(ctx, `${album.albumName} (${album.photos.length})`)
  }

  const usable = images.filter((i) => i.image)
  if (usable.length) {
    const cols = 3
    const gap = 10
    const cellW = (CONTENT_WIDTH - gap * (cols - 1)) / cols
    const cellH = cellW * 0.75
    let col = 0
    let rowY = ctx.y
    ensureSpace(ctx, cellH + 16)
    rowY = ctx.y
    for (const item of usable) {
      const x = MARGIN.left + col * (cellW + gap)
      ctx.doc.rect(x, rowY, cellW, cellH).fill(ctx.palette.light)
      try {
        ctx.doc.image(item.image!.buffer, x, rowY, { fit: [cellW, cellH], align: 'center', valign: 'center' })
      } catch {}
      ctx.doc.link(x, rowY, cellW, cellH, data.profileUrl)
      col++
      if (col >= cols) {
        col = 0
        rowY += cellH + gap
        ctx.y = rowY
        if (rowY + cellH > ctx.bottomLimit) {
          ctx.doc.addPage()
          ctx.y = ctx.top
          rowY = ctx.y
        }
      }
    }
    ctx.y = rowY + (col ? cellH : 0) + 8
  } else {
    drawText(ctx, 'Gallery images are best viewed on the live digital card.', { size: 9.5, color: ctx.palette.muted, gap: 8 })
  }
  linkRow(ctx, 'View Photo Gallery', data.profileUrl)
}

async function buildPaymentQr(data: PublicCardData): Promise<Buffer | null> {
  if (data.customer.paymentQrUrl) {
    const resolved = await resolveFileBuffer(data.customer.paymentQrUrl)
    if (resolved && isEmbeddableImage(resolved.mime)) return resolved.buffer
  }
  if (data.customer.upiId) {
    return qrPng(`upi://pay?pa=${encodeURIComponent(data.customer.upiId)}&pn=${encodeURIComponent(data.customer.name)}`, 300)
  }
  return null
}

function renderPayment(ctx: Ctx, data: PublicCardData): void {
  sectionHeading(ctx, data.builder?.sections.titles.payment || 'Payment')
  if (ctx.paymentQr) {
    try {
      ensureSpace(ctx, 150)
      ctx.doc.image(ctx.paymentQr, MARGIN.left, ctx.y, { fit: [130, 130] })
      ctx.doc.font(ctx.fontBody).fontSize(9).fillColor(ctx.palette.muted).text('Scan to pay', MARGIN.left, ctx.y + 134, { width: 130 })
      ctx.y += 152
    } catch {}
  }
  if (data.customer.upiId) infoRow(ctx, 'UPI ID', data.customer.upiId)
}

/* --------------------------------- helpers -------------------------------- */

function safeSocial(data: PublicCardData): Record<string, string> {
  try { return JSON.parse(data.customer.socialLinks || '{}') } catch { return {} }
}

function firstPhoto(raw: string): string | null {
  try {
    const arr = JSON.parse(raw || '[]')
    return Array.isArray(arr) && typeof arr[0] === 'string' ? arr[0] : null
  } catch {
    return null
  }
}

function platformLabel(platform: string): string {
  if (!platform) return 'Link'
  return platform.charAt(0).toUpperCase() + platform.slice(1)
}

function kindLabel(kind: string): string {
  switch (kind) {
    case 'price_list': return 'Price List'
    case 'brochure': return 'Brochure'
    case 'menu': return 'Menu'
    default: return 'Catalogue'
  }
}

function formatDate(): string {
  try {
    return new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return new Date().toISOString()
  }
}

function finalize(doc: Doc): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
    doc.end()
  })
}
