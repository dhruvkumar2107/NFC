"use client"
import { useEffect, useState } from 'react'

export default function EmployeeWalletPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [redeemPoints, setRedeemPoints] = useState('')
  const [upiId, setUpiId] = useState('')
  const [notes, setNotes] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [msg, setMsg] = useState('')

  function fetchWallet() {
    const token = localStorage.getItem('token')
    fetch('/api/employee/wallet', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchWallet() }, [])

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault()
    const pts = parseInt(redeemPoints)
    if (!pts || pts <= 0) return
    if (!upiId) { setMsg('UPI ID is required'); return }

    setRedeeming(true)
    setMsg('')
    const token = localStorage.getItem('token')
    const res = await fetch('/api/employee/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ points: pts, upiId, notes }),
    })
    const d = await res.json()
    if (d.success) {
      setMsg(`Redemption request for ${pts} points (₹${pts}) submitted!`)
      setRedeemPoints('')
      setUpiId('')
      setNotes('')
      fetchWallet()
    } else {
      setMsg(d.error || 'Failed')
    }
    setRedeeming(false)
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-48"></div><div className="grid md:grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-28 bg-gray-200 rounded-xl"></div>)}</div></div>

  if (!data) return <div className="text-center py-12 text-gray-500">Could not load wallet.</div>

  const w = data.wallet || {}

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Wallet</h1>

      {/* Wallet Stats */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="text-sm opacity-80">Available Points</div>
          <div className="text-4xl font-bold mt-1">{w.availablePoints || 0}</div>
          <div className="text-sm opacity-80 mt-1">= ₹{w.availablePoints || 0}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500">Total Earned</div>
          <div className="text-3xl font-bold text-primary-600">{w.totalPoints || 0}</div>
          <div className="text-sm text-gray-400">= ₹{w.totalPoints || 0}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500">Redeemed</div>
          <div className="text-3xl font-bold text-orange-500">{w.redeemedPoints || 0}</div>
          <div className="text-sm text-gray-400">= ₹{w.redeemedPoints || 0}</div>
        </div>
      </div>

      {/* How it works */}
      <div className="card mb-6 bg-blue-50 border-blue-200">
        <h2 className="font-semibold text-blue-800 mb-2">How Points Work</h2>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Earn 1 point for every ₹1 commission you earn from card sales</li>
          <li>• Points accumulate as you sell more cards</li>
          <li>• Redeem points for cash via UPI (1 point = ₹1)</li>
          <li>• Admin reviews and approves redemption requests</li>
        </ul>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Redeem Form */}
        <div className="card">
          <h2 className="font-semibold text-lg mb-4">Redeem Points</h2>
          {msg && <div className={`p-3 rounded-lg mb-4 text-sm ${msg.includes('success') || msg.includes('submitted') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg}</div>}
          <form onSubmit={handleRedeem} className="space-y-4">
            <div>
              <label className="label">Points to Redeem</label>
              <input type="number" min="1" max={w.availablePoints || 0} className="input-field" value={redeemPoints} onChange={e => setRedeemPoints(e.target.value)} placeholder={`Max: ${w.availablePoints || 0}`} required />
              <p className="text-xs text-gray-500 mt-1">1 point = ₹1. You will receive this amount via UPI.</p>
            </div>
            <div>
              <label className="label">Your UPI ID</label>
              <input className="input-field" value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="yourname@upi" required />
            </div>
            <div>
              <label className="label">Notes (optional)</label>
              <input className="input-field" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes for admin" />
            </div>
            <button type="submit" disabled={redeeming || !w.availablePoints} className="btn-primary w-full">
              {redeeming ? 'Submitting...' : `Redeem ${redeemPoints || 0} Points (₹${redeemPoints || 0})`}
            </button>
          </form>
        </div>

        {/* Recent Redemption Requests */}
        <div className="card">
          <h2 className="font-semibold text-lg mb-4">Redemption History</h2>
          {data.redemptions?.length === 0 ? (
            <p className="text-gray-500 text-sm">No redemption requests yet.</p>
          ) : (
            <div className="space-y-3">
              {data.redemptions?.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div>
                    <div className="font-medium">{r.points} points = ₹{r.amount}</div>
                    <div className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-400">UPI: {r.upiId}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    r.status === 'paid' ? 'bg-green-100 text-green-700' :
                    r.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                    r.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transaction History */}
      <div className="card">
        <h2 className="font-semibold text-lg mb-4">Transaction History</h2>
        {data.transactions?.length === 0 ? (
          <p className="text-gray-500 text-sm">No transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left p-2 font-medium text-gray-600">Date</th>
                  <th className="text-left p-2 font-medium text-gray-600">Type</th>
                  <th className="text-left p-2 font-medium text-gray-600">Points</th>
                  <th className="text-left p-2 font-medium text-gray-600">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.transactions?.map((t: any) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="p-2 text-gray-600">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="p-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        t.type === 'commission_earned' ? 'bg-green-100 text-green-700' :
                        t.type === 'redemption_request' ? 'bg-orange-100 text-orange-700' :
                        t.type === 'redemption_rejected' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>{t.type.replace(/_/g, ' ')}</span>
                    </td>
                    <td className={`p-2 font-bold ${t.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {t.points > 0 ? '+' : ''}{t.points}
                    </td>
                    <td className="p-2 text-gray-600 text-xs">{t.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
