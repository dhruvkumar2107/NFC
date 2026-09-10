import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import ExcelJS from 'exceljs'

const BASE_URL = 'https://www.mysmartcard.net'

function toAbsoluteUrl(value: string): string {
  if (!value) return ''
  if (value.startsWith('/uploads/')) return `${BASE_URL}${value}`
  return value
}

function writeCell(row: ExcelJS.Row, key: string, value: string) {
  if (!value) return
  const absolute = toAbsoluteUrl(value)
  if (/^https?:\/\//i.test(absolute)) {
    const cell = row.getCell(key)
    cell.value = { text: absolute, hyperlink: absolute }
    cell.font = { color: { argb: 'FF2563EB' }, underline: true }
  }
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

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('NFC Card Data')

    sheet.columns = [
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Mobile', key: 'mobile', width: 15 },
      { header: 'WhatsApp', key: 'whatsapp', width: 15 },
      { header: 'Designation', key: 'designation', width: 20 },
      { header: 'Company', key: 'company', width: 25 },
      { header: 'Card Number', key: 'cardNumber', width: 18 },
      { header: 'NFC URL', key: 'nfcUrl', width: 50 },
      { header: 'Logo URL', key: 'logoUrl', width: 60 },
      { header: 'Photo 1', key: 'photo1', width: 60 },
      { header: 'Photo 2', key: 'photo2', width: 60 },
      { header: 'Photo 3', key: 'photo3', width: 60 },
      { header: 'Taluk', key: 'taluk', width: 20 },
    ]

    const headerRow = sheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' }

    for (const order of orders) {
      const c = order.customer
      if (!c) continue

      const nfcCardNumber = order.card?.nfcCardNumber || ''
      const nfcUrl = nfcCardNumber ? `${BASE_URL}/card/${nfcCardNumber}` : ''

      let photos: string[] = []
      try { photos = JSON.parse(c.photos || '[]') } catch { photos = [] }

      const row = sheet.addRow({
        name: c.name || '',
        email: c.email || '',
        mobile: c.mobile || '',
        whatsapp: c.whatsapp || '',
        designation: c.designation || '',
        company: c.company || '',
        cardNumber: nfcCardNumber,
        nfcUrl: nfcUrl,
        logoUrl: c.logoUrl || '',
        photo1: photos[0] || '',
        photo2: photos[1] || '',
        photo3: photos[2] || '',
        taluk: c.taluk || '',
      })

      if (nfcUrl) {
        const urlCell = row.getCell('nfcUrl')
        urlCell.value = { text: nfcUrl, hyperlink: nfcUrl }
        urlCell.font = { color: { argb: 'FF2563EB' }, underline: true }
      }

      writeCell(row, 'logoUrl', c.logoUrl || '')
      writeCell(row, 'photo1', photos[0] || '')
      writeCell(row, 'photo2', photos[1] || '')
      writeCell(row, 'photo3', photos[2] || '')
    }

    const buffer = await workbook.xlsx.writeBuffer()

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="nfc-card-data-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Failed to generate Excel' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
