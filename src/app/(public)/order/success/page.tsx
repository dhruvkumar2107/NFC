"use client"
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function SuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderId) { setLoading(false); return }
    fetch(`/api/orders/status?orderId=${orderId}`)
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [orderId])

  if (loading) return (
    <div className="py-20 text-center">
      <div className="animate-spin h-12 w-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="text-gray-500">Loading order details...</p>
    </div>
  )

  if (!data) return (
    <div className="py-20 text-center">
      <div className="text-6xl mb-4">📦</div>
      <h1 className="text-3xl font-bold mb-4">Order Not Found</h1>
      <p className="text-gray-500 mb-8">We couldn&apos;t find your order. Please check your order ID.</p>
      <Link href="/order" className="btn-primary">Place New Order</Link>
    </div>
  )

  return (
    <div className="py-20">
      <div className="max-w-lg mx-auto px-4 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
        <p className="text-gray-600 mb-8">Thank you for your order. Your NFC card is being prepared.</p>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 text-left">
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-gray-500">Order ID</span><span className="font-mono font-bold">{data.orderId}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Card ID</span><span className="font-mono font-bold text-primary-600">{data.cardId}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">{data.status}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-bold">₹{data.amount}</span></div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 text-left">
          <h2 className="font-semibold text-blue-800 mb-2">Your Login Credentials</h2>
          <p className="text-sm text-blue-700 mb-2">Use these to log in to your customer dashboard:</p>
          <div className="bg-white rounded-lg p-3 text-sm">
            <div><span className="text-gray-500">Email:</span> <span className="font-mono">{data.customerEmail}</span></div>
            <div><span className="text-gray-500">Password:</span> <span className="font-mono">Use your email as password (first login)</span></div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8 text-left">
          <h2 className="font-semibold text-green-800 mb-2">Profile URL</h2>
          <p className="text-sm text-green-700">Your digital profile is live at:</p>
          <p className="font-mono text-sm text-green-800 mt-1 break-all">/p/{data.cardId}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={`/p/${data.cardId}`} className="btn-primary">View Your Profile</Link>
          <Link href="/login" className="btn-secondary">Login to Dashboard</Link>
        </div>
      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-gray-500">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  )
}
