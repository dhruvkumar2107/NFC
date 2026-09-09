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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm">Real-time confirmed sales and platform overview</p>
        </div>
        {stats.failedOrders > 0 && (
          <Link
            href="/admin/orders?status=Payment+Failed"
            className="px-3.5 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors flex items-center gap-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            {stats.failedOrders} Failed {stats.failedOrders === 1 ? 'Payment' : 'Payments'}
          </Link>
        )}
      </div>

      {/* Top Primary Metrics - Confirmed Sales & Revenue */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white shadow-sm">
          <div className="text-sm opacity-90 font-medium">Total Confirmed Revenue</div>
          <div className="text-2xl font-bold mt-1">₹{stats.totalRevenue.toLocaleString()}</div>
          <div className="text-xs opacity-80 mt-1">excludes failed & pending</div>
        </div>
        <div className="card shadow-sm">
          <div className="text-sm text-gray-500 font-medium">Confirmed Sales</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.totalOrders}</div>
          <div className="text-xs text-gray-400 mt-1">
            {stats.pendingOrders > 0 ? `${stats.pendingOrders} pending checkout` : 'All payments settled'}
          </div>
        </div>
        <div className="card shadow-sm">
          <div className="text-sm text-gray-500 font-medium">Total Commission</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">₹{stats.totalCommission.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">paid on confirmed sales</div>
        </div>
        <div className={`card shadow-sm ${stats.failedOrders > 0 ? 'bg-red-50/70 border-red-200' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 font-medium">Failed Payments</div>
            {stats.failedOrders > 0 && (
              <span className="text-[10px] uppercase tracking-wider font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Alert</span>
            )}
          </div>
          <div className={`text-2xl font-bold mt-1 ${stats.failedOrders > 0 ? 'text-red-600' : 'text-gray-400'}`}>
            {stats.failedOrders}
          </div>
          {stats.failedOrders > 0 ? (
            <Link href="/admin/orders?status=Payment+Failed" className="text-xs text-red-600 hover:underline mt-1 inline-block font-medium">
              View failed payments →
            </Link>
          ) : (
            <div className="text-xs text-gray-400 mt-1">No failed payments</div>
          )}
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="card"><div className="text-sm text-gray-500 font-medium">Active Customers</div><div className="text-2xl font-bold mt-1">{stats.totalCustomers}</div></div>
        <div className="card"><div className="text-sm text-gray-500 font-medium">Employees</div><div className="text-2xl font-bold mt-1">{stats.totalEmployees}</div></div>
        <div className="card bg-blue-50/60 border-blue-200">
          <div className="text-sm text-blue-700 font-medium">Referred Sales</div>
          <div className="text-2xl font-bold text-blue-800 mt-1">{stats.referredSales}</div>
          <div className="text-xs text-blue-600 mt-0.5">confirmed via referral</div>
        </div>
        <div className="card bg-gray-50 border-gray-200">
          <div className="text-sm text-gray-700 font-medium">Direct Sales</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{stats.directSales}</div>
          <div className="text-xs text-gray-500 mt-0.5">organic web purchases</div>
        </div>
      </div>

      {/* Employee Leaderboard */}
      {stats.employeeStats?.length > 0 && (
        <div className="card mb-6 shadow-sm">
          <h2 className="font-semibold text-lg mb-3">Employee Leaderboard (Confirmed Sales)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50/50"><tr>
                <th className="text-left p-2.5 font-medium text-gray-600">#</th>
                <th className="text-left p-2.5 font-medium text-gray-600">Employee</th>
                <th className="text-left p-2.5 font-medium text-gray-600">Confirmed Sales</th>
                <th className="text-left p-2.5 font-medium text-gray-600">Revenue</th>
                <th className="text-left p-2.5 font-medium text-gray-600">Commission (₹100/card)</th>
                <th className="text-left p-2.5 font-medium text-gray-600">Points</th>
                <th className="text-left p-2.5 font-medium text-gray-600">Status</th>
              </tr></thead>
              <tbody className="divide-y">
                {stats.employeeStats.map((emp: any, i: number) => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="p-2.5 font-bold text-gray-400">{i + 1}</td>
                    <td className="p-2.5">
                      <Link href={`/admin/employees/${emp.id}`} className="font-medium text-primary-600 hover:underline">
                        {emp.name}
                      </Link>
                      <div className="text-xs text-gray-400">{emp.employeeId}</div>
                    </td>
                    <td className="p-2.5 font-bold">{emp.salesCount}</td>
                    <td className="p-2.5">₹{emp.revenue.toLocaleString()}</td>
                    <td className="p-2.5 text-green-600 font-semibold">₹{emp.commission.toLocaleString()}</td>
                    <td className="p-2.5">
                      <span className="text-primary-600 font-bold">{emp.totalPoints || 0}</span>
                      <div className="text-xs text-gray-400">avail: {emp.availablePoints || 0}</div>
                    </td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Nav Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Link href="/admin/orders" className="card hover:shadow-md transition-shadow">
          <h3 className="font-semibold flex items-center justify-between">
            <span>📦 All Orders</span>
            {stats.failedOrders > 0 && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">
                {stats.failedOrders} failed
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-600">View and manage orders</p>
        </Link>
        <Link href="/admin/customers" className="card hover:shadow-md transition-shadow">
          <h3 className="font-semibold">👥 Customers</h3>
          <p className="text-sm text-gray-600">Manage customers</p>
        </Link>
        <Link href="/admin/employees" className="card hover:shadow-md transition-shadow">
          <h3 className="font-semibold">👤 Employees</h3>
          <p className="text-sm text-gray-600">Manage sales team</p>
        </Link>
        <Link href="/admin/wallet" className="card hover:shadow-md transition-shadow">
          <h3 className="font-semibold">💸 Wallet</h3>
          <p className="text-sm text-gray-600">All transactions</p>
        </Link>
      </div>

      {/* Recent Orders */}
      {stats.recentOrders?.length > 0 && (
        <div className="card shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-primary-600 hover:underline">View All →</Link>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50/50"><tr>
              <th className="text-left p-2.5 font-medium text-gray-600">Order</th>
              <th className="text-left p-2.5 font-medium text-gray-600">Customer</th>
              <th className="text-left p-2.5 font-medium text-gray-600">Amount</th>
              <th className="text-left p-2.5 font-medium text-gray-600">Attribution</th>
              <th className="text-left p-2.5 font-medium text-gray-600">Status</th>
              <th className="text-left p-2.5 font-medium text-gray-600"></th>
            </tr></thead>
            <tbody className="divide-y">
              {stats.recentOrders.map((o: any) => {
                const isConfirmed = o.status === 'Payment Received' || o.status === 'Delivered'
                const isFailed = o.status === 'Payment Failed' || o.status === 'Failed'
                return (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="p-2.5 font-mono">
                      <Link href={`/admin/orders/${o.id}`} className="text-primary-600 hover:underline">
                        {o.orderId}
                      </Link>
                    </td>
                    <td className="p-2.5">{o.customer?.name || '-'}</td>
                    <td className="p-2.5 font-medium">₹{o.amount}</td>
                    <td className="p-2.5">
                      {o.employee ? (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
                          {o.employee.name}
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Direct</span>
                      )}
                    </td>
                    <td className="p-2.5">
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
                    <td className="p-2.5">
                      <Link href={`/admin/orders/${o.id}`} className="text-xs text-primary-600 hover:underline">View</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
