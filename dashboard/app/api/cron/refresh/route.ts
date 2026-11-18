import { NextResponse, type NextRequest } from 'next/server'
import { runRefresh } from '@/lib/refresh'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/** Vercel Cron sends "Authorization: Bearer $CRON_SECRET". Without CRON_SECRET the route stays closed. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const result = await runRefresh('cron')
  return NextResponse.json(result, { status: result.ok ? 200 : result.status })
}
