/*
  Google Ads tag configuration.

  This site is Vite, so the browser-visible env prefix is VITE_.
  NEXT_PUBLIC_GOOGLE_ADS_ID is not read.

  Production builds use AW-18413556843 when VITE_GOOGLE_ADS_ID is unset.
  Set VITE_GOOGLE_ADS_ID=off to leave the tag out of a build.

  The HTML snippet can also config a GA4 measurement id in the same gtag.js
  load. Lead and phone conversions stay here; see googleAnalyticsConfig.ts.

  Conversion labels are the short id after the slash in Google's event snippet
  (AW-18413556843/LABEL). Production builds default to the Local Doctor labels
  below. Event payloads are page path and event name only: no names, emails,
  phone numbers, dates of birth, diagnoses, form answers, or Typeform response ids.

  Account 908-258-0886. The Ads conversion action id 7887201046 is not stored
  in this repo; the code fires send_to with the label Google provides.
*/

export const DEFAULT_GOOGLE_ADS_ID = 'AW-18413556843'
export const DEFAULT_GOOGLE_ADS_LEAD_LABEL = 'KA47CJbG9LAdEOuoosxE'
export const DEFAULT_GOOGLE_ADS_PHONE_LABEL = 'gJr-CJnG9LAdEOuoosxE'

const ADS_ID = /^AW-\d{6,20}$/
const CONVERSION_LABEL = /^[A-Za-z0-9_-]{1,64}$/
const PAGE_PATH = /^\/[A-Za-z0-9/_-]{0,160}$/
const CTA_LOCATION = /^[a-z_]{1,32}$/
const CTA_LABEL = /^[A-Za-z0-9][A-Za-z0-9 '.-]{0,80}$/

// Clinic numbers only. Legal-page 1-800 lines are not lead conversions.
// (844) 509-1404 is included so a future tel: link is tracked; it is not on the site today.
const TRACKED_PHONE_DIGITS = new Set([
  '12403765730',
  '18445091404',
])

// Kept on the first gtag page hit so Google Ads can attribute the click.
// Every other query param is dropped so a link cannot forward an email, phone, or note.
export const ADS_CLICK_PARAMS = [
  'gclid',
  'gbraid',
  'wbraid',
  'dclid',
  'gclsrc',
  'gad_source',
  'gad_campaignid',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
] as const

export type GtagArgs = [command: string, nameOrId: string, params?: Record<string, string>]

export function resolveGoogleAdsId(envValue: string | undefined, enableByDefault: boolean): string | null {
  const trimmed = envValue?.trim()
  if (trimmed === 'off' || trimmed === 'false' || trimmed === '0') return null
  if (trimmed) return ADS_ID.test(trimmed) ? trimmed : null
  return enableByDefault ? DEFAULT_GOOGLE_ADS_ID : null
}

export function resolveGoogleAdsLeadLabel(envValue: string | undefined, enableByDefault: boolean): string | null {
  return resolveConversionLabel(envValue, enableByDefault, DEFAULT_GOOGLE_ADS_LEAD_LABEL)
}

export function resolveGoogleAdsPhoneLabel(envValue: string | undefined, enableByDefault: boolean): string | null {
  return resolveConversionLabel(envValue, enableByDefault, DEFAULT_GOOGLE_ADS_PHONE_LABEL)
}

export function conversionSendTo(adsId: string, label: string | undefined): string | null {
  const trimmed = label?.trim()
  if (!trimmed || !CONVERSION_LABEL.test(trimmed)) return null
  return `${adsId}/${trimmed}`
}

export function safePagePath(input: string): string {
  const path = input.trim().split('#')[0]?.split('?')[0] ?? ''
  if (!path.startsWith('/') || path.startsWith('//')) return '/'
  if (!PAGE_PATH.test(path)) return '/'
  return path
}

export function keptAdsSearchParams(search: string): string {
  const input = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const kept = new URLSearchParams()
  const allowed = new Set<string>(ADS_CLICK_PARAMS)
  for (const [key, value] of input) {
    if (!allowed.has(key) || value.length > 200 || value.includes('@')) continue
    kept.append(key, value)
  }
  return kept.toString()
}

export function pathWithAdsParams(pathname: string, search = ''): string {
  const path = safePagePath(pathname)
  const query = keptAdsSearchParams(search)
  return query ? `${path}?${query}` : path
}

// Append the allow-listed ad params to an external URL (the evaluation Typeform).
// Typeform reads query params whose names match hidden fields. Existing params on
// the destination are left as they are. Contact and health params are already dropped
// by keptAdsSearchParams.
export function hrefWithAdsParams(href: string, search = ''): string {
  const query = keptAdsSearchParams(search)
  if (!query) return href
  const url = new URL(href)
  const kept = new URLSearchParams(query)
  for (const [key, value] of kept) {
    if (!url.searchParams.has(key)) url.searchParams.append(key, value)
  }
  return url.toString()
}

export function adsPageLocation(href: string): string {
  const url = new URL(href, 'https://trylocaldoctor.com')
  const query = keptAdsSearchParams(url.search)
  return `${url.origin}${safePagePath(url.pathname)}${query ? `?${query}` : ''}`
}

export const typeformTransitiveSearchParams = ADS_CLICK_PARAMS.join(',')

export function isTrackedClinicPhone(href: string): boolean {
  const digits = href.replace(/^tel:/i, '').replace(/\D/g, '')
  const normalized = digits.length === 10 ? `1${digits}` : digits
  return TRACKED_PHONE_DIGITS.has(normalized)
}

export function isTypeformSubmitMessage(origin: string, data: unknown): boolean {
  if (!isTypeformOrigin(origin)) return false
  if (data === 'form-submit') return true
  if (!data || typeof data !== 'object') return false
  return (data as { type?: unknown }).type === 'form-submit'
}

// Calendly posts { event: 'calendly.event_scheduled', payload } from its iframe after a booking.
// Only the event name is read. The payload (invitee and event details) is ignored on purpose.
export function isCalendlyScheduledMessage(origin: string, data: unknown): boolean {
  if (origin !== 'https://calendly.com') return false
  if (!data || typeof data !== 'object') return false
  return (data as { event?: unknown }).event === 'calendly.event_scheduled'
}

export function leadTrackingCalls(adsId: string, leadLabel: string | undefined, pathname: string): GtagArgs[] {
  return eventCalls('generate_lead', adsId, leadLabel, pathname)
}

export function phoneTrackingCalls(adsId: string, phoneLabel: string | undefined, pathname: string): GtagArgs[] {
  return eventCalls('phone_click', adsId, phoneLabel, pathname)
}

// Button text we chose. Anything with an email or other free text is dropped.
export function safeCtaLabel(input: string): string | null {
  const label = input.trim().replace(/\s+/g, ' ')
  if (!label || label.includes('@') || !CTA_LABEL.test(label)) return null
  return label
}

/*
  CTA click for GA4 and Ads.

  gtag.js is loaded with the Ads id. An event with no send_to is delivered only
  to that tag (google.com/ccm/collect), so GA4 never sees cta_click. Each call
  below names one destination. The Ads call uses the bare AW id, not AW/label,
  so it is not a conversion. Lead and phone conversions stay separate events.
*/
export function ctaTrackingCalls(
  pathname: string,
  ctaLocation?: string,
  options?: { gaId?: string | null; adsId?: string | null; ctaLabel?: string },
): GtagArgs[] {
  const params: Record<string, string> = { page_path: safePagePath(pathname) }
  if (ctaLocation && CTA_LOCATION.test(ctaLocation)) params.cta_location = ctaLocation
  const label = options?.ctaLabel ? safeCtaLabel(options.ctaLabel) : null
  if (label) params.cta_label = label

  const calls: GtagArgs[] = []
  if (options?.gaId) calls.push(['event', 'cta_click', { ...params, send_to: options.gaId }])
  if (options?.adsId) calls.push(['event', 'cta_click', { ...params, send_to: options.adsId }])
  if (calls.length === 0) calls.push(['event', 'cta_click', params])
  return calls
}

export function spaPageViewCall(
  adsId: string,
  pathname: string,
  previousPath: string | null,
): { nextPath: string; call: GtagArgs | null } {
  const pagePath = safePagePath(pathname)
  if (previousPath === null || previousPath === pagePath) {
    return { nextPath: pagePath, call: null }
  }
  return {
    nextPath: pagePath,
    call: ['event', 'page_view', { send_to: adsId, page_path: pagePath }],
  }
}

// One gtag.js load. Pass a GA4 id to add its config next to Ads, using the same
// sanitized pageLocation. Ads-only output stays the original snippet.
export function googleTagHtml(adsId: string | null, gaMeasurementId?: string | null): string | null {
  const gaId = gaMeasurementId || null
  if (!adsId && !gaId) return null
  const loaderId = adsId || gaId
  if (!loaderId) return null
  const allowed = ADS_CLICK_PARAMS.join(',')
  const configLines = [
    adsId ? `        gtag('config', '${adsId}', { page_location: pageLocation });` : '',
    gaId ? `        gtag('config', '${gaId}', { page_location: pageLocation });` : '',
  ].filter((line) => line.length > 0)
  const src = `https://www.googletagmanager.com/gtag/js?id=${loaderId}`
  const script = gaId
    ? `    <script async src="${src}" data-ga-measurement-id="${gaId}"></script>`
    : `    <script async src="${src}"></script>`
  return [
    '    <!-- Google tag (gtag.js) -->',
    script,
    '    <script>',
    '      window.dataLayer = window.dataLayer || [];',
    '      function gtag(){dataLayer.push(arguments);}',
    '      gtag(\'js\', new Date());',
    '      (function () {',
    `        var allowed = {${allowed.split(',').map((key) => `${key}:1`).join(',')}};`,
    '        var pageLocation = location.origin + \'/\';',
    '        try {',
    '          var url = new URL(location.href);',
    '          var kept = new URLSearchParams();',
    '          url.searchParams.forEach(function (value, key) {',
    '            if (allowed[key] && value.length <= 200 && value.indexOf(\'@\') === -1) kept.append(key, value);',
    '          });',
    '          var path = /^\\/[A-Za-z0-9/_-]{0,160}$/.test(url.pathname) ? url.pathname : \'/\';',
    '          pageLocation = url.origin + path + (kept.toString() ? \'?\' + kept.toString() : \'\');',
    '        } catch (e) {}',
    ...configLines,
    '      })();',
    '    </script>',
  ].join('\n')
}

export function googleAdsTagHtml(id: string): string {
  return googleTagHtml(id, null) ?? ''
}

function eventCalls(eventName: string, adsId: string, label: string | undefined, pathname: string): GtagArgs[] {
  const calls: GtagArgs[] = [['event', eventName, { page_path: safePagePath(pathname) }]]
  const sendTo = conversionSendTo(adsId, label)
  if (sendTo) calls.push(['event', 'conversion', { send_to: sendTo }])
  return calls
}

function resolveConversionLabel(
  envValue: string | undefined,
  enableByDefault: boolean,
  fallback: string,
): string | null {
  const trimmed = envValue?.trim()
  if (trimmed === 'off' || trimmed === 'false' || trimmed === '0') return null
  if (trimmed) return CONVERSION_LABEL.test(trimmed) ? trimmed : null
  return enableByDefault ? fallback : null
}

function isTypeformOrigin(origin: string): boolean {
  try {
    const url = new URL(origin)
    return url.protocol === 'https:' && (url.hostname === 'typeform.com' || url.hostname.endsWith('.typeform.com'))
  } catch {
    return false
  }
}
