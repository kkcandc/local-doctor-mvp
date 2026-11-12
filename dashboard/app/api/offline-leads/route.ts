import { NextResponse, type NextRequest } from 'next/server'
import { isValidDate } from '@/lib/dates'
import { deleteEntry, readOfflineLeads, upsertEntry, validateEntry } from '@/lib/offline'
import { StorageUnavailableError } from '@/lib/storage'

export const dynamic = 'force-dynamic'

/** Optional second password just for the entry form. When unset, the dashboard session is enough. */
function entryAllowed(request: NextRequest): boolean {
  const required = process.env.OFFLINE_ENTRY_PASSWORD
  if (!required) return true
  return request.headers.get('x-entry-password') === required
}

function today(): string {
  // UTC+14, so "today" is accepted from any time zone.
  return new Date(Date.now() + 14 * 3600_000).toISOString().slice(0, 10)
}

function storageError(err: unknown) {
  const status = err instanceof StorageUnavailableError ? 503 : 500
  return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not save' }, { status })
}

export async function GET() {
  return NextResponse.json(await readOfflineLeads())
}

export async function POST(request: NextRequest) {
  if (!entryAllowed(request)) return NextResponse.json({ error: 'Entry password is incorrect.' }, { status: 403 })
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  const result = validateEntry(
    { date: body.date, phoneLeads: body.phoneLeads, bookedPatients: body.bookedPatients, note: body.note },
    today(),
  )
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
  try {
    return NextResponse.json(await upsertEntry(result.entry))
  } catch (err) {
    return storageError(err)
  }
}

export async function DELETE(request: NextRequest) {
  if (!entryAllowed(request)) return NextResponse.json({ error: 'Entry password is incorrect.' }, { status: 403 })
  const date = request.nextUrl.searchParams.get('date') ?? ''
  if (!isValidDate(date)) return NextResponse.json({ error: 'Date must be YYYY-MM-DD.' }, { status: 400 })
  try {
    return NextResponse.json(await deleteEntry(date))
  } catch (err) {
    return storageError(err)
  }
}
