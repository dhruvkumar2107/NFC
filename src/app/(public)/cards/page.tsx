import Link from 'next/link'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const featureSets: Record<string, string[]> = {
  'Premium PVC': ['NFC Chip Embedded', 'Full Color Print', 'Standard Credit Card Size', 'Lightweight & Durable'],
  'Black Matte': ['NFC Chip Embedded', 'Matte Black Finish', 'Spot UV Details', 'Premium Feel'],
  'Metal': ['NFC Chip Embedded', 'Brushed Steel', 'Laser Engraved', 'Ultra Premium'],
}
const defaultFeatures = ['NFC Chip Embedded', 'Customizable Profile', 'QR Code Payment', 'Digital Business Card']

const colorMap: Record<string, string> = {
  'Premium PVC': 'bg-white border-2 border-gray-200',
  'Black Matte': 'bg-gray-900 text-white',
  'Metal': 'bg-gradient-to-br from-gray-300 to-gray-500 text-gray-900',
}
const defaultColor = 'bg-primary-50 border-2 border-primary-200'

export default async function CardsPage() {
  let designs: any[] = []
  try {
    designs = await prisma.cardDesign.findMany({
      where: { active: true },
      orderBy: { price: 'asc' },
    })
  } catch {
    designs = []
  }

  return (
    <div className="py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Card Designs</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Choose from our range of premium NFC-enabled smart cards. Each card comes with a unique digital profile and payment QR.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {designs.map((d, i) => (
            <div key={d.id} className={`card relative ${i === 1 ? 'ring-2 ring-primary-600' : ''}`}>
              {i === 1 && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-semibold">Most Popular</span>}
              <div className={`h-48 rounded-lg mb-6 flex items-center justify-center ${colorMap[d.name] || defaultColor}`}>
                <div className="text-center">
                  <div className="text-2xl font-bold">MySmartCard</div>
                  <div className="text-sm opacity-75 mt-1">{d.name}</div>
                </div>
              </div>
              <h2 className="text-xl font-bold mb-2">{d.name}</h2>
              <div className="text-2xl font-bold text-primary-600 mb-3">₹{d.price}</div>
              <ul className="text-sm text-gray-600 space-y-2 mb-6">
                {(featureSets[d.name] || defaultFeatures).map((f) => <li key={f} className="flex items-center gap-2"><span className="text-green-500">✓</span> {f}</li>)}
              </ul>
              <Link href={`/order?design=${d.id}`} className="btn-primary w-full block text-center">
                Select This Design
              </Link>
            </div>
          ))}
          {designs.length === 0 && (
            <div className="col-span-3 text-center py-12 text-gray-500">
              <p className="text-lg mb-4">No card designs available at the moment.</p>
              <Link href="/order" className="text-primary-600 hover:underline">Place an order anyway →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
