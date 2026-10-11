"use client"
import { useEffect, useState } from 'react'
import CardBuilderEditor from '@/components/builder/CardBuilderEditor'

export default function CustomerBuilderPage() {
  const [cardId, setCardId] = useState('')
  const [origin, setOrigin] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    setOrigin(window.location.origin)
    fetch('/api/customer/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.card?.id) setCardId(d.data.card.id)
        else setError('No card is assigned to your account yet. Please contact support.')
      })
      .catch(() => setError('Could not load your card.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 w-56 rounded bg-gray-200" /><div className="h-96 rounded-2xl bg-gray-100" /></div>
  if (error) return <div className="rounded-2xl bg-amber-50 p-6 text-sm text-amber-700">{error}</div>
  return <CardBuilderEditor cardId={cardId} previewBase={origin} />
}
