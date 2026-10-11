"use client"

import { useCallback, useEffect, useRef } from 'react'

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  try {
    let id = window.sessionStorage.getItem('msc_sid')
    if (!id) {
      id = (crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`).replace(/-/g, '')
      window.sessionStorage.setItem('msc_sid', id)
    }
    return id
  } catch {
    return ''
  }
}

export function useCardAnalytics(cardId: string) {
  const sessionRef = useRef<string>('')

  useEffect(() => {
    sessionRef.current = getSessionId()
  }, [])

  const track = useCallback(
    (type: string, metadata?: Record<string, unknown>) => {
      if (!cardId) return
      const sessionId = sessionRef.current || getSessionId()
      sessionRef.current = sessionId
      const payload = JSON.stringify({
        type,
        sessionId,
        referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
        metadata,
      })
      try {
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          navigator.sendBeacon(`/api/public/${encodeURIComponent(cardId)}/track`, new Blob([payload], { type: 'application/json' }))
        } else {
          fetch(`/api/public/${encodeURIComponent(cardId)}/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true,
          }).catch(() => {})
        }
      } catch {
        // ignore
      }
    },
    [cardId]
  )

  useEffect(() => {
    if (!cardId) return
    const key = `msc_viewed_${cardId}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch {
      // ignore
    }
    track('card_view')
  }, [cardId, track])

  return track
}
