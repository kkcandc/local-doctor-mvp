import type { CaptureResult } from 'posthog-js'

/*
  PostHog privacy rules for trylocaldoctor.com.

  /get-started embeds the Typeform intake, the only page where visitors enter
  health details. PostHog sends nothing from that page: no pageviews,
  autocapture, exceptions, logs, or session replay.

  Events are dropped in before_send when their URL is an intake path. Values
  that remember an intake URL (session entry, previous pageview, initial
  landing) are removed from later events so a visit to the page does not leak.
*/

const INTAKE_PATH = '/get-started'
const URL_BASE = 'https://trylocaldoctor.com'

// Properties that can carry an earlier intake URL onto a later event.
const REMEMBERED_URL_KEYS = [
  '$pathname',
  '$session_entry_url',
  '$session_entry_pathname',
  '$prev_pageview_pathname',
  '$initial_current_url',
  '$initial_pathname',
  '$referrer',
  '$initial_referrer',
]

// A value that cannot be parsed is treated as the intake page, so a malformed URL never gets through.
export function isIntakePath(pathOrUrl: unknown): boolean {
  if (typeof pathOrUrl !== 'string' || !pathOrUrl.trim()) return false
  let pathname: string
  try {
    pathname = new URL(pathOrUrl, URL_BASE).pathname
  } catch {
    return true
  }
  const normalized = pathname.toLowerCase().replace(/\/+$/, '')
  return normalized === INTAKE_PATH || normalized.startsWith(`${INTAKE_PATH}/`)
}

function withoutIntakeUrls(bag: Record<string, unknown> | undefined) {
  if (!bag) return bag
  const next = { ...bag }
  for (const key of REMEMBERED_URL_KEYS) {
    if (isIntakePath(next[key])) delete next[key]
  }
  if (isIntakePath(bag.$prev_pageview_pathname)) {
    for (const key of Object.keys(next)) {
      if (key.startsWith('$prev_pageview_')) delete next[key]
    }
  }
  return next
}

// before_send hook. liveUrl covers an event that has no $current_url of its own.
export function dropIntakeEvents(event: CaptureResult | null, liveUrl = ''): CaptureResult | null {
  if (!event) return null
  const url = event.properties?.$current_url ?? liveUrl
  if (isIntakePath(url)) return null
  return {
    ...event,
    properties: withoutIntakeUrls(event.properties) ?? {},
    $set: withoutIntakeUrls(event.$set),
    $set_once: withoutIntakeUrls(event.$set_once),
  }
}
