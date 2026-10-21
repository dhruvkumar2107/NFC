"use client"
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api-client'

export default function AdminWalletPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [allTypes, setAllTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState({ employee: '', type: '' })

  useEffect(() => {
    apiFetch('/api/admin/employees')
      .then((d: any) => { if (d?.success) setEmployees(d.data || []) })
      .catch(() => {})
  }, [])

  async function fetchTransactions() {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (filter.employee) params.set('employee_id', filter.employee)
      if (filter.type) params.set('type', filter.type)
      const d: any = await apiFetch(`/api/admin/wallet-transactions?${params}`)
      const list: any[] = d?.data || []
      setTransactions(list)
      // Keep the Type filter options stable by deriving them only from the
      // unfiltered result, otherwise selecting one type hides all others.
      if (!filter.type) setAllTypes(Array.from(new Set(list.map((t) => t.type))))
    } catch (e: any) {
      setError(e.message || 'Failed to load wallet transactions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTransactions() }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Wallet Transactions ({transactions.length})</h1>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div><label className="label">Employee</label>
            <select className="input-field" value={filter.employee} onChange={e => setFilter(f => ({ ...f, employee: e.target.value }))}>
              <option value="">All Employees</option>
              {employees.map((emp: any) => <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeId})</option>)}
            </select>
          </div>
          <div><label className="label">Type</label>
            <select className="input-field" value={filter.type} onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}>
              <option value="">All Types</option>
              {allTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
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
              {transactions.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-gray-500">No transactions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
