import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './tokens.css'
import './index.css'
import './forms.css'
import App from './App'
import { installGoogleAds } from './analytics/googleAds'
import { installPostHog } from './analytics/posthog'

installGoogleAds()
installPostHog()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
