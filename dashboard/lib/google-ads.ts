import 'server-only'
import type { AdsCredentials } from './env'
import { accessTokenFromRefreshToken } from './google-auth'
import { pathOnly } from './privacy'
import type {
  AccountDailyRow,
  AdDailyRow,
  AdGroupDailyRow,
  AdGroupMeta,
  AdMeta,
  AdsData,
  AdsLandingPageDailyRow,
  AssetDailyRow,
  AssetMeta,
  CampaignDailyRow,
  CampaignMeta,
  ConversionActionMeta,
  ConversionDailyRow,
  DateRange,
  KeywordDailyRow,
  KeywordMeta,
  SearchTermDailyRow,
} from './types'

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>

const micros = (v: unknown) => (v == null ? 0 : Number(v) / 1_000_000)
const optMicros = (v: unknown) => (v == null || v === '0' || v === 0 ? undefined : Number(v) / 1_000_000)
const num = (v: unknown) => (v == null ? 0 : Number(v))
const str = (v: unknown) => (v == null ? '' : String(v))

const BASE_METRICS =
  'metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.all_conversions'

function baseMetrics(r: Row) {
  const m = r.metrics ?? {}
  return {
    date: str(r.segments?.date),
    impressions: num(m.impressions),
    clicks: num(m.clicks),
    cost: micros(m.costMicros),
    conversions: num(m.conversions),
    allConversions: num(m.allConversions),
  }
}

class AdsClient {
  private token: string | null = null

  constructor(private creds: AdsCredentials) {}

  private async accessToken() {
    if (!this.token) {
      this.token = await accessTokenFromRefreshToken(this.creds.clientId, this.creds.clientSecret, this.creds.refreshToken)
    }
    return this.token
  }

  async query(gaql: string): Promise<Row[]> {
    const { apiVersion, customerId, developerToken, loginCustomerId } = this.creds
    const headers: Record<string, string> = {
      authorization: `Bearer ${await this.accessToken()}`,
      'developer-token': developerToken,
      'content-type': 'application/json',
    }
    if (loginCustomerId) headers['login-customer-id'] = loginCustomerId
    const res = await fetch(
      `https://googleads.googleapis.com/${apiVersion}/customers/${customerId}/googleAds:searchStream`,
      { method: 'POST', headers, body: JSON.stringify({ query: gaql }), cache: 'no-store' },
    )
    const body = (await res.json().catch(() => null)) as any
    if (!res.ok) {
      const first = Array.isArray(body) ? body[0] : body
      const detail =
        first?.error?.details?.[0]?.errors?.[0]?.message || first?.error?.message || `HTTP ${res.status}`
      throw new Error(`Google Ads API: ${detail}`)
    }
    const chunks: any[] = Array.isArray(body) ? body : [body]
    return chunks.flatMap((c) => c?.results ?? [])
  }

  /** Runs the first query that Google accepts. Field availability varies by API version and account. */
  async queryFirst(gaqls: string[]): Promise<Row[]> {
    let lastErr: unknown
    for (const q of gaqls) {
      try {
        return await this.query(q)
      } catch (err) {
        lastErr = err
      }
    }
    throw lastErr
  }
}

export interface AdsFetchResult {
  data: AdsData
  warnings: string[]
}

export async function fetchAds(creds: AdsCredentials, range: DateRange): Promise<AdsFetchResult> {
  const client = new AdsClient(creds)
  const during = `segments.date BETWEEN '${range.start}' AND '${range.end}'`
  const warnings: string[] = []

  async function optional<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await fn()
    } catch (err) {
      warnings.push(`${label}: ${err instanceof Error ? err.message : String(err)}`)
      return fallback
    }
  }

  // Required: account info and account totals. Failures here fail the whole Ads source.
  const [customer] = await client.query(
    'SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone FROM customer LIMIT 1',
  )
  const accountRows = await client.queryFirst([
    `SELECT segments.date, ${BASE_METRICS}, metrics.phone_calls FROM customer WHERE ${during}`,
    `SELECT segments.date, ${BASE_METRICS} FROM customer WHERE ${during}`,
  ])
  const account: AccountDailyRow[] = accountRows.map((r) => ({ ...baseMetrics(r), phoneCalls: num(r.metrics?.phoneCalls) }))

  const [
    campaigns,
    campaignDaily,
    adGroups,
    adGroupDaily,
    ads,
    adDaily,
    keywords,
    keywordDaily,
    searchTerms,
    landingPages,
    conversionActions,
    conversions,
    assetResult,
  ] = await Promise.all([
    optional('Campaigns', () => fetchCampaigns(client), [] as CampaignMeta[]),
    optional(
      'Campaign daily',
      async () =>
        (
          await client.queryFirst([
            `SELECT campaign.id, segments.date, ${BASE_METRICS}, metrics.phone_calls FROM campaign WHERE ${during}`,
            `SELECT campaign.id, segments.date, ${BASE_METRICS} FROM campaign WHERE ${during}`,
          ])
        ).map<CampaignDailyRow>((r) => ({
          ...baseMetrics(r),
          campaignId: str(r.campaign?.id),
          phoneCalls: num(r.metrics?.phoneCalls),
        })),
      [] as CampaignDailyRow[],
    ),
    optional(
      'Ad groups',
      async () =>
        (
          await client.query(
            'SELECT ad_group.id, ad_group.name, ad_group.status, ad_group.cpc_bid_micros, campaign.id FROM ad_group',
          )
        ).map<AdGroupMeta>((r) => ({
          id: str(r.adGroup?.id),
          campaignId: str(r.campaign?.id),
          name: str(r.adGroup?.name),
          status: str(r.adGroup?.status),
          defaultCpcBid: optMicros(r.adGroup?.cpcBidMicros),
        })),
      [] as AdGroupMeta[],
    ),
    optional(
      'Ad group daily',
      async () =>
        (await client.query(`SELECT campaign.id, ad_group.id, segments.date, ${BASE_METRICS} FROM ad_group WHERE ${during}`)).map<AdGroupDailyRow>(
          (r) => ({ ...baseMetrics(r), campaignId: str(r.campaign?.id), adGroupId: str(r.adGroup?.id) }),
        ),
      [] as AdGroupDailyRow[],
    ),
    optional('Ads', () => fetchAdsMeta(client), [] as AdMeta[]),
    optional(
      'Ad daily',
      async () =>
        (
          await client.query(`SELECT ad_group.id, ad_group_ad.ad.id, segments.date, ${BASE_METRICS} FROM ad_group_ad WHERE ${during}`)
        ).map<AdDailyRow>((r) => ({ ...baseMetrics(r), adGroupId: str(r.adGroup?.id), adId: str(r.adGroupAd?.ad?.id) })),
      [] as AdDailyRow[],
    ),
    optional('Keywords', () => fetchKeywords(client), [] as KeywordMeta[]),
    optional(
      'Keyword daily',
      async () =>
        (
          await client.queryFirst([
            `SELECT ad_group.id, ad_group_criterion.criterion_id, segments.date, ${BASE_METRICS}, metrics.search_impression_share FROM keyword_view WHERE ${during}`,
            `SELECT ad_group.id, ad_group_criterion.criterion_id, segments.date, ${BASE_METRICS} FROM keyword_view WHERE ${during}`,
          ])
        ).map<KeywordDailyRow>((r) => {
          const base = baseMetrics(r)
          const share = r.metrics?.searchImpressionShare
          const row: KeywordDailyRow = {
            ...base,
            adGroupId: str(r.adGroup?.id),
            criterionId: str(r.adGroupCriterion?.criterionId),
          }
          if (share != null && Number(share) > 0 && base.impressions > 0) {
            row.eligibleImpressions = base.impressions / Number(share)
          }
          return row
        }),
      [] as KeywordDailyRow[],
    ),
    optional(
      'Search terms',
      async () =>
        (
          await client.queryFirst([
            `SELECT search_term_view.search_term, segments.search_term_match_source, campaign.id, ad_group.id, segments.date, ${BASE_METRICS} FROM search_term_view WHERE ${during}`,
            `SELECT search_term_view.search_term, segments.search_term_match_type, campaign.id, ad_group.id, segments.date, ${BASE_METRICS} FROM search_term_view WHERE ${during}`,
          ])
        ).map<SearchTermDailyRow>((r) => ({
          ...baseMetrics(r),
          searchTerm: str(r.searchTermView?.searchTerm),
          matchSource: str(r.segments?.searchTermMatchSource ?? r.segments?.searchTermMatchType) || 'UNKNOWN',
          campaignId: str(r.campaign?.id),
          adGroupId: str(r.adGroup?.id),
        })),
      [] as SearchTermDailyRow[],
    ),
    optional(
      'Ads landing pages',
      async () =>
        mergeLandingPages(
          (
            await client.query(
              `SELECT landing_page_view.unexpanded_final_url, segments.date, ${BASE_METRICS} FROM landing_page_view WHERE ${during}`,
            )
          ).map<AdsLandingPageDailyRow>((r) => ({ ...baseMetrics(r), path: pathOnly(r.landingPageView?.unexpandedFinalUrl) })),
        ),
      [] as AdsLandingPageDailyRow[],
    ),
    optional(
      'Conversion actions',
      async () =>
        (
          await client.query(
            "SELECT conversion_action.id, conversion_action.name, conversion_action.category, conversion_action.status, conversion_action.primary_for_goal, conversion_action.origin FROM conversion_action WHERE conversion_action.status != 'REMOVED'",
          )
        ).map<ConversionActionMeta>((r) => ({
          id: str(r.conversionAction?.id),
          name: str(r.conversionAction?.name),
          category: str(r.conversionAction?.category),
          status: str(r.conversionAction?.status),
          primary: Boolean(r.conversionAction?.primaryForGoal),
          origin: r.conversionAction?.origin ? str(r.conversionAction.origin) : undefined,
        })),
      [] as ConversionActionMeta[],
    ),
    optional(
      'Conversions by action',
      async () =>
        (
          await client.query(
            `SELECT segments.conversion_action, segments.date, metrics.conversions, metrics.all_conversions FROM customer WHERE ${during}`,
          )
        ).map<ConversionDailyRow>((r) => ({
          date: str(r.segments?.date),
          conversionActionId: str(r.segments?.conversionAction).split('/').pop() ?? '',
          conversions: num(r.metrics?.conversions),
          allConversions: num(r.metrics?.allConversions),
        })),
      [] as ConversionDailyRow[],
    ),
    optional('Assets', () => fetchAssets(client, during), { assets: [] as AssetMeta[], daily: [] as AssetDailyRow[] }),
  ])

  return {
    warnings,
    data: {
      customerId: str(customer?.customer?.id) || creds.customerId,
      accountName: customer?.customer?.descriptiveName || undefined,
      currency: customer?.customer?.currencyCode || 'USD',
      timeZone: customer?.customer?.timeZone || 'America/New_York',
      campaigns,
      adGroups,
      ads,
      keywords,
      assets: assetResult.assets,
      conversionActions,
      daily: {
        account,
        campaigns: campaignDaily,
        adGroups: adGroupDaily,
        ads: adDaily,
        keywords: keywordDaily,
        searchTerms,
        landingPages,
        conversions,
        assets: assetResult.daily,
      },
    },
  }
}

async function fetchCampaigns(client: AdsClient): Promise<CampaignMeta[]> {
  const common =
    'campaign.id, campaign.name, campaign.status, campaign.bidding_strategy_type, campaign.advertising_channel_type, campaign_budget.amount_micros'
  const rows = await client.queryFirst([
    `SELECT ${common}, campaign.target_spend.cpc_bid_ceiling_micros FROM campaign`,
    `SELECT ${common} FROM campaign`,
  ])
  return rows.map((r) => ({
    id: str(r.campaign?.id),
    name: str(r.campaign?.name),
    status: str(r.campaign?.status),
    biddingStrategyType: str(r.campaign?.biddingStrategyType),
    channelType: r.campaign?.advertisingChannelType ? str(r.campaign.advertisingChannelType) : undefined,
    maxCpcCap: optMicros(r.campaign?.targetSpend?.cpcBidCeilingMicros),
    dailyBudget: optMicros(r.campaignBudget?.amountMicros),
  }))
}

async function fetchAdsMeta(client: AdsClient): Promise<AdMeta[]> {
  const rows = await client.query(
    "SELECT ad_group_ad.ad.id, ad_group_ad.ad.type, ad_group_ad.status, ad_group_ad.ad.final_urls, ad_group_ad.ad.responsive_search_ad.headlines, ad_group_ad.ad.responsive_search_ad.descriptions, ad_group_ad.ad.responsive_search_ad.path1, ad_group_ad.ad.responsive_search_ad.path2, ad_group.id, campaign.id FROM ad_group_ad WHERE ad_group_ad.status != 'REMOVED'",
  )
  return rows.map((r) => {
    const ad = r.adGroupAd?.ad ?? {}
    const rsa = ad.responsiveSearchAd ?? {}
    return {
      id: str(ad.id),
      adGroupId: str(r.adGroup?.id),
      campaignId: str(r.campaign?.id),
      status: str(r.adGroupAd?.status),
      type: str(ad.type),
      headlines: (rsa.headlines ?? []).map((h: Row) => str(h.text)).filter(Boolean),
      descriptions: (rsa.descriptions ?? []).map((d: Row) => str(d.text)).filter(Boolean),
      finalUrls: (ad.finalUrls ?? []).map((u: string) => pathOnly(u)),
      path1: rsa.path1 || undefined,
      path2: rsa.path2 || undefined,
    }
  })
}

async function fetchKeywords(client: AdsClient): Promise<KeywordMeta[]> {
  const rows = await client.query(
    "SELECT ad_group_criterion.criterion_id, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ad_group_criterion.status, ad_group_criterion.cpc_bid_micros, ad_group.id, campaign.id FROM ad_group_criterion WHERE ad_group_criterion.type = 'KEYWORD' AND ad_group_criterion.negative = FALSE",
  )
  return rows.map((r) => {
    const c = r.adGroupCriterion ?? {}
    return {
      criterionId: str(c.criterionId),
      adGroupId: str(r.adGroup?.id),
      campaignId: str(r.campaign?.id),
      text: str(c.keyword?.text),
      matchType: str(c.keyword?.matchType),
      status: str(c.status),
      // Own bid only. An inherited ad group bid is not stored here.
      cpcBid: optMicros(c.cpcBidMicros),
    }
  })
}

async function fetchAssets(client: AdsClient, during: string): Promise<{ assets: AssetMeta[]; daily: AssetDailyRow[] }> {
  const fields =
    'asset.id, asset.type, asset.final_urls, asset.sitelink_asset.link_text, asset.sitelink_asset.description1, asset.sitelink_asset.description2, asset.call_asset.phone_number, asset.callout_asset.callout_text'
  // Structured snippets are optional: a field the API version does not have must not drop sitelinks and callouts.
  let snippetFields = ', asset.structured_snippet_asset.header, asset.structured_snippet_asset.values'
  let types = "asset.type IN ('SITELINK', 'CALL', 'CALLOUT', 'STRUCTURED_SNIPPET')"
  try {
    await client.query(`SELECT asset.structured_snippet_asset.header FROM asset WHERE asset.type = 'STRUCTURED_SNIPPET' LIMIT 1`)
  } catch {
    snippetFields = ''
    types = "asset.type IN ('SITELINK', 'CALL', 'CALLOUT')"
  }
  const levels = [
    { level: 'customer' as const, from: 'customer_asset', extra: '', status: 'customer_asset.status', split: 'asset.id' },
    { level: 'campaign' as const, from: 'campaign_asset', extra: ', campaign.id', status: 'campaign_asset.status', split: 'campaign.id, asset.id' },
    {
      level: 'ad_group' as const,
      from: 'ad_group_asset',
      extra: ', ad_group.id, campaign.id',
      status: 'ad_group_asset.status',
      split: 'campaign.id, ad_group.id, asset.id',
    },
  ]
  const assets: AssetMeta[] = []
  const daily: AssetDailyRow[] = []
  for (const l of levels) {
    // Removed links stay in the snapshot. The UI shows them only when the range still has impressions.
    const meta = await client.query(
      `SELECT ${fields}${snippetFields}, ${l.status}${l.extra} FROM ${l.from} WHERE ${types}`,
    )
    for (const r of meta) {
      const a = r.asset ?? {}
      const statusKey = l.from.replace(/_([a-z])/g, (_m, c: string) => c.toUpperCase())
      const values = a.structuredSnippetAsset?.values
      assets.push({
        id: str(a.id),
        type: str(a.type),
        level: l.level,
        campaignId: r.campaign?.id ? str(r.campaign.id) : undefined,
        adGroupId: r.adGroup?.id ? str(r.adGroup.id) : undefined,
        status: r[statusKey]?.status ? str(r[statusKey].status) : undefined,
        linkText: a.sitelinkAsset?.linkText || undefined,
        description1: a.sitelinkAsset?.description1 || undefined,
        description2: a.sitelinkAsset?.description2 || undefined,
        phoneNumber: a.callAsset?.phoneNumber || undefined,
        finalUrls: a.finalUrls?.length ? a.finalUrls.map((u: string) => pathOnly(u)) : undefined,
        calloutText: a.calloutAsset?.calloutText || undefined,
        snippetHeader: a.structuredSnippetAsset?.header || undefined,
        snippetValues: Array.isArray(values) ? values.map((v: unknown) => str(v)).filter(Boolean) : undefined,
      })
    }
    // Selecting the link ids stops Google from summing one asset across every campaign it is attached to.
    const metrics = await client.query(
      `SELECT ${l.split}, segments.date, metrics.impressions, metrics.clicks, metrics.cost_micros FROM ${l.from} WHERE ${types} AND ${during}`,
    )
    for (const r of metrics) {
      daily.push({
        date: str(r.segments?.date),
        assetId: str(r.asset?.id),
        level: l.level,
        campaignId: r.campaign?.id ? str(r.campaign.id) : undefined,
        adGroupId: r.adGroup?.id ? str(r.adGroup.id) : undefined,
        impressions: num(r.metrics?.impressions),
        clicks: num(r.metrics?.clicks),
        cost: micros(r.metrics?.costMicros),
      })
    }
  }
  return { assets, daily }
}

/** Several final URLs can collapse to the same path once query strings are stripped. */
function mergeLandingPages(rows: AdsLandingPageDailyRow[]): AdsLandingPageDailyRow[] {
  const map = new Map<string, AdsLandingPageDailyRow>()
  for (const r of rows) {
    const key = `${r.date}|${r.path}`
    const prev = map.get(key)
    if (!prev) {
      map.set(key, { ...r })
      continue
    }
    prev.impressions += r.impressions
    prev.clicks += r.clicks
    prev.cost += r.cost
    prev.conversions += r.conversions
    prev.allConversions += r.allConversions
  }
  return [...map.values()]
}
