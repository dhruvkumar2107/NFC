"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function EmployeeDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const headers = { Authorization: `Bearer ${token}` }
    Promise.all([
      fetch('/api/employee/me', { headers }).then(r => r.json()),
      fetch('/api/employee/reports', { headers }).then(r => r.json()),
      fetch('/api/employee/wallet', { headers }).then(r => r.json()),
    ]).then(([me, reports, wallet]) => {
      if (me.success) setData({
        ...me.data,
        reports: reports.success ? reports.data : null,
        wallet: wallet.success ? wallet.data?.wallet : null,
      })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="animate-pulse space-y-4">
    <div className="h-8 bg-gray-200 rounded w-48"></div>
    <div className="grid md:grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>)}</div>
  </div>

  if (!data) return <div className="text-center py-12 text-gray-500">Could not load dashboard.</div>

  const r = data.reports || {}
  const w = data.wallet || {}

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Welcome, {data.name}</h1>
      <p className="text-gray-500 text-sm mb-6">Employee ID: {data.employeeId}</p>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="text-sm text-gray-500">Total Sales</div>
          <div className="text-2xl font-bold">{r.totalSales || 0}</div>
          <div className="text-xs text-gray-400">cards sold</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500">Revenue Generated</div>
          <div className="text-2xl font-bold">₹{(r.totalRevenue || 0).toLocaleString()}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500">Commission Earned</div>
          <div className="text-2xl font-bold text-green-600">₹{(r.totalCommission || 0).toLocaleString()}</div>
        </div>
        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="text-sm opacity-80">Available Points</div>
          <div className="text-2xl font-bold">{w.availablePoints || 0} pts</div>
          <div className="text-xs opacity-80">= ₹{w.availablePoints || 0}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600">{r.deliveredCount || 0}</div>
          <div className="text-sm text-gray-500">Delivered</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-yellow-600">{(r.totalSales || 0) - (r.deliveredCount || 0)}</div>
          <div className="text-sm text-gray-500">Pending Delivery</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600">{data.customers?.length || 0}</div>
          <div className="text-sm text-gray-500">My Customers</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-purple-600">{w.totalPoints || 0}</div>
          <div className="text-sm text-gray-500">Lifetime Points</div>
        </div>
      </div>

      {/* Referral Link */}
      <div className="card mb-6">
        <h2 className="font-semibold text-lg mb-2">Your Referral Link</h2>
        <p className="text-sm text-gray-600 mb-3">Share this link with customers to attribute sales and earn commission points:</p>
        <div className="flex items-center gap-2">
          <input readOnly value={`${typeof window !== 'undefined' ? window.location.origin : ''}/pay/${data.referralLinkCode}`} className="input-field flex-1 text-sm" />
          <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/pay/${data.referralLinkCode}`); alert('Copied!') }} className="btn-secondary whitespace-nowrap">Copy</button>
        </div>
        <p className="text-xs text-gray-400 mt-2">Or customers can enter your code: <span className="font-mono font-bold text-primary-600">{data.referralLinkCode}</span></p>
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-2 gap-6">
        <Link href="/employee/customers" className="card hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-lg mb-2">👥 My Customers</h3>
          <p className="text-gray-600 text-sm">View your customers and their cards.</p>
        </Link>
        <Link href="/employee/orders" className="card hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-lg mb-2">📦 My Orders</h3>
          <p className="text-gray-600 text-sm">Track your orders and mark them delivered.</p>
        </Link>
        <Link href="/employee/wallet" className="card hover:shadow-md transition-shadow border-green-200">
          <h3 className="font-semibold text-lg mb-2">💰 My Wallet</h3>
          <p className="text-gray-600 text-sm">View points, redeem for cash via UPI.</p>
        </Link>
        <Link href="/employee/reports" className="card hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-lg mb-2">📈 Reports</h3>
          <p className="text-gray-600 text-sm">Detailed sales report and earnings.</p>
        </Link>
      </div>
    </div>
  )
}
