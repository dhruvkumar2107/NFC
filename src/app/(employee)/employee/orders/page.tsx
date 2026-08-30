"use client"
import { useEffect, useState } from 'react'

export default function EmployeeOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [markingId, setMarkingId] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('/api/employee/orders', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setOrders(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function markDelivered(orderId: string) {
    setMarkingId(orderId)
    const token = localStorage.getItem('token')
    await fetch(`/api/employee/orders/${orderId}/mark-delivered`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Delivered' } : o))
    setMarkingId(null)
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-48"></div><div className="h-64 bg-gray-200 rounded-xl"></div></div>

  const totalPoints = orders.reduce((s, o) => s + (o.commissionPoints || 0), 0)
  const totalCommission = orders.reduce((s, o) => s + (o.commissionAmount || 0), 0)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Orders ({orders.length})</h1>

      {orders.length > 0 && (
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="card">
            <div className="text-sm text-gray-500">Total Orders</div>
            <div className="text-2xl font-bold">{orders.length}</div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-500">Total Commission</div>
            <div className="text-2xl font-bold text-green-600">₹{totalCommission.toLocaleString()}</div>
          </div>
          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="text-sm opacity-80">Total Points Earned</div>
            <div className="text-2xl font-bold">{totalPoints} pts</div>
            <div className="text-xs opacity-80">= ₹{totalPoints}</div>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">No orders yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium text-gray-600">Order ID</th>
                <th className="text-left p-3 font-medium text-gray-600">Customer</th>
                <th className="text-left p-3 font-medium text-gray-600">Design</th>
                <th className="text-left p-3 font-medium text-gray-600">Amount</th>
                <th className="text-left p-3 font-medium text-gray-600">Commission</th>
                <th className="text-left p-3 font-medium text-gray-600">Points</th>
                <th className="text-left p-3 font-medium text-gray-600">Source</th>
                <th className="text-left p-3 font-medium text-gray-600">Status</th>
                <th className="text-left p-3 font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="p-3 font-mono">{o.orderId}</td>
                  <td className="p-3">{o.customer?.name || '-'}</td>
                  <td className="p-3">{o.design?.name || '-'}</td>
                  <td className="p-3">₹{o.amount}</td>
                  <td className="p-3 text-green-600 font-medium">₹{o.commissionAmount || 0}</td>
                  <td className="p-3 font-bold text-primary-600">+{o.commissionPoints || 0}</td>
                  <td className="p-3">
                    {o.attributionType === 'link' && <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">Link</span>}
                    {o.attributionType === 'manual_code' && <span className="px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700">Code</span>}
                    {!o.attributionType && <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500">Direct</span>}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      o.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                      o.status === 'Payment Received' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{o.status}</span>
                  </td>
                  <td className="p-3">
                    {o.status !== 'Delivered' && o.status !== 'Cancelled' && (
                      <button
                        onClick={() => markDelivered(o.id)}
                        disabled={markingId === o.id}
                        className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {markingId === o.id ? '...' : 'Mark Delivered'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
