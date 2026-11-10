import { landingCanonical, landingMeta, type LandingSlug } from './landingMeta.ts'
import type { PageShellMeta } from '../pageMeta.ts'

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function setMetaContent(html: string, attr: 'name' | 'property', key: string, content: string): string {
  const pattern = new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`, 'i')
  return html.replace(pattern, `$1${escapeAttr(content)}$2`)
}

// Rewrites the built index.html into the shell for one landing route. The app still
// boots the same bundle; only the head tags differ so they are right before JS runs.
export function landingHtml(indexHtml: string, slug: LandingSlug): string {
  const { title, description } = landingMeta[slug]
  const url = landingCanonical(slug)
  let html = indexHtml.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeText(title)}</title>`)
  html = setMetaContent(html, 'name', 'description', description)
  html = setMetaContent(html, 'property', 'og:title', title)
  html = setMetaContent(html, 'property', 'og:description', description)
  const tags = `    <link rel="canonical" href="${escapeAttr(url)}" />\n    <meta property="og:url" content="${escapeAttr(url)}" />\n`
  return html.replace(/\s*<\/head>/i, `\n${tags}  </head>`)
}

// Shell for a conversion page (/get-started, /evaluation). Same bundle, own title and description,
// and a robots noindex tag when the page should stay out of search results.
export function pageShellHtml(indexHtml: string, meta: PageShellMeta): string {
  let html = indexHtml.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeText(meta.title)}</title>`)
  html = setMetaContent(html, 'name', 'description', meta.description)
  html = setMetaContent(html, 'property', 'og:title', meta.title)
  html = setMetaContent(html, 'property', 'og:description', meta.description)
  if (!meta.noindex) return html
  return html.replace(/\s*<\/head>/i, '\n    <meta name="robots" content="noindex, follow" />\n  </head>')
}
