"use client"
import { useEffect, useState } from 'react'

export default function EmployeeOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [markingId, setMarkingId] = useState<string | null>(null)
  const [tab, setTab] = useState<'confirmed' | 'all' | 'unconfirmed'>('confirmed')

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

  const isConfirmed = (o: any) => o.status === 'Payment Received' || o.status === 'Delivered'
  const isFailedOrPending = (o: any) => o.status === 'Pending' || o.status === 'Payment Failed' || o.status === 'Failed' || o.status === 'Cancelled'

  const confirmedOrders = orders.filter(isConfirmed)
  const unconfirmedOrders = orders.filter(isFailedOrPending)

  // Strictly calculate commission and points ONLY from confirmed orders
  const totalPoints = confirmedOrders.reduce((s, o) => s + (o.commissionPoints || 0), 0)
  const totalCommission = confirmedOrders.reduce((s, o) => s + (o.commissionAmount || 0), 0)

  const displayedOrders = tab === 'confirmed' ? confirmedOrders : tab === 'unconfirmed' ? unconfirmedOrders : orders

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Orders</h1>
          <p className="text-gray-500 text-sm">Track your customer orders and earnings</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 text-sm bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setTab('confirmed')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              tab === 'confirmed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Confirmed Sales ({confirmedOrders.length})
          </button>
          <button
            onClick={() => setTab('all')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              tab === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({orders.length})
          </button>
          {unconfirmedOrders.length > 0 && (
            <button
              onClick={() => setTab('unconfirmed')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                tab === 'unconfirmed' ? 'bg-white text-red-700 shadow-sm' : 'text-gray-600 hover:text-red-700'
              }`}
            >
              Pending / Failed ({unconfirmedOrders.length})
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards - Strictly from Confirmed Orders */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="card shadow-sm">
          <div className="text-sm text-gray-500 font-medium">Confirmed Sales</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{confirmedOrders.length}</div>
          <div className="text-xs text-gray-400 mt-0.5">verified customer purchases</div>
        </div>
        <div className="card shadow-sm">
          <div className="text-sm text-gray-500 font-medium">Earned Commission</div>
          <div className="text-2xl font-bold text-green-600 mt-1">₹{totalCommission.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-0.5">₹100 per confirmed card sale</div>
        </div>
        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white shadow-sm">
          <div className="text-sm opacity-90 font-medium">Total Confirmed Points</div>
          <div className="text-2xl font-bold mt-1">{totalPoints} pts</div>
          <div className="text-xs opacity-80 mt-0.5">= ₹{totalPoints} (credited to wallet)</div>
        </div>
      </div>

      {displayedOrders.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          {tab === 'confirmed' ? 'No confirmed sales yet. Share your referral link to earn ₹100 per card!' : 'No orders in this list.'}
        </div>
      ) : (
        <div className="card p-0 overflow-hidden shadow-sm">
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
                {displayedOrders.map((o) => {
                  const confirmed = isConfirmed(o)
                  const isFailed = o.status === 'Payment Failed' || o.status === 'Failed'
                  return (
                    <tr key={o.id} className={`hover:bg-gray-50 ${isFailed ? 'bg-red-50/20' : ''}`}>
                      <td className="p-3 font-mono font-medium text-primary-600">{o.orderId}</td>
                      <td className="p-3">{o.customer?.name || '-'}</td>
                      <td className="p-3">{o.design?.name || '-'}</td>
                      <td className="p-3 font-medium">₹{o.amount}</td>
                      <td className="p-3 font-semibold">
                        {confirmed ? (
                          <span className="text-green-600">₹{o.commissionAmount || 100}</span>
                        ) : (
                          <span className="text-gray-400">₹0 (Pending)</span>
                        )}
                      </td>
                      <td className="p-3 font-bold">
                        {confirmed ? (
                          <span className="text-primary-600">+{o.commissionPoints || 100}</span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="p-3">
                        {o.attributionType === 'link' && <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700 font-medium">Link</span>}
                        {o.attributionType === 'manual_code' && <span className="px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700 font-medium">Code</span>}
                        {!o.attributionType && <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500">Direct</span>}
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          o.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                          o.status === 'Payment Received' ? 'bg-blue-100 text-blue-700' :
                          isFailed ? 'bg-red-100 text-red-700 border border-red-200' :
                          o.status === 'Cancelled' ? 'bg-gray-100 text-gray-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>{o.status}</span>
                      </td>
                      <td className="p-3">
                        {o.status === 'Payment Received' && (
                          <button
                            onClick={() => markDelivered(o.id)}
                            disabled={markingId === o.id}
                            className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium shadow-sm"
                          >
                            {markingId === o.id ? 'Updating...' : 'Mark Delivered'}
                          </button>
                        )}
                        {o.status === 'Delivered' && (
                          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                            ✓ Delivered
                          </span>
                        )}
                        {!confirmed && (
                          <span className="text-xs text-gray-400 italic">No action</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
