'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface OrderForm {
  designId: string
  fullName: string
  designation: string
  company: string
  mobile: string
  whatsapp: string
  email: string
  website: string
  instagram: string
  facebook: string
  linkedin: string
  location: string
  upiId: string
  profilePhotoUrl: string
  logoUrl: string
  description: string
  referralCode: string
}

const initialForm: OrderForm = {
  designId: '', fullName: '', designation: '', company: '', mobile: '', whatsapp: '',
  email: '', website: '', instagram: '', facebook: '', linkedin: '',
  location: '', upiId: '', profilePhotoUrl: '', logoUrl: '', description: '', referralCode: '',
}

function OrderContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<OrderForm>({
    ...initialForm,
    designId: searchParams.get('design') || '',
    referralCode: searchParams.get('referral') || '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof OrderForm, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [referralValid, setReferralValid] = useState<boolean | null>(null)
  const [designs, setDesigns] = useState<any[]>([])
  const [attributionType, setAttributionType] = useState('direct')

  useEffect(() => {
    const via = searchParams.get('via')
    if (via === 'link') setAttributionType('link')
    else if (searchParams.get('referral')) setAttributionType('manual_code')
  }, [searchParams])

  useEffect(() => {
    fetch('/api/designs').then(r => r.json()).then(d => {
      if (d.success) setDesigns(d.data)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (searchParams.get('design') && designs.length > 0) {
      const exists = designs.find(d => d.id === searchParams.get('design'))
      if (exists) setForm(f => ({ ...f, designId: searchParams.get('design')! }))
    }
  }, [searchParams, designs])

  const selectedDesign = designs.find((d) => d.id === form.designId)

  const setField = (field: keyof OrderForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validateStep1 = (): boolean => {
    if (!form.designId) { setErrors({ designId: 'Please select a card design' }); return false }
    return true
  }

  const validateStep2 = (): boolean => {
    const newErrors: Partial<Record<keyof OrderForm, string>> = {}
    if (!form.fullName.trim()) newErrors.fullName = 'Full name is required'
    if (!form.mobile.trim()) newErrors.mobile = 'Mobile number is required'
    else if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) newErrors.mobile = 'Enter a valid 10-digit Indian mobile number'
    if (!form.email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) newErrors.email = 'Enter a valid email address'
    if (form.whatsapp && !/^[6-9]\d{9}$/.test(form.whatsapp.trim())) newErrors.whatsapp = 'Enter a valid 10-digit number'
    if (form.referralCode && referralValid === false) newErrors.referralCode = 'Invalid referral code'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  useEffect(() => {
    if (form.referralCode.trim().length >= 4) {
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/referral/validate?code=${encodeURIComponent(form.referralCode.trim())}`)
          const data = await res.json()
          setReferralValid(data.valid)
        } catch { setReferralValid(false) }
      }, 500)
      return () => clearTimeout(timer)
    } else { setReferralValid(null) }
  }, [form.referralCode])

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2)
    else if (step === 2 && validateStep2()) setStep(3)
    else if (step === 3) setStep(4)
  }

  const handleBack = () => { if (step > 1) setStep(step - 1) }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designId: form.designId,
          fullName: form.fullName.trim(),
          designation: form.designation.trim(),
          company: form.company.trim(),
          mobile: form.mobile.trim(),
          whatsapp: form.whatsapp.trim() || form.mobile.trim(),
          email: form.email.trim(),
          website: form.website.trim(),
          socialLinks: { instagram: form.instagram.trim(), facebook: form.facebook.trim(), linkedin: form.linkedin.trim() },
          location: form.location.trim(),
          upiId: form.upiId.trim(),
          profilePhotoUrl: form.profilePhotoUrl.trim(),
          logoUrl: form.logoUrl.trim(),
          description: form.description.trim(),
          referralCode: form.referralCode.trim() || undefined,
          attributionType: form.referralCode.trim() ? attributionType : 'direct',
        }),
      })
      const data = await res.json()
      if (!data.success) { alert(data.error || 'Something went wrong.'); setSubmitting(false); return }

      if (data.razorpayOrderId && data.razorpayKey) {
        const options = {
          key: data.razorpayKey,
          amount: data.amount * 100,
          currency: 'INR',
          name: 'MySmartCard',
          description: `${data.design} NFC Smart Card`,
          order_id: data.razorpayOrderId,
          handler: async function (response: any) {
            try {
              await fetch('/api/orders/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: data.orderId,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              })
            } catch {}
            router.push(`/order/success?orderId=${data.orderId}`)
          },
          prefill: { name: form.fullName, email: form.email, contact: form.mobile },
          theme: { color: '#2563eb' },
          modal: {
            ondismiss: function () {
              setSubmitting(false)
            }
          }
        }
        const rzp = new (window as any).Razorpay(options)
        rzp.open()
      } else {
        await fetch('/api/orders/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: data.orderId }),
        })
        router.push(`/order/success?orderId=${data.orderId}`)
      }
    } catch { alert('Failed to place order. Please try again.'); setSubmitting(false) }
  }

  return (
    <div className="py-20">
      <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-4">Place Your Order</h1>

          <div className="flex items-center justify-center gap-2 mb-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${s <= step ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{s}</div>
                {s < 4 && <div className={`w-12 h-0.5 ${s < step ? 'bg-primary-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-6 sm:gap-8 mb-10 text-xs sm:text-sm text-gray-500">
            <span className={step === 1 ? 'text-primary-600 font-semibold' : ''}>Design</span>
            <span className={step === 2 ? 'text-primary-600 font-semibold' : ''}>Details</span>
            <span className={step === 3 ? 'text-primary-600 font-semibold' : ''}>Preview</span>
            <span className={step === 4 ? 'text-primary-600 font-semibold' : ''}>Payment</span>
          </div>

          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Select Card Design</h2>
              {errors.designId && <p className="text-red-500 text-sm mb-4">{errors.designId}</p>}
              <div className="space-y-4">
                {designs.map((d) => (
                  <label key={d.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${form.designId === d.id ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="design" value={d.id} checked={form.designId === d.id} onChange={(e) => setField('designId', e.target.value)} className="sr-only" />
                    <div className="w-20 h-12 rounded-lg flex items-center justify-center bg-white border-2 border-gray-200 flex-shrink-0">
                      <span className="text-xs font-bold text-gray-700">{d.name}</span>
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold">{d.name}</span>
                      <div className="text-2xl font-bold text-primary-600">₹{d.price}</div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${form.designId === d.id ? 'border-primary-600 bg-primary-600' : 'border-gray-300'}`}>
                      {form.designId === d.id && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </label>
                ))}
                {designs.length === 0 && <p className="text-gray-500 text-center py-8">Loading designs...</p>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Customer Details</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-700">Personal Information</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input type="text" value={form.fullName} onChange={(e) => setField('fullName', e.target.value)}
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`} placeholder="John Doe" />
                      {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                      <input type="text" value={form.designation} onChange={(e) => setField('designation', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" placeholder="Founder & CEO" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company / Business</label>
                      <input type="text" value={form.company} onChange={(e) => setField('company', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" placeholder="Acme Pvt. Ltd." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input type="text" value={form.location} onChange={(e) => setField('location', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" placeholder="Mumbai, India" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-700">Contact Information</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mobile *</label>
                      <input type="tel" value={form.mobile} onChange={(e) => setField('mobile', e.target.value)}
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none ${errors.mobile ? 'border-red-500' : 'border-gray-300'}`} placeholder="9876543210" />
                      {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                      <input type="tel" value={form.whatsapp} onChange={(e) => setField('whatsapp', e.target.value)} className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none ${errors.whatsapp ? 'border-red-500' : 'border-gray-300'}`} placeholder="9876543210" />
                      {errors.whatsapp && <p className="text-red-500 text-xs mt-1">{errors.whatsapp}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)}
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none ${errors.email ? 'border-red-500' : 'border-gray-300'}`} placeholder="john@example.com" />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                      <input type="url" value={form.website} onChange={(e) => setField('website', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" placeholder="https://example.com" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-700">Social Links</h3>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                      <input type="text" value={form.instagram} onChange={(e) => setField('instagram', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" placeholder="@username" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                      <input type="text" value={form.facebook} onChange={(e) => setField('facebook', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" placeholder="facebook.com/username" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                      <input type="text" value={form.linkedin} onChange={(e) => setField('linkedin', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" placeholder="linkedin.com/in/username" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-700">Profile & Branding</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo URL</label>
                      <input type="url" value={form.profilePhotoUrl} onChange={(e) => setField('profilePhotoUrl', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" placeholder="https://example.com/photo.jpg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                      <input type="url" value={form.logoUrl} onChange={(e) => setField('logoUrl', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" placeholder="https://example.com/logo.png" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description / Bio</label>
                    <textarea value={form.description} onChange={(e) => setField('description', e.target.value)} rows={3} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none" placeholder="Tell people about yourself or your business..." />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-700">Payment</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
                      <input type="text" value={form.upiId} onChange={(e) => setField('upiId', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" placeholder="yourname@upi" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Referral / Employee Code</label>
                      <input type="text" value={form.referralCode} onChange={(e) => setField('referralCode', e.target.value)}
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none ${errors.referralCode ? 'border-red-500' : form.referralCode && referralValid === true ? 'border-green-500' : 'border-gray-300'}`} placeholder="Optional" />
                      {errors.referralCode && <p className="text-red-500 text-xs mt-1">{errors.referralCode}</p>}
                      {form.referralCode && referralValid === true && <p className="text-green-600 text-xs mt-1">Valid referral code</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && selectedDesign && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Preview Your Profile</h2>
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md mx-auto border border-gray-200">
                <div className="bg-gradient-to-br from-primary-600 to-primary-800 p-6 text-white">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-white/20 flex-shrink-0">
                      {form.profilePhotoUrl ? (
                        <img src={form.profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold">{form.fullName ? form.fullName.charAt(0) : '?'}</div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{form.fullName || 'Your Name'}</h3>
                      {form.designation && <p className="text-sm opacity-80">{form.designation}</p>}
                      {form.company && <p className="text-sm opacity-70">{form.company}</p>}
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {form.description && <p className="text-gray-600 text-sm">{form.description}</p>}
                  <div className="space-y-2 text-sm">
                    {form.mobile && <div className="flex items-center gap-2 text-gray-700"><span>📱</span> <span>{form.mobile}</span></div>}
                    {form.email && <div className="flex items-center gap-2 text-gray-700"><span>✉️</span> <span>{form.email}</span></div>}
                    {form.location && <div className="flex items-center gap-2 text-gray-700"><span>📍</span> <span>{form.location}</span></div>}
                    {form.website && <div className="flex items-center gap-2 text-gray-700"><span>🌐</span> <span>{form.website}</span></div>}
                  </div>
                  {(form.instagram || form.facebook || form.linkedin) && (
                    <div className="flex gap-3 pt-2">
                      {form.instagram && <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-medium">Instagram</span>}
                      {form.facebook && <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Facebook</span>}
                      {form.linkedin && <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">LinkedIn</span>}
                    </div>
                  )}
                  {form.upiId && (
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-sm text-gray-700"><span>💳</span> <span>UPI: {form.upiId}</span></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 4 && selectedDesign && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
              <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-md mx-auto">
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
                  <div className="w-16 h-10 rounded-lg flex items-center justify-center bg-white border-2 border-gray-200">
                    <span className="text-xs font-bold text-gray-700">{selectedDesign.name}</span>
                  </div>
                  <div>
                    <div className="font-semibold">{selectedDesign.name} Card</div>
                    <div className="text-sm text-gray-500">NFC Smart Card</div>
                  </div>
                </div>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">{form.fullName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium">{form.email}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Mobile</span><span className="font-medium">{form.mobile}</span></div>
                  {form.referralCode && referralValid && (
                    <div className="flex justify-between"><span className="text-gray-500">Referral</span><span className="font-medium text-green-600">{form.referralCode}</span></div>
                  )}
                </div>
                <div className="border-t border-gray-100 pt-4 flex justify-between">
                  <span className="font-semibold text-lg">Total</span>
                  <span className="font-bold text-xl text-primary-600">₹{selectedDesign.price}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-10 max-w-md mx-auto">
            {step > 1 ? (
              <button onClick={handleBack} className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">Back</button>
            ) : <div />}
            {step < 4 ? (
              <button onClick={handleNext} className="px-8 py-3 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors">Continue</button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                className="px-8 py-3 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Processing...
                  </span>
                ) : `Pay ₹${selectedDesign?.price || 0}`}
              </button>
            )}
          </div>
      </div>
    </div>
  )
}

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-gray-500">Loading...</div>}>
      <OrderContent />
    </Suspense>
  )
}
