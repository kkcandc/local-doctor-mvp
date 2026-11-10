import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { googleTagHtml, resolveGoogleAdsId } from './src/analytics/googleAdsConfig.ts'
import { resolveGaMeasurementId } from './src/analytics/googleAnalyticsConfig.ts'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { landingHtml, pageShellHtml } from './src/landing/landingHtml.ts'
import { pageShells } from './src/pageMeta.ts'
import { landingSlugs } from './src/landing/landingMeta.ts'
import { siteSitemapXml } from './src/siteMap.ts'

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

// Writes dist/<slug>/index.html for each intent landing page, /get-started and /evaluation so
// the title, description, and canonical (or noindex) are in the HTML response. Vercel serves these before the SPA rewrite.
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
      for (const [slug, meta] of Object.entries(pageShells)) {
        const dir = path.join(outDir, slug)
        await mkdir(dir, { recursive: true })
        await writeFile(path.join(dir, 'index.html'), pageShellHtml(indexHtml, meta))
      }
      await writeFile(path.join(outDir, 'sitemap.xml'), siteSitemapXml())
    },
  }
}

// Serves /sitemap.xml in dev with an XML content type. Production uses the file
// written into dist, plus the Content-Type header in vercel.json.
function sitemapDevPlugin(): Plugin {
  return {
    name: 'local-doctor-sitemap-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0]
        if (url !== '/sitemap.xml') return next()
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/xml; charset=utf-8')
        res.end(siteSitemapXml())
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    plugins: [react(), googleTagsHtmlPlugin(env.VITE_GOOGLE_ADS_ID, env.VITE_GA_MEASUREMENT_ID), sitemapDevPlugin(), landingPagesHtmlPlugin()],
  }
})
