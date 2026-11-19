/*
  Where each landing page's primary button goes.

  Every funnel uses the /get-started scheduler (the Calendly embed). evaluationForm
  (/dementia-evaluation, /alzheimers-evaluation, /memory-evaluation and /alzheimers-blood-test)
  used to send its buttons to /evaluation, the scored evaluation Typeform. It now goes straight
  to the scheduler so a visitor reaches open times without a quiz first, and gives contact
  details once, in Calendly. The /evaluation route still exists (src/EvaluationPage.tsx); no
  landing button points at it. To send a funnel back there, set it to { kind: 'evaluation' }.
  To point another funnel at an external form, change its entry below to
  { kind: 'external', href: 'https://...' }. To move a single page, give it its own
  funnel key rather than flipping a shared one.

  Constraints:
  - An external form cannot be measured. Prefer the on-site /evaluation page.
  - /dementia-test-online states that no online screening tool is offered. Revise
    that copy in landingContent.ts before pointing onlineScreening at a screener.
  - Only https URLs on an allowed host are accepted for external forms; anything else
    falls back to the scheduler so a typo can never produce a dead or off-site button.
*/

export type LandingFunnel = 'evaluation' | 'evaluationForm' | 'onlineScreening'

export type CtaDestination = { kind: 'intake' } | { kind: 'evaluation' } | { kind: 'external'; href: string }

export const landingDestinations: Record<LandingFunnel, CtaDestination> = {
  evaluation: { kind: 'intake' },
  evaluationForm: { kind: 'intake' },
  onlineScreening: { kind: 'intake' },
}

export const intakePath = '/get-started'
export const evaluationPath = '/evaluation'

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

/*
  Optional booking link for /get-started (VITE_BOOKING_URL). There is no real
  scheduler yet, so this is unset and the page keeps the existing Typeform intake.
  When a scheduler is chosen, set the URL and add its host to allowedExternalHosts
  after it has been reviewed (including whether a BAA is needed). Anything that is
  not an allowed https URL is ignored, so a bad value never produces a dead button.
*/
export function resolveBookingUrl(raw: string | undefined): string | null {
  const value = raw?.trim()
  if (!value) return null
  return isAllowedExternalHref(value) ? value : null
}
