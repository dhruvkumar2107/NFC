import { prisma } from '@/lib/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

async function getData(code: string) {
  try {
    const employee = await prisma.employee.findFirst({
      where: { referralLinkCode: code, status: 'active' },
      select: { employeeId: true, name: true, referralLinkCode: true, territory: true },
    })
    if (!employee) return null

    const designs = await prisma.cardDesign.findMany({
      where: { active: true },
      orderBy: { price: 'asc' },
      select: { id: true, name: true, price: true },
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
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden text-center">
          <div className="bg-primary-600 p-8 text-white">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold mx-auto mb-4">
              {employee.name?.charAt(0) || '?'}
            </div>
            <h1 className="text-2xl font-bold">MySmartCard</h1>
            <p className="text-primary-100 mt-1">Premium NFC Smart Card</p>
          </div>

          <div className="p-6">
            <div className="bg-primary-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-primary-600 font-medium mb-1">Referred by</p>
              <p className="text-lg font-bold text-gray-900">{employee.name}</p>
              <p className="text-xs text-gray-500">Sales Executive • {employee.employeeId}</p>
              {employee.territory && <p className="text-xs text-gray-400 mt-1">{employee.territory}</p>}
            </div>

            <div className="space-y-3 mb-6">
              {designs.map((d, i) => (
                <div key={d.id} className={`flex items-center justify-between p-3 rounded-lg border ${i === 1 ? 'border-2 border-primary-200 bg-primary-50' : 'border-gray-200'}`}>
                  <div>
                    <p className="font-medium text-sm">{d.name}</p>
                  </div>
                  <p className="font-bold">₹{d.price.toLocaleString()}</p>
                </div>
              ))}
            </div>

            <Link
              href={`/order?referral=${employee.referralLinkCode}&via=link`}
              className="btn-primary w-full text-center block text-lg py-4"
            >
              Buy Your MySmartCard
            </Link>

            <p className="text-xs text-gray-400 mt-4">
              Your order will be attributed to {employee.name}. They will deliver your card in person.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-white/50 mt-4">
          Powered by MySmartCard.net
        </p>
      </div>
    </div>
  )
}
