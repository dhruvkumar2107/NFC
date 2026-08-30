"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchCustomers = (q?: string) => {
    const token = localStorage.getItem('token')
    const params = q ? `?search=${encodeURIComponent(q)}` : ''
    fetch(`/api/admin/customers${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setCustomers(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchCustomers() }, [])

  useEffect(() => {
    const t = setTimeout(() => fetchCustomers(search), 300)
    return () => clearTimeout(t)
  }, [search])

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-48"></div></div>

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Customers ({customers.length})</h1>
        <input className="input-field w-64" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3 font-medium text-gray-600">Name</th>
              <th className="text-left p-3 font-medium text-gray-600">Email</th>
              <th className="text-left p-3 font-medium text-gray-600">Mobile</th>
              <th className="text-left p-3 font-medium text-gray-600">Card</th>
              <th className="text-left p-3 font-medium text-gray-600">Type</th>
              <th className="text-left p-3 font-medium text-gray-600">Sold By</th>
              <th className="text-left p-3 font-medium text-gray-600">Orders</th>
              <th className="text-left p-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="p-3 font-medium"><Link href={`/admin/customers/${c.id}`} className="text-primary-600 hover:underline">{c.name}</Link></td>
                <td className="p-3 text-gray-600">{c.email}</td>
                <td className="p-3 text-gray-600">{c.mobile || '-'}</td>
                <td className="p-3 font-mono text-primary-600 text-xs">{c.card?.cardId || '-'}</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded text-xs bg-gray-100">{c.type}</span></td>
                <td className="p-3 text-gray-600">{c.employee ? <Link href={`/admin/employees/${c.employee.id}`} className="text-primary-600 hover:underline text-xs">{c.employee.employeeId}</Link> : <span className="text-xs text-gray-400">Direct</span>}</td>
                <td className="p-3">{c.orders?.length || 0}</td>
                <td className="p-3"><Link href={`/admin/customers/${c.id}`} className="text-sm text-primary-600 hover:underline">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
