"use client"
import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function AdminOrdersContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialStatus = searchParams.get('status') || 'confirmed'

  const [orders, setOrders] = useState<any[]>([])
  const [counts, setCounts] = useState<any>({ all: 0, confirmed: 0, failed: 0, pending: 0, delivered: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(initialStatus)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [downloading, setDownloading] = useState(false)

  const fetchOrders = useCallback((q?: string, s?: string) => {
    const token = localStorage.getItem('token')
    const params = new URLSearchParams()
    if (q) params.set('search', q)
    if (s) params.set('status', s)
    fetch(`/api/admin/orders?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          // Supports both old array response and new { orders, counts }
          if (Array.isArray(d.data)) {
            setOrders(d.data)
          } else {
            setOrders(d.data.orders || [])
            if (d.data.counts) setCounts(d.data.counts)
          }
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchOrders(search, statusFilter)
  }, [fetchOrders, search, statusFilter])

  const handleTabChange = (status: string) => {
    setStatusFilter(status)
    setSelected(new Set())
    const url = status ? `/admin/orders?status=${encodeURIComponent(status)}` : '/admin/orders'
    router.replace(url)
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === orders.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(orders.map(o => o.id)))
    }
  }

  const downloadDocx = useCallback(async (orderIds: string[]) => {
    setDownloading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/orders/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderIds }),
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
      a.download = orderIds.length === 1 ? `customer-data-${orderIds[0]}.docx` : `customer-data-${new Date().toISOString().slice(0, 10)}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      alert('Download failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }, [])

  const handleBulkDownload = () => {
    if (selected.size === 0) { alert('Please select orders first'); return }
    downloadDocx(Array.from(selected))
  }

  const handleDownloadAll = () => {
    if (orders.length === 0) { alert('No orders to download'); return }
    downloadDocx(orders.map(o => o.id))
  }

  const isConfirmedTab = statusFilter === 'confirmed'
  const isFailedTab = statusFilter === 'Payment Failed' || statusFilter === 'failed'

  const totalValue = orders.reduce((s, o) => s + o.amount, 0)

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Orders Management</h1>
          <p className="text-gray-500 text-sm">
            {isConfirmedTab && 'Showing verified & confirmed sales only'}
            {isFailedTab && 'Showing failed payment attempts — isolated from sales & revenue'}
            {!isConfirmedTab && !isFailedTab && `Showing orders (${orders.length})`}
          </p>
        </div>

        <div className="flex gap-3 flex-wrap items-center">
          <input
            className="input-field w-56 text-sm"
            placeholder="Search order, customer, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {selected.size > 0 && (
            <button
              onClick={handleBulkDownload}
              disabled={downloading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              {downloading ? 'Generating...' : `Download Selected (${selected.size})`}
            </button>
          )}
          <button
            onClick={handleDownloadAll}
            disabled={downloading || orders.length === 0}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {downloading ? 'Generating...' : 'Download All DOCX'}
          </button>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 border-b border-gray-200 text-sm">
        <button
          onClick={() => handleTabChange('confirmed')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
            statusFilter === 'confirmed'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span>Confirmed Sales</span>
          <span className={`px-2 py-0.2 rounded-full text-xs ${statusFilter === 'confirmed' ? 'bg-primary-700 text-white' : 'bg-gray-200 text-gray-700'}`}>
            {counts.confirmed || 0}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('Payment Failed')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
            statusFilter === 'Payment Failed'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-red-700 hover:bg-red-50'
          }`}
        >
          <span>⚠️ Failed Payments</span>
          <span className={`px-2 py-0.2 rounded-full text-xs ${statusFilter === 'Payment Failed' ? 'bg-red-700 text-white' : 'bg-red-100 text-red-700'}`}>
            {counts.failed || 0}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('Pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
            statusFilter === 'Pending'
              ? 'bg-yellow-500 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span>Pending Checkout</span>
          <span className={`px-2 py-0.2 rounded-full text-xs ${statusFilter === 'Pending' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
            {counts.pending || 0}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('Delivered')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
            statusFilter === 'Delivered'
              ? 'bg-green-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span>Delivered</span>
          <span className={`px-2 py-0.2 rounded-full text-xs ${statusFilter === 'Delivered' ? 'bg-green-700 text-white' : 'bg-gray-200 text-gray-700'}`}>
            {counts.delivered || 0}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
            statusFilter === ''
              ? 'bg-gray-800 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span>All Orders</span>
          <span className={`px-2 py-0.2 rounded-full text-xs ${statusFilter === '' ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-700'}`}>
            {counts.all || 0}
          </span>
        </button>
      </div>

      {/* Alert banner for Failed Payments view */}
      {isFailedTab && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl mb-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div className="text-sm">
            <p className="font-semibold">Isolated Failed Payments View</p>
            <p className="text-red-700 mt-0.5">
              These orders experienced payment errors during checkout. They are completely excluded from total sales, total revenue, and employee commission attribution.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          No orders found in this view.
        </div>
      ) : (
        <div className="card p-0 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-600 w-10">
                    <input
                      type="checkbox"
                      checked={selected.size === orders.length && orders.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="text-left p-3 font-medium text-gray-600">Order ID</th>
                  <th className="text-left p-3 font-medium text-gray-600">Customer</th>
                  <th className="text-left p-3 font-medium text-gray-600">Design</th>
                  <th className="text-left p-3 font-medium text-gray-600">Amount</th>
                  <th className="text-left p-3 font-medium text-gray-600">Attribution</th>
                  <th className="text-left p-3 font-medium text-gray-600">Employee</th>
                  <th className="text-left p-3 font-medium text-gray-600">Status</th>
                  <th className="text-left p-3 font-medium text-gray-600">Date</th>
                  <th className="text-left p-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((o) => {
                  const isFailed = o.status === 'Payment Failed' || o.status === 'Failed'
                  const isConfirmed = o.status === 'Payment Received' || o.status === 'Delivered'
                  return (
                    <tr
                      key={o.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        selected.has(o.id) ? 'bg-primary-50/70' : isFailed ? 'bg-red-50/30' : ''
                      }`}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selected.has(o.id)}
                          onChange={() => toggleSelect(o.id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="p-3 font-mono font-medium">
                        <Link href={`/admin/orders/${o.id}`} className="text-primary-600 hover:underline">
                          {o.orderId}
                        </Link>
                      </td>
                      <td className="p-3">
                        {o.customer ? (
                          <Link href={`/admin/customers/${o.customer.id}`} className="text-gray-900 font-medium hover:underline">
                            {o.customer.name}
                          </Link>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                        {o.customer?.email && (
                          <div className="text-xs text-gray-400">{o.customer.email}</div>
                        )}
                      </td>
                      <td className="p-3">{o.design?.name || '-'}</td>
                      <td className="p-3 font-semibold">₹{o.amount}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          o.attributionType === 'link' ? 'bg-blue-100 text-blue-700' :
                          o.attributionType === 'manual_code' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {o.attributionType === 'link' ? 'Link' : o.attributionType === 'manual_code' ? 'Code' : 'Direct'}
                        </span>
                      </td>
                      <td className="p-3">
                        {o.employee ? (
                          <Link href={`/admin/employees/${o.employee.id}`} className="text-primary-600 hover:underline text-xs font-medium">
                            {o.employee.name}
                          </Link>
                        ) : (
                          <span className="text-gray-400 text-xs">Direct</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          o.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                          o.status === 'Payment Received' ? 'bg-blue-100 text-blue-700' :
                          isFailed ? 'bg-red-100 text-red-700 border border-red-200' :
                          o.status === 'Cancelled' ? 'bg-gray-100 text-gray-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600 text-xs whitespace-nowrap">
                        {new Date(o.orderDate).toLocaleDateString()}
                      </td>
                      <td className="p-3 flex items-center gap-3 whitespace-nowrap">
                        <Link href={`/admin/orders/${o.id}`} className="text-sm text-primary-600 hover:underline font-medium">
                          View
                        </Link>
                        {isConfirmed && (
                          <button
                            onClick={() => downloadDocx([o.id])}
                            disabled={downloading}
                            className="text-sm text-green-600 hover:underline disabled:opacity-50 font-medium"
                          >
                            DOCX
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-gray-50 border-t flex items-center justify-between text-xs text-gray-500">
            <span>Showing {orders.length} orders</span>
            <span className="font-semibold text-gray-700">Subtotal: ₹{totalValue.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-64 bg-gray-100 rounded-xl"></div>}>
      <AdminOrdersContent />
    </Suspense>
  )
}
