import { MAX_IMAGE_BYTES, MAX_DOCUMENT_BYTES } from './profile-media'

export type UploadKind = 'image' | 'document'

export interface UploadOptions {
  kind?: UploadKind
  onProgress?: (percent: number) => void
}

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)$/i

// Vercel functions reject request bodies over 4.5MB with a 413, so larger
// files are split into chunks that each stay comfortably below that cap.
const CHUNK_SIZE = 3 * 1024 * 1024

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

function randomUploadId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function statusErrorMessage(status: number): string {
  if (status === 413) return 'File is too large for the server to accept.'
  if (status === 401) return 'Your session has expired. Please log in again and retry the upload.'
  if (status === 403) return 'You do not have permission to upload files.'
  return `Upload failed (${status})`
}

/** Posts one multipart request and resolves the parsed JSON payload. */
function postUpload(
  formData: FormData,
  onChunkProgress?: (percent: number) => void
): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/upload')
    const token = getStoredToken()
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onChunkProgress) {
        onChunkProgress(Math.round((event.loaded / event.total) * 100))
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
      if (xhr.status >= 200 && xhr.status < 300 && payload?.success) {
        resolve(payload)
      } else {
        reject(new Error(payload?.error || statusErrorMessage(xhr.status)))
      }
    }

    xhr.send(formData)
  })
}

function buildFormData(file: Blob, kind: UploadKind, originalName: string, extra: Record<string, string> = {}): FormData {
  const formData = new FormData()
  formData.append('file', file, originalName)
  formData.append('kind', kind)
  formData.append('originalName', originalName)
  formData.append('mimeType', file.type || '')
  for (const [key, value] of Object.entries(extra)) formData.append(key, value)
  return formData
}

/**
 * Uploads a file to /api/upload with progress reporting.
 * Files larger than 3MB are uploaded in chunks so the serverless functions
 * never exceed their 4.5MB request payload limit.
 */
export function uploadFile(file: File, options: UploadOptions = {}): Promise<string> {
  const kind: UploadKind = options.kind || 'image'
  const validation = kind === 'document' ? validatePdfFile(file) : validateImageFile(file)
  if (validation) return Promise.reject(new Error(validation))

  if (file.size <= CHUNK_SIZE) {
    return postUpload(buildFormData(file, kind, file.name), options.onProgress).then((payload) => {
      if (!payload.url) throw new Error('Upload failed. Please try again.')
      return payload.url as string
    })
  }

  const uploadId = randomUploadId()
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE)

  return (async () => {
    let lastUrl: string | null = null
    for (let index = 0; index < totalChunks; index++) {
      const start = index * CHUNK_SIZE
      const end = Math.min(file.size, start + CHUNK_SIZE)
      const chunk = file.slice(start, end, file.type || undefined)
      const payload = await postUpload(
        buildFormData(chunk, kind, file.name, {
          uploadId,
          chunkIndex: String(index),
          totalChunks: String(totalChunks),
          totalSize: String(file.size),
        }),
        (chunkPercent) => {
          if (options.onProgress) {
            options.onProgress(Math.round(((index + chunkPercent / 100) / totalChunks) * 100))
          }
        }
      )
      if (payload.url) lastUrl = payload.url
    }
    if (!lastUrl) throw new Error('Upload failed. Please try again.')
    return lastUrl as string
  })()
}
