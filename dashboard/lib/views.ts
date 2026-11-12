import { costPer, cpc, ctr, filterRange, groupSum, ratio, sumFields } from './aggregate'
import type {
  AdsData,
  AdsMetrics,
  AssetDailyRow,
  DateRange,
  Ga4Data,
  Ga4EventDailyRow,
  Ga4TotalsDailyRow,
} from './types'

export const ADS_FIELDS = ['impressions', 'clicks', 'cost', 'conversions', 'allConversions'] as const

export interface WithDerived extends AdsMetrics {
  ctr: number | null
  cpc: number | null
  costPerConversion: number | null
}

export function derive<T extends AdsMetrics>(m: T): T & WithDerived {
  return { ...m, ctr: ctr(m.clicks, m.impressions), cpc: cpc(m.cost, m.clicks), costPerConversion: costPer(m.cost, m.conversions) }
}

export function accountTotals(ads: AdsData, range: DateRange) {
  const rows = filterRange(ads.daily.account, range)
  return derive(sumFields(rows, [...ADS_FIELDS, 'phoneCalls'] as const))
}

export type OverviewScope = 'all' | 'enabled'

/** Enabled campaigns only. Removed and paused campaigns stay out of this set. */
function enabledCampaignIds(ads: AdsData): Set<string> {
  return new Set(ads.campaigns.filter((c) => c.status.toUpperCase() === 'ENABLED').map((c) => c.id))
}

/**
 * Traffic for the Overview. "all" uses the account totals (every campaign,
 * including removed). "enabled" sums only campaigns that are enabled today.
 * Calls always come from campaign phone_calls, because the account row often has none.
 */
export function overviewTraffic(ads: AdsData, range: DateRange, scope: OverviewScope) {
  if (scope === 'all') {
    const totals = accountTotals(ads, range)
    return { ...totals, phoneCalls: callsFromAds(ads, range) }
  }
  const enabled = enabledCampaignIds(ads)
  const rows = filterRange(ads.daily.campaigns, range).filter((r) => enabled.has(r.campaignId))
  return derive(sumFields(rows, [...ADS_FIELDS, 'phoneCalls'] as const))
}

/** Daily spend and clicks for the Overview charts. Same scope rules as overviewTraffic. */
export function overviewMetricRows(ads: AdsData, scope: OverviewScope): { date: string; cost: number; clicks: number }[] {
  if (scope === 'all') return ads.daily.account
  const enabled = enabledCampaignIds(ads)
  return ads.daily.campaigns.filter((r) => enabled.has(r.campaignId))
}

/**
 * Primary conversions for the Overview. "all" is all_conversions of actions
 * marked primary today. "enabled" is the Conversions column on enabled campaigns
 * only, so cost per conversion uses the same spend and conversions as the filter.
 */
export function overviewPrimaryCount(ads: AdsData, range: DateRange, scope: OverviewScope): number {
  if (scope === 'all') return primaryConversionCount(ads, range)
  return overviewTraffic(ads, range, 'enabled').conversions
}

export function overviewCostPerPrimary(ads: AdsData, range: DateRange, scope: OverviewScope): number | null {
  return costPer(overviewTraffic(ads, range, scope).cost, overviewPrimaryCount(ads, range, scope))
}

/** Daily primary conversions for the Overview chart, using the same scope as the KPI. */
export function overviewConversionRows(ads: AdsData, scope: OverviewScope): { date: string; conversions: number }[] {
  if (scope === 'all') return primaryConversionsByDate(ads)
  const enabled = enabledCampaignIds(ads)
  return ads.daily.campaigns.filter((r) => enabled.has(r.campaignId)).map((r) => ({ date: r.date, conversions: r.conversions }))
}

export interface RemovedCampaignContribution {
  id: string
  name: string
  impressions: number
  clicks: number
  cost: number
}

/** Removed campaigns that still have impressions, clicks or spend inside the range. */
export function removedCampaignsInRange(ads: AdsData, range: DateRange): RemovedCampaignContribution[] {
  const removed = new Map(ads.campaigns.filter((c) => c.status.toUpperCase() === 'REMOVED').map((c) => [c.id, c]))
  const sums = groupSum(
    filterRange(ads.daily.campaigns, range).filter((r) => removed.has(r.campaignId)),
    (r) => r.campaignId,
    ['impressions', 'clicks', 'cost'] as const,
  )
  return [...sums.entries()]
    .filter(([, m]) => m.impressions > 0 || m.clicks > 0 || m.cost > 0)
    .map(([id, m]) => ({
      id,
      name: removed.get(id)?.name || `Campaign ${id}`,
      impressions: m.impressions,
      clicks: m.clicks,
      cost: m.cost,
    }))
    .sort((a, b) => b.clicks - a.clicks || b.cost - a.cost)
}

export interface ActionRow {
  id: string
  name: string
  category: string
  /** True when the action is primary_for_goal right now. */
  primary: boolean
  /** all_conversions for this action, whether or not it is primary. */
  count: number
  rateOfClicks: number | null
  costPerAction: number | null
}

/**
 * One row per conversion action. The count is always all_conversions.
 * "Primary" follows primary_for_goal today, not Google's Conversions column
 * (that column can still include an action after it was switched to secondary).
 */
export function conversionActionRows(ads: AdsData, range: DateRange): ActionRow[] {
  const totals = accountTotals(ads, range)
  const sums = groupSum(filterRange(ads.daily.conversions, range), (r) => r.conversionActionId, ['allConversions'] as const)
  const meta = new Map(ads.conversionActions.map((a) => [a.id, a]))
  const ids = new Set([...meta.keys(), ...sums.keys()])
  return [...ids].map((id) => {
    const m = meta.get(id)
    const count = sums.get(id)?.allConversions ?? 0
    return {
      id,
      name: m?.name ?? `Conversion action ${id}`,
      category: m?.category ?? 'UNKNOWN',
      primary: m?.primary ?? false,
      count,
      rateOfClicks: ratio(count, totals.clicks),
      costPerAction: costPer(totals.cost, count),
    }
  })
}

/** Sum of all_conversions over actions that are primary_for_goal today. */
export function primaryConversionCount(ads: AdsData, range: DateRange): number {
  return conversionActionRows(ads, range)
    .filter((a) => a.primary)
    .reduce((sum, a) => sum + a.count, 0)
}

/** Daily all_conversions for actions that are primary_for_goal today, for the trend chart. */
export function primaryConversionsByDate(ads: AdsData): { date: string; conversions: number }[] {
  const primary = new Set(ads.conversionActions.filter((a) => a.primary).map((a) => a.id))
  const grouped = groupSum(
    ads.daily.conversions.filter((r) => primary.has(r.conversionActionId)),
    (r) => r.date,
    ['allConversions'] as const,
  )
  return [...grouped.entries()].map(([date, v]) => ({ date, conversions: v.allConversions }))
}

/** Calls from call assets, summed from campaign metrics.phone_calls. Not a conversion action. */
export function callsFromAds(ads: AdsData, range: DateRange): number {
  return sumFields(filterRange(ads.daily.campaigns, range), ['phoneCalls'] as const).phoneCalls
}

export function callsFromAdsByDate(ads: AdsData): { date: string; phoneCalls: number }[] {
  const grouped = groupSum(ads.daily.campaigns, (r) => r.date, ['phoneCalls'] as const)
  return [...grouped.entries()].map(([date, v]) => ({ date, phoneCalls: v.phoneCalls }))
}

/** Same asset linked to two campaigns (or ad groups) must not share one metric total. */
export function assetLinkKey(row: {
  assetId?: string
  id?: string
  level: string
  campaignId?: string
  adGroupId?: string
}): string {
  return [row.assetId ?? row.id ?? '', row.level, row.campaignId ?? '', row.adGroupId ?? ''].join('|')
}

export function assetLinkMetrics(rows: readonly AssetDailyRow[], range: DateRange) {
  return groupSum(filterRange(rows, range), (r) => assetLinkKey(r), ['impressions', 'clicks', 'cost'] as const)
}

/**
 * Enabled and paused links always show. A removed link shows only when it still
 * had impressions in the selected range, so a sitelink removed today is not lost.
 */
export function visibleAssetLinks<T extends { status?: string; impressions: number }>(rows: T[]): T[] {
  return rows.filter((r) => (r.status ?? '').toUpperCase() !== 'REMOVED' || r.impressions > 0)
}

export interface KeywordBidInfo {
  /** Set only when the keyword itself has a CPC bid. */
  keywordBid?: number
  /** Ad group CPC, shown when the keyword has no bid of its own. */
  adGroupDefault?: number
  /** Campaign max CPC cap (Maximize clicks). */
  maxCpcCap?: number
  /** Maximize clicks: only the campaign cap applies. Keyword bids and ad group defaults are not used. */
  leadWithCap: boolean
}

/** Secondary line under a Maximize clicks cap. The amount is already formatted. */
export function unusedBidLine(label: 'Keyword bid' | 'Ad group default', amount: string): string {
  return `${label} ${amount}, not used`
}

export function keywordBidInfo(
  keyword: { cpcBid?: number } | undefined,
  adGroup: { defaultCpcBid?: number } | undefined,
  campaign: { maxCpcCap?: number; biddingStrategyType?: string } | undefined,
): KeywordBidInfo {
  const keywordBid = keyword?.cpcBid
  return {
    keywordBid,
    adGroupDefault: keywordBid == null ? adGroup?.defaultCpcBid : undefined,
    maxCpcCap: campaign?.maxCpcCap,
    leadWithCap: campaign?.biddingStrategyType === 'TARGET_SPEND',
  }
}

export function matchesChannel(channel: string, filter: 'paid' | 'all') {
  return filter === 'all' || channel === 'Paid Search'
}

export function ga4Totals(ga4: Ga4Data, range: DateRange, channel: 'paid' | 'all') {
  const rows = filterRange(ga4.daily.totals, range).filter((r) => matchesChannel(r.channel, channel))
  return sumFields(rows, ['sessions', 'engagedSessions', 'keyEvents'] as const)
}

export function ga4TotalsRows(ga4: Ga4Data, channel: 'paid' | 'all'): Ga4TotalsDailyRow[] {
  return ga4.daily.totals.filter((r) => matchesChannel(r.channel, channel))
}

export function ga4EventRows(ga4: Ga4Data, channel: 'paid' | 'all'): Ga4EventDailyRow[] {
  return ga4.daily.events.filter((r) => matchesChannel(r.channel, channel))
}

export function ga4EventCounts(ga4: Ga4Data, range: DateRange, channel: 'paid' | 'all'): Record<string, number> {
  const out: Record<string, number> = {}
  for (const r of filterRange(ga4.daily.events, range)) {
    if (!matchesChannel(r.channel, channel)) continue
    out[r.eventName] = (out[r.eventName] ?? 0) + r.eventCount
  }
  return out
}

/** Pivots event rows so each event name becomes a numeric field on a per-day row. */
export function eventsByDay(rows: Ga4EventDailyRow[], names: readonly string[]) {
  const map = new Map<string, Record<string, number | string>>()
  for (const r of rows) {
    if (!names.includes(r.eventName)) continue
    let day = map.get(r.date)
    if (!day) {
      day = { date: r.date }
      for (const n of names) day[n] = 0
      map.set(r.date, day)
    }
    day[r.eventName] = (day[r.eventName] as number) + r.eventCount
  }
  return [...map.values()] as ({ date: string } & Record<string, number>)[]
}

export interface RollupNode {
  id: string
  level: 0 | 1 | 2 | 3
  name: string
  sub?: string
  cost: number
  clicks: number
  conversions: number
  impressions: number
  children: RollupNode[]
}

/**
 * Account, campaign, ad group and keyword spend. Ad group spend not matched to a
 * keyword (for example broad AI Max or close variants without keyword rows) is
 * shown as an "Other" child so children always add up to their parent.
 */
export function spendRollup(ads: AdsData, range: DateRange): RollupNode {
  const fields = ['cost', 'clicks', 'conversions', 'impressions'] as const
  const acct = sumFields(filterRange(ads.daily.account, range), fields)
  const camp = groupSum(filterRange(ads.daily.campaigns, range), (r) => r.campaignId, fields)
  const ag = groupSum(filterRange(ads.daily.adGroups, range), (r) => r.adGroupId, fields)
  const kw = groupSum(filterRange(ads.daily.keywords, range), (r) => `${r.adGroupId}|${r.criterionId}`, fields)
  const campaignName = new Map(ads.campaigns.map((c) => [c.id, c.name]))
  const adGroupMeta = new Map(ads.adGroups.map((g) => [g.id, g]))
  const keywordMeta = new Map(ads.keywords.map((k) => [`${k.adGroupId}|${k.criterionId}`, k]))

  const adGroupCampaign = new Map<string, string>()
  for (const r of ads.daily.adGroups) adGroupCampaign.set(r.adGroupId, r.campaignId)
  for (const g of ads.adGroups) adGroupCampaign.set(g.id, g.campaignId)

  const node = (id: string, level: RollupNode['level'], name: string, m: Record<(typeof fields)[number], number>, sub?: string): RollupNode => ({
    id,
    level,
    name,
    sub,
    cost: m.cost,
    clicks: m.clicks,
    conversions: m.conversions,
    impressions: m.impressions,
    children: [],
  })

  const root = node('account', 0, ads.accountName ?? 'Account', acct)
  for (const [cid, cm] of camp) {
    if (!cm.cost && !cm.clicks && !cm.impressions) continue
    const cNode = node(`c:${cid}`, 1, campaignName.get(cid) ?? `Campaign ${cid}`, cm)
    for (const [gid, gm] of ag) {
      if (adGroupCampaign.get(gid) !== cid || (!gm.cost && !gm.impressions)) continue
      const gNode = node(`g:${gid}`, 2, adGroupMeta.get(gid)?.name ?? `Ad group ${gid}`, gm)
      const left = { ...gm }
      for (const [key, km] of kw) {
        if (!key.startsWith(`${gid}|`) || (!km.cost && !km.impressions)) continue
        const meta = keywordMeta.get(key)
        gNode.children.push(node(`k:${key}`, 3, meta?.text ?? `Keyword ${key.split('|')[1]}`, km, meta?.matchType))
        for (const f of fields) left[f] -= km[f]
      }
      if (gNode.children.length && (left.cost >= 0.5 || left.clicks > 0)) {
        gNode.children.push(node(`o:${gid}`, 3, 'Other (not matched to a keyword)', {
          cost: Math.max(0, left.cost),
          clicks: Math.max(0, left.clicks),
          conversions: Math.max(0, left.conversions),
          impressions: Math.max(0, left.impressions),
        }))
      }
      gNode.children.sort((a, b) => b.cost - a.cost)
      cNode.children.push(gNode)
    }
    cNode.children.sort((a, b) => b.cost - a.cost)
    root.children.push(cNode)
  }
  root.children.sort((a, b) => b.cost - a.cost)
  return root
}
