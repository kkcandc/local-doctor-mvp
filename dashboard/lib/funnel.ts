import { costPer, filterRange, groupSum, sumFields } from './aggregate'
import type { AdsData, DateRange, Ga4Data, OfflineEntry, SourceStatus } from './types'
import {
  conversionActionRows,
  ga4EventCounts,
  ga4Totals,
  matchesChannel,
  overviewPrimaryCount,
  overviewTraffic,
  type OverviewScope,
} from './views'

export const PHONE_EVENTS = ['phone_click', 'phone_tap'] as const
export const TYPEFORM_START_EVENT = 'evaluation_started'
export const TYPEFORM_SUBMIT_EVENT = 'evaluation_submitted'
export const LEAD_EVENT = 'generate_lead'
export const CTA_EVENT = 'cta_click'
export const VISIT_BOOKED_EVENT = 'visit_booked'

export type FunnelSource = 'ads' | 'ga4' | 'offline'
export type Ga4Channel = 'paid' | 'all'

export type FunnelStepId =
  | 'impressions'
  | 'clicks'
  | 'sessions'
  | 'engagedSessions'
  | 'ctaClick'
  | 'phoneClick'
  | 'typeformStart'
  | 'typeformSubmit'
  | 'lead'
  | 'primaryConversions'
  | 'secondaryConversions'
  | 'manualBooked'

export interface FunnelStep {
  id: FunnelStepId
  label: string
  sub: string
  value: number | null
  source: FunnelSource
  /** Side branch rather than a narrower step, so no step-to-step rate. */
  branch?: boolean
  detail?: string
  awaitingGa4?: boolean
  rateFromPrevious: number | null
  costPer: number | null
}

export interface CampaignFunnelRow {
  key: string
  name: string
  status?: string
  impressions: number
  clicks: number
  cost: number
  primaryConversions: number
  secondaryConversions: number
  sessions: number | null
  engagedSessions: number | null
  ctaClicks: number | null
  phoneClicks: number | null
  typeformStarts: number | null
  typeformSubmits: number | null
  leads: number | null
}

export interface LandingPageFunnelRow {
  path: string
  adClicks: number | null
  adCost: number | null
  adConversions: number | null
  sessions: number | null
  engagedSessions: number | null
  ctaClicks: number | null
  phoneClicks: number | null
  typeformStarts: number | null
  typeformSubmits: number | null
  leads: number | null
}

const UNAUTHORIZED_RE = /not yet authorized|permission|403|unauthorized|access denied|does not have sufficient permissions|caller does not have|missing env vars:.*GA4_SERVICE_ACCOUNT/i

export function isGa4Unauthorized(status: SourceStatus | undefined): boolean {
  if (!status) return true
  if (status.state === 'ok') return false
  if (status.state === 'not_configured') return true
  return UNAUTHORIZED_RE.test(status.message ?? '')
}

/** Message stored on the snapshot when a GA4 refresh cannot run or is refused. */
export function formatGa4RefreshMessage(kind: 'missing' | 'parse' | 'api', detail: string): string {
  if (kind === 'missing' && /GA4_SERVICE_ACCOUNT/.test(detail)) {
    return 'GA4 not yet authorized. The service account key is not set yet. After it is added, Eric needs to grant that account Viewer access on GA4 property 562274971.'
  }
  if (kind === 'missing') return `Missing env vars: ${detail}`
  if (kind === 'api' && UNAUTHORIZED_RE.test(detail)) {
    return `GA4 not yet authorized. The service account cannot read this property yet. Ask Eric to add it as a Viewer on GA4 property 562274971. (${detail})`
  }
  return detail
}

/** Short, public-facing copy when GA4 steps cannot be filled in. */
export function ga4UnauthorizedMessage(status: SourceStatus | undefined): string {
  const msg = status?.message?.trim()
  if (msg && UNAUTHORIZED_RE.test(msg) && /Viewer|property|service account/i.test(msg)) return msg
  if (msg && /Missing env vars:.*GA4_SERVICE_ACCOUNT/i.test(msg)) {
    return 'GA4 not yet authorized. The service account key is not set yet. After it is added, Eric needs to grant that account Viewer access on GA4 property 562274971.'
  }
  if (status?.state === 'error' && msg && UNAUTHORIZED_RE.test(msg)) {
    return `GA4 not yet authorized. The service account cannot read this property yet. Ask Eric to add it as a Viewer on GA4 property 562274971. (${msg})`
  }
  if (status?.state === 'error' && msg) return msg
  return 'GA4 not yet authorized. Landing page sessions, engaged sessions and on-site events appear here once the service account can read GA4 property 562274971.'
}

/** Normalize a campaign name so Ads and GA4 labels can be matched. */
export function normalizeCampaignName(name: string | undefined | null): string {
  return (name ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
}

function eventTotal(events: Record<string, number> | null, names: readonly string[]): number | null {
  if (!events) return null
  return names.reduce((sum, name) => sum + (events[name] ?? 0), 0)
}

function costFor(spend: number | null, value: number | null): number | null {
  if (spend == null || value == null || value <= 0) return null
  return costPer(spend, value)
}

function attachRates(steps: Omit<FunnelStep, 'rateFromPrevious' | 'costPer'>[], spend: number | null): FunnelStep[] {
  return steps.map((step, i) => {
    let rateFromPrevious: number | null = null
    if (step.value != null && !step.branch) {
      const prev = [...steps.slice(0, i)].reverse().find((p) => p.value != null && !p.branch)
      if (prev?.value) rateFromPrevious = step.value / prev.value
    }
    return { ...step, rateFromPrevious, costPer: costFor(spend, step.value) }
  })
}

function secondaryCount(ads: AdsData, range: DateRange, scope: OverviewScope): number {
  if (scope === 'enabled') {
    const traffic = overviewTraffic(ads, range, 'enabled')
    return Math.max(0, traffic.allConversions - traffic.conversions)
  }
  return conversionActionRows(ads, range)
    .filter((row) => !row.primary)
    .reduce((sum, row) => sum + row.count, 0)
}

function sumEventMap(
  rows: { date: string; channel: string; eventName: string; eventCount: number }[],
  range: DateRange,
  channel: Ga4Channel,
  names: readonly string[],
): number {
  return filterRange(rows, range)
    .filter((row) => matchesChannel(row.channel, channel) && names.includes(row.eventName))
    .reduce((sum, row) => sum + row.eventCount, 0)
}

export function buildConversionFunnel(args: {
  ads: AdsData | null
  ga4: Ga4Data | null
  ga4Status?: SourceStatus
  offline: OfflineEntry[]
  range: DateRange
  scope: OverviewScope
  channel: Ga4Channel
}): {
  steps: FunnelStep[]
  campaigns: CampaignFunnelRow[]
  landingPages: LandingPageFunnelRow[]
  spend: number | null
  ga4Ready: boolean
  placeholder: string
} {
  const { ads, ga4, ga4Status, offline, range, scope, channel } = args
  const ga4Ready = Boolean(ga4)
  const placeholder = ga4Ready ? '' : ga4UnauthorizedMessage(ga4Status)
  const traffic = ads ? overviewTraffic(ads, range, scope) : null
  const spend = traffic?.cost ?? null
  const events = ga4 ? ga4EventCounts(ga4, range, channel) : null
  const sessions = ga4 ? ga4Totals(ga4, range, channel) : null
  const ev = (name: string) => (events ? events[name] ?? 0 : null)
  const phone = eventTotal(events, PHONE_EVENTS)
  const cta = ev(CTA_EVENT)
  const starts = ev(TYPEFORM_START_EVENT)
  const submits = ev(TYPEFORM_SUBMIT_EVENT)
  const leads = ev(LEAD_EVENT)
  const visitBooked = ev(VISIT_BOOKED_EVENT)
  const primary = ads ? overviewPrimaryCount(ads, range, scope) : null
  const secondary = ads ? secondaryCount(ads, range, scope) : null
  const offlineInRange = filterRange(offline, range)
  const booked = sumFields(offlineInRange, ['bookedPatients'] as const).bookedPatients
  const phoneLeadCounts = sumFields(offlineInRange, ['phoneLeads'] as const).phoneLeads
  const channelLabel = channel === 'paid' ? 'paid search' : 'all traffic'
  const phoneDetail = events
    ? `(${(events.phone_click ?? 0).toLocaleString('en-US')} phone_click, ${(events.phone_tap ?? 0).toLocaleString('en-US')} phone_tap)`
    : undefined
  const leadDetail =
    events && (visitBooked ?? 0) > 0
      ? `(generate_lead, plus ${(visitBooked ?? 0).toLocaleString('en-US')} visit_booked)`
      : 'GA4 generate_lead event'

  const rawSteps: Omit<FunnelStep, 'rateFromPrevious' | 'costPer'>[] = [
    {
      id: 'impressions',
      label: 'Ad impressions',
      sub: 'Google Ads',
      value: traffic?.impressions ?? null,
      source: 'ads',
    },
    {
      id: 'clicks',
      label: 'Clicks',
      sub: 'Google Ads',
      value: traffic?.clicks ?? null,
      source: 'ads',
    },
    {
      id: 'sessions',
      label: 'Landing page sessions',
      sub: `GA4, ${channelLabel}`,
      value: sessions?.sessions ?? null,
      source: 'ga4',
      awaitingGa4: !ga4Ready,
    },
    {
      id: 'engagedSessions',
      label: 'Engaged sessions',
      sub: `GA4, ${channelLabel}`,
      value: sessions?.engagedSessions ?? null,
      source: 'ga4',
      awaitingGa4: !ga4Ready,
    },
    {
      id: 'ctaClick',
      label: 'CTA clicks',
      sub: 'GA4 cta_click',
      value: cta,
      source: 'ga4',
      awaitingGa4: !ga4Ready,
    },
    {
      id: 'phoneClick',
      label: 'Phone clicks',
      sub: 'GA4 phone_click and phone_tap',
      value: phone,
      source: 'ga4',
      branch: true,
      awaitingGa4: !ga4Ready,
      detail: phoneDetail,
    },
    {
      id: 'typeformStart',
      label: 'Typeform starts',
      sub: 'GA4 evaluation_started',
      value: starts,
      source: 'ga4',
      branch: true,
      awaitingGa4: !ga4Ready,
    },
    {
      id: 'typeformSubmit',
      label: 'Typeform submits',
      sub: 'GA4 evaluation_submitted',
      value: submits,
      source: 'ga4',
      branch: true,
      awaitingGa4: !ga4Ready,
    },
    {
      id: 'lead',
      label: 'Lead',
      sub: leadDetail,
      value: leads,
      source: 'ga4',
      branch: true,
      awaitingGa4: !ga4Ready,
    },
    {
      id: 'primaryConversions',
      label: 'Ads primary conversions',
      sub: scope === 'enabled' ? 'Enabled campaigns, Conversions column' : 'Marked primary today',
      value: primary,
      source: 'ads',
    },
    {
      id: 'secondaryConversions',
      label: 'Ads secondary conversions',
      sub: scope === 'enabled' ? 'Enabled campaigns, all conversions minus Conversions' : 'Actions not marked primary today',
      value: secondary,
      source: 'ads',
      branch: true,
    },
    {
      id: 'manualBooked',
      label: 'Manual booked counts',
      sub: "Eric's clinic entries",
      value: booked,
      source: 'offline',
      branch: true,
      detail:
        offlineInRange.length === 0
          ? 'No booked counts entered for this range'
          : phoneLeadCounts > 0
            ? `(${phoneLeadCounts.toLocaleString('en-US')} phone leads also entered)`
            : undefined,
    },
  ]

  return {
    steps: attachRates(rawSteps, spend),
    campaigns: campaignBreakdown({ ads, ga4, range, scope, channel, ga4Ready }),
    landingPages: landingPageBreakdown({ ads, ga4, range, channel, ga4Ready }),
    spend,
    ga4Ready,
    placeholder,
  }
}

function campaignBreakdown(args: {
  ads: AdsData | null
  ga4: Ga4Data | null
  range: DateRange
  scope: OverviewScope
  channel: Ga4Channel
  ga4Ready: boolean
}): CampaignFunnelRow[] {
  const { ads, ga4, range, scope, channel, ga4Ready } = args
  const enabled = new Set((ads?.campaigns ?? []).filter((c) => c.status.toUpperCase() === 'ENABLED').map((c) => c.id))
  const adSums = ads
    ? groupSum(
        filterRange(ads.daily.campaigns, range).filter((row) => scope === 'all' || enabled.has(row.campaignId)),
        (row) => row.campaignId,
        ['impressions', 'clicks', 'cost', 'conversions', 'allConversions'] as const,
      )
    : new Map()
  const meta = new Map((ads?.campaigns ?? []).map((c) => [c.id, c]))
  const gaTotals = new Map<string, { sessions: number; engagedSessions: number }>()
  const gaEvents = new Map<string, Record<string, number>>()

  if (ga4?.daily.campaigns) {
    for (const row of filterRange(ga4.daily.campaigns, range)) {
      if (!matchesChannel(row.channel, channel)) continue
      const key = normalizeCampaignName(row.campaignName)
      const prev = gaTotals.get(key) ?? { sessions: 0, engagedSessions: 0 }
      prev.sessions += row.sessions
      prev.engagedSessions += row.engagedSessions
      gaTotals.set(key, prev)
    }
  }
  if (ga4?.daily.eventsByCampaign) {
    for (const row of filterRange(ga4.daily.eventsByCampaign, range)) {
      if (!matchesChannel(row.channel, channel)) continue
      const key = normalizeCampaignName(row.campaignName)
      const prev = gaEvents.get(key) ?? {}
      prev[row.eventName] = (prev[row.eventName] ?? 0) + row.eventCount
      gaEvents.set(key, prev)
    }
  }

  const usedGa = new Set<string>()
  const rows: CampaignFunnelRow[] = [...adSums.entries()].map(([id, metrics]) => {
    const name = meta.get(id)?.name ?? `Campaign ${id}`
    const gaKey = normalizeCampaignName(name)
    usedGa.add(gaKey)
    const g = gaTotals.get(gaKey)
    const evs = gaEvents.get(gaKey)
    return {
      key: id,
      name,
      status: meta.get(id)?.status,
      impressions: metrics.impressions,
      clicks: metrics.clicks,
      cost: metrics.cost,
      primaryConversions: metrics.conversions,
      secondaryConversions: Math.max(0, metrics.allConversions - metrics.conversions),
      sessions: ga4Ready ? (g?.sessions ?? (ga4?.daily.campaigns ? 0 : null)) : null,
      engagedSessions: ga4Ready ? (g?.engagedSessions ?? (ga4?.daily.campaigns ? 0 : null)) : null,
      ctaClicks: eventOrNull(ga4Ready, evs, ga4?.daily.eventsByCampaign, [CTA_EVENT]),
      phoneClicks: eventOrNull(ga4Ready, evs, ga4?.daily.eventsByCampaign, PHONE_EVENTS),
      typeformStarts: eventOrNull(ga4Ready, evs, ga4?.daily.eventsByCampaign, [TYPEFORM_START_EVENT]),
      typeformSubmits: eventOrNull(ga4Ready, evs, ga4?.daily.eventsByCampaign, [TYPEFORM_SUBMIT_EVENT]),
      leads: eventOrNull(ga4Ready, evs, ga4?.daily.eventsByCampaign, [LEAD_EVENT]),
    }
  })

  if (ga4Ready && (ga4?.daily.campaigns || ga4?.daily.eventsByCampaign)) {
    const leftover = new Set([...gaTotals.keys(), ...gaEvents.keys()])
    for (const key of leftover) {
      if (!key || usedGa.has(key)) continue
      const g = gaTotals.get(key)
      const evs = gaEvents.get(key)
      const label = (ga4.daily.campaigns ?? []).find((row) => normalizeCampaignName(row.campaignName) === key)?.campaignName ?? key
      rows.push({
        key: `ga4:${key}`,
        name: label,
        impressions: 0,
        clicks: 0,
        cost: 0,
        primaryConversions: 0,
        secondaryConversions: 0,
        sessions: g?.sessions ?? 0,
        engagedSessions: g?.engagedSessions ?? 0,
        ctaClicks: evs ? evs[CTA_EVENT] ?? 0 : 0,
        phoneClicks: evs ? PHONE_EVENTS.reduce((s, n) => s + (evs[n] ?? 0), 0) : 0,
        typeformStarts: evs ? evs[TYPEFORM_START_EVENT] ?? 0 : 0,
        typeformSubmits: evs ? evs[TYPEFORM_SUBMIT_EVENT] ?? 0 : 0,
        leads: evs ? evs[LEAD_EVENT] ?? 0 : 0,
      })
    }
  }

  return rows.sort((a, b) => b.cost - a.cost || b.clicks - a.clicks || b.impressions - a.impressions || a.name.localeCompare(b.name))
}

function eventOrNull(
  ga4Ready: boolean,
  evs: Record<string, number> | undefined,
  source: unknown,
  names: readonly string[],
): number | null {
  if (!ga4Ready) return null
  if (!source) return null
  if (!evs) return 0
  return names.reduce((sum, name) => sum + (evs[name] ?? 0), 0)
}

function landingPageBreakdown(args: {
  ads: AdsData | null
  ga4: Ga4Data | null
  range: DateRange
  channel: Ga4Channel
  ga4Ready: boolean
}): LandingPageFunnelRow[] {
  const { ads, ga4, range, channel, ga4Ready } = args
  const adSums = ads
    ? groupSum(filterRange(ads.daily.landingPages, range), (row) => row.path, ['clicks', 'cost', 'conversions'] as const)
    : new Map()
  const gaSums = ga4
    ? groupSum(
        filterRange(ga4.daily.landingPages, range).filter((row) => matchesChannel(row.channel, channel)),
        (row) => row.path,
        ['sessions', 'engagedSessions'] as const,
      )
    : new Map()
  const evSums = new Map<string, Record<string, number>>()
  if (ga4?.daily.eventsByLandingPage) {
    for (const row of filterRange(ga4.daily.eventsByLandingPage, range)) {
      if (!matchesChannel(row.channel, channel)) continue
      const prev = evSums.get(row.path) ?? {}
      prev[row.eventName] = (prev[row.eventName] ?? 0) + row.eventCount
      evSums.set(row.path, prev)
    }
  }
  const paths = new Set<string>([...adSums.keys(), ...gaSums.keys(), ...evSums.keys()])
  const hasEventBreak = Boolean(ga4?.daily.eventsByLandingPage)
  const rows: LandingPageFunnelRow[] = [...paths].map((path) => {
    const a = adSums.get(path)
    const g = gaSums.get(path)
    const evs = evSums.get(path)
    return {
      path,
      adClicks: a?.clicks ?? null,
      adCost: a?.cost ?? null,
      adConversions: a?.conversions ?? null,
      sessions: ga4Ready ? (g?.sessions ?? 0) : null,
      engagedSessions: ga4Ready ? (g?.engagedSessions ?? 0) : null,
      ctaClicks: eventOrNull(ga4Ready, evs, hasEventBreak ? evs ?? {} : undefined, [CTA_EVENT]),
      phoneClicks: eventOrNull(ga4Ready, evs, hasEventBreak ? evs ?? {} : undefined, PHONE_EVENTS),
      typeformStarts: eventOrNull(ga4Ready, evs, hasEventBreak ? evs ?? {} : undefined, [TYPEFORM_START_EVENT]),
      typeformSubmits: eventOrNull(ga4Ready, evs, hasEventBreak ? evs ?? {} : undefined, [TYPEFORM_SUBMIT_EVENT]),
      leads: eventOrNull(ga4Ready, evs, hasEventBreak ? evs ?? {} : undefined, [LEAD_EVENT]),
    }
  })
  return rows.sort((a, b) => (b.adCost ?? 0) - (a.adCost ?? 0) || (b.sessions ?? 0) - (a.sessions ?? 0) || a.path.localeCompare(b.path))
}

/** Used only so unused helpers are not flagged if tree-shaken tests import this later. */
export const funnelEventNames = {
  CTA_EVENT,
  PHONE_EVENTS,
  TYPEFORM_START_EVENT,
  TYPEFORM_SUBMIT_EVENT,
  LEAD_EVENT,
  VISIT_BOOKED_EVENT,
}

// Keep sumEventMap referenced for tests that want a raw sum helper.
export { sumEventMap as sumFilteredGa4Events }
