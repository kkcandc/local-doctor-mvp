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
  primaryConversionCount,
} from '../lib/views'

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

describe('keyword bids', () => {
  it('labels an inherited ad group bid as the default and keeps the campaign cap', () => {
    const info = keywordBidInfo(undefined, { defaultCpcBid: 0.01 }, { maxCpcCap: 6 })
    expect(info.keywordBid).toBeUndefined()
    expect(info.adGroupDefault).toBe(0.01)
    expect(info.maxCpcCap).toBe(6)
  })

  it('keeps a keyword bid that was set on the keyword, and still shows the cap', () => {
    const info = keywordBidInfo({ cpcBid: 4 }, { defaultCpcBid: 20 }, { maxCpcCap: 8 })
    expect(info).toEqual({ keywordBid: 4, adGroupDefault: undefined, maxCpcCap: 8 })
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
    expect(src).toContain('campaign.id, asset.id')
    expect(src).toContain('campaign.id, ad_group.id, asset.id')
    expect(src).not.toContain('effective_cpc_bid')
  })
})
