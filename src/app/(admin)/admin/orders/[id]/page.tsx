"use client"
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function OrderDetailPage() {
  const params = useParams()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

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

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-48"></div></div>
  if (!order) return <div className="text-center py-12 text-gray-500">Order not found.</div>

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/orders" className="text-sm text-primary-600 hover:underline">← Back to Orders</Link>
        <h1 className="text-2xl font-bold mt-1">Order {order.orderId}</h1>
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
