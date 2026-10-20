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
