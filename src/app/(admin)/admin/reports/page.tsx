"use client"
import { useEffect, useState } from 'react'

export default function AdminReportsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  function fetchReports() {
    setLoading(true)
    const token = localStorage.getItem('token')
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    fetch(`/api/admin/reports/sales?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchReports() }, [])

  function exportCSV() {
    if (!data?.orders?.length) return
    const headers = ['Order ID', 'Customer', 'Employee', 'Attribution', 'Amount', 'Commission', 'Status', 'Date']
    const rows = data.orders.map((o: any) => [
      o.orderId,
      o.customer?.name || '',
      o.employee?.name || 'Direct',
      o.attributionType || 'direct',
      o.amount,
      o.commissionAmount || 0,
      o.status,
      new Date(o.orderDate).toLocaleDateString(),
    ])
    const csv = [headers.join(','), ...rows.map((r: (string | number)[]) => r.map(c => `"${c}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading && !data) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-48"></div></div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Sales Reports</h1>

      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div><label className="label">From</label><input type="date" className="input-field" value={from} onChange={e => setFrom(e.target.value)} /></div>
          <div><label className="label">To</label><input type="date" className="input-field" value={to} onChange={e => setTo(e.target.value)} /></div>
          <button onClick={fetchReports} className="btn-primary">Filter</button>
          {data?.orders?.length > 0 && (
            <button onClick={exportCSV} className="btn-secondary">Export CSV</button>
          )}
        </div>
      </div>

      {data && (
        <>
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="card text-center">
              <div className="text-sm text-gray-500">Total Orders</div>
              <div className="text-3xl font-bold">{data.totalOrders}</div>
            </div>
            <div className="card text-center">
              <div className="text-sm text-gray-500">Total Revenue</div>
              <div className="text-3xl font-bold">₹{data.totalRevenue.toLocaleString()}</div>
            </div>
            <div className="card text-center">
              <div className="text-sm text-gray-500">Direct Sales (No Employee)</div>
              <div className="text-3xl font-bold">{data.directSales}</div>
            </div>
          </div>

          {data.summary?.length > 0 && (
            <div className="card mb-6">
              <h2 className="font-semibold text-lg mb-3">Employee-wise Summary</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-2 font-medium text-gray-600">Employee</th>
                      <th className="text-left p-2 font-medium text-gray-600">Sales</th>
                      <th className="text-left p-2 font-medium text-gray-600">Revenue</th>
                      <th className="text-left p-2 font-medium text-gray-600">Commission</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.summary.map((s: any) => (
                      <tr key={s.employee.id} className="hover:bg-gray-50">
                        <td className="p-2">{s.employee.name} <span className="text-gray-400 text-xs">({s.employee.employeeId})</span></td>
                        <td className="p-2">{s.totalSales}</td>
                        <td className="p-2">₹{s.totalRevenue.toLocaleString()}</td>
                        <td className="p-2">₹{s.totalCommission.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data.orders?.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-lg mb-3">All Orders ({data.orders.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-2 font-medium text-gray-600">Order ID</th>
                      <th className="text-left p-2 font-medium text-gray-600">Customer</th>
                      <th className="text-left p-2 font-medium text-gray-600">Employee</th>
                      <th className="text-left p-2 font-medium text-gray-600">Attribution</th>
                      <th className="text-left p-2 font-medium text-gray-600">Amount</th>
                      <th className="text-left p-2 font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.orders.map((o: any) => (
                      <tr key={o.id} className="hover:bg-gray-50">
                        <td className="p-2 font-mono text-xs">{o.orderId}</td>
                        <td className="p-2">{o.customer?.name || '-'}</td>
                        <td className="p-2">{o.employee?.name || <span className="text-gray-400">Direct</span>}</td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${o.attributionType === 'link' ? 'bg-blue-100 text-blue-700' : o.attributionType === 'manual_code' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                            {o.attributionType === 'link' ? 'Link' : o.attributionType === 'manual_code' ? 'Code' : 'Direct'}
                          </span>
                        </td>
                        <td className="p-2">₹{o.amount}</td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${o.status === 'Delivered' ? 'bg-green-100 text-green-700' : o.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{o.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
