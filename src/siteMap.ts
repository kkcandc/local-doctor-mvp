import { blogPosts } from './blogPosts.ts'
import { landingSlugs, siteOrigin } from './landing/landingMeta.ts'
import { servicePageSlugs } from './services/servicePages.ts'

/*
  Public URLs for sitemap.xml. About is off in featureFlags, so it is not listed.
  Intent pages come from landingSlugs, and individual service pages from servicePageSlugs, so a new
  one is included automatically.
*/

const contentPaths = [
  '/',
  '/services',
  ...servicePageSlugs.map((slug) => `/services/${slug}`),
  '/treatments',
  '/how-it-works',
  '/get-started',
  '/faq',
  '/blog',
  ...blogPosts.map((post) => `/blog/${post.slug}`),
  '/refer-a-patient',
  '/contact',
  '/privacy',
  '/terms',
  '/patient-rights',
  '/telehealth-consent',
]

export const publicSitemapPaths = [...contentPaths, ...landingSlugs.map((slug) => `/${slug}`)]

export function siteSitemapXml(): string {
  const urls = publicSitemapPaths.map((path) => `  <url><loc>${siteOrigin}${path}</loc></url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}
