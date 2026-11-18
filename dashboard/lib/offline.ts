import 'server-only'
import { isValidDate } from './dates'
import { checkNote } from './privacy'
import { readJson, StorageConflictError, writeJson } from './storage'
import type { OfflineEntry, OfflineLeads } from './types'

const FILE = 'offline-leads.json'
const MAX_COUNT = 10_000

export async function readOfflineLeads(): Promise<OfflineLeads> {
  try {
    const doc = await readJson<OfflineLeads>(FILE)
    return doc?.data ?? { schemaVersion: 1, entries: [] }
  } catch {
    return { schemaVersion: 1, entries: [] }
  }
}

export type EntryInput = { date: unknown; phoneLeads: unknown; bookedPatients: unknown; note?: unknown }
export type Validated = { ok: true; entry: Omit<OfflineEntry, 'updatedAt'> } | { ok: false; error: string }

function count(v: unknown, label: string): number | string {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v
  if (typeof n !== 'number' || !Number.isInteger(n) || n < 0 || n > MAX_COUNT) {
    return `${label} must be a whole number from 0 to ${MAX_COUNT}.`
  }
  return n
}

/** Accepts only a date, two counts and an optional short note. Anything else is dropped. */
export function validateEntry(input: EntryInput, today: string): Validated {
  const date = typeof input.date === 'string' ? input.date : ''
  if (!isValidDate(date)) return { ok: false, error: 'Date must be YYYY-MM-DD.' }
  if (date > today) return { ok: false, error: 'Date cannot be in the future.' }
  const phoneLeads = count(input.phoneLeads, 'Phone leads')
  if (typeof phoneLeads === 'string') return { ok: false, error: phoneLeads }
  const bookedPatients = count(input.bookedPatients, 'Booked patients')
  if (typeof bookedPatients === 'string') return { ok: false, error: bookedPatients }
  const note = checkNote(input.note)
  if (!note.ok) return note
  return { ok: true, entry: { date, phoneLeads, bookedPatients, ...(note.note ? { note: note.note } : {}) } }
}

async function mutate(fn: (entries: OfflineEntry[]) => OfflineEntry[]): Promise<OfflineLeads> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const doc = await readJson<OfflineLeads>(FILE)
    const next: OfflineLeads = { schemaVersion: 1, entries: fn([...(doc?.data.entries ?? [])]) }
    next.entries.sort((a, b) => a.date.localeCompare(b.date))
    try {
      await writeJson(FILE, next, { ifMatch: doc?.etag })
      return next
    } catch (err) {
      if (!(err instanceof StorageConflictError) || attempt === 2) throw err
    }
  }
  throw new Error('unreachable')
}

/** One entry per date. Saving a date again replaces it. */
export function upsertEntry(entry: Omit<OfflineEntry, 'updatedAt'>) {
  const full: OfflineEntry = { ...entry, updatedAt: new Date().toISOString() }
  return mutate((entries) => [...entries.filter((e) => e.date !== entry.date), full])
}

export function deleteEntry(date: string) {
  return mutate((entries) => entries.filter((e) => e.date !== date))
}
