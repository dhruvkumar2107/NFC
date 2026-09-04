"use client"
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [downloading, setDownloading] = useState(false)

  const fetchOrders = (q?: string, s?: string) => {
    const token = localStorage.getItem('token')
    const params = new URLSearchParams()
    if (q) params.set('search', q)
    if (s) params.set('status', s)
    fetch(`/api/admin/orders?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setOrders(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchOrders() }, [])

  useEffect(() => {
    const t = setTimeout(() => fetchOrders(search, statusFilter), 300)
    return () => clearTimeout(t)
  }, [search, statusFilter])

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

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-48"></div></div>

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">All Orders ({orders.length})</h1>
        <div className="flex gap-3 flex-wrap">
          <input className="input-field w-56" placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="input-field w-40" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Payment Received">Payment Received</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          {selected.size > 0 && (
            <button onClick={handleBulkDownload} disabled={downloading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
              {downloading ? 'Generating...' : `Download Selected (${selected.size})`}
            </button>
          )}
          <button onClick={handleDownloadAll} disabled={downloading || orders.length === 0}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
            {downloading ? 'Generating...' : 'Download All DOCX'}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3 font-medium text-gray-600 w-10">
                <input type="checkbox" checked={selected.size === orders.length && orders.length > 0} onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              </th>
              <th className="text-left p-3 font-medium text-gray-600">Order ID</th>
              <th className="text-left p-3 font-medium text-gray-600">Customer</th>
              <th className="text-left p-3 font-medium text-gray-600">Design</th>
              <th className="text-left p-3 font-medium text-gray-600">Amount</th>
              <th className="text-left p-3 font-medium text-gray-600">Attribution</th>
              <th className="text-left p-3 font-medium text-gray-600">Employee</th>
              <th className="text-left p-3 font-medium text-gray-600">Status</th>
              <th className="text-left p-3 font-medium text-gray-600">Date</th>
              <th className="text-left p-3 font-medium text-gray-600"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((o) => (
              <tr key={o.id} className={`hover:bg-gray-50 ${selected.has(o.id) ? 'bg-primary-50' : ''}`}>
                <td className="p-3">
                  <input type="checkbox" checked={selected.has(o.id)} onChange={() => toggleSelect(o.id)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                </td>
                <td className="p-3 font-mono">{o.orderId}</td>
                <td className="p-3">{o.customer ? <Link href={`/admin/customers/${o.customer.id}`} className="text-primary-600 hover:underline">{o.customer.name}</Link> : '-'}</td>
                <td className="p-3">{o.design?.name || '-'}</td>
                <td className="p-3">₹{o.amount}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${o.attributionType === 'link' ? 'bg-blue-100 text-blue-700' : o.attributionType === 'manual_code' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                    {o.attributionType === 'link' ? 'Link' : o.attributionType === 'manual_code' ? 'Code' : 'Direct'}
                  </span>
                </td>
                <td className="p-3">{o.employee ? <Link href={`/admin/employees/${o.employee.id}`} className="text-primary-600 hover:underline text-xs">{o.employee.name}</Link> : <span className="text-gray-400 text-xs">-</span>}</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${o.status === 'Delivered' ? 'bg-green-100 text-green-700' : o.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{o.status}</span></td>
                <td className="p-3 text-gray-600 text-xs">{new Date(o.orderDate).toLocaleDateString()}</td>
                <td className="p-3 flex gap-2">
                  <Link href={`/admin/orders/${o.id}`} className="text-sm text-primary-600 hover:underline">View</Link>
                  <button onClick={() => downloadDocx([o.id])} disabled={downloading}
                    className="text-sm text-green-600 hover:underline disabled:opacity-50">
                    DOCX
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
