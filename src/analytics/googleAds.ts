import {
  isTrackedClinicPhone,
  isCalendlyScheduledMessage,
  isTypeformSubmitMessage,
  adsPageLocation,
  leadTrackingCalls,
  phoneTrackingCalls,
  resolveGoogleAdsId,
  resolveGoogleAdsLeadLabel,
  resolveGoogleAdsPhoneLabel,
  spaPageViewCall,
  type GtagArgs,
} from './googleAdsConfig'

const LEAD_DEDUPE_MS = 4000

let listenersBound = false
let lastLeadAt = 0
let lastSpaPath: string | null = null

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    localDoctorOnTypeformSubmit?: () => void
  }
}

function adsId(): string | null {
  return resolveGoogleAdsId(import.meta.env.VITE_GOOGLE_ADS_ID, import.meta.env.PROD)
}

function leadLabel(): string | null {
  return resolveGoogleAdsLeadLabel(import.meta.env.VITE_GOOGLE_ADS_LEAD_LABEL, import.meta.env.PROD)
}

function phoneLabel(): string | null {
  return resolveGoogleAdsPhoneLabel(import.meta.env.VITE_GOOGLE_ADS_PHONE_LABEL, import.meta.env.PROD)
}

function push(calls: GtagArgs[]) {
  if (typeof window.gtag !== 'function') return
  for (const args of calls) window.gtag(...args)
}

export function installGoogleAds() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  window.localDoctorOnTypeformSubmit = onTypeformSubmit
  if (!listenersBound) {
    listenersBound = true
    document.addEventListener('click', onDocumentClick, true)
    window.addEventListener('message', onWindowMessage)
  }
  const id = adsId()
  if (!id || document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) return

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    // gtag.js only dispatches the arguments object. A rest array is ignored.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments)
  }
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`
  script.dataset.googleAdsId = id
  document.head.appendChild(script)
  window.gtag('js', new Date())
  window.gtag('config', id, { page_location: adsPageLocation(window.location.href) })
}

// Reports the lead conversion. Typeform calls this directly with { formId, responseId }, and a
// Calendly booking reaches it through onWindowMessage. Arguments and payloads are ignored on purpose.
export function onTypeformSubmit() {
  const now = Date.now()
  if (now - lastLeadAt < LEAD_DEDUPE_MS) return
  const id = adsId()
  if (!id) return
  lastLeadAt = now
  push(leadTrackingCalls(id, leadLabel() ?? undefined, window.location.pathname))
}

export function noteSpaNavigation(pathname: string) {
  const id = adsId()
  if (!id) return
  const result = spaPageViewCall(id, pathname, lastSpaPath)
  lastSpaPath = result.nextPath
  if (result.call) push([result.call])
}

function onDocumentClick(event: MouseEvent) {
  if (!(event.target instanceof Element)) return
  const link = event.target.closest('a')
  if (!(link instanceof HTMLAnchorElement)) return
  const href = link.getAttribute('href') ?? ''
  if (!href.toLowerCase().startsWith('tel:')) return
  if (!isTrackedClinicPhone(href)) return
  const id = adsId()
  if (!id) return
  push(phoneTrackingCalls(id, phoneLabel() ?? undefined, window.location.pathname))
}

function onWindowMessage(event: MessageEvent) {
  if (!isTypeformSubmitMessage(event.origin, event.data) && !isCalendlyScheduledMessage(event.origin, event.data)) return
  onTypeformSubmit()
}
