"use client"
import { useEffect, useState } from 'react'

export default function EmployeeReportsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const headers = { Authorization: `Bearer ${token}` }
    Promise.all([
      fetch('/api/employee/reports', { headers }).then(r => r.json()),
      fetch('/api/employee/wallet', { headers }).then(r => r.json()),
    ]).then(([reports, wallet]) => {
      setData({
        ...(reports.success ? reports.data : {}),
        wallet: wallet.success ? wallet.data : null,
      })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-48"></div></div>
  if (!data) return <div className="text-center py-12 text-gray-500">Could not load reports.</div>

  const w = data.wallet?.wallet || {}

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Sales Report</h1>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="card text-center">
          <div className="text-sm text-gray-500">Total Sales</div>
          <div className="text-3xl font-bold">{data.totalSales || 0}</div>
        </div>
        <div className="card text-center">
          <div className="text-sm text-gray-500">Revenue Generated</div>
          <div className="text-3xl font-bold">₹{(data.totalRevenue || 0).toLocaleString()}</div>
        </div>
        <div className="card text-center">
          <div className="text-sm text-gray-500">Commission Earned</div>
          <div className="text-3xl font-bold text-green-600">₹{(data.totalCommission || 0).toLocaleString()}</div>
        </div>
        <div className="card text-center bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="text-sm opacity-80">Available Points</div>
          <div className="text-3xl font-bold">{w.availablePoints || 0}</div>
          <div className="text-xs opacity-80">= ₹{w.availablePoints || 0}</div>
        </div>
      </div>

      {/* Points Breakdown */}
      <div className="card mb-6">
        <h2 className="font-semibold text-lg mb-3">Points Summary</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{w.totalPoints || 0}</div>
            <div className="text-sm text-green-700">Total Earned</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{w.redeemedPoints || 0}</div>
            <div className="text-sm text-orange-700">Redeemed</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{w.availablePoints || 0}</div>
            <div className="text-sm text-blue-700">Available</div>
          </div>
        </div>
      </div>

      {data.orders?.length > 0 && (
        <div className="overflow-x-auto">
          <h2 className="font-semibold text-lg mb-3">Order History</h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium text-gray-600">Date</th>
                <th className="text-left p-3 font-medium text-gray-600">Order ID</th>
                <th className="text-left p-3 font-medium text-gray-600">Customer</th>
                <th className="text-left p-3 font-medium text-gray-600">Amount</th>
                <th className="text-left p-3 font-medium text-gray-600">Commission</th>
                <th className="text-left p-3 font-medium text-gray-600">Points</th>
                <th className="text-left p-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.orders.map((o: any) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="p-3">{new Date(o.orderDate).toLocaleDateString()}</td>
                  <td className="p-3 font-mono">{o.orderId}</td>
                  <td className="p-3">{o.customer?.name || '-'}</td>
                  <td className="p-3">₹{o.amount}</td>
                  <td className="p-3 text-green-600">₹{o.commissionAmount || 0}</td>
                  <td className="p-3 font-bold text-primary-600">+{o.commissionPoints || 0}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${o.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {o.status}
                    </span>
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
