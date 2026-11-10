import {
  DEFAULT_GOOGLE_ADS_LEAD_LABEL,
  DEFAULT_GOOGLE_ADS_PHONE_LABEL,
  isTrackedClinicPhone,
  conversionSendTo,
  resolveGoogleAdsId,
  resolveGoogleAdsLeadLabel,
  resolveGoogleAdsPhoneLabel,
  safeCtaLabel,
  safePagePath,
  type GtagArgs,
} from './googleAdsConfig'
import { resolveGaMeasurementId } from './googleAnalyticsConfig'

/*
  Central conversion event layer for Google Ads and GA4.

  Every site event goes through trackEvent. The only data it can send is the event
  name, the page path, and the button text and destination of a CTA click. Callers
  cannot attach anything else, so form answers, names, emails, phone numbers and
  Typeform response ids have no way into a hit. No enhanced conversions, no user data.

  To change a conversion, edit its label in ADS_CONVERSIONS below. A label is the part
  after the slash in Google's send_to (AW-18413556843/<label>). A label that is empty
  or still a placeholder is skipped, and the GA4 event is sent either way.

  Dedupe: each Ads conversion fires at most once per page session (one page load, so
  moving around the single-page app does not reset it). GA4 events other than clicks
  also fire once per page session, so a repeated Calendly message is not double counted.
*/

export type TrackedEvent =
  | 'visit_booked'
  | 'phone_tap'
  | 'cta_click'
  | 'calendly_viewed'
  | 'calendly_time_selected'
  | 'evaluation_started'
  | 'evaluation_submitted'
  | 'engaged_visit'

type AdsConversion = { label: string; value?: number; currency?: string }

export const ADS_CONVERSIONS: Partial<Record<TrackedEvent, AdsConversion>> = {
  // Calendly calendly.event_scheduled only. The Typeform submit never fires this.
  visit_booked: { label: DEFAULT_GOOGLE_ADS_LEAD_LABEL, value: 300, currency: 'USD' },
  phone_tap: { label: DEFAULT_GOOGLE_ADS_PHONE_LABEL },
  cta_click: { label: 'A54CCNK03bUdEOuoosxE' },
  calendly_time_selected: { label: 'CqZ_CKDm17UdEOuoosxE' },
  evaluation_started: { label: 'r0XvCNW03bUdEOuoosxE' },
  evaluation_submitted: { label: 'vOMaCO613bUdEOuoosxE', value: 100, currency: 'USD' },
  engaged_visit: { label: 'DTk2CPG13bUdEOuoosxE' },
  // calendly_viewed is GA4 only.
}

// GA4 event names per event. generate_lead and phone_click are kept alongside the new
// names so existing reports keep working.
const GA_EVENTS: Record<TrackedEvent, { names: string[]; oncePerSession: boolean }> = {
  visit_booked: { names: ['visit_booked', 'generate_lead'], oncePerSession: true },
  phone_tap: { names: ['phone_tap', 'phone_click'], oncePerSession: false },
  cta_click: { names: ['cta_click'], oncePerSession: false },
  calendly_viewed: { names: ['calendly_viewed'], oncePerSession: true },
  calendly_time_selected: { names: ['calendly_time_selected'], oncePerSession: true },
  evaluation_started: { names: ['evaluation_started'], oncePerSession: true },
  evaluation_submitted: { names: ['evaluation_submitted'], oncePerSession: true },
  engaged_visit: { names: ['engaged_visit'], oncePerSession: true },
}

export type EventDetails = {
  pathname: string
  ctaLocation?: string
  ctaLabel?: string
  ctaDestination?: string
}

export type TrackingContext = {
  gaId: string | null
  adsId: string | null
  // Overrides ADS_CONVERSIONS labels. Used by tests and by env overrides.
  labels?: Partial<Record<TrackedEvent, string | null>>
}

export type FiredState = { ga: Set<TrackedEvent>; ads: Set<TrackedEvent> }

export function newFiredState(): FiredState {
  return { ga: new Set(), ads: new Set() }
}

const CTA_LOCATION = /^[a-z_]{1,32}$/

function eventParams(event: TrackedEvent, details: EventDetails): Record<string, string> {
  const params: Record<string, string> = { page_path: safePagePath(details.pathname) }
  if (event === 'cta_click') {
    if (details.ctaLocation && CTA_LOCATION.test(details.ctaLocation)) params.cta_location = details.ctaLocation
    const label = details.ctaLabel ? safeCtaLabel(details.ctaLabel) : null
    if (label) params.cta_label = label
    if (details.ctaDestination) params.cta_destination = safePagePath(details.ctaDestination)
  }
  if (event === 'visit_booked') params.booking_source = 'calendly'
  if (event === 'evaluation_started' || event === 'evaluation_submitted') params.form_name = 'evaluation'
  return params
}

// Pure planner: returns the gtag calls for one event and records what it fired in `fired`.
export function buildTrackingCalls(
  event: TrackedEvent,
  details: EventDetails,
  context: TrackingContext,
  fired: FiredState = newFiredState(),
): GtagArgs[] {
  const calls: GtagArgs[] = []
  const definition = GA_EVENTS[event]
  const params = eventParams(event, details)

  if (context.gaId && !(definition.oncePerSession && fired.ga.has(event))) {
    fired.ga.add(event)
    for (const name of definition.names) calls.push(['event', name, { ...params, send_to: context.gaId }])
  }

  const conversion = ADS_CONVERSIONS[event]
  const label = context.labels && event in context.labels ? context.labels[event] : conversion?.label
  const sendTo = context.adsId ? conversionSendTo(context.adsId, label ?? undefined) : null
  if (sendTo && !fired.ads.has(event)) {
    fired.ads.add(event)
    const call: Record<string, string | number> = { send_to: sendTo }
    if (conversion?.value !== undefined && conversion.currency) {
      call.value = conversion.value
      call.currency = conversion.currency
    }
    calls.push(['event', 'conversion', call])
  }
  return calls
}

const fired = newFiredState()
let listenersBound = false

function resolveContext(): TrackingContext {
  // The two original labels can still be switched off or swapped per build with their env vars.
  return {
    adsId: resolveGoogleAdsId(import.meta.env.VITE_GOOGLE_ADS_ID, import.meta.env.PROD),
    gaId: resolveGaMeasurementId(import.meta.env.VITE_GA_MEASUREMENT_ID, import.meta.env.PROD),
    labels: {
      visit_booked: resolveGoogleAdsLeadLabel(import.meta.env.VITE_GOOGLE_ADS_LEAD_LABEL, true),
      phone_tap: resolveGoogleAdsPhoneLabel(import.meta.env.VITE_GOOGLE_ADS_PHONE_LABEL, true),
    },
  }
}

export function trackEvent(event: TrackedEvent, details: Partial<EventDetails> = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  const context = resolveContext()
  if (!context.gaId && !context.adsId) return
  const calls = buildTrackingCalls(event, { pathname: window.location.pathname, ...details }, context, fired)
  for (const args of calls) window.gtag(...args)
}

export function trackCtaClick(ctaLocation?: string, ctaLabel?: string, ctaDestination?: string) {
  trackEvent('cta_click', { ctaLocation, ctaLabel, ctaDestination })
}

// Typeform callbacks pass a form id and a response id. These helpers take no arguments on
// purpose, so nothing from the form can reach a hit.
export function trackEvaluationStarted() {
  trackEvent('evaluation_started')
}

export function trackEvaluationSubmitted() {
  trackEvent('evaluation_submitted')
}

const CALENDLY_ORIGIN = 'https://calendly.com'

// Only the event name is read. The payload (invitee and event details) is ignored on purpose.
export function calendlyTrackedEvent(origin: string, data: unknown): TrackedEvent | null {
  if (origin !== CALENDLY_ORIGIN) return null
  if (!data || typeof data !== 'object') return null
  switch ((data as { event?: unknown }).event) {
    case 'calendly.event_scheduled':
      return 'visit_booked'
    case 'calendly.date_and_time_selected':
      return 'calendly_time_selected'
    case 'calendly.event_type_viewed':
      return 'calendly_viewed'
    default:
      return null
  }
}

function onWindowMessage(event: MessageEvent) {
  const tracked = calendlyTrackedEvent(event.origin, event.data)
  if (tracked) trackEvent(tracked)
}

function onDocumentClick(event: MouseEvent) {
  if (!(event.target instanceof Element)) return
  const link = event.target.closest('a')
  if (!(link instanceof HTMLAnchorElement)) return
  const href = link.getAttribute('href') ?? ''
  if (!href.toLowerCase().startsWith('tel:') || !isTrackedClinicPhone(href)) return
  trackEvent('phone_tap')
}

export const ENGAGED_VISIT_MS = 45_000
export const ENGAGED_VISIT_SCROLL = 0.5
const ENGAGED_STORAGE_KEY = 'ld_engaged_visit'

function scrollDepth(): number {
  const doc = document.documentElement
  const total = Math.max(doc.scrollHeight, 1)
  return (window.scrollY + window.innerHeight) / total
}

function engagedAlreadyRecorded(): boolean {
  try {
    return window.sessionStorage.getItem(ENGAGED_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

// Once per browser session: 45 seconds with the tab visible and at least half the page scrolled.
function installEngagedVisit() {
  if (engagedAlreadyRecorded()) return
  let visibleMs = 0
  let scrolled = false
  let timer = 0

  const check = () => {
    if (visibleMs < ENGAGED_VISIT_MS || !scrolled) return
    window.clearInterval(timer)
    window.removeEventListener('scroll', onScroll)
    try {
      window.sessionStorage.setItem(ENGAGED_STORAGE_KEY, '1')
    } catch {
      // Storage can be blocked. The in-memory dedupe still holds for this page load.
    }
    trackEvent('engaged_visit')
  }
  const onScroll = () => {
    if (!scrolled && scrollDepth() >= ENGAGED_VISIT_SCROLL) scrolled = true
    check()
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  timer = window.setInterval(() => {
    if (document.visibilityState === 'visible') visibleMs += 1000
    if (!scrolled && scrollDepth() >= ENGAGED_VISIT_SCROLL) scrolled = true
    check()
  }, 1000)
}

export function installTracking() {
  if (typeof window === 'undefined' || typeof document === 'undefined' || listenersBound) return
  listenersBound = true
  document.addEventListener('click', onDocumentClick, true)
  window.addEventListener('message', onWindowMessage)
  installEngagedVisit()
}
