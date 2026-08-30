import { prisma } from '@/lib/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

async function getData(code: string) {
  try {
    const employee = await prisma.employee.findFirst({
      where: { referralLinkCode: code, status: 'active' },
      select: { employeeId: true, referralLinkCode: true, territory: true },
    })
    if (!employee) return null

    const designs = await prisma.cardDesign.findMany({
      where: { active: true },
      orderBy: { price: 'asc' },
      select: { id: true, name: true, price: true, imageUrl: true },
    })

    return { employee, designs }
  } catch {
    return null
  }
}

export default async function PayReferralPage({ params }: { params: { link_code: string } }) {
  const data = await getData(params.link_code)
  if (!data) notFound()

  const { employee, designs } = data

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(0,0,0,0.1),transparent_50%)]" />

      <div className="w-full max-w-md relative z-10 animate-scale-in">
        <div className="glass-strong rounded-3xl overflow-hidden shadow-2xl shadow-black/10 text-center">
          {/* Header */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-800 p-10 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
            <div className="relative z-10">
              <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold mx-auto mb-5 ring-4 ring-white/15 shadow-xl">
                M
              </div>
              <h1 className="text-2xl font-bold">MySmartCard</h1>
              <p className="text-primary-100 mt-1 text-sm">Premium NFC Smart Card</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-7">
            {/* Design List */}
            <div className="space-y-2.5 mb-7">
              {designs.map((d, i) => (
                <div key={d.id} className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 ${
                  i === 1
                    ? 'glass ring-1 ring-primary-200/50 shadow-md shadow-primary-500/5'
                    : 'glass-subtle hover:shadow-sm'
                }`}>
                  <div className="flex items-center gap-3">
                    {d.imageUrl && (
                      <div className="w-16 h-10 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                        <img src={d.imageUrl} alt={d.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <p className="font-semibold text-sm text-gray-900">{d.name}</p>
                  </div>
                  <p className="font-bold text-gray-900">₹{d.price.toLocaleString()}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link
              href={`/order?referral=${employee.referralLinkCode}&via=link`}
              className="btn-primary w-full text-center block text-lg py-4 rounded-2xl"
            >
              Buy Your MySmartCard
            </Link>

            <p className="text-xs text-gray-400 mt-5 leading-relaxed">
              Order your MySmartCard today and get it delivered to your doorstep.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-white/40 mt-5 font-medium tracking-wide">
          Powered by MySmartCard.net
        </p>
      </div>
    </div>
  )
}
