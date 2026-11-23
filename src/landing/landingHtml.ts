import { clinicPhoneForLanding, isVirginiaLandingSlug } from '../clinicPhones.ts'
import { landingCanonical, landingMeta, type LandingSlug } from './landingMeta.ts'

export type StaticHead = {
  title: string
  description: string
  og?: { title: string; description: string }
  ogUrl?: string
  canonical?: string
  noindex?: boolean
  jsonLd?: Record<string, unknown>
}

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

// Rewrites the built index.html head for one route: title, description, Open Graph, and
// canonical, robots, and JSON-LD tags when the route has them. extraHead goes in as is.
export function staticPageHtml(indexHtml: string, head: StaticHead, extraHead = ''): string {
  let html = indexHtml.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeText(head.title)}</title>`)
  html = setMetaContent(html, 'name', 'description', head.description)
  if (head.og) {
    html = setMetaContent(html, 'property', 'og:title', head.og.title)
    html = setMetaContent(html, 'property', 'og:description', head.og.description)
  }
  let tags = ''
  if (head.canonical) tags += `    <link rel="canonical" href="${escapeAttr(head.canonical)}" />\n`
  if (head.ogUrl) tags += `    <meta property="og:url" content="${escapeAttr(head.ogUrl)}" />\n`
  if (head.noindex) tags += '    <meta name="robots" content="noindex, follow" />\n'
  if (head.jsonLd) {
    // The id matches the tag usePageMeta updates, so the app reuses it instead of adding a second one.
    const json = JSON.stringify(head.jsonLd).replace(/</g, '\\u003c')
    tags += `    <script id="blog-article-jsonld" type="application/ld+json">${json}</script>\n`
  }
  tags += extraHead
  if (!tags) return html
  return html.replace(/\s*<\/head>/i, `\n${tags}  </head>`)
}

export function landingHead(slug: LandingSlug): StaticHead {
  const meta = landingMeta[slug]
  const url = landingCanonical(slug)
  const head: StaticHead = { ...meta, og: meta, ogUrl: url, canonical: url }
  if (isVirginiaLandingSlug(slug)) {
    const phone = clinicPhoneForLanding(slug)
    head.jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'MedicalClinic',
      name: 'Local Doctor',
      url,
      telephone: phone.telephone,
      areaServed: { '@type': 'AdministrativeArea', name: 'Virginia' },
    }
  }
  return head
}

// The head of one landing route, so the title, description, and canonical are right before JS runs.
export function landingHtml(indexHtml: string, slug: LandingSlug): string {
  return staticPageHtml(indexHtml, landingHead(slug))
}
