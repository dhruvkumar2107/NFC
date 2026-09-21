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
  let socialLinks: any = {}
  try { socialLinks = JSON.parse(customer.socialLinks || '{}') } catch { socialLinks = {} }
  let photos: string[] = []
  try { photos = JSON.parse(customer.photos || '[]') } catch { photos = [] }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {customer.name}</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your digital profile and card</p>
        </div>
        <Link href="/dashboard/profile" className="btn-primary text-sm">
          Edit Profile
        </Link>
      </div>

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
          {readableCardId && (
            <button onClick={() => { navigator.clipboard.writeText(`${baseUrl}/p/${readableCardId}`); alert('Profile URL copied!') }}
              className="mt-2 text-xs text-primary-600 hover:text-primary-700">Copy Link</button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Link href="/dashboard/profile" className="card hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-lg mb-2">Edit Profile</h3>
          <p className="text-gray-600 text-sm">Update your profile details. Changes appear instantly on your digital profile.</p>
        </Link>
        <Link href="/dashboard/card" className="card hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-lg mb-2">My Card</h3>
          <p className="text-gray-600 text-sm">View your card details, QR codes, and NFC information.</p>
        </Link>
      </div>

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Personal Information</h2>
          <Link href="/dashboard/profile" className="text-sm text-primary-600 hover:text-primary-700">Edit</Link>
        </div>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Full Name:</span> <span className="font-medium">{customer.name || '-'}</span></div>
          <div><span className="text-gray-500">Designation:</span> <span className="font-medium">{customer.designation || '-'}</span></div>
          <div><span className="text-gray-500">Company:</span> <span className="font-medium">{customer.company || '-'}</span></div>
          <div><span className="text-gray-500">University/College:</span> <span className="font-medium">{customer.college || '-'}</span></div>
          <div className="md:col-span-2"><span className="text-gray-500">About:</span> <span className="font-medium">{customer.description || '-'}</span></div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Contact Details</h2>
          <Link href="/dashboard/profile" className="text-sm text-primary-600 hover:text-primary-700">Edit</Link>
        </div>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Mobile:</span> <span className="font-medium">{customer.mobile || '-'}</span></div>
          <div><span className="text-gray-500">WhatsApp:</span> <span className="font-medium">{customer.whatsapp || '-'}</span></div>
          <div><span className="text-gray-500">Email:</span> <span className="font-medium">{customer.email || '-'}</span></div>
          <div><span className="text-gray-500">Website:</span> <span className="font-medium">{customer.website || '-'}</span></div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Address</h2>
          <Link href="/dashboard/profile" className="text-sm text-primary-600 hover:text-primary-700">Edit</Link>
        </div>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="md:col-span-2"><span className="text-gray-500">Address:</span> <span className="font-medium">{customer.address || '-'}</span></div>
          <div><span className="text-gray-500">Taluk:</span> <span className="font-medium">{customer.taluk || '-'}</span></div>
          <div><span className="text-gray-500">City:</span> <span className="font-medium">{customer.city || '-'}</span></div>
          <div><span className="text-gray-500">State:</span> <span className="font-medium">{customer.state || '-'}</span></div>
          <div><span className="text-gray-500">PIN Code:</span> <span className="font-medium">{customer.pincode || '-'}</span></div>
        </div>
      </div>

      {(Object.keys(socialLinks).length > 0) && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Social Links</h2>
            <Link href="/dashboard/profile" className="text-sm text-primary-600 hover:text-primary-700">Edit</Link>
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            {socialLinks.instagram && <div><span className="text-gray-500">Instagram:</span> <span className="font-medium">@{socialLinks.instagram}</span></div>}
            {socialLinks.facebook && <div><span className="text-gray-500">Facebook:</span> <span className="font-medium">{socialLinks.facebook}</span></div>}
            {socialLinks.linkedin && <div><span className="text-gray-500">LinkedIn:</span> <span className="font-medium">{socialLinks.linkedin}</span></div>}
            {socialLinks.twitter && <div><span className="text-gray-500">Twitter/X:</span> <span className="font-medium">{socialLinks.twitter}</span></div>}
            {socialLinks.youtube && <div><span className="text-gray-500">YouTube:</span> <span className="font-medium">{socialLinks.youtube}</span></div>}
          </div>
        </div>
      )}

      {(customer.logoUrl || customer.paymentQrUrl || photos.length > 0) && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Media</h2>
            <Link href="/dashboard/profile" className="text-sm text-primary-600 hover:text-primary-700">Edit</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {customer.logoUrl && (
              <div>
                <div className="text-xs text-gray-500 mb-1">Logo</div>
                <img src={customer.logoUrl} alt="Logo" className="w-full h-24 rounded-lg object-cover" />
              </div>
            )}
            {customer.paymentQrUrl && (
              <div>
                <div className="text-xs text-gray-500 mb-1">Payment QR</div>
                <img src={customer.paymentQrUrl} alt="Payment QR" className="w-full h-24 rounded-lg object-contain" />
              </div>
            )}
            {photos.map((photo: string, idx: number) => (
              <div key={idx}>
                <div className="text-xs text-gray-500 mb-1">Photo {idx + 1}</div>
                <img src={photo} alt={`Photo ${idx + 1}`} className="w-full h-24 rounded-lg object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {customer.orders && customer.orders.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-lg mb-4">Order History</h2>
          <div className="space-y-3">
            {customer.orders.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">{order.orderId}</div>
                  <div className="text-xs text-gray-500">{new Date(order.orderDate).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-sm">₹{order.amount}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    order.status === 'Confirmed' ? 'bg-green-100 text-green-700' :
                    order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
