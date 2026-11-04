import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { googleTagHtml, resolveGoogleAdsId } from './src/analytics/googleAdsConfig.ts'
import { resolveGaMeasurementId } from './src/analytics/googleAnalyticsConfig.ts'

// Injects the Google tag (Ads and GA4) into the SPA shell for production builds.
// Every route is rewritten to index.html, so one snippet covers the site.
function googleTagsHtmlPlugin(adsEnv: string | undefined, gaEnv: string | undefined): Plugin {
  return {
    name: 'local-doctor-google-tags',
    apply: 'build',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        if (html.includes('googletagmanager.com/gtag/js')) return html
        const snippet = googleTagHtml(resolveGoogleAdsId(adsEnv, true), resolveGaMeasurementId(gaEnv, true))
        if (!snippet) return html
        const head = html.match(/<head[^>]*>/i)
        if (!head || head.index === undefined) return html
        const insertAt = head.index + head[0].length
        return `${html.slice(0, insertAt)}\n${snippet}${html.slice(insertAt)}`
      },
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    plugins: [react(), googleTagsHtmlPlugin(env.VITE_GOOGLE_ADS_ID, env.VITE_GA_MEASUREMENT_ID)],
  }
})
