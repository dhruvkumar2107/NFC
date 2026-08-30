"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function AdminCardsPage() {
  const [cards, setCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('/api/admin/cards', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setCards(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function updateStatus(cardId: string, status: string) {
    const token = localStorage.getItem('token')
    await fetch(`/api/admin/cards/${cardId}/status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    })
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, status } : c))
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-48"></div></div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Cards ({cards.length})</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3 font-medium text-gray-600">Card ID</th>
              <th className="text-left p-3 font-medium text-gray-600">Customer</th>
              <th className="text-left p-3 font-medium text-gray-600">Design</th>
              <th className="text-left p-3 font-medium text-gray-600">Employee</th>
              <th className="text-left p-3 font-medium text-gray-600">Status</th>
              <th className="text-left p-3 font-medium text-gray-600">Created</th>
              <th className="text-left p-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {cards.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="p-3 font-mono font-bold"><Link href={`/admin/cards/${c.id}`} className="text-primary-600 hover:underline">{c.cardId}</Link></td>
                <td className="p-3">{c.customer ? <Link href={`/admin/customers/${c.customer.id}`} className="text-primary-600 hover:underline">{c.customer.name}</Link> : <span className="text-gray-400">-</span>}</td>
                <td className="p-3">{c.design?.name || '-'}</td>
                <td className="p-3 text-gray-600 text-xs">{c.employee?.employeeId || '-'}</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.status === 'Active' ? 'bg-green-100 text-green-700' : c.status === 'Delivered' ? 'bg-blue-100 text-blue-700' : c.status === 'Deactivated' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{c.status}</span></td>
                <td className="p-3 text-gray-600 text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                <td className="p-3 space-x-2">
                  <Link href={`/admin/cards/${c.id}`} className="text-sm text-primary-600 hover:underline">View</Link>
                  {c.status !== 'Active' && <button onClick={() => updateStatus(c.id, 'Active')} className="text-sm text-green-600 hover:underline">Activate</button>}
                  {c.status !== 'Deactivated' && <button onClick={() => updateStatus(c.id, 'Deactivated')} className="text-sm text-red-600 hover:underline">Deactivate</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
