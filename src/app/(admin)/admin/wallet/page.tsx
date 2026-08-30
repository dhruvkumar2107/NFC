"use client"
import { useEffect, useState } from 'react'

export default function AdminWalletPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ employee: '', type: '' })

  function fetchTransactions() {
    setLoading(true)
    const token = localStorage.getItem('token')
    const params = new URLSearchParams()
    if (filter.employee) params.set('employee_id', filter.employee)
    if (filter.type) params.set('type', filter.type)
    fetch(`/api/admin/wallet-transactions?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setTransactions(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchTransactions() }, [])

  const types = Array.from(new Set(transactions.map(t => t.type)))

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Wallet Transactions ({transactions.length})</h1>

      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div><label className="label">Type</label>
            <select className="input-field" value={filter.type} onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}>
              <option value="">All Types</option>
              {types.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <button onClick={fetchTransactions} className="btn-primary">Filter</button>
        </div>
      </div>

      {loading ? <div className="animate-pulse h-64 bg-gray-200 rounded-xl"></div> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr>
              <th className="text-left p-3 font-medium text-gray-600">Date</th>
              <th className="text-left p-3 font-medium text-gray-600">Employee</th>
              <th className="text-left p-3 font-medium text-gray-600">Type</th>
              <th className="text-left p-3 font-medium text-gray-600">Points</th>
              <th className="text-left p-3 font-medium text-gray-600">Description</th>
            </tr></thead>
            <tbody className="divide-y">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="p-3 text-gray-600">{new Date(t.createdAt).toLocaleString()}</td>
                  <td className="p-3">{t.employee?.name} <span className="text-xs text-gray-400">({t.employee?.employeeId})</span></td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${t.type === 'commission_earned' ? 'bg-green-100 text-green-700' : t.type === 'redemption_request' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100'}`}>{t.type.replace(/_/g, ' ')}</span></td>
                  <td className={`p-3 font-bold ${t.points > 0 ? 'text-green-600' : 'text-red-600'}`}>{t.points > 0 ? '+' : ''}{t.points}</td>
                  <td className="p-3 text-gray-600 text-xs max-w-xs truncate">{t.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
