"use client"
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function CardDetailPage() {
  const params = useParams()
  const [card, setCard] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch(`/api/admin/cards/${params.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setCard(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [params.id])

  async function updateStatus(status: string) {
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/admin/cards/${params.id}/status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    })
    const d = await res.json()
    if (d.success) { setCard((c: any) => ({ ...c, status })); setMsg(`Card ${status}`) }
    else setMsg(d.error)
  }

  async function assignNfcNumber() {
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/admin/cards/${params.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ assignNfcNumber: true }),
    })
    const d = await res.json()
    if (d.success) { setCard((c: any) => ({ ...c, nfcCardNumber: d.data.nfcCardNumber })); setMsg('NFC Card Number assigned!') }
    else setMsg(d.error || 'Failed to assign NFC number')
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-48"></div></div>
  if (!card) return <div className="text-center py-12 text-gray-500">Card not found.</div>

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/cards" className="text-sm text-primary-600 hover:underline">← Back to Cards</Link>
        <h1 className="text-2xl font-bold mt-1">Card {card.cardId}</h1>
      </div>

      {msg && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm">{msg}</div>}

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="card"><div className="text-sm text-gray-500">Status</div><div className="text-xl font-bold"><span className={`px-3 py-1 rounded-full text-sm ${card.status === 'Active' ? 'bg-green-100 text-green-700' : card.status === 'Deactivated' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{card.status}</span></div></div>
        <div className="card"><div className="text-sm text-gray-500">Design</div><div className="text-xl font-bold">{card.design?.name || '-'}</div></div>
        <div className="card"><div className="text-sm text-gray-500">Profile URL</div><div className="text-sm font-mono text-primary-600 break-all">/p/{card.cardId}</div></div>
        <div className="card"><div className="text-sm text-gray-500">Created</div><div className="text-sm">{new Date(card.createdAt).toLocaleDateString()}</div></div>
      </div>

      {card.nfcCardNumber ? (
        <div className="card mb-6">
          <h2 className="font-semibold mb-3">NFC Details</h2>
          <div className="space-y-2 text-sm">
            <div><span className="text-gray-500">NFC Card Number:</span> <span className="font-mono font-bold text-primary-600">{card.nfcCardNumber}</span></div>
            <div className="flex items-start gap-2">
              <span className="text-gray-500">NFC URL:</span>
              <span className="font-mono text-xs text-primary-600 break-all">{baseUrl}/card/{card.nfcCardNumber}</span>
              <button
                onClick={() => { navigator.clipboard.writeText(`${baseUrl}/card/${card.nfcCardNumber}`); alert('NFC URL copied!') }}
                className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded hover:bg-primary-200 transition-colors flex-shrink-0"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Program this URL into the physical NFC chip. When tapped, it will open the customer's complete public profile.</p>
          </div>
        </div>
      ) : (
        <div className="card mb-6 bg-yellow-50 border border-yellow-200">
          <h2 className="font-semibold mb-3 text-yellow-800">NFC Card Number Not Assigned</h2>
          <p className="text-sm text-yellow-700 mb-3">This card does not have an NFC card number yet. Click below to generate one.</p>
          <button onClick={assignNfcNumber} className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors">Generate NFC Card Number</button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h2 className="font-semibold mb-3">Customer</h2>
          {card.customer ? (
            <div className="space-y-2 text-sm">
              <div><Link href={`/admin/customers/${card.customer.id}`} className="text-primary-600 hover:underline font-medium">{card.customer.name}</Link></div>
              <div>{card.customer.email}</div>
              <div>{card.customer.mobile || '-'}</div>
            </div>
          ) : <p className="text-gray-500">No customer assigned</p>}
        </div>
        <div className="card">
          <h2 className="font-semibold mb-3">Order</h2>
          {card.order ? (
            <div className="space-y-2 text-sm">
              <div><Link href={`/admin/orders/${card.order.id}`} className="text-primary-600 hover:underline font-mono">{card.order.orderId}</Link></div>
              <div>₹{card.order.amount}</div>
              <div><span className={`px-2 py-0.5 rounded-full text-xs ${card.order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{card.order.status}</span></div>
            </div>
          ) : <p className="text-gray-500">No order</p>}
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">Change Status</h2>
        <div className="flex flex-wrap gap-2">
          {['Pending', 'Issued', 'Delivered', 'Active', 'Deactivated'].map(s => (
            <button key={s} onClick={() => updateStatus(s)} disabled={card.status === s}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${card.status === s ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
