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

  const stepLabels = ['Design', 'Details', 'Preview', 'Payment']

  return (
    <div className="min-h-screen gradient-mesh">
      <div className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8 text-gray-900 tracking-tight animate-fade-in">
            Place Your Order
          </h1>

          {/* Step Indicator */}
          <div className="glass-strong rounded-full px-6 py-4 max-w-lg mx-auto mb-12 animate-fade-in">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200/60 -translate-y-1/2 rounded-full" />
              <div
                className="absolute top-1/2 left-0 h-0.5 bg-primary-500 -translate-y-1/2 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${((step - 1) / 3) * 100}%` }}
              />
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="relative z-10 flex flex-col items-center gap-2">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                    s <= step
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                      : 'glass text-gray-400'
                  }`}>
                    {s < step ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : s}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-3 px-1">
              {stepLabels.map((label, i) => (
                <span key={label} className={`text-[11px] font-medium transition-colors duration-300 ${
                  step === i + 1 ? 'text-primary-600' : 'text-gray-400'
                }`}>
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Step 1 - Design */}
          {step === 1 && (
            <div className="animate-slide-up">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Select Card Design</h2>
              {errors.designId && (
                <div className="glass rounded-2xl p-4 mb-6 border border-red-200/50 bg-red-50/50">
                  <p className="text-red-600 text-sm font-medium">{errors.designId}</p>
                </div>
              )}
              <div className="space-y-4">
                {designs.map((d) => (
                  <label
                    key={d.id}
                    className={`glass flex items-center gap-5 p-5 rounded-2xl cursor-pointer transition-all duration-300 ${
                      form.designId === d.id
                        ? 'ring-2 ring-primary-500/40 shadow-lg shadow-primary-500/10'
                        : 'hover:shadow-md'
                    }`}
                  >
                    <input type="radio" name="design" value={d.id} checked={form.designId === d.id} onChange={(e) => setField('designId', e.target.value)} className="sr-only" />
                    <div className="w-24 h-14 rounded-xl flex items-center justify-center bg-white border border-gray-200/60 flex-shrink-0 shadow-sm">
                      <span className="text-xs font-bold text-gray-700">{d.name}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-gray-900 block">{d.name}</span>
                      <div className="text-2xl font-bold text-primary-600 mt-0.5">₹{d.price}</div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                      form.designId === d.id ? 'border-primary-600 bg-primary-600 shadow-md shadow-primary-600/30' : 'border-gray-300'
                    }`}>
                      {form.designId === d.id && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </label>
                ))}
                {designs.length === 0 && (
                  <div className="glass rounded-2xl text-center py-12">
                    <p className="text-gray-500">Loading designs...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2 - Details */}
          {step === 2 && (
            <div className="animate-slide-up">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Customer Details</h2>
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="glass rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Personal Information</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Full Name *</label>
                      <input type="text" value={form.fullName} onChange={(e) => setField('fullName', e.target.value)}
                        className={`input-field ${errors.fullName ? '!border-red-400 !ring-red-400/20' : ''}`} placeholder="John Doe" />
                      {errors.fullName && <p className="text-red-500 text-xs mt-1.5">{errors.fullName}</p>}
                    </div>
                    <div>
                      <label className="label">Designation</label>
                      <input type="text" value={form.designation} onChange={(e) => setField('designation', e.target.value)}
                        className="input-field" placeholder="Founder & CEO" />
                    </div>
                    <div>
                      <label className="label">Company / Business</label>
                      <input type="text" value={form.company} onChange={(e) => setField('company', e.target.value)}
                        className="input-field" placeholder="Acme Pvt. Ltd." />
                    </div>
                    <div>
                      <label className="label">Location</label>
                      <input type="text" value={form.location} onChange={(e) => setField('location', e.target.value)}
                        className="input-field" placeholder="Mumbai, India" />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="glass rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Contact Information</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Mobile *</label>
                      <input type="tel" value={form.mobile} onChange={(e) => setField('mobile', e.target.value)}
                        className={`input-field ${errors.mobile ? '!border-red-400 !ring-red-400/20' : ''}`} placeholder="9876543210" />
                      {errors.mobile && <p className="text-red-500 text-xs mt-1.5">{errors.mobile}</p>}
                    </div>
                    <div>
                      <label className="label">WhatsApp</label>
                      <input type="tel" value={form.whatsapp} onChange={(e) => setField('whatsapp', e.target.value)}
                        className={`input-field ${errors.whatsapp ? '!border-red-400 !ring-red-400/20' : ''}`} placeholder="9876543210" />
                      {errors.whatsapp && <p className="text-red-500 text-xs mt-1.5">{errors.whatsapp}</p>}
                    </div>
                    <div>
                      <label className="label">Email *</label>
                      <input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)}
                        className={`input-field ${errors.email ? '!border-red-400 !ring-red-400/20' : ''}`} placeholder="john@example.com" />
                      {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email}</p>}
                    </div>
                    <div>
                      <label className="label">Website</label>
                      <input type="url" value={form.website} onChange={(e) => setField('website', e.target.value)}
                        className="input-field" placeholder="https://example.com" />
                    </div>
                  </div>
                </div>

                {/* Social Links */}
                <div className="glass rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Social Links</h3>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="label">Instagram</label>
                      <input type="text" value={form.instagram} onChange={(e) => setField('instagram', e.target.value)}
                        className="input-field" placeholder="@username" />
                    </div>
                    <div>
                      <label className="label">Facebook</label>
                      <input type="text" value={form.facebook} onChange={(e) => setField('facebook', e.target.value)}
                        className="input-field" placeholder="facebook.com/username" />
                    </div>
                    <div>
                      <label className="label">LinkedIn</label>
                      <input type="text" value={form.linkedin} onChange={(e) => setField('linkedin', e.target.value)}
                        className="input-field" placeholder="linkedin.com/in/username" />
                    </div>
                  </div>
                </div>

                {/* Profile & Branding */}
                <div className="glass rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Profile & Branding</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Profile Photo URL</label>
                      <input type="url" value={form.profilePhotoUrl} onChange={(e) => setField('profilePhotoUrl', e.target.value)}
                        className="input-field" placeholder="https://example.com/photo.jpg" />
                    </div>
                    <div>
                      <label className="label">Logo URL</label>
                      <input type="url" value={form.logoUrl} onChange={(e) => setField('logoUrl', e.target.value)}
                        className="input-field" placeholder="https://example.com/logo.png" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="label">Description / Bio</label>
                    <textarea value={form.description} onChange={(e) => setField('description', e.target.value)} rows={3}
                      className="input-field resize-none" placeholder="Tell people about yourself or your business..." />
                  </div>
                </div>

                {/* Payment */}
                <div className="glass rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Payment</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">UPI ID</label>
                      <input type="text" value={form.upiId} onChange={(e) => setField('upiId', e.target.value)}
                        className="input-field" placeholder="yourname@upi" />
                    </div>
                    <div>
                      <label className="label">Referral / Employee Code</label>
                      <input type="text" value={form.referralCode} onChange={(e) => setField('referralCode', e.target.value)}
                        className={`input-field ${errors.referralCode ? '!border-red-400 !ring-red-400/20' : form.referralCode && referralValid === true ? '!border-green-400 !ring-green-400/20' : ''}`} placeholder="Optional" />
                      {errors.referralCode && <p className="text-red-500 text-xs mt-1.5">{errors.referralCode}</p>}
                      {form.referralCode && referralValid === true && <p className="text-green-600 text-xs mt-1.5">Valid referral code</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3 - Preview */}
          {step === 3 && selectedDesign && (
            <div className="animate-slide-up">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Preview Your Profile</h2>
              <div className="glass-strong rounded-3xl overflow-hidden max-w-md mx-auto shadow-xl">
                <div className="bg-gradient-to-br from-primary-600 to-primary-800 p-8 text-center text-white">
                  <div className="w-24 h-24 rounded-full mx-auto mb-5 overflow-hidden ring-4 ring-white/20 shadow-xl">
                    {form.profilePhotoUrl ? (
                      <img src={form.profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl font-bold bg-white/20">
                        {form.fullName ? form.fullName.charAt(0) : '?'}
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold">{form.fullName || 'Your Name'}</h3>
                  {form.designation && <p className="text-primary-100 mt-1 text-sm">{form.designation}</p>}
                  {form.company && <p className="text-primary-200 text-sm mt-0.5">{form.company}</p>}
                </div>
                <div className="p-6 space-y-4">
                  {form.description && <p className="text-gray-600 text-sm leading-relaxed">{form.description}</p>}
                  <div className="space-y-2.5 text-sm">
                    {form.mobile && (
                      <div className="flex items-center gap-3 text-gray-700 glass-subtle rounded-xl p-3">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                        <span>{form.mobile}</span>
                      </div>
                    )}
                    {form.email && (
                      <div className="flex items-center gap-3 text-gray-700 glass-subtle rounded-xl p-3">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                        <span>{form.email}</span>
                      </div>
                    )}
                    {form.location && (
                      <div className="flex items-center gap-3 text-gray-700 glass-subtle rounded-xl p-3">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                        <span>{form.location}</span>
                      </div>
                    )}
                    {form.website && (
                      <div className="flex items-center gap-3 text-gray-700 glass-subtle rounded-xl p-3">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
                        <span>{form.website}</span>
                      </div>
                    )}
                  </div>
                  {(form.instagram || form.facebook || form.linkedin) && (
                    <div className="flex gap-2 pt-2">
                      {form.instagram && <span className="px-3 py-1.5 glass-subtle rounded-full text-xs font-medium text-pink-600">Instagram</span>}
                      {form.facebook && <span className="px-3 py-1.5 glass-subtle rounded-full text-xs font-medium text-blue-600">Facebook</span>}
                      {form.linkedin && <span className="px-3 py-1.5 glass-subtle rounded-full text-xs font-medium text-blue-700">LinkedIn</span>}
                    </div>
                  )}
                  {form.upiId && (
                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-sm text-gray-700 glass-subtle rounded-xl p-3">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
                        <span>UPI: {form.upiId}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4 - Payment */}
          {step === 4 && selectedDesign && (
            <div className="animate-slide-up">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Order Summary</h2>
              <div className="glass-strong rounded-3xl p-8 max-w-md mx-auto shadow-xl">
                <div className="flex items-center gap-5 mb-6 pb-6 border-b border-gray-100/60">
                  <div className="w-20 h-12 rounded-xl flex items-center justify-center bg-white border border-gray-200/60 shadow-sm flex-shrink-0">
                    <span className="text-xs font-bold text-gray-700">{selectedDesign.name}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{selectedDesign.name} Card</div>
                    <div className="text-sm text-gray-400 mt-0.5">NFC Smart Card</div>
                  </div>
                </div>
                <div className="space-y-3 text-sm mb-6">
                  <div className="flex justify-between"><span className="text-gray-400">Name</span><span className="font-medium text-gray-900">{form.fullName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Email</span><span className="font-medium text-gray-900">{form.email}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Mobile</span><span className="font-medium text-gray-900">{form.mobile}</span></div>
                  {form.referralCode && referralValid && (
                    <div className="flex justify-between"><span className="text-gray-400">Referral</span><span className="font-medium text-green-600">{form.referralCode}</span></div>
                  )}
                </div>
                <div className="border-t border-gray-100/60 pt-5 flex justify-between items-center">
                  <span className="font-semibold text-lg text-gray-900">Total</span>
                  <span className="font-bold text-2xl text-primary-600">₹{selectedDesign.price}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-12 max-w-md mx-auto">
            {step > 1 ? (
              <button onClick={handleBack} className="btn-secondary px-8">
                Back
              </button>
            ) : <div />}
            {step < 4 ? (
              <button onClick={handleNext} className="btn-primary px-10">
                Continue
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary px-10">
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
    </div>
  )
}

export default function OrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <div className="glass-strong rounded-3xl p-12 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <OrderContent />
    </Suspense>
  )
}
