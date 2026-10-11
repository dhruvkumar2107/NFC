export function sanitizeAttributes(input: unknown): Record<string, string> {
  const out: Record<string, string> = {}
  if (!input || typeof input !== 'object') return out
  let count = 0
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (count >= 15) break
    const key = String(k).trim().slice(0, 40)
    if (!key) continue
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      const value = String(v).trim().slice(0, 200)
      if (value) {
        out[key] = value
        count++
      }
    }
  }
  return out
}

export function parseAttributes(raw: string | null | undefined): Record<string, string> {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'string' || typeof v === 'number') out[k] = String(v)
    }
    return out
  } catch {
    return {}
  }
}
