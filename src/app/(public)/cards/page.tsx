import Link from 'next/link'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const featureSets: Record<string, string[]> = {
  'Premium PVC Card': ['NFC Chip Embedded', 'Full Color Print', 'Standard Credit Card Size', 'Lightweight & Durable'],
  'Premium Wood': ['NFC Chip Embedded', 'Natural Wood Finish', 'Laser Engraved', 'Eco-Friendly Premium'],
  'Premium Metal': ['NFC Chip Embedded', 'Brushed Steel', 'Laser Engraved', 'Ultra Premium'],
}
const defaultFeatures = ['NFC Chip Embedded', 'Customizable Profile', 'QR Code Payment', 'Digital Business Card']

const colorMap: Record<string, string> = {
  'Premium PVC Card': 'bg-white border-2 border-gray-200',
  'Premium Wood': 'bg-amber-800 text-white',
  'Premium Metal': 'bg-gradient-to-br from-gray-300 to-gray-500 text-gray-900',
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
    <div className="min-h-screen gradient-mesh">
      <div className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-5xl font-bold text-gray-900 mb-5 tracking-tight">
              Card Designs
            </h1>
            <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
              Choose from our range of premium NFC-enabled smart cards. Each card comes with a unique digital profile and payment QR.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {designs.map((d, i) => (
              <div key={d.id} className={`card group relative ${i === 1 ? 'ring-2 ring-primary-500/40 shadow-xl shadow-primary-500/10' : ''} animate-slide-up`} style={{ animationDelay: `${i * 100}ms` }}>
                {i === 1 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-xs font-semibold tracking-wide shadow-lg shadow-primary-600/30">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className={`h-52 rounded-2xl mb-8 flex items-center justify-center ${colorMap[d.name] || defaultColor} relative overflow-hidden transition-transform duration-500 group-hover:scale-[1.02]`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent" />
                  <div className="text-center relative z-10">
                    <div className="text-2xl font-bold tracking-wide">MySmartCard</div>
                    <div className="text-sm opacity-60 mt-1.5 font-medium">{d.name}</div>
                  </div>
                </div>

                <h2 className="text-xl font-bold text-gray-900 mb-2">{d.name}</h2>
                <div className="text-3xl font-bold text-primary-600 mb-5">₹{d.price}</div>

                <ul className="text-sm text-gray-500 space-y-2.5 mb-8">
                  {(featureSets[d.name] || defaultFeatures).map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link href={`/order?design=${d.id}`} className="btn-primary w-full block text-center rounded-2xl">
                  Select This Design
                </Link>
              </div>
            ))}

            {designs.length === 0 && (
              <div className="col-span-3 text-center py-16 animate-fade-in">
                <div className="card max-w-md mx-auto">
                  <p className="text-lg text-gray-600 mb-6">No card designs available at the moment.</p>
                  <Link href="/order" className="btn-glass inline-block">
                    Place an order anyway
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
