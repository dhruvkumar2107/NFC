const STREAM_CHUNK = 64 * 1024

/** Converts bytes to a ReadableStream so responses are not buffered (Vercel caps buffered bodies at 4.5MB). */
export function bufferToStream(bytes: Buffer | Uint8Array): ReadableStream<Uint8Array> {
  const data = bytes instanceof Buffer ? bytes : Buffer.from(bytes)
  let offset = 0
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (offset >= data.length) {
        controller.close()
        return
      }
      const slice = data.subarray(offset, offset + STREAM_CHUNK)
      offset += slice.length
      controller.enqueue(new Uint8Array(slice))
    },
  })
}

/** Builds a file download response that streams the body in small chunks. */
export function streamedFileResponse(bytes: Buffer | Uint8Array, headers: Record<string, string>): Response {
  const data = bytes instanceof Buffer ? bytes : Buffer.from(bytes)
  return new Response(bufferToStream(data), {
    headers: {
      ...headers,
      'Content-Length': String(data.length),
    },
  })
}

/** Parses a single-range `Range` header (e.g. `bytes=0-1023`). Returns null when absent or invalid. */
export function parseByteRange(header: string | null, size: number): { start: number; end: number } | null {
  if (!header || size <= 0) return null
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim())
  if (!match) return null
  const [, rawStart, rawEnd] = match
  if (rawStart === '' && rawEnd === '') return null

  let start: number
  let end: number
  if (rawStart === '') {
    // Suffix range: last N bytes.
    const suffix = parseInt(rawEnd, 10)
    if (!Number.isFinite(suffix) || suffix <= 0) return null
    start = Math.max(0, size - suffix)
    end = size - 1
  } else {
    start = parseInt(rawStart, 10)
    end = rawEnd === '' ? size - 1 : parseInt(rawEnd, 10)
  }

  if (!Number.isFinite(start) || !Number.isFinite(end)) return null
  if (start > end || start >= size) return null
  if (end >= size) end = size - 1
  return { start, end }
}

/** Builds a 206 Partial Content response for the requested byte range. */
export function rangedFileResponse(
  bytes: Buffer | Uint8Array,
  headers: Record<string, string>,
  range: { start: number; end: number },
): Response {
  const data = bytes instanceof Buffer ? bytes : Buffer.from(bytes)
  const chunk = data.subarray(range.start, range.end + 1)
  return new Response(new Uint8Array(chunk), {
    status: 206,
    headers: {
      ...headers,
      'Content-Length': String(chunk.length),
      'Content-Range': `bytes ${range.start}-${range.end}/${data.length}`,
      'Accept-Ranges': 'bytes',
    },
  })
}
