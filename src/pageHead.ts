import { getBlogPost, type BlogPost } from './blogPosts'
import { landingHead, type StaticHead } from './landing/landingHtml'
import { isLandingSlug, siteOrigin } from './landing/landingMeta'
import { defaultMeta, routeMeta } from './pageMeta'
import { pathFor, type RouteLocation } from './routes'
import { isServicePageSlug, servicePages } from './services/servicePages'

export type PageHead = StaticHead

function blogArticleJsonLd(post: BlogPost): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.published,
    dateModified: post.updated,
    author: { '@type': 'Person', name: post.author },
    publisher: {
      '@type': 'Organization',
      name: 'Local Infusion',
      url: 'https://mylocalinfusion.com/',
    },
    isBasedOn: post.originalUrl,
    sameAs: post.originalUrl,
    mainEntityOfPage: post.originalUrl,
  }
}

// Head tags for one route. The prerender writes them into that route's HTML and usePageMeta
// in App.tsx applies the same values after in-app navigation.
export function pageHead(location: RouteLocation): PageHead {
  const { route, slug } = location

  if (route === 'blogPost') {
    const post = getBlogPost(slug)
    if (!post) return { title: defaultMeta.title, description: defaultMeta.description }
    // Republished articles point their canonical at the original on mylocalinfusion.com.
    return {
      title: `${post.title} | Local Doctor`,
      description: post.excerpt,
      canonical: post.originalUrl,
      jsonLd: blogArticleJsonLd(post),
    }
  }

  if (route === 'landing' && isLandingSlug(slug)) return landingHead(slug)

  if (route === 'service' && isServicePageSlug(slug)) {
    const { meta } = servicePages[slug]
    return { title: meta.title, description: meta.description, og: meta, canonical: `${siteOrigin}${pathFor(location)}` }
  }

  const meta = routeMeta[route]
  if (!meta) return { title: defaultMeta.title, description: defaultMeta.description, canonical: `${siteOrigin}${pathFor(location)}` }
  // /evaluation is noindex, so it carries no canonical.
  return {
    title: meta.title,
    description: meta.description,
    og: meta,
    canonical: meta.noindex ? undefined : `${siteOrigin}${pathFor(location)}`,
    noindex: meta.noindex,
  }
}
