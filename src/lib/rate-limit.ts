interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

/** Simple in-memory fixed-window rate limiter. Returns true when the request is allowed. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (bucket.count >= limit) return false
  bucket.count++
  return true
}

export function clientIp(headers: Headers): string {
  const fwd = headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim()
  return headers.get('x-real-ip') || 'unknown'
}

if (typeof setInterval !== 'undefined') {
  // Periodically clear expired buckets so the map does not grow forever.
  const timer = setInterval(() => {
    const now = Date.now()
    buckets.forEach((bucket, key) => {
      if (bucket.resetAt <= now) buckets.delete(key)
    })
  }, 60_000)
  if (typeof timer.unref === 'function') timer.unref()
}
