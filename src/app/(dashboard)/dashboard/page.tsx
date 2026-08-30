"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function CustomerDashboard() {
  const [customer, setCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [baseUrl, setBaseUrl] = useState('')

  useEffect(() => {
    setBaseUrl(window.location.origin)
    const token = localStorage.getItem('token')
    fetch('/api/customer/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setCustomer(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="animate-pulse space-y-4">
    <div className="h-8 bg-gray-200 rounded w-48"></div>
    <div className="grid md:grid-cols-3 gap-4">
      {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>)}
    </div>
  </div>

  if (!customer) return <div className="text-center py-12 text-gray-500">Could not load dashboard data.</div>

  const readableCardId = customer.card?.cardId || ''

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">MySmartCard Dashboard</h1>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="text-sm text-gray-500 mb-1">My Card</div>
          <div className="text-2xl font-bold">{readableCardId || 'Not assigned'}</div>
          <div className="mt-1 text-sm">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              customer.card?.status === 'Active' ? 'bg-green-100 text-green-700' :
              customer.card?.status === 'Delivered' ? 'bg-blue-100 text-blue-700' :
              customer.card ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {customer.card?.status || 'Unassigned'}
            </span>
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500 mb-1">Total Orders</div>
          <div className="text-2xl font-bold">{customer.orders?.length || 0}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500 mb-1">Profile URL</div>
          <div className="text-sm font-mono text-primary-600 break-all">
            {readableCardId ? `${baseUrl}/p/${readableCardId}` : 'N/A'}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Link href="/dashboard/profile" className="card hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-lg mb-2">Edit Profile</h3>
          <p className="text-gray-600 text-sm">Update your profile details. Changes appear instantly on your digital profile.</p>
        </Link>
        <Link href="/dashboard/card" className="card hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-lg mb-2">My Card</h3>
          <p className="text-gray-600 text-sm">View your card details, QR codes, and NFC information.</p>
        </Link>
      </div>
    </div>
  )
}
