import 'server-only'
import { addDays } from './dates'
import { adsCredentials, ga4Credentials, lookbackDays } from './env'
import { fetchAds } from './google-ads'
import { fetchGa4 } from './ga4'
import { readJson, StorageConflictError, writeJson } from './storage'
import type { DateRange, Snapshot, SourceStatus } from './types'

export const SNAPSHOT_FILE = 'snapshot.json'
const STATE_FILE = 'refresh-state.json'
export const MANUAL_REFRESH_COOLDOWN_MS = 10 * 60 * 1000

interface RefreshState {
  lastStartedAt?: string
  lastFinishedAt?: string
  lastTrigger?: 'cron' | 'manual'
}

export type RefreshResult =
  | { ok: true; generatedAt: string; sources: Snapshot['sources'] }
  | { ok: false; status: number; error: string; retryAfterSeconds?: number }

function todayIn(timeZone: string): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

/** Pulls through yesterday in the account time zone, so every stored day is complete. */
export function refreshRange(timeZone: string, days: number): DateRange {
  const end = addDays(todayIn(timeZone), -1)
  return { start: addDays(end, -(days - 1)), end }
}

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err)).slice(0, 500)

export async function runRefresh(trigger: 'cron' | 'manual'): Promise<RefreshResult> {
  const stateDoc = await readJson<RefreshState>(STATE_FILE)
  const state = stateDoc?.data ?? {}
  const now = Date.now()
  if (trigger === 'manual' && state.lastStartedAt) {
    const elapsed = now - Date.parse(state.lastStartedAt)
    if (elapsed < MANUAL_REFRESH_COOLDOWN_MS) {
      return {
        ok: false,
        status: 429,
        error: 'Data was refreshed less than 10 minutes ago. Try again shortly.',
        retryAfterSeconds: Math.ceil((MANUAL_REFRESH_COOLDOWN_MS - elapsed) / 1000),
      }
    }
  }
  try {
    await writeJson(STATE_FILE, { ...state, lastStartedAt: new Date(now).toISOString(), lastTrigger: trigger }, { ifMatch: stateDoc?.etag })
  } catch (err) {
    if (err instanceof StorageConflictError) return { ok: false, status: 429, error: 'A refresh is already running.' }
    return { ok: false, status: 503, error: errorMessage(err) }
  }

  const previous = (await readJson<Snapshot>(SNAPSHOT_FILE).catch(() => null))?.data
  const timeZone = previous?.ads?.timeZone || process.env.DASHBOARD_TIMEZONE || 'America/New_York'
  const range = refreshRange(timeZone, lookbackDays())
  const generatedAt = new Date().toISOString()

  const adsCfg = adsCredentials()
  const ga4Cfg = ga4Credentials()

  const [adsOutcome, ga4Outcome] = await Promise.all([
    adsCfg.creds
      ? fetchAds(adsCfg.creds, range).then(
          (r) => ({ ok: true as const, ...r }),
          (err) => ({ ok: false as const, error: errorMessage(err) }),
        )
      : null,
    ga4Cfg.creds
      ? fetchGa4(ga4Cfg.creds, range).then(
          (r) => ({ ok: true as const, ...r }),
          (err) => ({ ok: false as const, error: errorMessage(err) }),
        )
      : null,
  ])

  let adsStatus: SourceStatus
  let ads: Snapshot['ads'] = null
  if (!adsOutcome) {
    adsStatus = { state: 'not_configured', message: `Missing env vars: ${adsCfg.missing.join(', ')}` }
  } else if (adsOutcome.ok) {
    ads = adsOutcome.data
    adsStatus = {
      state: 'ok',
      lastSuccessAt: generatedAt,
      message: adsOutcome.warnings.length ? `Partial: ${adsOutcome.warnings.join(' | ')}`.slice(0, 1000) : undefined,
    }
  } else {
    // Keep the last good data so a transient API error does not blank the dashboard.
    ads = previous?.ads ?? null
    adsStatus = { state: 'error', message: adsOutcome.error, lastSuccessAt: previous?.sources.ads.lastSuccessAt }
  }

  let ga4Status: SourceStatus
  let ga4: Snapshot['ga4'] = null
  if (!ga4Outcome) {
    ga4Status = ga4Cfg.error
      ? { state: 'error', message: ga4Cfg.error }
      : { state: 'not_configured', message: `Missing env vars: ${ga4Cfg.missing.join(', ')}` }
  } else if (ga4Outcome.ok) {
    ga4 = ga4Outcome.data
    ga4Status = {
      state: 'ok',
      lastSuccessAt: generatedAt,
      message: ga4Outcome.warnings.length ? `Partial: ${ga4Outcome.warnings.join(' | ')}`.slice(0, 1000) : undefined,
    }
  } else {
    ga4 = previous?.ga4 ?? null
    ga4Status = { state: 'error', message: ga4Outcome.error, lastSuccessAt: previous?.sources.ga4.lastSuccessAt }
  }

  const snapshot: Snapshot = {
    schemaVersion: 1,
    generatedAt,
    isExample: false,
    range,
    sources: { ads: adsStatus, ga4: ga4Status },
    ads,
    ga4,
  }

  try {
    await writeJson(SNAPSHOT_FILE, snapshot)
    const latest = await readJson<RefreshState>(STATE_FILE)
    await writeJson(STATE_FILE, { ...(latest?.data ?? {}), lastFinishedAt: new Date().toISOString() })
  } catch (err) {
    return { ok: false, status: 503, error: errorMessage(err) }
  }
  return { ok: true, generatedAt, sources: snapshot.sources }
}
