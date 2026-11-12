import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import type { AdsData, AssetDailyRow } from '../lib/types'
import {
  assetLinkKey,
  assetLinkMetrics,
  callsFromAds,
  conversionActionRows,
  keywordBidInfo,
  overviewConversionRows,
  overviewCostPerPrimary,
  overviewMetricRows,
  overviewPrimaryCount,
  overviewTraffic,
  primaryConversionCount,
  removedCampaignsInRange,
  unusedBidLine,
  visibleAssetLinks,
} from '../lib/views'
import { refreshCooldownMessage } from '../lib/refresh-message'

const range = { start: '2026-11-01', end: '2026-11-07' }

function ads(partial: {
  accountPhoneCalls?: number
  campaigns: { id: string; phoneCalls: number; date?: string }[]
  actions: { id: string; name: string; primary: boolean; conversions: number; allConversions: number }[]
}): AdsData {
  const blank = { impressions: 0, clicks: 10, cost: 100, conversions: 0, allConversions: 0 }
  return {
    customerId: '1',
    currency: 'USD',
    timeZone: 'America/New_York',
    campaigns: [],
    adGroups: [],
    ads: [],
    keywords: [],
    assets: [],
    conversionActions: partial.actions.map((a) => ({
      id: a.id,
      name: a.name,
      category: 'DEFAULT',
      status: 'ENABLED',
      primary: a.primary,
    })),
    daily: {
      account: [{ date: '2026-11-02', ...blank, conversions: 1, allConversions: 5, phoneCalls: partial.accountPhoneCalls ?? 0 }],
      campaigns: partial.campaigns.map((c) => ({
        date: c.date ?? '2026-11-02',
        campaignId: c.id,
        ...blank,
        phoneCalls: c.phoneCalls,
      })),
      adGroups: [],
      ads: [],
      keywords: [],
      searchTerms: [],
      landingPages: [],
      conversions: partial.actions.map((a) => ({
        date: '2026-11-02',
        conversionActionId: a.id,
        conversions: a.conversions,
        allConversions: a.allConversions,
      })),
      assets: [],
    },
  }
}

describe('asset metrics stay on their own link', () => {
  it('does not repeat one asset total on every campaign it is attached to', () => {
    const rows: AssetDailyRow[] = [
      { date: '2026-11-02', assetId: 'sitelink', level: 'campaign', campaignId: 'doctor', impressions: 304, clicks: 31, cost: 551.4 },
      { date: '2026-11-03', assetId: 'sitelink', level: 'campaign', campaignId: 'doctor', impressions: 10, clicks: 1, cost: 2 },
      { date: '2026-11-02', assetId: 'sitelink', level: 'campaign', campaignId: 'evaluation', impressions: 473, clicks: 57, cost: 751.45 },
      { date: '2026-11-02', assetId: 'call', level: 'campaign', campaignId: 'doctor', impressions: 51, clicks: 5, cost: 96.06 },
      { date: '2026-11-02', assetId: 'call', level: 'campaign', campaignId: 'evaluation', impressions: 8, clicks: 1, cost: 15.93 },
      { date: '2026-11-02', assetId: 'call', level: 'ad_group', campaignId: 'doctor', adGroupId: 'g1', impressions: 25, clicks: 2, cost: 10.98 },
    ]
    const sums = assetLinkMetrics(rows, range)
    expect(sums.get(assetLinkKey({ assetId: 'sitelink', level: 'campaign', campaignId: 'doctor' }))).toEqual({
      impressions: 314,
      clicks: 32,
      cost: 553.4,
    })
    expect(sums.get(assetLinkKey({ assetId: 'sitelink', level: 'campaign', campaignId: 'evaluation' }))?.impressions).toBe(473)
    expect(sums.get(assetLinkKey({ assetId: 'call', level: 'ad_group', campaignId: 'doctor', adGroupId: 'g1' }))?.cost).toBe(10.98)
    // The campaign row must not pick up the ad group row.
    expect(sums.get(assetLinkKey({ assetId: 'call', level: 'campaign', campaignId: 'doctor' }))?.impressions).toBe(51)
  })
})

describe('calls from ads', () => {
  it('sums campaign phone_calls and ignores the account row and the conversion action', () => {
    const data = ads({
      accountPhoneCalls: 0,
      campaigns: [
        { id: 'md', phoneCalls: 1 },
        { id: 'eval', phoneCalls: 0 },
      ],
      actions: [{ id: 'calls', name: 'Calls from ads', primary: false, conversions: 0, allConversions: 4 }],
    })
    expect(callsFromAds(data, range)).toBe(1)
  })
})

describe('primary conversions', () => {
  const data = ads({
    campaigns: [],
    actions: [
      // In Google's Conversions column, but secondary today.
      { id: 'tap', name: 'LD - Phone tap (site)', primary: false, conversions: 1, allConversions: 1 },
      // Primary today, with the count only in all_conversions.
      { id: 'booked', name: 'LD - Visit booked (Calendly)', primary: true, conversions: 0, allConversions: 1 },
      { id: 'eval', name: 'LD - Evaluation submitted', primary: true, conversions: 2, allConversions: 3 },
    ],
  })

  it('sums all_conversions of actions marked primary today', () => {
    expect(primaryConversionCount(data, range)).toBe(4)
  })

  it('uses all_conversions for secondary actions too, and does not call them primary', () => {
    const rows = conversionActionRows(data, range)
    const tap = rows.find((r) => r.id === 'tap')
    const booked = rows.find((r) => r.id === 'booked')
    expect(tap).toMatchObject({ primary: false, count: 1 })
    expect(booked).toMatchObject({ primary: true, count: 1 })
  })
})

describe('removed asset links', () => {
  it('keeps a removed link that had impressions and drops one that did not', () => {
    const rows = [
      { id: '435690817021', status: 'REMOVED', impressions: 120 },
      { id: '435841430362', status: 'REMOVED', impressions: 80 },
      { id: '435581476439', status: 'REMOVED', impressions: 40 },
      { id: 'gone', status: 'REMOVED', impressions: 0 },
      { id: 'live', status: 'ENABLED', impressions: 0 },
    ]
    const shown = visibleAssetLinks(rows)
    expect(shown.map((r) => r.id)).toEqual(['435690817021', '435841430362', '435581476439', 'live'])
    expect(shown.find((r) => r.id === '435690817021')?.status).toBe('REMOVED')
  })
})

describe('overview campaign scope', () => {
  const ads = {
    campaigns: [
      { id: 'pmax', name: 'Campaign #1', status: 'REMOVED', biddingStrategyType: 'MAXIMIZE_CONVERSIONS' },
      { id: 'md', name: 'MD Search', status: 'ENABLED', biddingStrategyType: 'TARGET_SPEND' },
      { id: 'paused', name: 'Brand', status: 'PAUSED', biddingStrategyType: 'MANUAL_CPC' },
      { id: 'quiet', name: 'Empty removed', status: 'REMOVED', biddingStrategyType: 'MANUAL_CPC' },
    ],
    daily: {
      account: [{ date: '2026-08-14', impressions: 200, clicks: 50, cost: 20, conversions: 0, allConversions: 0, phoneCalls: 0 }],
      campaigns: [
        { date: '2026-08-14', campaignId: 'pmax', impressions: 16792, clicks: 445, cost: 132, conversions: 0, allConversions: 0, phoneCalls: 0 },
        { date: '2026-08-14', campaignId: 'md', impressions: 30, clicks: 4, cost: 7, conversions: 0, allConversions: 0, phoneCalls: 1 },
        { date: '2026-08-14', campaignId: 'paused', impressions: 10, clicks: 1, cost: 1, conversions: 0, allConversions: 0, phoneCalls: 0 },
        { date: '2026-08-14', campaignId: 'quiet', impressions: 0, clicks: 0, cost: 0, conversions: 0, allConversions: 0, phoneCalls: 0 },
        { date: '2026-07-01', campaignId: 'pmax', impressions: 9, clicks: 1, cost: 1, conversions: 0, allConversions: 0, phoneCalls: 0 },
      ],
    },
  } as AdsData

  it('names a removed campaign that still has clicks in the range', () => {
    const found = removedCampaignsInRange(ads, { start: '2026-08-01', end: '2026-11-01' })
    expect(found.map((c) => c.name)).toEqual(['Campaign #1'])
    expect(found[0]).toMatchObject({ impressions: 16792, clicks: 445, cost: 132 })
  })

  it('keeps all-campaign totals, and drops removed and paused when set to enabled', () => {
    const range = { start: '2026-08-01', end: '2026-11-01' }
    expect(overviewTraffic(ads, range, 'all').clicks).toBe(50)
    expect(overviewTraffic(ads, range, 'all').phoneCalls).toBe(1)
    expect(overviewTraffic(ads, range, 'enabled')).toMatchObject({ impressions: 30, clicks: 4, cost: 7, phoneCalls: 1 })
    expect(overviewMetricRows(ads, 'enabled').map((r) => r.clicks)).toEqual([4])
  })

  it('uses enabled spend and enabled conversions for cost per primary', () => {
    const scoped = {
      campaigns: [
        { id: 'md', name: 'MD Search', status: 'ENABLED', biddingStrategyType: 'TARGET_SPEND' },
        { id: 'old', name: 'Campaign #1', status: 'REMOVED', biddingStrategyType: 'MAXIMIZE_CONVERSIONS' },
      ],
      conversionActions: [
        { id: 'booked', name: 'Visit booked', category: 'DEFAULT', status: 'ENABLED', primary: true },
      ],
      daily: {
        account: [{ date: '2026-08-14', impressions: 200, clicks: 50, cost: 2581, conversions: 4, allConversions: 4, phoneCalls: 0 }],
        campaigns: [
          { date: '2026-08-14', campaignId: 'md', impressions: 30, clicks: 4, cost: 800, conversions: 2, allConversions: 2, phoneCalls: 0 },
          { date: '2026-08-14', campaignId: 'old', impressions: 170, clicks: 46, cost: 1781, conversions: 2, allConversions: 2, phoneCalls: 0 },
        ],
        conversions: [{ date: '2026-08-14', conversionActionId: 'booked', conversions: 0, allConversions: 4 }],
      },
    } as AdsData
    const window = { start: '2026-08-01', end: '2026-11-01' }
    expect(overviewPrimaryCount(scoped, window, 'all')).toBe(4)
    expect(overviewCostPerPrimary(scoped, window, 'all')).toBe(2581 / 4)
    expect(overviewPrimaryCount(scoped, window, 'enabled')).toBe(2)
    expect(overviewCostPerPrimary(scoped, window, 'enabled')).toBe(400)
    expect(overviewConversionRows(scoped, 'enabled').reduce((sum, row) => sum + row.conversions, 0)).toBe(2)
  })
})

describe('keyword bids', () => {
  it('labels an inherited ad group bid as the default and keeps the campaign cap', () => {
    const info = keywordBidInfo(undefined, { defaultCpcBid: 0.01 }, { maxCpcCap: 6 })
    expect(info.keywordBid).toBeUndefined()
    expect(info.adGroupDefault).toBe(0.01)
    expect(info.maxCpcCap).toBe(6)
    expect(info.leadWithCap).toBe(false)
  })

  it('leads Maximize clicks with the cap and leaves the ad group default secondary', () => {
    const info = keywordBidInfo(undefined, { defaultCpcBid: 0.01 }, { maxCpcCap: 6, biddingStrategyType: 'TARGET_SPEND' })
    expect(info.leadWithCap).toBe(true)
    expect(info.maxCpcCap).toBe(6)
    expect(info.adGroupDefault).toBe(0.01)
    expect(info.keywordBid).toBeUndefined()
    expect(unusedBidLine('Ad group default', '$0.01')).toBe('Ad group default $0.01, not used')
  })

  it('marks a keyword bid unused under Maximize clicks, since only the cap applies', () => {
    const info = keywordBidInfo({ cpcBid: 12.8 }, { defaultCpcBid: 0.01 }, { maxCpcCap: 6, biddingStrategyType: 'TARGET_SPEND' })
    expect(info.leadWithCap).toBe(true)
    expect(info.keywordBid).toBe(12.8)
    expect(info.adGroupDefault).toBeUndefined()
    expect(unusedBidLine('Keyword bid', '$12.80')).toBe('Keyword bid $12.80, not used')
  })

  it('keeps a keyword bid that was set on the keyword, and still shows the cap', () => {
    const info = keywordBidInfo({ cpcBid: 4 }, { defaultCpcBid: 20 }, { maxCpcCap: 8 })
    expect(info).toEqual({ keywordBid: 4, adGroupDefault: undefined, maxCpcCap: 8, leadWithCap: false })
  })
})

describe('refresh cooldown message', () => {
  it('says how long ago the refresh was and how long to wait', () => {
    const ten = 10 * 60 * 1000
    expect(refreshCooldownMessage(3 * 60 * 1000, ten)).toEqual({
      error: 'Refreshed 3 min ago, try again in 7 min.',
      retryAfterSeconds: 7 * 60,
    })
    expect(refreshCooldownMessage(30 * 1000, ten).error).toBe('Refreshed just now, try again in 10 min.')
    expect(refreshCooldownMessage(9 * 60 * 1000 + 1000, ten).error).toBe('Refreshed 9 min ago, try again in 1 min.')
  })
})

describe('vercel ignore rules', () => {
  const repo = path.resolve(import.meta.dirname, '../..')
  const dash = path.join(repo, 'dashboard')

  function code(cmd: string, cwd: string): number {
    try {
      execSync(cmd, { cwd, stdio: 'ignore' })
      return 0
    } catch (err) {
      return (err as { status?: number }).status ?? 1
    }
  }

  it('builds when dashboard changes and skips when it does not, from either directory', () => {
    const dashboardSha = execSync('git log -1 --format=%H -- dashboard', { cwd: repo }).toString().trim()
    const recent = execSync('git log -30 --format=%H', { cwd: repo }).toString().trim().split('\n')
    const untouched = recent.find((sha) => {
      const names = execSync(`git diff --name-only ${sha}^ ${sha}`, { cwd: repo }).toString()
      return names.length > 0 && !names.split('\n').some((n) => n.startsWith('dashboard/') || n === 'dashboard')
    })
    expect(untouched).toBeTruthy()
    for (const cwd of [repo, dash]) {
      expect(code(`git diff --quiet ${dashboardSha}^ ${dashboardSha} -- :/dashboard`, cwd)).toBe(1)
      expect(code(`git diff --quiet ${untouched}^ ${untouched} -- :/dashboard`, cwd)).toBe(0)
    }
  })

  it('points the dashboard project at that check and leaves the marketing site always building', () => {
    const dashboardConfig = JSON.parse(readFileSync(path.join(dash, 'vercel.json'), 'utf8')) as { ignoreCommand: string }
    const siteConfig = JSON.parse(readFileSync(path.join(repo, 'vercel.json'), 'utf8')) as { ignoreCommand: string }
    expect(dashboardConfig.ignoreCommand).toContain('vercel-ignore.sh')
    expect(readFileSync(path.join(dash, 'scripts/vercel-ignore.sh'), 'utf8')).toContain(':/dashboard')
    expect(siteConfig.ignoreCommand).toBe('exit 1')
  })

  it('fetches asset metrics per link and does not treat the effective bid as a keyword bid', () => {
    const src = readFileSync(path.join(dash, 'lib/google-ads.ts'), 'utf8')
    const assetFn = src.slice(src.indexOf('async function fetchAssets'), src.indexOf('function mergeLandingPages'))
    expect(assetFn).toContain('campaign.id, asset.id')
    expect(assetFn).toContain('campaign.id, ad_group.id, asset.id')
    expect(assetFn).toContain('asset.callout_asset.callout_text')
    expect(assetFn).not.toContain('REMOVED')
    expect(src).not.toContain('effective_cpc_bid')
    expect(src).toContain("campaign.status IN ('ENABLED', 'PAUSED', 'REMOVED')")
    const charts = readFileSync(path.join(dash, 'components/charts.tsx'), 'utf8')
    expect(charts).not.toContain('monotone')
    for (const file of ['KeywordsSection.tsx', 'OfflineSection.tsx', 'LandingPagesSection.tsx', 'OnPageSection.tsx']) {
      const section = readFileSync(path.join(dash, 'components/sections', file), 'utf8')
      expect(section).toContain('MetricCharts')
      expect(section).not.toContain("axis: 'right'")
      expect(section).not.toContain("type: 'line'")
    }
  })
})
