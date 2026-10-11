"use client"

import { useEffect, useState } from 'react'

export interface EnquiryPrefill {
  token: number
  source?: string
  subject?: string
  productId?: string
  emiData?: Record<string, any>
}

interface Props {
  cardId: string
  title?: string
  prefill?: EnquiryPrefill
}

export default function EnquiryForm({ cardId, title = 'Send an Enquiry', prefill }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [consent, setConsent] = useState(false)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!prefill?.token) return
    setSubject(prefill.subject || '')
    setMessage(prefill.emiData ? `I would like a finance quote based on the EMI estimate provided.` : '')
    setDone(false)
    setError('')
  }, [prefill?.token])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Please enter your name.'); return }
    if (!phone.trim() && !email.trim()) { setError('Please provide a phone number or email.'); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/public/${encodeURIComponent(cardId)}/enquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, phone, email,
          subject: subject || title,
          message,
          source: prefill?.source || 'form',
          productId: prefill?.productId,
          emiData: prefill?.emiData,
          consent,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not submit enquiry.')
      setDone(true)
      setName(''); setPhone(''); setEmail(''); setMessage(''); setSubject(''); setConsent(false)
    } catch (err: any) {
      setError(err.message || 'Could not submit enquiry.')
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    return (
      <div className="glass-subtle rounded-2xl p-5 text-center">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
          <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
        </div>
        <p className="text-sm font-semibold text-gray-800">Enquiry sent successfully</p>
        <p className="mt-1 text-xs text-gray-500">The business will contact you soon.</p>
        <button type="button" onClick={() => setDone(false)} className="mt-3 text-xs font-semibold text-primary-600 hover:underline">Send another enquiry</button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="glass-subtle rounded-2xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name *" maxLength={120}
          className="col-span-2 rounded-xl border border-gray-200 bg-white/80 px-3 py-2 text-sm" />
        <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9+\-\s]/g, ''))} inputMode="tel" placeholder="Phone" maxLength={20}
          className="rounded-xl border border-gray-200 bg-white/80 px-3 py-2 text-sm" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" maxLength={160}
          className="rounded-xl border border-gray-200 bg-white/80 px-3 py-2 text-sm" />
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" maxLength={160}
          className="col-span-2 rounded-xl border border-gray-200 bg-white/80 px-3 py-2 text-sm" />
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" rows={3} maxLength={4000}
          className="col-span-2 rounded-xl border border-gray-200 bg-white/80 px-3 py-2 text-sm resize-none" />
      </div>
      <label className="flex items-start gap-2 text-[11px] text-gray-500">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-primary-600" />
        <span>I agree to be contacted by the business regarding my enquiry and accept the privacy notice.</span>
      </label>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button type="submit" disabled={saving}
        className="w-full rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
        {saving ? 'Sending...' : 'Submit Enquiry'}
      </button>
    </form>
  )
}
