import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { googleAdsTagHtml, resolveGoogleAdsId } from './src/analytics/googleAdsConfig.ts'

// Injects the Google Ads tag into the SPA shell for production builds.
// Every route is rewritten to index.html, so one snippet covers the site.
function googleAdsHtmlPlugin(envValue: string | undefined): Plugin {
  return {
    name: 'local-doctor-google-ads',
    apply: 'build',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const id = resolveGoogleAdsId(envValue, true)
        if (!id || html.includes('googletagmanager.com/gtag/js')) return html
        const head = html.match(/<head[^>]*>/i)
        if (!head || head.index === undefined) return html
        const insertAt = head.index + head[0].length
        return `${html.slice(0, insertAt)}\n${googleAdsTagHtml(id)}${html.slice(insertAt)}`
      },
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    plugins: [react(), googleAdsHtmlPlugin(env.VITE_GOOGLE_ADS_ID)],
  }
})
