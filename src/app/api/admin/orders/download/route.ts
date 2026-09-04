import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, BorderStyle, ShadingType } from 'docx'
import { join } from 'path'
import { readFile } from 'fs/promises'

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    if (url.startsWith('/uploads/')) {
      const filePath = join(process.cwd(), 'public', url)
      return await readFile(filePath)
    }
    const res = await fetch(url)
    if (!res.ok) return null
    const arrayBuffer = await res.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch {
    return null
  }
}

function parseJsonArray(val: string | null | undefined): string[] {
  if (!val) return []
  try { return JSON.parse(val) } catch { return [] }
}

function parseJsonObject(val: string | null | undefined): Record<string, string> {
  if (!val) return {}
  try { return JSON.parse(val) } catch { return {} }
}

function emptyLine(): Paragraph {
  return new Paragraph({ children: [], spacing: { after: 100 } })
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24, font: 'Arial', color: '1a5276' })],
    spacing: { before: 200, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: '1a5276' } },
  })
}

function fieldRow(label: string, value: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 20, font: 'Arial', color: '555555' }),
      new TextRun({ text: value || '-', size: 20, font: 'Arial' }),
    ],
    spacing: { after: 60 },
  })
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request, 'admin')
    if (error) return error

    const body = await request.json()
    const { orderIds } = body as { orderIds?: string[] }

    const where: any = {}
    if (orderIds && orderIds.length > 0) {
      where.id = { in: orderIds }
    }
    where.status = { not: 'Cancelled' }

    const orders = await prisma.order.findMany({
      where,
      include: { customer: true, card: true, design: true },
      orderBy: { orderDate: 'desc' },
    })

    if (orders.length === 0) {
      return new Response(JSON.stringify({ error: 'No orders found' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
    }

    const sections: any[] = []

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i]
      const c = order.customer
      if (!c) continue

      const photos = parseJsonArray(c.photos)
      const socialLinks = parseJsonObject(c.socialLinks)
      const addressParts = [c.address, c.city, c.state, c.pincode].filter(Boolean)
      const fullAddress = addressParts.join(', ')

      // Fetch images
      let logoBuffer: Buffer | null = null
      if (c.logoUrl) logoBuffer = await fetchImageBuffer(c.logoUrl)

      let profileBuffer: Buffer | null = null
      if (photos[0]) profileBuffer = await fetchImageBuffer(photos[0])

      const photoBuffers: Buffer[] = []
      for (const p of photos) {
        const buf = await fetchImageBuffer(p)
        if (buf) photoBuffers.push(buf)
      }

      // Header section
      const headerChildren: (Paragraph | Table)[] = []

      if (logoBuffer || profileBuffer) {
        // Create a table for photo + info layout
        const imageCells: TableRow[] = []

        const profileImageChildren: Paragraph[] = []
        if (profileBuffer) {
          profileImageChildren.push(
            new Paragraph({
              children: [new ImageRun({
                data: profileBuffer,
                transformation: { width: 150, height: 150 },
                type: 'png',
              })],
              alignment: AlignmentType.CENTER,
            })
          )
        } else {
          profileImageChildren.push(
            new Paragraph({
              children: [new TextRun({ text: c.name?.charAt(0) || '?', bold: true, size: 48, font: 'Arial', color: 'FFFFFF' })],
              alignment: AlignmentType.CENTER,
            })
          )
        }

        const infoChildren: Paragraph[] = [
          new Paragraph({
            children: [new TextRun({ text: c.name || 'Unknown', bold: true, size: 32, font: 'Arial' })],
            spacing: { after: 80 },
          }),
        ]
        if (c.designation) infoChildren.push(fieldRow('Designation', c.designation))
        if (c.company) infoChildren.push(fieldRow('Company', c.company))
        if (c.email) infoChildren.push(fieldRow('Email', c.email))
        if (c.mobile) infoChildren.push(fieldRow('Mobile', c.mobile))
        if (c.whatsapp) infoChildren.push(fieldRow('WhatsApp', c.whatsapp))
        if (c.website) infoChildren.push(fieldRow('Website', c.website))
        if (fullAddress) infoChildren.push(fieldRow('Address', fullAddress))

        const profileRow = new TableRow({
          children: [
            new TableCell({
              children: profileImageChildren,
              width: { size: 30, type: WidthType.PERCENTAGE },
              verticalAlign: 'center',
            }),
            new TableCell({
              children: infoChildren,
              width: { size: 70, type: WidthType.PERCENTAGE },
            }),
          ],
        })

        const mainTable = new Table({
          rows: [profileRow],
          width: { size: 100, type: WidthType.PERCENTAGE },
        })

        headerChildren.push(mainTable)
      } else {
        // No images - just text
        headerChildren.push(
          new Paragraph({
            children: [new TextRun({ text: c.name || 'Unknown', bold: true, size: 32, font: 'Arial' })],
            spacing: { after: 80 },
          })
        )
        if (c.designation) headerChildren.push(fieldRow('Designation', c.designation))
        if (c.company) headerChildren.push(fieldRow('Company', c.company))
        if (c.email) headerChildren.push(fieldRow('Email', c.email))
        if (c.mobile) headerChildren.push(fieldRow('Mobile', c.mobile))
        if (c.whatsapp) headerChildren.push(fieldRow('WhatsApp', c.whatsapp))
        if (c.website) headerChildren.push(fieldRow('Website', c.website))
        if (fullAddress) headerChildren.push(fieldRow('Address', fullAddress))
      }

      sections.push(...headerChildren)

      // Social Links
      const socialEntries = Object.entries(socialLinks).filter(([, v]) => v)
      if (socialEntries.length > 0) {
        sections.push(sectionHeading('Social Links'))
        for (const [platform, url] of socialEntries) {
          sections.push(fieldRow(platform.charAt(0).toUpperCase() + platform.slice(1), url as string))
        }
      }

      // Description
      if (c.description) {
        sections.push(sectionHeading('About'))
        sections.push(new Paragraph({
          children: [new TextRun({ text: c.description, size: 20, font: 'Arial' })],
          spacing: { after: 100 },
        }))
      }

      // Card & Order Info
      sections.push(sectionHeading('Card Details'))
      if (order.card) sections.push(fieldRow('Card ID', order.card.cardId))
      sections.push(fieldRow('Card Design', order.design?.name || '-'))
      sections.push(fieldRow('Order ID', order.orderId))
      sections.push(fieldRow('Amount', `₹${order.amount}`))
      sections.push(fieldRow('Order Date', new Date(order.orderDate).toLocaleDateString('en-IN')))

      // Additional Photos
      if (photoBuffers.length > 0) {
        sections.push(sectionHeading('Photos'))
        const photoRowCells: TableRow[] = []
        const photoRowParagraphs: Paragraph[] = []
        for (const buf of photoBuffers) {
          photoRowParagraphs.push(
            new Paragraph({
              children: [new ImageRun({
                data: buf,
                transformation: { width: 180, height: 180 },
                type: 'png',
              })],
              alignment: AlignmentType.CENTER,
            })
          )
        }

        // Create photo grid - 3 per row
        for (let j = 0; j < photoBuffers.length; j += 3) {
          const rowCells: TableCell[] = []
          for (let k = 0; k < 3; k++) {
            const idx = j + k
            if (idx < photoBuffers.length) {
              rowCells.push(
                new TableCell({
                  children: [new Paragraph({
                    children: [new ImageRun({
                      data: photoBuffers[idx],
                      transformation: { width: 170, height: 170 },
                      type: 'png',
                    })],
                    alignment: AlignmentType.CENTER,
                  })],
                  width: { size: 33, type: WidthType.PERCENTAGE },
                })
              )
            } else {
              rowCells.push(new TableCell({ children: [emptyLine()], width: { size: 33, type: WidthType.PERCENTAGE } }))
            }
          }
          photoRowCells.push(new TableRow({ children: rowCells }))
        }

        sections.push(new Table({
          rows: photoRowCells,
          width: { size: 100, type: WidthType.PERCENTAGE },
        }))
      }

      // Add page break between customers (except last)
      if (i < orders.length - 1) {
        sections.push(new Paragraph({
          children: [new TextRun({ break: 1 })],
          pageBreakBefore: true,
        }))
      }
    }

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        children: sections,
      }],
    })

    const buffer = await Packer.toBuffer(doc)
    const uint8Array = new Uint8Array(buffer)

    return new Response(uint8Array, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="customer-data-${new Date().toISOString().slice(0, 10)}.docx"`,
      },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Failed to generate document' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
