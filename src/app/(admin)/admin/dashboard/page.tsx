"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('/api/admin/dashboard/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-48"></div><div className="grid md:grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-200 rounded-xl"></div>)}</div></div>

  if (!stats) return <div className="text-center py-12 text-gray-500">Could not load dashboard.</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="text-sm opacity-80">Total Revenue</div>
          <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500">Total Orders</div>
          <div className="text-2xl font-bold">{stats.totalOrders}</div>
          <div className="text-xs text-yellow-600">{stats.pendingOrders} pending</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500">Total Commission</div>
          <div className="text-2xl font-bold text-orange-600">₹{stats.totalCommission.toLocaleString()}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500">Pending Redemptions</div>
          <div className="text-2xl font-bold text-red-600">{stats.pendingRedemptions}</div>
          {stats.pendingRedemptions > 0 && <Link href="/admin/redemptions" className="text-xs text-primary-600 hover:underline">Review</Link>}
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="card"><div className="text-sm text-gray-500">Customers</div><div className="text-2xl font-bold">{stats.totalCustomers}</div></div>
        <div className="card"><div className="text-sm text-gray-500">Employees</div><div className="text-2xl font-bold">{stats.totalEmployees}</div></div>
        <div className="card bg-blue-50 border-blue-200"><div className="text-sm text-blue-600">Referred Sales</div><div className="text-2xl font-bold text-blue-700">{stats.referredSales}</div></div>
        <div className="card bg-gray-50 border-gray-200"><div className="text-sm text-gray-600">Direct Sales</div><div className="text-2xl font-bold text-gray-700">{stats.directSales}</div></div>
      </div>

      {stats.employeeStats?.length > 0 && (
        <div className="card mb-6">
          <h2 className="font-semibold text-lg mb-3">Employee Leaderboard</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b"><tr>
                <th className="text-left p-2 font-medium text-gray-600">#</th>
                <th className="text-left p-2 font-medium text-gray-600">Employee</th>
                <th className="text-left p-2 font-medium text-gray-600">Sales</th>
                <th className="text-left p-2 font-medium text-gray-600">Revenue</th>
                <th className="text-left p-2 font-medium text-gray-600">Commission</th>
                <th className="text-left p-2 font-medium text-gray-600">Points</th>
                <th className="text-left p-2 font-medium text-gray-600">Status</th>
              </tr></thead>
              <tbody className="divide-y">
                {stats.employeeStats.map((emp: any, i: number) => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="p-2 font-bold text-gray-400">{i + 1}</td>
                    <td className="p-2"><Link href={`/admin/employees/${emp.id}`} className="font-medium text-primary-600 hover:underline">{emp.name}</Link><div className="text-xs text-gray-400">{emp.employeeId}</div></td>
                    <td className="p-2 font-bold">{emp.salesCount}</td>
                    <td className="p-2">₹{emp.revenue.toLocaleString()}</td>
                    <td className="p-2 text-green-600">₹{emp.commission.toLocaleString()}</td>
                    <td className="p-2"><span className="text-primary-600 font-bold">{emp.totalPoints || 0}</span><div className="text-xs text-gray-400">avail: {emp.availablePoints || 0}</div></td>
                    <td className="p-2"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{emp.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Link href="/admin/orders" className="card hover:shadow-md transition-shadow"><h3 className="font-semibold">📦 Orders</h3><p className="text-sm text-gray-600">View all orders</p></Link>
        <Link href="/admin/customers" className="card hover:shadow-md transition-shadow"><h3 className="font-semibold">👥 Customers</h3><p className="text-sm text-gray-600">Manage customers</p></Link>
        <Link href="/admin/employees" className="card hover:shadow-md transition-shadow"><h3 className="font-semibold">👤 Employees</h3><p className="text-sm text-gray-600">Manage sales team</p></Link>
        <Link href="/admin/wallet" className="card hover:shadow-md transition-shadow"><h3 className="font-semibold">💸 Wallet</h3><p className="text-sm text-gray-600">All transactions</p></Link>
      </div>

      {stats.recentOrders?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-lg mb-3">Recent Orders</h2>
          <table className="w-full text-sm">
            <thead className="border-b"><tr>
              <th className="text-left p-2 font-medium text-gray-600">Order</th>
              <th className="text-left p-2 font-medium text-gray-600">Customer</th>
              <th className="text-left p-2 font-medium text-gray-600">Amount</th>
              <th className="text-left p-2 font-medium text-gray-600">Attribution</th>
              <th className="text-left p-2 font-medium text-gray-600">Status</th>
              <th className="text-left p-2 font-medium text-gray-600"></th>
            </tr></thead>
            <tbody className="divide-y">
              {stats.recentOrders.map((o: any) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="p-2 font-mono"><Link href={`/admin/orders/${o.id}`} className="text-primary-600 hover:underline">{o.orderId}</Link></td>
                  <td className="p-2">{o.customer?.name || '-'}</td>
                  <td className="p-2">₹{o.amount}</td>
                  <td className="p-2">{o.employee ? <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{o.employee.name}</span> : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Direct</span>}</td>
                  <td className="p-2"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${o.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{o.status}</span></td>
                  <td className="p-2"><Link href={`/admin/orders/${o.id}`} className="text-xs text-primary-600 hover:underline">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
