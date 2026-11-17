import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './tokens.css'
import './index.css'
import './forms.css'
import App from './App'
import { installGoogleAds } from './analytics/googleAds'
import { installGoogleAnalytics } from './analytics/googleAnalytics'
import { installPostHog } from './analytics/posthog'
import { installTracking } from './analytics/tracking'
import { syncChatbot } from './chatbot'
import { stopEarlyClicks } from './earlyClicks'
import { lazyPageFor, preloadAllPages } from './routePages'
import { initialLocation } from './routes'

// Ads first. If the built HTML has no gtag snippet, Ads creates it and configs AW-…
// and GA4 then adds its config. Reversing that would leave Ads unconfigured.
installGoogleAds()
installGoogleAnalytics()
installTracking()
installPostHog()
syncChatbot(window.location.pathname)

const root = document.getElementById('root')!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

function preloadOtherPages() {
  window.setTimeout(() => void preloadAllPages(), 0)
}

// Public routes are prerendered at build time (scripts/prerender.mjs), so root already holds the
// page. Its chunk is loaded first so the first render matches that HTML. Any other path gets the
// empty SPA shell and renders from scratch.
if (root.hasChildNodes()) {
  const page = lazyPageFor(initialLocation(window.location.pathname.replace(/^\/+|\/+$/g, '')).route)
  void (page ? page.preload() : Promise.resolve()).then(() => {
    hydrateRoot(root, app)
    stopEarlyClicks()
    preloadOtherPages()
  })
} else {
  createRoot(root).render(app)
  preloadOtherPages()
}
