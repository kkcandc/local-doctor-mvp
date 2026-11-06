import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './tokens.css'
import './index.css'
import './forms.css'
import App from './App'
import { installGoogleAds } from './analytics/googleAds'
import { installGoogleAnalytics } from './analytics/googleAnalytics'
import { installPostHog } from './analytics/posthog'

// Ads first. If the built HTML has no gtag snippet, Ads creates it and configs AW-…
// and GA4 then adds its config. Reversing that would leave Ads unconfigured.
installGoogleAds()
installGoogleAnalytics()
installPostHog()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
