/**
 * RFC 6350 / vCard 3.0 generation.
 *
 * The previous implementation joined raw profile values into the card, which
 * produced invalid files whenever a name, note or address contained a comma,
 * semicolon, backslash or newline. This module performs the escaping the spec
 * requires and emits CRLF line endings with UTF-8 content.
 */

export interface VCardSocialLinks {
  instagram?: string
  facebook?: string
  linkedin?: string
  twitter?: string
  youtube?: string
  [key: string]: string | undefined
}

export interface VCardInput {
  name: string
  designation?: string | null
  company?: string | null
  college?: string | null
  mobile?: string | null
  whatsapp?: string | null
  email?: string | null
  website?: string | null
  address?: string | null
  taluk?: string | null
  city?: string | null
  state?: string | null
  pincode?: string | null
  country?: string | null
  description?: string | null
  socialLinks?: VCardSocialLinks | null
  /** Absolute public card URL. */
  profileUrl?: string | null
  /** Logo/profile image URL — embedded as a URI reference (not base64). */
  photoUrl?: string | null
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/([;,])/g, '\\$1')
    .replace(/\r\n|\r|\n/g, '\\n')
}

function escapeStructured(value: string): string {
  // Structured components are separated on ';' so only structural escaping.
  return escapeText(value)
}

function clean(value?: string | null): string {
  if (typeof value !== 'string') return ''
  return value.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim()
}

/** Splits a full name into given / family components for the structured N field. */
function splitName(fullName: string): { family: string; given: string; additional: string } {
  const tokens = clean(fullName).split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return { family: '', given: '', additional: '' }
  if (tokens.length === 1) return { family: tokens[0], given: '', additional: '' }
  const family = tokens[tokens.length - 1]
  const given = tokens[0]
  const additional = tokens.slice(1, -1).join(' ')
  return { family, given, additional }
}

export function buildVCard(input: VCardInput): string {
  const name = clean(input.name) || 'MySmartCard Contact'
  const { family, given, additional } = splitName(name)
  const company = clean(input.company)
  const college = clean(input.college)
  const designation = clean(input.designation)
  const description = clean(input.description)

  const mobile = clean(input.mobile)
  const whatsapp = clean(input.whatsapp)
  const email = clean(input.email)
  const website = clean(input.website)

  const street = clean(input.address)
  const city = clean(input.city)
  const state = clean(input.state)
  const zip = clean(input.pincode)
  const country = clean(input.country)
  const taluk = clean(input.taluk)
  const locality = [city, taluk].filter(Boolean).join(', ')

  const hasAddress = Boolean(street || city || taluk || state || zip || country)

  const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0', 'PRODID:-//MySmartCard//Digital Business Card//EN']

  lines.push(`N:${[family, given, additional].map(escapeStructured).join(';')};;`)
  lines.push(`FN:${escapeText(name)}`)

  if (company && college) lines.push(`ORG:${escapeStructured(company)};${escapeStructured(college)}`)
  else if (company) lines.push(`ORG:${escapeStructured(company)}`)
  else if (college) lines.push(`ORG:${escapeStructured(college)}`)

  if (designation) lines.push(`TITLE:${escapeText(designation)}`)

  if (mobile) lines.push(`TEL;TYPE=CELL,PREF:${escapeText(mobile)}`)
  if (whatsapp && whatsapp !== mobile) lines.push(`TEL;TYPE=CELL,VOICE:${escapeText(whatsapp)}`)

  if (email) lines.push(`EMAIL;TYPE=WORK,INTERNET:${escapeText(email)}`)
  if (website) lines.push(`URL:${escapeText(normalizeUrl(website))}`)
  if (input.profileUrl) lines.push(`URL;TYPE=MySmartCard:${escapeText(input.profileUrl)}`)

  if (hasAddress) {
    const adr = ['', '', street, locality, [state, zip].filter(Boolean).join(' '), country]
      .map((part) => escapeStructured(part))
      .join(';')
    lines.push(`ADR;TYPE=WORK:${adr}`)
  }

  const social = input.socialLinks || {}
  const noteParts: string[] = []
  if (description) noteParts.push(description)
  const socialNotes: string[] = []
  for (const [platform, value] of Object.entries(social)) {
    const v = clean(value as string)
    if (v) socialNotes.push(`${platformLabel(platform)}: ${v}`)
  }
  if (socialNotes.length) noteParts.push('Social: ' + socialNotes.join(', '))
  if (input.profileUrl) noteParts.push(`Digital business card: ${input.profileUrl}`)
  if (noteParts.length) lines.push(`NOTE:${escapeText(noteParts.join('\n'))}`)

  // Social profiles as extensions (widely supported by Google/Apple Contacts).
  for (const [platform, value] of Object.entries(social)) {
    const v = clean(value as string)
    if (!v) continue
    lines.push(`X-SOCIALPROFILE;TYPE=${platform}:${escapeText(normalizeUrl(v, platform))}`)
  }

  if (input.photoUrl && /^https?:\/\//i.test(input.photoUrl)) {
    lines.push(`PHOTO;VALUE=URI:${escapeText(input.photoUrl)}`)
  }

  lines.push(`REV:${new Date().toISOString()}`)
  lines.push('END:VCARD')

  return lines.join('\r\n') + '\r\n'
}

function platformLabel(platform: string): string {
  if (!platform) return 'Link'
  return platform.charAt(0).toUpperCase() + platform.slice(1)
}

export function normalizeUrl(value: string, platform?: string): string {
  const v = clean(value)
  if (!v) return ''
  if (/^https?:\/\//i.test(v)) return v
  if (platform) {
    const handle = v.replace(/^@/, '')
    switch (platform) {
      case 'instagram': return `https://instagram.com/${handle}`
      case 'facebook': return `https://facebook.com/${handle}`
      case 'linkedin': return `https://linkedin.com/in/${handle}`
      case 'twitter': return `https://twitter.com/${handle}`
      case 'youtube': return `https://youtube.com/@${handle}`
      default: return `https://${platform}.com/${handle}`
    }
  }
  return `https://${v}`
}

export function vCardFilename(name: string): string {
  const base = (name || 'contact').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60) || 'contact'
  return `${base}_Contact.vcf`
}
