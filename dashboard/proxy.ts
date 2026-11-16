import { NextResponse, type NextRequest } from 'next/server'
import { isAuthConfigured, SESSION_COOKIE, verifySessionToken } from './lib/auth'

/** Always reachable without a session. The cron route checks CRON_SECRET itself. */
const PUBLIC_PATHS = new Set(['/login', '/api/login', '/robots.txt', '/api/cron/refresh'])

/** Only these APIs still need a signed-in session. Pages are public. */
const SESSION_API_PATHS = new Set(['/api/refresh', '/api/logout'])

export const NOINDEX = 'noindex, nofollow, noarchive'

function withNoindex(res: NextResponse): NextResponse {
  res.headers.set('X-Robots-Tag', NOINDEX)
  return res
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.has(pathname) || !SESSION_API_PATHS.has(pathname)) {
    return withNoindex(NextResponse.next())
  }

  if (!isAuthConfigured()) {
    return withNoindex(
      NextResponse.json({ error: 'Refresh sign-in is unavailable: DASHBOARD_PASSWORD is not set.' }, { status: 503 }),
    )
  }

  const ok = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)
  if (ok) return withNoindex(NextResponse.next())

  return withNoindex(NextResponse.json({ error: 'Not signed in' }, { status: 401 }))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg).*)'],
}
