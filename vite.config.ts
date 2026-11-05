import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { googleTagHtml, resolveGoogleAdsId } from './src/analytics/googleAdsConfig.ts'
import { resolveGaMeasurementId } from './src/analytics/googleAnalyticsConfig.ts'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { landingHtml } from './src/landing/landingHtml.ts'
import { landingSlugs } from './src/landing/landingMeta.ts'

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

// Writes dist/<slug>/index.html for each intent landing page so its title, description,
// and canonical are in the HTML response. Vercel serves these before the SPA rewrite.
function landingPagesHtmlPlugin(): Plugin {
  let outDir = 'dist'
  return {
    name: 'local-doctor-landing-pages',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },
    async writeBundle() {
      const indexHtml = await readFile(path.join(outDir, 'index.html'), 'utf8')
      for (const slug of landingSlugs) {
        const dir = path.join(outDir, slug)
        await mkdir(dir, { recursive: true })
        await writeFile(path.join(dir, 'index.html'), landingHtml(indexHtml, slug))
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    plugins: [react(), googleTagsHtmlPlugin(env.VITE_GOOGLE_ADS_ID, env.VITE_GA_MEASUREMENT_ID), landingPagesHtmlPlugin()],
  }
})
