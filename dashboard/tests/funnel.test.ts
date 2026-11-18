import { describe, expect, it } from 'vitest'
import {
  buildConversionFunnel,
  formatGa4RefreshMessage,
  isGa4Unauthorized,
  normalizeCampaignName,
} from '../lib/funnel'
import type { AdsData, Ga4Data, OfflineEntry, SourceStatus } from '../lib/types'

const range = { start: '2026-11-01', end: '2026-11-07' }

function ads(): AdsData {
  const doctor = {
    impressions: 1000,
    clicks: 100,
    cost: 400,
    conversions: 2,
    allConversions: 8,
    phoneCalls: 1,
  }
  const evaluation = {
    impressions: 500,
    clicks: 40,
    cost: 200,
    conversions: 1,
    allConversions: 5,
    phoneCalls: 0,
  }
  return {
    customerId: '9082580886',
    currency: 'USD',
    timeZone: 'America/New_York',
    campaigns: [
      { id: 'doc', name: 'Local Doctor - Doctor', status: 'ENABLED', biddingStrategyType: 'TARGET_SPEND' },
      { id: 'eval', name: 'Local Doctor - Evaluation', status: 'ENABLED', biddingStrategyType: 'TARGET_SPEND' },
    ],
    adGroups: [],
    ads: [],
    keywords: [],
    assets: [],
    conversionActions: [
      { id: 'p1', name: 'Primary lead', category: 'SUBMIT_LEAD_FORM', status: 'ENABLED', primary: true },
      { id: 's1', name: 'Secondary click', category: 'ENGAGEMENT', status: 'ENABLED', primary: false },
    ],
    daily: {
      account: [{ date: '2026-11-02', impressions: 1500, clicks: 140, cost: 600, conversions: 3, allConversions: 13, phoneCalls: 1 }],
      campaigns: [
        { date: '2026-11-02', campaignId: 'doc', ...doctor },
        { date: '2026-11-02', campaignId: 'eval', ...evaluation },
      ],
      adGroups: [],
      ads: [],
      keywords: [],
      searchTerms: [],
      landingPages: [
        { date: '2026-11-02', path: '/memory-doctor-near-me', impressions: 800, clicks: 80, cost: 350, conversions: 2, allConversions: 6 },
        { date: '2026-11-02', path: '/cognitive-evaluation', impressions: 400, clicks: 40, cost: 180, conversions: 1, allConversions: 4 },
      ],
      conversions: [
        { date: '2026-11-02', conversionActionId: 'p1', conversions: 3, allConversions: 3 },
        { date: '2026-11-02', conversionActionId: 's1', conversions: 0, allConversions: 10 },
      ],
      assets: [],
    },
  }
}

function ga4(): Ga4Data {
  return {
    propertyId: '562274971',
    daily: {
      totals: [
        { date: '2026-11-02', channel: 'Paid Search', sessions: 120, engagedSessions: 70, keyEvents: 8 },
        { date: '2026-11-02', channel: 'Organic Search', sessions: 30, engagedSessions: 10, keyEvents: 1 },
      ],
      landingPages: [
        { date: '2026-11-02', channel: 'Paid Search', path: '/memory-doctor-near-me', sessions: 80, engagedSessions: 50, keyEvents: 5 },
        { date: '2026-11-02', channel: 'Paid Search', path: '/cognitive-evaluation', sessions: 40, engagedSessions: 20, keyEvents: 3 },
      ],
      events: [
        { date: '2026-11-02', channel: 'Paid Search', eventName: 'cta_click', eventCount: 20 },
        { date: '2026-11-02', channel: 'Paid Search', eventName: 'phone_tap', eventCount: 3 },
        { date: '2026-11-02', channel: 'Paid Search', eventName: 'phone_click', eventCount: 1 },
        { date: '2026-11-02', channel: 'Paid Search', eventName: 'evaluation_started', eventCount: 6 },
        { date: '2026-11-02', channel: 'Paid Search', eventName: 'evaluation_submitted', eventCount: 2 },
        { date: '2026-11-02', channel: 'Paid Search', eventName: 'generate_lead', eventCount: 2 },
        { date: '2026-11-02', channel: 'Paid Search', eventName: 'visit_booked', eventCount: 1 },
      ],
      campaigns: [
        { date: '2026-11-02', channel: 'Paid Search', campaignName: 'Local Doctor - Doctor', sessions: 80, engagedSessions: 50, keyEvents: 5 },
        { date: '2026-11-02', channel: 'Paid Search', campaignName: 'Local Doctor - Evaluation', sessions: 40, engagedSessions: 20, keyEvents: 3 },
      ],
      eventsByCampaign: [
        { date: '2026-11-02', channel: 'Paid Search', campaignName: 'Local Doctor - Doctor', eventName: 'cta_click', eventCount: 12 },
        { date: '2026-11-02', channel: 'Paid Search', campaignName: 'Local Doctor - Evaluation', eventName: 'cta_click', eventCount: 8 },
        { date: '2026-11-02', channel: 'Paid Search', campaignName: 'Local Doctor - Doctor', eventName: 'evaluation_started', eventCount: 4 },
      ],
      eventsByLandingPage: [
        { date: '2026-11-02', channel: 'Paid Search', path: '/memory-doctor-near-me', eventName: 'cta_click', eventCount: 14 },
        { date: '2026-11-02', channel: 'Paid Search', path: '/cognitive-evaluation', eventName: 'cta_click', eventCount: 6 },
        { date: '2026-11-02', channel: 'Paid Search', path: '/memory-doctor-near-me', eventName: 'evaluation_submitted', eventCount: 2 },
      ],
    },
  }
}

const booked: OfflineEntry[] = [
  { date: '2026-11-03', phoneLeads: 2, bookedPatients: 1, updatedAt: '2026-11-03T12:00:00Z' },
]

describe('GA4 authorization copy', () => {
  it('treats a missing service account as not yet authorized', () => {
    const status: SourceStatus = {
      state: 'not_configured',
      message: formatGa4RefreshMessage('missing', 'GA4_SERVICE_ACCOUNT_JSON'),
    }
    expect(isGa4Unauthorized(status)).toBe(true)
    expect(status.message).toContain('GA4 not yet authorized')
    expect(status.message).toContain('Viewer')
  })

  it('mentions both credential options when GA4 is not set up', () => {
    const message = formatGa4RefreshMessage('missing', 'GA4_SERVICE_ACCOUNT_JSON (or GA4_OAUTH_CLIENT_ID)')
    expect(message).toContain('GA4 not yet authorized')
    expect(message).toContain('OAuth refresh token')
  })

  it('rewrites a permission error into a Viewer request', () => {
    const message = formatGa4RefreshMessage('api', 'User does not have sufficient permissions for this property')
    expect(message.startsWith('GA4 not yet authorized')).toBe(true)
    expect(isGa4Unauthorized({ state: 'error', message })).toBe(true)
  })
})

describe('buildConversionFunnel', () => {
  it('leaves GA4 steps empty and still computes Ads rates and cost per step', () => {
    const funnel = buildConversionFunnel({
      ads: ads(),
      ga4: null,
      ga4Status: { state: 'not_configured', message: formatGa4RefreshMessage('missing', 'GA4_SERVICE_ACCOUNT_JSON') },
      offline: booked,
      range,
      scope: 'all',
      channel: 'paid',
    })
    expect(funnel.ga4Ready).toBe(false)
    expect(funnel.placeholder).toContain('GA4 not yet authorized')
    const byId = Object.fromEntries(funnel.steps.map((s) => [s.id, s]))
    expect(byId.impressions.value).toBe(1500)
    expect(byId.clicks.value).toBe(140)
    expect(byId.clicks.rateFromPrevious).toBeCloseTo(140 / 1500)
    expect(byId.clicks.costPer).toBeCloseTo(600 / 140)
    expect(byId.sessions.value).toBeNull()
    expect(byId.sessions.awaitingGa4).toBe(true)
    expect(byId.engagedSessions.value).toBeNull()
    expect(byId.ctaClick.value).toBeNull()
    expect(byId.phoneClick.value).toBeNull()
    expect(byId.primaryConversions.value).toBe(3)
    expect(byId.secondaryConversions.value).toBe(10)
    expect(byId.secondaryConversions.branch).toBe(true)
    expect(byId.secondaryConversions.rateFromPrevious).toBeNull()
    expect(byId.manualBooked.value).toBe(1)
    expect(funnel.campaigns).toHaveLength(2)
    expect(funnel.campaigns[0].sessions).toBeNull()
    expect(funnel.landingPages[0].sessions).toBeNull()
  })

  it('fills the full path once GA4 data is present, including campaign and page breakdowns', () => {
    const funnel = buildConversionFunnel({
      ads: ads(),
      ga4: ga4(),
      ga4Status: { state: 'ok' },
      offline: booked,
      range,
      scope: 'all',
      channel: 'paid',
    })
    const byId = Object.fromEntries(funnel.steps.map((s) => [s.id, s]))
    expect(byId.sessions.value).toBe(120)
    expect(byId.engagedSessions.value).toBe(70)
    expect(byId.engagedSessions.rateFromPrevious).toBeCloseTo(70 / 120)
    expect(byId.ctaClick.value).toBe(20)
    expect(byId.phoneClick.value).toBe(4)
    expect(byId.phoneClick.branch).toBe(true)
    expect(byId.typeformStart.value).toBe(6)
    expect(byId.typeformSubmit.value).toBe(2)
    expect(byId.lead.value).toBe(2)
    expect(byId.lead.sub).toContain('visit_booked')
    expect(byId.ctaClick.costPer).toBeCloseTo(600 / 20)
    const doctor = funnel.campaigns.find((r) => r.key === 'doc')
    expect(doctor?.sessions).toBe(80)
    expect(doctor?.ctaClicks).toBe(12)
    expect(doctor?.typeformStarts).toBe(4)
    const memory = funnel.landingPages.find((r) => r.path === '/memory-doctor-near-me')
    expect(memory?.sessions).toBe(80)
    expect(memory?.ctaClicks).toBe(14)
    expect(memory?.typeformSubmits).toBe(2)
  })

  it('uses only paid search events when the channel filter is paid', () => {
    const data = ga4()
    data.daily.events.push({ date: '2026-11-02', channel: 'Organic Search', eventName: 'cta_click', eventCount: 50 })
    const paid = buildConversionFunnel({ ads: ads(), ga4: data, offline: [], range, scope: 'all', channel: 'paid' })
    const all = buildConversionFunnel({ ads: ads(), ga4: data, offline: [], range, scope: 'all', channel: 'all' })
    expect(paid.steps.find((s) => s.id === 'ctaClick')?.value).toBe(20)
    expect(all.steps.find((s) => s.id === 'ctaClick')?.value).toBe(70)
    expect(all.steps.find((s) => s.id === 'sessions')?.value).toBe(150)
    expect(paid.steps.find((s) => s.id === 'manualBooked')?.detail).toBe('No booked counts entered for this range')
  })
})

describe('normalizeCampaignName', () => {
  it('matches Ads and GA4 labels that differ only by spacing or case', () => {
    expect(normalizeCampaignName('Local Doctor - Doctor')).toBe(normalizeCampaignName('  local doctor - doctor  '))
  })
})
