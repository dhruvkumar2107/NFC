"use client"
import { useEffect, useState } from 'react'

export default function AdminRedemptionsPage() {
  const [redemptions, setRedemptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('/api/admin/redemptions', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setRedemptions(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function updateStatus(id: string, status: string) {
    setProcessingId(id)
    const token = localStorage.getItem('token')
    const res = await fetch('/api/admin/redemptions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, status }),
    })
    const d = await res.json()
    if (d.success) {
      setRedemptions(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    } else {
      alert(d.error)
    }
    setProcessingId(null)
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-48"></div></div>

  const pending = redemptions.filter(r => r.status === 'pending')
  const processed = redemptions.filter(r => r.status !== 'pending')

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Redemption Requests ({redemptions.length})</h1>

      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-lg mb-3 text-orange-600">Pending ({pending.length})</h2>
          <div className="space-y-3">
            {pending.map(r => (
              <div key={r.id} className="card flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold">{r.employee?.name}</span>
                    <span className="text-xs text-gray-500">({r.employee?.employeeId})</span>
                  </div>
                  <div className="text-lg font-bold text-primary-600">{r.points} points = ₹{r.amount}</div>
                  <div className="text-sm text-gray-600">UPI: {r.upiId}</div>
                  {r.notes && <div className="text-xs text-gray-400 mt-1">Note: {r.notes}</div>}
                  <div className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(r.id, 'approved')}
                    disabled={processingId === r.id}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => updateStatus(r.id, 'paid')}
                    disabled={processingId === r.id}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    Mark Paid
                  </button>
                  <button
                    onClick={() => updateStatus(r.id, 'rejected')}
                    disabled={processingId === r.id}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {processed.length > 0 && (
        <div>
          <h2 className="font-semibold text-lg mb-3">Processed</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-600">Employee</th>
                  <th className="text-left p-3 font-medium text-gray-600">Points</th>
                  <th className="text-left p-3 font-medium text-gray-600">Amount</th>
                  <th className="text-left p-3 font-medium text-gray-600">UPI</th>
                  <th className="text-left p-3 font-medium text-gray-600">Status</th>
                  <th className="text-left p-3 font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {processed.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="p-3">{r.employee?.name} <span className="text-xs text-gray-400">({r.employee?.employeeId})</span></td>
                    <td className="p-3 font-bold">{r.points}</td>
                    <td className="p-3">₹{r.amount}</td>
                    <td className="p-3 text-xs font-mono">{r.upiId}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.status === 'paid' ? 'bg-green-100 text-green-700' :
                        r.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                        r.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{r.status}</span>
                    </td>
                    <td className="p-3 text-gray-600">{new Date(r.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {redemptions.length === 0 && (
        <div className="card text-center py-12 text-gray-500">No redemption requests yet.</div>
      )}
    </div>
  )
}
