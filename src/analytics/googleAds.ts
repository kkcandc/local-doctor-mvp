import { adsPageLocation, resolveGoogleAdsId, spaPageViewCall, type GtagArgs } from './googleAdsConfig'

let lastSpaPath: string | null = null

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

function adsId(): string | null {
  return resolveGoogleAdsId(import.meta.env.VITE_GOOGLE_ADS_ID, import.meta.env.PROD)
}

function push(calls: GtagArgs[]) {
  if (typeof window.gtag !== 'function') return
  for (const args of calls) window.gtag(...args)
}

// Loads gtag.js and configs the Ads id when the built HTML did not already do it.
// Conversion events are sent from tracking.ts.
export function installGoogleAds() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
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

export function noteSpaNavigation(pathname: string) {
  const id = adsId()
  if (!id) return
  const result = spaPageViewCall(id, pathname, lastSpaPath)
  lastSpaPath = result.nextPath
  if (result.call) push([result.call])
}
