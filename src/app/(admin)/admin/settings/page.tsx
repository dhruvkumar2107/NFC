"use client"
import { useState, useEffect } from 'react'

export default function AdminSettingsPage() {
  const [admin, setAdmin] = useState<any>(null)
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [paymentQrUrl, setPaymentQrUrl] = useState('')
  const [qrSaving, setQrSaving] = useState(false)
  const [qrMsg, setQrMsg] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('/api/admin/settings', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setAdmin(d.data)
          setPaymentQrUrl(d.data.paymentQrUrl || '')
        }
      })
      .catch(() => {})
  }, [])

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmPassword) { setMsg('Passwords do not match'); return }
    if (pwForm.newPassword.length < 6) { setMsg('Password must be at least 6 characters'); return }
    setSaving(true); setMsg('')
    const token = localStorage.getItem('token')
    const res = await fetch('/api/admin/change-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
    })
    const d = await res.json()
    if (d.success) { setMsg('Password changed successfully!'); setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }) }
    else setMsg(d.error || 'Failed')
    setSaving(false)
  }

  async function savePaymentQr() {
    setQrSaving(true); setQrMsg('')
    const token = localStorage.getItem('token')
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ paymentQrUrl }),
    })
    const d = await res.json()
    if (d.success) { setQrMsg('Payment QR code URL saved!') }
    else setQrMsg(d.error || 'Failed to save')
    setQrSaving(false)
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Admin Settings</h1>
      <div className="card mb-6">
        <h2 className="font-semibold text-lg mb-4">Account Info</h2>
        <div className="space-y-2 text-sm">
          <div><span className="text-gray-500">Name:</span> <span className="font-medium">{admin?.name || 'System Admin'}</span></div>
          <div><span className="text-gray-500">Email:</span> <span className="font-medium">{admin?.email || 'admin@mysmartcard.net'}</span></div>
          <div><span className="text-gray-500">Role:</span> <span className="font-medium">Super Admin</span></div>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="font-semibold text-lg mb-4">Payment QR Code</h2>
        <p className="text-sm text-gray-500 mb-4">Set the payment QR code URL that customers will see on their profile for receiving payments.</p>
        {qrMsg && <div className={`p-3 rounded-lg mb-4 text-sm ${qrMsg.includes('saved') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{qrMsg}</div>}
        <div className="space-y-4">
          <div>
            <label className="label">Payment QR Code URL</label>
            <input type="url" className="input-field" value={paymentQrUrl} onChange={e => setPaymentQrUrl(e.target.value)} placeholder="https://example.com/payment-qr.png" />
          </div>
          {paymentQrUrl && (
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                <img src={paymentQrUrl} alt="Payment QR Preview" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              </div>
              <div className="text-sm text-gray-500">Preview of your payment QR code</div>
            </div>
          )}
          <button onClick={savePaymentQr} disabled={qrSaving} className="btn-primary">{qrSaving ? 'Saving...' : 'Save QR Code'}</button>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-lg mb-4">Change Password</h2>
        {msg && <div className={`p-3 rounded-lg mb-4 text-sm ${msg.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg}</div>}
        <form onSubmit={changePassword} className="space-y-4">
          <div><label className="label">Current Password</label><input type="password" className="input-field" value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} required /></div>
          <div><label className="label">New Password</label><input type="password" className="input-field" value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} required minLength={6} /></div>
          <div><label className="label">Confirm New Password</label><input type="password" className="input-field" value={pwForm.confirmPassword} onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))} required /></div>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Changing...' : 'Change Password'}</button>
        </form>
      </div>
    </div>
  )
}
