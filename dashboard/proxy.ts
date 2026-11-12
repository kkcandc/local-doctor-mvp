import { NextResponse, type NextRequest } from 'next/server'
import { isAuthConfigured, SESSION_COOKIE, verifySessionToken } from './lib/auth'

/** Reachable without a session. The cron route checks CRON_SECRET itself. */
const PUBLIC_PATHS = new Set(['/login', '/api/login', '/robots.txt', '/api/cron/refresh'])

export const NOINDEX = 'noindex, nofollow, noarchive'

function withNoindex(res: NextResponse): NextResponse {
  res.headers.set('X-Robots-Tag', NOINDEX)
  return res
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl
  const isApi = pathname.startsWith('/api/')

  if (PUBLIC_PATHS.has(pathname)) return withNoindex(NextResponse.next())

  if (!isAuthConfigured()) {
    if (isApi) {
      return withNoindex(NextResponse.json({ error: 'Dashboard is locked: DASHBOARD_PASSWORD is not set.' }, { status: 503 }))
    }
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    return withNoindex(NextResponse.redirect(url))
  }

  const ok = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)
  if (ok) return withNoindex(NextResponse.next())

  if (isApi) return withNoindex(NextResponse.json({ error: 'Not signed in' }, { status: 401 }))

  const url = request.nextUrl.clone()
  url.pathname = '/login'
  url.search = ''
  if (pathname !== '/') url.searchParams.set('next', `${pathname}${search}`)
  return withNoindex(NextResponse.redirect(url))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg).*)'],
}
