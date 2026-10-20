import { prisma } from '@/lib/db'
import { buildStoredFileUrl, parseStoredFileUrl } from '@/lib/profile-media'

const STALE_CHUNK_MS = 24 * 60 * 60 * 1000

export interface SavedFile {
  id: string
  url: string
  name: string
  mime: string
  size: number
}

/** Persists the assembled bytes in the database and returns a small /api/files URL. */
export async function saveStoredFile(name: string, mime: string, buffer: Buffer): Promise<SavedFile> {
  const row = await prisma.storedFile.create({
    data: { name, mime: mime || 'application/octet-stream', size: buffer.length, data: buffer },
  })
  return { id: row.id, url: buildStoredFileUrl(row.id, row.name), name: row.name, mime: row.mime, size: row.size }
}

/** Stores one chunk of an in-progress upload (idempotent per uploadId + index). */
export async function saveUploadChunk(uploadId: string, index: number, buffer: Buffer): Promise<void> {
  await prisma.storedFileChunk.upsert({
    where: { uploadId_idx: { uploadId, idx: index } },
    create: { uploadId, idx: index, data: buffer },
    update: { data: buffer },
  })
}

/** Concatenates every stored chunk for an upload, or null when parts are missing. */
export async function assembleUploadChunks(uploadId: string, totalChunks: number): Promise<Buffer | null> {
  const chunks = await prisma.storedFileChunk.findMany({
    where: { uploadId },
    orderBy: { idx: 'asc' },
  })
  if (chunks.length !== totalChunks) return null
  const ordered = [...chunks].sort((a, b) => a.idx - b.idx)
  for (let i = 0; i < ordered.length; i++) {
    if (ordered[i].idx !== i) return null
  }
  return Buffer.concat(ordered.map((c) => Buffer.from(c.data)))
}

/** Removes finished and abandoned chunk rows (best effort). */
export async function cleanupUploadChunks(uploadId: string): Promise<void> {
  await prisma.storedFileChunk.deleteMany({ where: { uploadId } }).catch(() => {})
  await prisma.storedFileChunk
    .deleteMany({ where: { createdAt: { lt: new Date(Date.now() - STALE_CHUNK_MS) } } })
    .catch(() => {})
}

/** Deletes the stored file a media URL points at (no-op for legacy URLs). */
export async function deleteStoredFileByUrl(url: string): Promise<void> {
  const ref = parseStoredFileUrl(url)
  if (!ref) return
  await prisma.storedFile.deleteMany({ where: { id: ref.id } }).catch(() => {})
}

/** Reads a stored file's bytes for download/ZIP flows. */
export async function resolveStoredFile(id: string): Promise<{ buffer: Buffer; mime: string; name: string } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const row = await prisma.storedFile.findUnique({ where: { id } })
  if (!row) return null
  return { buffer: Buffer.from(row.data), mime: row.mime, name: row.name }
}
