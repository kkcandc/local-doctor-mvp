import 'server-only'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { BlobPreconditionFailedError, get, put } from '@vercel/blob'
import { localStorageAllowed, storageConfigured } from './env'

/*
  Small JSON documents in a private Vercel Blob store:
    dashboard/snapshot.json        normalized daily snapshot (schema/snapshot.schema.json)
    dashboard/offline-leads.json   daily phone lead and booked patient counts
    dashboard/refresh-state.json   last refresh start time, for rate limiting
  ETags give optimistic concurrency on writes.
*/

const PREFIX = 'dashboard/'
const LOCAL_DIR = path.join(process.cwd(), '.data')

export type StorageMode = 'blob' | 'local' | 'none'

export function storageMode(): StorageMode {
  if (storageConfigured()) return 'blob'
  if (localStorageAllowed()) return 'local'
  return 'none'
}

export class StorageConflictError extends Error {}
export class StorageUnavailableError extends Error {}

export interface Stored<T> {
  data: T
  etag?: string
}

export async function readJson<T>(name: string): Promise<Stored<T> | null> {
  const mode = storageMode()
  if (mode === 'none') return null
  if (mode === 'local') {
    try {
      const text = await fs.readFile(path.join(LOCAL_DIR, name), 'utf8')
      return { data: JSON.parse(text) as T }
    } catch {
      return null
    }
  }
  try {
    const res = await get(`${PREFIX}${name}`, { access: 'private', useCache: false })
    if (!res || res.statusCode !== 200) return null
    const text = await new Response(res.stream).text()
    return { data: JSON.parse(text) as T, etag: res.blob.etag }
  } catch (err) {
    if (err instanceof Error && /not.?found/i.test(err.name + err.message)) return null
    throw err
  }
}

export async function writeJson(name: string, data: unknown, opts: { ifMatch?: string } = {}): Promise<void> {
  const mode = storageMode()
  const body = JSON.stringify(data)
  if (mode === 'none') {
    throw new StorageUnavailableError('Storage is not configured: connect a Vercel Blob store (BLOB_READ_WRITE_TOKEN).')
  }
  if (mode === 'local') {
    await fs.mkdir(LOCAL_DIR, { recursive: true })
    await fs.writeFile(path.join(LOCAL_DIR, name), body)
    return
  }
  try {
    await put(`${PREFIX}${name}`, body, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
      cacheControlMaxAge: 60,
      ...(opts.ifMatch ? { ifMatch: opts.ifMatch } : {}),
    })
  } catch (err) {
    if (err instanceof BlobPreconditionFailedError) throw new StorageConflictError('Document changed while saving, try again.')
    throw err
  }
}
