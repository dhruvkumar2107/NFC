"use client"
import { useEffect, useState, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function SuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const razorpayPaymentId = searchParams.get('razorpay_payment_id')
  const razorpayOrderId = searchParams.get('razorpay_order_id')
  const razorpaySignature = searchParams.get('razorpay_signature')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const verifyPayment = useCallback(async (oid: string, paymentId?: string, orderId?: string, signature?: string) => {
    if (!paymentId || !orderId || !signature) return false
    try {
      const res = await fetch('/api/orders/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: oid,
          razorpay_payment_id: paymentId,
          razorpay_order_id: orderId,
          razorpay_signature: signature,
        }),
      })
      const result = await res.json()
      return result.success
    } catch {
      return false
    }
  }, [])

  const fetchOrderStatus = useCallback(async (oid: string) => {
    try {
      const res = await fetch(`/api/orders/status?orderId=${oid}`)
      const d = await res.json()
      if (d.success) setData(d.data)
      setLoading(false)
      return d.data
    } catch {
      setLoading(false)
      return null
    }
  }, [])

  useEffect(() => {
    if (!orderId) { setLoading(false); return }

    const init = async () => {
      if (razorpayPaymentId && razorpayOrderId && razorpaySignature) {
        setVerifying(true)
        const success = await verifyPayment(orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature)
        setVerifying(false)
      }
      await fetchOrderStatus(orderId)
    }
    init()
  }, [orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature, verifyPayment, fetchOrderStatus])

  useEffect(() => {
    if (!orderId || !data || retryCount >= 5) return
    if (data.status === 'Pending') {
      const timer = setTimeout(async () => {
        setRetryCount(prev => prev + 1)
        const updated = await fetchOrderStatus(orderId)
        if (updated && updated.status === 'Pending' && retryCount < 4) {
          if (razorpayPaymentId && razorpayOrderId && razorpaySignature) {
            setVerifying(true)
            await verifyPayment(orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature)
            setVerifying(false)
            await fetchOrderStatus(orderId)
          }
        }
      }, 3000 * (retryCount + 1))
      return () => clearTimeout(timer)
    }
  }, [data, orderId, retryCount, fetchOrderStatus, verifyPayment, razorpayPaymentId, razorpayOrderId, razorpaySignature])

  function sendToWhatsApp() {
    if (!data) return
    const phone = data.customerWhatsapp || data.customerMobile || ''
    const cleanedPhone = phone.replace(/[^0-9]/g, '')
    const message = encodeURIComponent(
      `*MySmartCard Order Confirmation*\n\n` +
      `Order ID: ${data.orderId}\n` +
      `Card ID: ${data.cardId || 'Pending'}\n` +
      `Design: ${data.design}\n` +
      `Amount: ₹${data.amount}\n` +
      `Status: ${data.status}\n` +
      `Customer: ${data.customerName || '-'}\n` +
      `Email: ${data.customerEmail || '-'}\n` +
      `Mobile: ${data.customerMobile || '-'}\n\n` +
      `Thank you for your order!\n` +
      `Profile: ${typeof window !== 'undefined' ? window.location.origin : ''}/p/${data.cardId}`
    )
    if (cleanedPhone) {
      window.open(`https://wa.me/${cleanedPhone}?text=${message}`, '_blank')
    } else {
      navigator.clipboard.writeText(message.replace(/%20/g, ' ').replace(/\n/g, '\n'))
      alert('Order details copied to clipboard! No WhatsApp number found.')
    }
  }

  if (loading || verifying) return (
    <div className="py-20 text-center">
      <div className="animate-spin h-12 w-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="text-gray-500">{verifying ? 'Verifying your payment...' : 'Loading order details...'}</p>
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

  if (data.status === 'Pending') return (
    <div className="py-20 text-center">
      <div className="animate-spin h-12 w-12 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4"></div>
      <h1 className="text-3xl font-bold mb-4">Payment Processing</h1>
      <p className="text-gray-500 mb-4">Your payment is being verified. This may take a few moments.</p>
      <p className="text-sm text-gray-400 mb-6">Order ID: <span className="font-mono font-bold">{data.orderId}</span></p>
      <p className="text-sm text-gray-400 mb-8">If money was deducted, your order will be confirmed shortly. Please do not close this page.</p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button onClick={async () => {
          setRetryCount(0)
          setLoading(true)
          if (razorpayPaymentId && razorpayOrderId && razorpaySignature) {
            setVerifying(true)
            await verifyPayment(orderId!, razorpayPaymentId, razorpayOrderId, razorpaySignature)
            setVerifying(false)
          }
          await fetchOrderStatus(orderId!)
        }} className="btn-primary">Retry Verification</button>
        <Link href="/order" className="btn-secondary">Place New Order</Link>
      </div>
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

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <Link href={`/p/${data.cardId}`} className="btn-primary">View Your Profile</Link>
          <Link href="/login" className="btn-secondary">Login to Dashboard</Link>
        </div>

        <button onClick={sendToWhatsApp} className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
          Send Order Details to WhatsApp
        </button>
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
