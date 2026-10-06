import { MAX_IMAGE_BYTES, MAX_DOCUMENT_BYTES } from './profile-media'

export type UploadKind = 'image' | 'document'

export interface UploadOptions {
  kind?: UploadKind
  onProgress?: (percent: number) => void
}

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)$/i

export function validateImageFile(file: File): string | null {
  if (!file) return 'No file selected'
  if (file.size > MAX_IMAGE_BYTES) return 'File too large. Max size is 20MB.'
  const typeOk = file.type ? file.type.startsWith('image/') : IMAGE_EXT.test(file.name)
  if (!typeOk) return 'Only JPG, JPEG, PNG and WebP image files are allowed.'
  return null
}

export function validatePdfFile(file: File): string | null {
  if (!file) return 'No file selected'
  if (file.size > MAX_DOCUMENT_BYTES) return 'Document too large. Max size is 10MB.'
  const looksLikePdf =
    (file.type && file.type.toLowerCase() === 'application/pdf') || /\.pdf$/i.test(file.name)
  if (!looksLikePdf) return 'Only PDF documents are allowed.'
  return null
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  const token = localStorage.getItem('token')
  if (!token || token === 'null' || token === 'undefined') return null
  return token
}

/**
 * Uploads a file to /api/upload with progress reporting.
 * Uses XHR because fetch() cannot report upload progress.
 */
export function uploadFile(file: File, options: UploadOptions = {}): Promise<string> {
  const kind: UploadKind = options.kind || 'image'
  const validation = kind === 'document' ? validatePdfFile(file) : validateImageFile(file)
  if (validation) return Promise.reject(new Error(validation))

  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('kind', kind)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/upload')
    const token = getStoredToken()
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && options.onProgress) {
        options.onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }

    xhr.onerror = () => reject(new Error('Network error while uploading'))
    xhr.ontimeout = () => reject(new Error('Upload timed out. Please try again.'))
    xhr.onload = () => {
      let payload: any = null
      try {
        payload = JSON.parse(xhr.responseText)
      } catch {
        payload = null
      }
      if (xhr.status >= 200 && xhr.status < 300 && payload?.success && payload.url) {
        resolve(payload.url as string)
      } else {
        reject(new Error(payload?.error || `Upload failed (${xhr.status})`))
      }
    }

    xhr.send(formData)
  })
}
