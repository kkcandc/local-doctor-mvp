import 'server-only'
import exampleSnapshot from '../fixtures/example-snapshot.json'
import { adsCredentials, ga4Credentials } from './env'
import { SNAPSHOT_FILE } from './refresh'
import { readJson, storageMode, type StorageMode } from './storage'
import type { OfflineEntry, Snapshot, SourceState } from './types'

export interface LoadedSnapshot {
  snapshot: Snapshot
  /** Why example data is shown, if it is. */
  exampleReason?: string
  storage: StorageMode
  configured: { ads: SourceState; ga4: SourceState }
}

export function exampleData(): Snapshot {
  return { ...(exampleSnapshot as unknown as Snapshot), isExample: true }
}

function configuredState(): LoadedSnapshot['configured'] {
  const ga4 = ga4Credentials()
  return {
    ads: adsCredentials().creds ? 'ok' : 'not_configured',
    ga4: ga4.creds ? 'ok' : ga4.error ? 'error' : 'not_configured',
  }
}

/**
 * Stored snapshot when one exists with data, otherwise the bundled example.
 * USE_EXAMPLE_DATA=1 forces the example (handy for previews).
 */
export async function loadSnapshot(): Promise<LoadedSnapshot> {
  const storage = storageMode()
  const configured = configuredState()
  if (process.env.USE_EXAMPLE_DATA === '1') {
    return { snapshot: exampleData(), exampleReason: 'USE_EXAMPLE_DATA is set.', storage, configured }
  }
  let stored: Snapshot | undefined
  let readError: string | undefined
  try {
    stored = (await readJson<Snapshot>(SNAPSHOT_FILE))?.data
  } catch (err) {
    readError = err instanceof Error ? err.message : String(err)
  }
  if (stored && (stored.ads || stored.ga4)) return { snapshot: stored, storage, configured }

  let reason: string
  if (readError) reason = `Could not read stored data (${readError}).`
  else if (storage === 'none') reason = 'Storage is not connected yet.'
  else if (configured.ads !== 'ok' && configured.ga4 !== 'ok') reason = 'Google Ads and GA4 are not connected yet.'
  else if (!stored) reason = 'No data has been pulled yet. Use Refresh now or wait for the daily job.'
  else reason = 'The last refresh returned no data. Check the source status below.'
  const example = exampleData()
  if (stored) example.sources = stored.sources
  return { snapshot: example, exampleReason: reason, storage, configured }
}

/** Made-up daily counts for the example view, derived from the fixture so they line up with ad calls. */
export function exampleOfflineEntries(snapshot: Snapshot): OfflineEntry[] {
  const rows = snapshot.ads?.daily.account.slice(-60) ?? []
  return rows.map((r, i) => {
    const wobble = (i * 7) % 3
    return {
      date: r.date,
      phoneLeads: r.phoneCalls + (wobble === 0 ? 1 : 0),
      bookedPatients: (i * 5) % 4 === 0 ? 1 : 0,
      ...(i === rows.length - 10 ? { note: 'Example note: clinic closed for the holiday' } : {}),
      updatedAt: snapshot.generatedAt,
    }
  })
}
