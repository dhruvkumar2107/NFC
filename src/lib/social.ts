export function getSocialDisplay(platform: string, value: string): string {
  if (!value) return ''
  const v = value.trim()
  if (v.startsWith('http://') || v.startsWith('https://')) {
    try {
      const url = new URL(v)
      const path = url.pathname.replace(/^\/+|\/+$/g, '')
      return path || url.hostname
    } catch {
      return v
    }
  }
  return v.startsWith('@') ? v : `@${v}`
}

export function getSocialUrl(platform: string, value: string): string {
  if (!value) return ''
  const v = value.trim()
  if (v.startsWith('http://') || v.startsWith('https://')) return v
  const username = v.replace(/^@/, '')
  switch (platform) {
    case 'instagram': return `https://instagram.com/${username}`
    case 'facebook': return `https://facebook.com/${username}`
    case 'linkedin': return `https://linkedin.com/in/${username}`
    case 'twitter': return `https://twitter.com/${username}`
    case 'youtube': return `https://youtube.com/@${username}`
    default: return `https://${platform}.com/${username}`
  }
}
