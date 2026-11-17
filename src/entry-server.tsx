import { StrictMode } from 'react'
import { prerender } from 'react-dom/static'
import App from './App'
import { pageHead } from './pageHead'
import { lazyPageFor, preloadAllPages } from './routePages'
import { pathFor, prerenderLocations } from './routes'

/*
  Build-time only. scripts/prerender.mjs loads the SSR build of this file and writes one HTML
  file per public route, so the first response already has the page content and head tags.
*/

export type PrerenderedPage = {
  path: string
  head: ReturnType<typeof pageHead>
  html: string
  // Vite manifest key of the route's lazy chunk, if it has one.
  lazySource?: string
}

export async function prerenderAll(): Promise<PrerenderedPage[]> {
  await preloadAllPages()
  const pages: PrerenderedPage[] = []
  for (const location of prerenderLocations()) {
    const path = pathFor(location)
    const { prelude } = await prerender(
      <StrictMode>
        <App pathname={path} />
      </StrictMode>,
    )
    const html = await new Response(prelude).text()
    pages.push({ path, head: pageHead(location), html, lazySource: lazyPageFor(location.route)?.source })
  }
  return pages
}

export { earlyClickScript } from './earlyClicks'
export { staticPageHtml } from './landing/landingHtml'
