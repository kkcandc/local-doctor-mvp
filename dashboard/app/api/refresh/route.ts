import { NextResponse } from 'next/server'
import { runRefresh } from '@/lib/refresh'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/** "Refresh now" button. The proxy already requires a session; the job enforces a 10 minute cooldown. */
export async function POST() {
  const result = await runRefresh('manual')
  if (!result.ok) {
    const headers: Record<string, string> = {}
    if (result.retryAfterSeconds) headers['Retry-After'] = String(result.retryAfterSeconds)
    return NextResponse.json(result, { status: result.status, headers })
  }
  return NextResponse.json(result)
}
