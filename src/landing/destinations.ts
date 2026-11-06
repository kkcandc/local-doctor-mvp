/*
  Where each landing page's Get Started button goes.

  Today every funnel uses the existing /get-started intake (the Typeform embed).
  When Eric's evaluation or screening Typeform is ready, change the funnel's
  entry below to { kind: 'external', href: 'https://...' }. Nothing else in the
  landing pages needs to change for the button to point at the new form.

  Constraints:
  - An external form does not fire the Google Ads lead conversion; that is wired
    to the /get-started embed only (src/analytics/googleAds.ts).
  - /dementia-test-online states that no online screening tool is offered. Revise
    that copy in landingContent.ts before pointing onlineScreening at a screener.
  - Only https URLs on an allowed host are accepted; anything else falls back to
    the intake so a typo can never produce a dead or off-site button.
*/

export type LandingFunnel = 'evaluation' | 'onlineScreening'

export type CtaDestination = { kind: 'intake' } | { kind: 'external'; href: string }

export const landingDestinations: Record<LandingFunnel, CtaDestination> = {
  evaluation: { kind: 'intake' },
  onlineScreening: { kind: 'intake' },
}

export const intakePath = '/get-started'

const allowedExternalHosts = ['trylocaldoctor.com', 'form.typeform.com', 'typeform.com']

export function isAllowedExternalHref(href: string): boolean {
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return false
  }
  if (url.protocol !== 'https:') return false
  const host = url.hostname.toLowerCase()
  return allowedExternalHosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))
}

export function resolveDestination(destination: CtaDestination): CtaDestination {
  if (destination.kind === 'external' && !isAllowedExternalHref(destination.href)) return { kind: 'intake' }
  return destination
}
