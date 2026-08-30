"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

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

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-48"></div></div>

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">All Orders ({orders.length})</h1>
        <div className="flex gap-3">
          <input className="input-field w-56" placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="input-field w-40" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Payment Received">Payment Received</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
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
              <tr key={o.id} className="hover:bg-gray-50">
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
                <td className="p-3"><Link href={`/admin/orders/${o.id}`} className="text-sm text-primary-600 hover:underline">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
