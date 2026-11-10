import { keptAdsSearchParams } from './analytics/googleAdsConfig'

export const CALENDLY_EVENT_URL = 'https://calendly.com/local-doctor/virtualvisit'

// Starting height before Calendly reports calendly.page_height. The reported
// mobile height is about 602px and desktop about 662px. 700 avoids clipping the
// time zone control if that message is late, and the listener then tightens it.
export const CALENDLY_DEFAULT_HEIGHT_PX = 700

// Calendly posts 2px and 26px while the calendar is still loading. Applying those
// collapses the embed to a blank strip, so only a finished calendar height is used.
export const CALENDLY_MIN_HEIGHT_PX = 480
export const CALENDLY_MAX_HEIGHT_PX = 1600

// Invitee tracking fields Calendly stores (Meetings, webhooks, v2 API, CSV).
// utm_id is not one of them. It is still added to the embed URL so the iframe src carries it.
const CALENDLY_STORED_UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const
const CALENDLY_URL_ONLY_PARAMS = ['utm_id'] as const
const CALENDLY_CLICK_PARAMS = ['gclid', 'gbraid', 'wbraid'] as const

// Calendly drops a tracking value longer than 255 characters.
const SALESFORCE_UUID_MAX = 255

/*
  Build the inline embed URL for /get-started.

  widget.js copies utm_source, utm_medium, utm_campaign, utm_content, utm_term,
  and salesforce_uuid from the parent page. It does not copy gclid, gbraid, or
  wbraid. A live check confirmed that: utm_* showed up on the iframe, gclid did not.

  Calendly records those five UTM params plus salesforce_uuid on the invitee.
  Custom params are not stored. The click id is therefore written to
  salesforce_uuid, which is the passthrough Calendly keeps. The format is
  gclid:<value>, gbraid:<value>, or wbraid:<value>, joined with | when more than
  one is present (gclid first). utm_content and utm_term are left unchanged so a
  keyword or creative is not overwritten.

  The raw gclid, gbraid, and wbraid are also set on the embed URL. widget.js
  forwards every data-url query param into the iframe, and a live check kept
  them on the iframe href after Calendly added its own month param. They are
  not a substitute for salesforce_uuid, because Calendly does not record them.

  hide_gdpr_banner=1 hides Calendly's cookie banner. It only takes effect once
  widget.js adds embed_domain and embed_type=Inline, which the inline embed does.
  On a 390px-wide iframe that banner is about 350px tall and covers the lower
  calendar rows and the time zone control.

  Contact details, form answers, and anything outside the ad allowlist are omitted.
*/
export function calendlyEmbedUrl(search = ''): string {
  const kept = new URLSearchParams(keptAdsSearchParams(search))
  const url = new URL(CALENDLY_EVENT_URL)
  url.searchParams.set('hide_event_type_details', '1')
  url.searchParams.set('hide_gdpr_banner', '1')
  url.searchParams.set('primary_color', '2970d6')
  for (const key of [...CALENDLY_STORED_UTM_PARAMS, ...CALENDLY_URL_ONLY_PARAMS]) {
    const value = kept.get(key)
    if (value) url.searchParams.set(key, value)
  }
  for (const key of CALENDLY_CLICK_PARAMS) {
    const value = kept.get(key)
    if (value) url.searchParams.set(key, value)
  }
  const salesforceUuid = salesforceClickId(kept)
  if (salesforceUuid) url.searchParams.set('salesforce_uuid', salesforceUuid)
  return url.toString()
}

export function calendlyEmbedHeightPx(raw: unknown): number | null {
  const text = typeof raw === 'number' && Number.isFinite(raw) ? `${raw}px` : typeof raw === 'string' ? raw.trim() : ''
  const match = /^(\d+(?:\.\d+)?)px$/.exec(text)
  if (!match) return null
  const px = Math.round(Number(match[1]))
  if (px < CALENDLY_MIN_HEIGHT_PX || px > CALENDLY_MAX_HEIGHT_PX) return null
  return px
}

function salesforceClickId(params: URLSearchParams): string | null {
  const parts: string[] = []
  for (const key of CALENDLY_CLICK_PARAMS) {
    const value = params.get(key)
    if (!value) continue
    const part = `${key}:${value}`
    const next = parts.length ? `${parts.join('|')}|${part}` : part
    if (next.length > SALESFORCE_UUID_MAX) continue
    parts.push(part)
  }
  return parts.length ? parts.join('|') : null
}
