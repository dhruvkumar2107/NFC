import {
  MAX_IMAGE_BYTES,
  MAX_DOCUMENT_BYTES,
  MAX_VIDEO_BYTES,
  ACCEPTED_IMAGE_EXT,
  formatFileSize,
} from './profile-media'

export type UploadKind = 'image' | 'document' | 'video'

export interface UploadOptions {
  kind?: UploadKind
  onProgress?: (percent: number) => void
}

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv)$/i

// Browsers can paint these formats directly; anything else is converted to JPEG
// before upload so public profiles never show a broken image.
const BROWSER_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/bmp',
])

// Vercel functions reject request bodies over 4.5MB with a 413, so larger
// files are split into chunks that each stay comfortably below that cap.
const CHUNK_SIZE = 3 * 1024 * 1024

// Canvas cannot reliably allocate beyond this; only oversized images are scaled.
const CANVAS_MAX_DIMENSION = 8192

export function validateImageFile(file: File): string | null {
  if (!file) return 'No file selected'
  if (file.size > MAX_IMAGE_BYTES) return `File too large. Maximum size is ${formatFileSize(MAX_IMAGE_BYTES)}.`
  if (file.type === 'image/svg+xml' || /\.svg$/i.test(file.name)) {
    return 'SVG images are not supported. Please upload a JPG, PNG, WebP, GIF, BMP, HEIC, HEIF, AVIF or TIFF file.'
  }
  const typeOk = file.type ? file.type.startsWith('image/') : ACCEPTED_IMAGE_EXT.test(file.name)
  if (!typeOk) return 'Only image files are allowed.'
  return null
}

export function validatePdfFile(file: File): string | null {
  if (!file) return 'No file selected'
  if (file.size > MAX_DOCUMENT_BYTES) return `Document too large. Maximum size is ${formatFileSize(MAX_DOCUMENT_BYTES)}.`
  const looksLikePdf =
    (file.type && file.type.toLowerCase() === 'application/pdf') || /\.pdf$/i.test(file.name)
  if (!looksLikePdf) return 'Only PDF documents are allowed.'
  return null
}

export function validateVideoFile(file: File): string | null {
  if (!file) return 'No file selected'
  if (file.size > MAX_VIDEO_BYTES) return `Video too large. Maximum size is ${formatFileSize(MAX_VIDEO_BYTES)}.`
  const typeOk = file.type ? file.type.toLowerCase().startsWith('video/') : VIDEO_EXT.test(file.name)
  if (!typeOk) return 'Only MP4, WebM and MOV video files are allowed.'
  return null
}

/**
 * Converts formats the browser cannot display (HEIC, HEIF, TIFF) to JPEG.
 * Dimensions are preserved; only images beyond the canvas limit are scaled.
 */
async function prepareImageFile(file: File): Promise<File> {
  const type = (file.type || '').toLowerCase()
  const looksLikeImage = type.startsWith('image/') || ACCEPTED_IMAGE_EXT.test(file.name)
  if (!looksLikeImage || BROWSER_IMAGE_TYPES.has(type)) return file

  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') {
    throw new Error('This image format is not supported by your browser. Please export it as JPG or PNG.')
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('This image format is not supported by your browser. Please export it as JPG or PNG.')
  }

  let { width, height } = bitmap
  if (width > CANVAS_MAX_DIMENSION || height > CANVAS_MAX_DIMENSION) {
    const scale = CANVAS_MAX_DIMENSION / Math.max(width, height)
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close?.()
    throw new Error('Could not process this image. Please export it as JPG or PNG.')
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close?.()

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.92)
  })
  if (!blob) throw new Error('Could not process this image. Please export it as JPG or PNG.')

  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
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
export async function uploadFile(file: File, options: UploadOptions = {}): Promise<string> {
  const kind: UploadKind = options.kind || 'image'
  const prepared = kind === 'image' ? await prepareImageFile(file) : file
  const validation =
    kind === 'document' ? validatePdfFile(prepared) : kind === 'video' ? validateVideoFile(prepared) : validateImageFile(prepared)
  if (validation) throw new Error(validation)

  if (prepared.size <= CHUNK_SIZE) {
    const payload = await postUpload(buildFormData(prepared, kind, prepared.name), options.onProgress)
    if (!payload.url) throw new Error('Upload failed. Please try again.')
    return payload.url as string
  }

  const uploadId = randomUploadId()
  const totalChunks = Math.ceil(prepared.size / CHUNK_SIZE)

  return (async () => {
    let lastUrl: string | null = null
    for (let index = 0; index < totalChunks; index++) {
      const start = index * CHUNK_SIZE
      const end = Math.min(prepared.size, start + CHUNK_SIZE)
      const chunk = prepared.slice(start, end, prepared.type || undefined)
      const payload = await postUpload(
        buildFormData(chunk, kind, prepared.name, {
          uploadId,
          chunkIndex: String(index),
          totalChunks: String(totalChunks),
          totalSize: String(prepared.size),
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
