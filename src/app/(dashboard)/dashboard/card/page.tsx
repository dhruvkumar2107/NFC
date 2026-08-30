"use client"
import { useEffect, useState } from 'react'

export default function CardDetailsPage() {
  const [customer, setCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [profileQr, setProfileQr] = useState('')
  const [paymentQr, setPaymentQr] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('/api/customer/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setCustomer(d.data)
          const baseUrl = window.location.origin
          const readableCardId = d.data.card?.cardId
          if (readableCardId) {
            const profileUrl = `${baseUrl}/p/${readableCardId}`
            setProfileQr(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(profileUrl)}`)
          }
          if (d.data.upiId) {
            const paymentUrl = `upi://pay?pa=${encodeURIComponent(d.data.upiId)}&pn=${encodeURIComponent(d.data.name || '')}`
            setPaymentQr(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentUrl)}`)
          }
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="animate-pulse space-y-4">
    <div className="h-8 bg-gray-200 rounded w-48"></div>
    <div className="grid md:grid-cols-2 gap-4">
      {[1,2].map(i => <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>)}
    </div>
  </div>

  if (!customer) return <div className="text-center py-12 text-gray-500">Could not load card data.</div>

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const readableCardId = customer.card?.cardId || ''

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Card</h1>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <div className="text-sm text-gray-500 mb-1">Card ID</div>
          <div className="text-3xl font-bold text-primary-600">{readableCardId || 'Not assigned'}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500 mb-1">Status</div>
          <div className="text-2xl font-bold">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
              customer.card?.status === 'Active' ? 'bg-green-100 text-green-700' :
              customer.card?.status === 'Delivered' ? 'bg-blue-100 text-blue-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {customer.card?.status || 'Pending'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card text-center">
          <h2 className="font-semibold text-lg mb-4">QR #1 — Profile</h2>
          {profileQr ? (
            <img src={profileQr} alt="Profile QR" className="mx-auto mb-4" />
          ) : (
            <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 mb-4">No card assigned</div>
          )}
          <p className="text-sm text-gray-600 break-all">{baseUrl}/p/{readableCardId}</p>
          <button
            onClick={() => { navigator.clipboard.writeText(`${baseUrl}/p/${readableCardId}`); alert('Profile URL copied!') }}
            className="btn-secondary mt-3 text-sm"
          >
            Copy Link
          </button>
        </div>
        <div className="card text-center">
          <h2 className="font-semibold text-lg mb-4">QR #2 — Payment</h2>
          {paymentQr ? (
            <img src={paymentQr} alt="Payment QR" className="mx-auto mb-4" />
          ) : (
            <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 mb-4">Add UPI ID to generate payment QR</div>
          )}
          <p className="text-sm text-gray-600">{customer.upiId || 'No UPI ID set'}</p>
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="font-semibold text-lg mb-2">NFC Information</h2>
        <p className="text-gray-600 text-sm">Your NFC chip is programmed with your profile URL. Anyone with an NFC-enabled phone can tap your card to view your digital profile.</p>
        <p className="text-sm text-gray-600 mt-2">Profile URL: <span className="font-mono text-primary-600">{baseUrl}/p/{readableCardId}</span></p>
      </div>
    </div>
  )
}
