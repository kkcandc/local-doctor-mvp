import type { PostHog } from 'posthog-js'

const projectToken = import.meta.env.VITE_POSTHOG_KEY
const apiHost = import.meta.env.VITE_POSTHOG_HOST

// posthog-js is the largest dependency, so it loads in its own chunk after the app starts.
let posthog: PostHog | null = null
let installing = false

export function installPostHog() {
  if (typeof window === 'undefined' || !projectToken || !apiHost || installing) return
  installing = true
  void import('posthog-js').then(({ default: client }) => {
    posthog = client
    if (client.__loaded) return
    init(client)
  })
}

function init(client: PostHog) {
  client.init(projectToken, {
    api_host: apiHost,
    defaults: '2026-08-30',
    // Pinned so a future `defaults` change cannot alter it: a pageview on first load and on every path change.
    capture_pageview: 'history_change',
    persistence: 'memory',
    logs: {
      serviceName: 'local-doctor-web',
      environment: import.meta.env.MODE,
    },
    capture_exceptions: {
      capture_unhandled_errors: true,
      capture_unhandled_rejections: true,
      capture_console_errors: false,
    },
  })
}

const CTA_LOCATION = /^[a-z_]{1,32}$/

// Called when a visitor clicks through to the eligibility page. The path is where they came from.
// ctaLocation names the button's slot on the page (hero, closing, ...), never anything the visitor typed.
export function noteEligibilityStarted(sourcePath: string, ctaLocation?: string) {
  if (!posthog?.__loaded) return
  const location = ctaLocation && CTA_LOCATION.test(ctaLocation) ? { cta_location: ctaLocation } : {}
  posthog.capture('eligibility_check_started', { source_path: sourcePath, ...location })
  posthog.logger.info('eligibility journey opened', {
    flow_stage: 'started',
    source_path: sourcePath,
    ...location,
  })
}
