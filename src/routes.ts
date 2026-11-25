import { blogPosts } from './blogPosts'
import { isPageEnabled, type PageFlag } from './featureFlags'
import { isLandingSlug, landingSlugs } from './landing/landingMeta'
import { lpVariantFromRoutePath, lpVariants } from './lp/lpVariants'
import { isServicePageSlug, servicePageSlugs } from './services/servicePages'

export type Route =
  | 'home'
  | 'services'
  | 'service'
  | 'treatments'
  | 'how'
  | 'about'
  | 'start'
  | 'evaluation'
  | 'faq'
  | 'blog'
  | 'blogPost'
  | 'refer'
  | 'privacy'
  | 'terms'
  | 'patientRights'
  | 'consent'
  | 'contact'
  | 'landing'
  // Paid search landing page test variants at /lp/a, /lp/b, /lp/c. The slug is the letter.
  | 'lp'

export type RouteLocation = { route: Route; slug: string }

export const routePaths: Record<Exclude<Route, 'blogPost' | 'landing' | 'service' | 'lp'>, string> = {
  home: '/',
  services: '/services',
  treatments: '/treatments',
  how: '/how-it-works',
  about: '/about',
  start: '/get-started',
  evaluation: '/evaluation',
  faq: '/faq',
  blog: '/blog',
  refer: '/refer-a-patient',
  privacy: '/privacy',
  terms: '/terms',
  patientRights: '/patient-rights',
  consent: '/telehealth-consent',
  contact: '/contact',
}

const pathRoutes: Record<string, Route> = {
  '': 'home',
  services: 'services',
  treatments: 'treatments',
  'how-it-works': 'how',
  about: 'about',
  'get-started': 'start',
  evaluation: 'evaluation',
  faq: 'faq',
  blog: 'blog',
  'refer-a-patient': 'refer',
  privacy: 'privacy',
  terms: 'terms',
  'patient-rights': 'patientRights',
  'telehealth-consent': 'consent',
  contact: 'contact',
}

export function routeEnabled(route: Route) {
  // An individual service page follows the Services page's flag.
  const flag: PageFlag =
    route === 'blogPost'
      ? 'blog'
      : route === 'landing' || route === 'lp'
        ? 'landingPages'
        : route === 'service'
          ? 'services'
          : route
  return isPageEnabled(flag)
}

// path has no leading or trailing slashes.
export function readLocation(path: string): RouteLocation {
  if (isLandingSlug(path)) return { route: 'landing', slug: path }
  if (path.startsWith('services/')) {
    const slug = path.slice('services/'.length)
    if (isServicePageSlug(slug)) return { route: 'service', slug }
  }
  const lpVariant = lpVariantFromRoutePath(path)
  if (lpVariant) return { route: 'lp', slug: lpVariant }
  if (path === 'blog') return { route: 'blog', slug: '' }
  if (path.startsWith('blog/')) {
    const slug = decodeURIComponent(path.slice('blog/'.length).split('/')[0] ?? '')
    return { route: slug ? 'blogPost' : 'blog', slug }
  }
  return { route: pathRoutes[path as keyof typeof routePaths] ?? 'home', slug: '' }
}

// The route the app renders first. It has to match the prerendered HTML for that path, so it
// cannot wait for the effect in App that applies redirects.
export function initialLocation(path: string): RouteLocation {
  const next = readLocation(path)
  return routeEnabled(next.route) ? next : { route: 'home', slug: '' }
}

export function pathFor({ route, slug }: RouteLocation): string {
  if (route === 'blogPost') return `/blog/${slug}`
  if (route === 'landing') return `/${slug}`
  if (route === 'service') return `/services/${slug}`
  if (route === 'lp') return `/lp/${slug}`
  return routePaths[route]
}

// Every enabled public route, written to dist as static HTML at build time. A page that is off
// in featureFlags is skipped, so it still falls through to the SPA shell and redirects home.
export function prerenderLocations(): RouteLocation[] {
  const pages = (Object.keys(routePaths) as Array<keyof typeof routePaths>).map((route) => ({ route, slug: '' }))
  const posts = blogPosts.map((post) => ({ route: 'blogPost' as const, slug: post.slug }))
  const landings = landingSlugs.map((slug) => ({ route: 'landing' as const, slug }))
  const services = servicePageSlugs.map((slug) => ({ route: 'service' as const, slug }))
  const lpTests = lpVariants.map((slug) => ({ route: 'lp' as const, slug }))
  return [...pages, ...services, ...posts, ...landings, ...lpTests].filter((location) => routeEnabled(location.route))
}
