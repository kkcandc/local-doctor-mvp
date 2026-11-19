import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { googleTagHtml, resolveGoogleAdsId } from './src/analytics/googleAdsConfig.ts'
import { resolveGaMeasurementId } from './src/analytics/googleAnalyticsConfig.ts'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { siteSitemapXml } from './src/siteMap.ts'

// Injects the Google tag (Ads and GA4) into the SPA shell for production builds.
// Every prerendered route and the SPA fallback shell are built from index.html, so one snippet covers the site.
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

// Writes dist/sitemap.xml. The per-route HTML files are written after this build by
// scripts/prerender.mjs, which renders each public route into its own dist/<path>/index.html.
function sitemapBuildPlugin(): Plugin {
  let outDir = 'dist'
  let ssr = false
  return {
    name: 'local-doctor-sitemap',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
      ssr = Boolean(config.build.ssr)
    },
    async writeBundle() {
      if (ssr) return
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

export default defineConfig(({ mode, isSsrBuild }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    plugins: [react(), googleTagsHtmlPlugin(env.VITE_GOOGLE_ADS_ID, env.VITE_GA_MEASUREMENT_ID), sitemapDevPlugin(), sitemapBuildPlugin()],
    // The prerender reads the manifest to link each route's lazy chunk and its CSS, then deletes it.
    build: isSsrBuild ? {} : { manifest: true },
    // The Typeform embed is CommonJS with no named ESM exports, so the server build bundles it.
    ssr: { noExternal: ['@typeform/embed-react', '@typeform/embed'] },
  }
})
