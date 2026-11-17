import 'server-only'
import type { Ga4Credentials } from './env'
import { accessTokenFromServiceAccount } from './google-auth'
import { GA4_EVENTS, pathOnly } from './privacy'
import type {
  DateRange,
  Ga4CampaignDailyRow,
  Ga4Data,
  Ga4EventByCampaignDailyRow,
  Ga4EventByLandingPageDailyRow,
  Ga4EventDailyRow,
  Ga4LandingPageDailyRow,
  Ga4TotalsDailyRow,
} from './types'

/* eslint-disable @typescript-eslint/no-explicit-any */

const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly'
const PAGE_SIZE = 100_000

interface ReportRequest {
  dimensions: string[]
  metrics: string[]
  dimensionFilter?: unknown
}

const ga4Date = (d: string) => `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`

async function runReport(token: string, propertyId: string, range: DateRange, req: ReportRequest) {
  const rows: { dims: string[]; mets: number[] }[] = []
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        dateRanges: [{ startDate: range.start, endDate: range.end }],
        dimensions: req.dimensions.map((name) => ({ name })),
        metrics: req.metrics.map((name) => ({ name })),
        dimensionFilter: req.dimensionFilter,
        limit: PAGE_SIZE,
        offset,
        keepEmptyRows: false,
      }),
    })
    const body = (await res.json().catch(() => null)) as any
    if (!res.ok) throw new Error(`GA4 Data API: ${body?.error?.message || `HTTP ${res.status}`}`)
    for (const r of body?.rows ?? []) {
      rows.push({
        dims: (r.dimensionValues ?? []).map((v: any) => String(v.value ?? '')),
        mets: (r.metricValues ?? []).map((v: any) => Number(v.value ?? 0)),
      })
    }
    const total = Number(body?.rowCount ?? 0)
    if (offset + PAGE_SIZE >= total) break
  }
  return rows
}

export async function fetchGa4(creds: Ga4Credentials, range: DateRange): Promise<{ data: Ga4Data; warnings: string[] }> {
  const token = await accessTokenFromServiceAccount(creds.clientEmail, creds.privateKey, SCOPE)
  const warnings: string[] = []

  // keyEvents replaced conversions in GA4. Fall back for older properties.
  let keyMetric = 'keyEvents'
  let totalsRaw
  try {
    totalsRaw = await runReport(token, creds.propertyId, range, {
      dimensions: ['date', 'sessionDefaultChannelGroup'],
      metrics: ['sessions', 'engagedSessions', keyMetric],
    })
  } catch (err) {
    keyMetric = 'conversions'
    totalsRaw = await runReport(token, creds.propertyId, range, {
      dimensions: ['date', 'sessionDefaultChannelGroup'],
      metrics: ['sessions', 'engagedSessions', keyMetric],
    }).catch(() => {
      throw err
    })
  }

  const totals: Ga4TotalsDailyRow[] = totalsRaw.map(({ dims, mets }) => ({
    date: ga4Date(dims[0]),
    channel: dims[1] || '(not set)',
    sessions: mets[0],
    engagedSessions: mets[1],
    keyEvents: mets[2],
  }))

  let landingPages: Ga4LandingPageDailyRow[] = []
  try {
    const raw = await runReport(token, creds.propertyId, range, {
      dimensions: ['date', 'sessionDefaultChannelGroup', 'landingPage'],
      metrics: ['sessions', 'engagedSessions', keyMetric],
    })
    const merged = new Map<string, Ga4LandingPageDailyRow>()
    for (const { dims, mets } of raw) {
      const row = {
        date: ga4Date(dims[0]),
        channel: dims[1] || '(not set)',
        path: pathOnly(dims[2]),
        sessions: mets[0],
        engagedSessions: mets[1],
        keyEvents: mets[2],
      }
      const key = `${row.date}|${row.channel}|${row.path}`
      const prev = merged.get(key)
      if (prev) {
        prev.sessions += row.sessions
        prev.engagedSessions += row.engagedSessions
        prev.keyEvents += row.keyEvents
      } else merged.set(key, row)
    }
    landingPages = [...merged.values()]
  } catch (err) {
    warnings.push(`GA4 landing pages: ${err instanceof Error ? err.message : String(err)}`)
  }

  let events: Ga4EventDailyRow[] = []
  try {
    const raw = await runReport(token, creds.propertyId, range, {
      dimensions: ['date', 'sessionDefaultChannelGroup', 'eventName'],
      metrics: ['eventCount'],
      dimensionFilter: {
        filter: { fieldName: 'eventName', inListFilter: { values: [...GA4_EVENTS], caseSensitive: true } },
      },
    })
    events = raw.map(({ dims, mets }) => ({
      date: ga4Date(dims[0]),
      channel: dims[1] || '(not set)',
      eventName: dims[2],
      eventCount: mets[0],
    }))
  } catch (err) {
    warnings.push(`GA4 events: ${err instanceof Error ? err.message : String(err)}`)
  }

  let campaigns: Ga4CampaignDailyRow[] | undefined
  try {
    const raw = await runReport(token, creds.propertyId, range, {
      dimensions: ['date', 'sessionDefaultChannelGroup', 'sessionCampaignName'],
      metrics: ['sessions', 'engagedSessions', keyMetric],
    })
    const merged = new Map<string, Ga4CampaignDailyRow>()
    for (const { dims, mets } of raw) {
      const row: Ga4CampaignDailyRow = {
        date: ga4Date(dims[0]),
        channel: dims[1] || '(not set)',
        campaignName: dims[2] || '(not set)',
        sessions: mets[0],
        engagedSessions: mets[1],
        keyEvents: mets[2],
      }
      const key = `${row.date}|${row.channel}|${row.campaignName}`
      const prev = merged.get(key)
      if (prev) {
        prev.sessions += row.sessions
        prev.engagedSessions += row.engagedSessions
        prev.keyEvents += row.keyEvents
      } else merged.set(key, row)
    }
    campaigns = [...merged.values()]
  } catch (err) {
    warnings.push(`GA4 campaigns: ${err instanceof Error ? err.message : String(err)}`)
  }

  let eventsByLandingPage: Ga4EventByLandingPageDailyRow[] | undefined
  try {
    const raw = await runReport(token, creds.propertyId, range, {
      dimensions: ['date', 'sessionDefaultChannelGroup', 'landingPage', 'eventName'],
      metrics: ['eventCount'],
      dimensionFilter: {
        filter: { fieldName: 'eventName', inListFilter: { values: [...GA4_EVENTS], caseSensitive: true } },
      },
    })
    const merged = new Map<string, Ga4EventByLandingPageDailyRow>()
    for (const { dims, mets } of raw) {
      const row: Ga4EventByLandingPageDailyRow = {
        date: ga4Date(dims[0]),
        channel: dims[1] || '(not set)',
        path: pathOnly(dims[2]),
        eventName: dims[3],
        eventCount: mets[0],
      }
      const key = `${row.date}|${row.channel}|${row.path}|${row.eventName}`
      const prev = merged.get(key)
      if (prev) prev.eventCount += row.eventCount
      else merged.set(key, row)
    }
    eventsByLandingPage = [...merged.values()]
  } catch (err) {
    warnings.push(`GA4 events by landing page: ${err instanceof Error ? err.message : String(err)}`)
  }

  let eventsByCampaign: Ga4EventByCampaignDailyRow[] | undefined
  try {
    const raw = await runReport(token, creds.propertyId, range, {
      dimensions: ['date', 'sessionDefaultChannelGroup', 'sessionCampaignName', 'eventName'],
      metrics: ['eventCount'],
      dimensionFilter: {
        filter: { fieldName: 'eventName', inListFilter: { values: [...GA4_EVENTS], caseSensitive: true } },
      },
    })
    eventsByCampaign = raw.map(({ dims, mets }) => ({
      date: ga4Date(dims[0]),
      channel: dims[1] || '(not set)',
      campaignName: dims[2] || '(not set)',
      eventName: dims[3],
      eventCount: mets[0],
    }))
  } catch (err) {
    warnings.push(`GA4 events by campaign: ${err instanceof Error ? err.message : String(err)}`)
  }

  return {
    data: {
      propertyId: creds.propertyId,
      daily: { totals, landingPages, events, campaigns, eventsByLandingPage, eventsByCampaign },
    },
    warnings,
  }
}
