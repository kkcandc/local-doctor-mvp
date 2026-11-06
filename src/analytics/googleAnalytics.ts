import { adsPageLocation, ctaTrackingCalls, spaPageViewCall, type GtagArgs } from './googleAdsConfig'
import { resolveGaMeasurementId } from './googleAnalyticsConfig'

// Same allow-list as Google Ads: click ids and utm_* stay, everything else is dropped.
export function gaPageLocation(href: string): string {
  return adsPageLocation(href)
}

export function gaSpaPageViewCall(
  measurementId: string,
  pathname: string,
  previousPath: string | null,
): { nextPath: string; call: GtagArgs | null } {
  return spaPageViewCall(measurementId, pathname, previousPath)
}

let lastSpaPath: string | null = null

function measurementId(): string | null {
  return resolveGaMeasurementId(import.meta.env.VITE_GA_MEASUREMENT_ID, import.meta.env.PROD)
}

function push(calls: GtagArgs[]) {
  if (typeof window.gtag !== 'function') return
  for (const args of calls) window.gtag(...args)
}

function ensureGtag() {
  window.dataLayer = window.dataLayer || []
  if (typeof window.gtag === 'function') return
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args)
  }
}

// Installs GA4 beside Ads. main.tsx calls installGoogleAds first so this does
// not steal the fallback script load and skip the Ads config.
export function installGoogleAnalytics() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  const id = measurementId()
  if (!id) return

  const existing = document.querySelector('script[src*="googletagmanager.com/gtag/js"]')
  if (existing instanceof HTMLScriptElement && existing.dataset.gaMeasurementId) return

  if (existing instanceof HTMLScriptElement) {
    ensureGtag()
    existing.dataset.gaMeasurementId = id
    window.gtag?.('config', id, { page_location: gaPageLocation(window.location.href) })
    return
  }

  ensureGtag()
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`
  script.dataset.gaMeasurementId = id
  document.head.appendChild(script)
  window.gtag?.('js', new Date())
  window.gtag?.('config', id, { page_location: gaPageLocation(window.location.href) })
}

// First call records the landing path and sends nothing. The config hit already
// counted that view. Later route changes send page_path only.
export function noteGaSpaNavigation(pathname: string) {
  const id = measurementId()
  if (!id) return
  const result = gaSpaPageViewCall(id, pathname, lastSpaPath)
  lastSpaPath = result.nextPath
  if (result.call) push([result.call])
}

// Fired when a visitor clicks through to /get-started. Path and button slot only.
export function noteGaCtaClick(pathname: string, ctaLocation?: string) {
  if (!measurementId()) return
  push(ctaTrackingCalls(pathname, ctaLocation))
}
