import { NextResponse, type NextRequest } from 'next/server'
import { createSessionToken, isAuthConfigured, passwordMatches, safeNextPath, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null)
  const password = String(form?.get('password') ?? '')
  const next = safeNextPath(String(form?.get('next') ?? '/'))

  const back = (error: string) => {
    const url = new URL('/login', request.url)
    url.searchParams.set('error', error)
    if (next !== '/') url.searchParams.set('next', next)
    return NextResponse.redirect(url, 303)
  }

  if (!isAuthConfigured()) return back('locked')
  if (!(await passwordMatches(password))) {
    // Slows down guessing. Serverless instances do not share memory, so no counter.
    await new Promise((r) => setTimeout(r, 750))
    return back('invalid')
  }
  const res = NextResponse.redirect(new URL(next, request.url), 303)
  res.cookies.set(SESSION_COOKIE, await createSessionToken(), sessionCookieOptions())
  return res
}
