import { next, rewrite } from '@vercel/functions/middleware'
import { clearLpCookieHeader, decideSplit, lpCookieHeader } from './src/lp/split'

/*
  Vercel Routing Middleware for the Evaluation landing page test. It runs only on the split paths
  below (config.matcher). decideSplit in src/lp/split.ts decides who is in; this file only
  applies the answer.

  In the test: the response is the variant's prerendered page (/lp/a, /lp/b, or /lp/c) served at
  the original URL. It is a rewrite, not a redirect, so the address bar, gclid, and utm_* stay as
  they were and there is no flash. The variant HTML is noindex and carries data-lp-root so the app
  hydrates the right page. A new assignment sets the first-party ld_lp cookie.

  Not in the test: the request continues untouched to the normal page.
*/

export const config = {
  matcher: ['/dementia-evaluation', '/alzheimers-evaluation', '/memory-evaluation'],
}

export default function middleware(request: Request): Response {
  const url = new URL(request.url)
  const decision = decideSplit({
    pathname: url.pathname,
    search: url.search,
    cookieHeader: request.headers.get('cookie'),
    userAgent: request.headers.get('user-agent'),
  })

  if (!decision.variant) {
    return decision.clearCookie ? next({ headers: { 'set-cookie': clearLpCookieHeader() } }) : next()
  }

  const destination = new URL(`/lp/${decision.variant}`, url)
  destination.search = url.search
  const headers = new Headers({
    // The same URL serves different HTML per visitor, so no shared cache may keep it.
    'cache-control': 'private, no-cache',
    'x-robots-tag': 'noindex',
    'x-lp-variant': decision.variant,
  })
  if (decision.setCookie) headers.set('set-cookie', lpCookieHeader(decision.setCookie))
  return rewrite(destination, { headers })
}
