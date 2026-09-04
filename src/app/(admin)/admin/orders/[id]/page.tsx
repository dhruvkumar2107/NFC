"use client"
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function OrderDetailPage() {
  const params = useParams()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch(`/api/admin/orders/${params.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setOrder(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [params.id])

  async function updateStatus(status: string) {
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/admin/orders/${params.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    })
    const d = await res.json()
    if (d.success) { setOrder((o: any) => ({ ...o, status })); setMsg(`Status updated to ${status}`) }
    else setMsg(d.error)
  }

  const downloadDocx = useCallback(async () => {
    if (!order) return
    setDownloading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/orders/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderIds: [order.id] }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Download failed')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `customer-data-${order.orderId}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      alert('Download failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }, [order])

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-48"></div></div>
  if (!order) return <div className="text-center py-12 text-gray-500">Order not found.</div>

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/admin/orders" className="text-sm text-primary-600 hover:underline">← Back to Orders</Link>
          <h1 className="text-2xl font-bold mt-1">Order {order.orderId}</h1>
        </div>
        <button onClick={downloadDocx} disabled={downloading}
          className="px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          {downloading ? 'Generating DOCX...' : 'Download Customer Data (DOCX)'}
        </button>
      </div>

      {msg && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm">{msg}</div>}

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="card"><div className="text-sm text-gray-500">Amount</div><div className="text-2xl font-bold">₹{order.amount}</div></div>
        <div className="card"><div className="text-sm text-gray-500">Commission</div><div className="text-2xl font-bold text-green-600">₹{order.commissionAmount || 0}</div><div className="text-xs text-gray-400">{order.commissionPoints || 0} points</div></div>
        <div className="card"><div className="text-sm text-gray-500">Status</div><div className="text-2xl font-bold"><span className={`px-3 py-1 rounded-full text-sm ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' : order.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{order.status}</span></div></div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h2 className="font-semibold mb-3">Customer</h2>
          {order.customer ? (
            <div className="space-y-2 text-sm">
              <div><Link href={`/admin/customers/${order.customer.id}`} className="text-primary-600 hover:underline font-medium">{order.customer.name}</Link></div>
              <div>{order.customer.email}</div>
              <div>{order.customer.mobile || '-'}</div>
              <div>{order.customer.company || '-'}</div>
            </div>
          ) : <p className="text-gray-500">No customer</p>}
        </div>
        <div className="card">
          <h2 className="font-semibold mb-3">Employee</h2>
          {order.employee ? (
            <div className="space-y-2 text-sm">
              <div><Link href={`/admin/employees/${order.employee.id}`} className="text-primary-600 hover:underline font-medium">{order.employee.name}</Link></div>
              <div>{order.employee.employeeId}</div>
              <div><span className="text-gray-500">Attribution:</span> <span className={`px-2 py-0.5 rounded text-xs ${order.attributionType === 'link' ? 'bg-blue-100 text-blue-700' : order.attributionType === 'manual_code' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100'}`}>{order.attributionType || 'direct'}</span></div>
            </div>
          ) : <p className="text-gray-500">Direct sale (no employee)</p>}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h2 className="font-semibold mb-3">Card</h2>
          {order.card ? (
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-500">Card ID:</span> <span className="font-mono font-bold">{order.card.cardId}</span></div>
              <div><span className="text-gray-500">Design:</span> {order.design?.name}</div>
              <div><Link href={`/admin/cards/${order.card.id}`} className="text-primary-600 text-sm hover:underline">View Card →</Link></div>
            </div>
          ) : <p className="text-gray-500">No card</p>}
        </div>
        <div className="card">
          <h2 className="font-semibold mb-3">Payment</h2>
          <div className="space-y-2 text-sm">
            <div><span className="text-gray-500">Razorpay ID:</span> <span className="font-mono text-xs">{order.razorpayPaymentId || 'N/A'}</span></div>
            <div><span className="text-gray-500">Order Date:</span> {new Date(order.orderDate).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      {order.customer?.address && (
        <div className="card mb-6">
          <h2 className="font-semibold mb-3">Shipping Address</h2>
          <div className="space-y-1 text-sm">
            <div>{order.customer.name}</div>
            <div>{order.customer.address}</div>
            <div>{[order.customer.city, order.customer.state, order.customer.pincode].filter(Boolean).join(', ')}</div>
            <div>{order.customer.country || 'India'}</div>
            <div className="text-gray-500 mt-1">Mobile: {order.customer.mobile}</div>
          </div>
        </div>
      )}

      {/* Customer Preview */}
      {order.customer && (
        <div className="card mb-6">
          <h2 className="font-semibold mb-3">Customer Profile Preview</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {(() => {
              let photos: string[] = []
              try { photos = JSON.parse(order.customer.photos || '[]') } catch {}
              let socialLinks: Record<string, string> = {}
              try { socialLinks = JSON.parse(order.customer.socialLinks || '{}') } catch {}
              return (
                <>
                  <div className="text-center">
                    {order.customer.logoUrl ? (
                      <img src={order.customer.logoUrl} alt="Logo" className="w-20 h-20 rounded-full object-cover mx-auto mb-2" />
                    ) : photos[0] ? (
                      <img src={photos[0]} alt="Profile" className="w-20 h-20 rounded-full object-cover mx-auto mb-2" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-2 text-2xl font-bold text-primary-600">{order.customer.name?.charAt(0)}</div>
                    )}
                    <div className="font-medium">{order.customer.name}</div>
                    <div className="text-xs text-gray-500">{order.customer.designation} {order.customer.company ? `at ${order.customer.company}` : ''}</div>
                  </div>
                  <div className="text-sm space-y-1">
                    {order.customer.email && <div className="text-gray-600">{order.customer.email}</div>}
                    {order.customer.mobile && <div className="text-gray-600">Mobile: {order.customer.mobile}</div>}
                    {order.customer.whatsapp && <div className="text-gray-600">WhatsApp: {order.customer.whatsapp}</div>}
                    {order.customer.website && <div className="text-gray-600">{order.customer.website}</div>}
                  </div>
                  <div className="text-sm space-y-1">
                    {order.customer.description && <div className="text-gray-600 text-xs">{order.customer.description.slice(0, 100)}...</div>}
                    {Object.entries(socialLinks).filter(([,v]) => v).map(([k, v]) => (
                      <div key={k} className="text-xs text-gray-500 capitalize">{k}: {v as string}</div>
                    ))}
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* Status Actions */}
      <div className="card">
        <h2 className="font-semibold mb-3">Change Status</h2>
        <div className="flex flex-wrap gap-2">
          {['Pending', 'Payment Received', 'Delivered', 'Cancelled'].map(s => (
            <button key={s} onClick={() => updateStatus(s)} disabled={order.status === s}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${order.status === s ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
