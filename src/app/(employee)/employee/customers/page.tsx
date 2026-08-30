"use client"
import { useEffect, useState } from 'react'

export default function EmployeeCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('/api/employee/customers', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setCustomers(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-48"></div><div className="h-64 bg-gray-200 rounded-xl"></div></div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Customers ({customers.length})</h1>
      {customers.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">No customers yet.</p>
          <p className="text-sm text-gray-400">Share your referral link or register customers from the New Order page.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium text-gray-600">Name</th>
                <th className="text-left p-3 font-medium text-gray-600">Email</th>
                <th className="text-left p-3 font-medium text-gray-600">Mobile</th>
                <th className="text-left p-3 font-medium text-gray-600">Card ID</th>
                <th className="text-left p-3 font-medium text-gray-600">Order</th>
                <th className="text-left p-3 font-medium text-gray-600">Source</th>
                <th className="text-left p-3 font-medium text-gray-600">Card Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customers.map((c) => {
                const latestOrder = c.orders?.[0]
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="p-3 text-gray-600">{c.email}</td>
                    <td className="p-3 text-gray-600">{c.mobile}</td>
                    <td className="p-3 font-mono text-primary-600">{c.card?.cardId || '-'}</td>
                    <td className="p-3">
                      {latestOrder ? (
                        <div>
                          <span className="font-mono text-xs">{latestOrder.orderId}</span>
                          <div className="text-xs text-gray-400">₹{latestOrder.amount}</div>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="p-3">
                      {latestOrder?.attributionType === 'link' && (
                        <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">Link</span>
                      )}
                      {latestOrder?.attributionType === 'manual_code' && (
                        <span className="px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700">Code</span>
                      )}
                      {!latestOrder?.attributionType && (
                        <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500">Direct</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        c.card?.status === 'Active' ? 'bg-green-100 text-green-700' :
                        c.card?.status === 'Delivered' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {c.card?.status || 'Pending'}
                      </span>
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
