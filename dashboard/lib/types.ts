/*
  Snapshot format, version 1. The JSON Schema in schema/snapshot.schema.json
  documents the same shape; keep both in sync.

  Every metric row is one calendar day (account time zone) so any date range and
  any day / week / month grouping can be computed from it. Rows hold aggregate
  counts only: no user-level data, click ids, IPs, or form answers.
*/

export type SourceState = 'ok' | 'not_configured' | 'error'

export interface SourceStatus {
  state: SourceState
  /** Short human-readable message, e.g. which env var is missing or the API error. */
  message?: string
  /** ISO timestamp of the last successful pull for this source. */
  lastSuccessAt?: string
}

export interface DateRange {
  /** Inclusive, YYYY-MM-DD */
  start: string
  /** Inclusive, YYYY-MM-DD */
  end: string
}

/** Base metrics that every Google Ads daily row carries. cost is in account currency units. */
export interface AdsMetrics {
  impressions: number
  clicks: number
  cost: number
  /** Primary (biddable) conversions, the "Conversions" column in Google Ads. */
  conversions: number
  /** All conversions including secondary actions. */
  allConversions: number
}

export interface AdsDailyRow extends AdsMetrics {
  date: string
}

export interface AccountDailyRow extends AdsDailyRow {
  /** Calls from call assets (metrics.phone_calls). */
  phoneCalls: number
}

export interface CampaignDailyRow extends AccountDailyRow {
  campaignId: string
}

export interface AdGroupDailyRow extends AdsDailyRow {
  campaignId: string
  adGroupId: string
}

export interface AdDailyRow extends AdsDailyRow {
  adGroupId: string
  adId: string
}

export interface KeywordDailyRow extends AdsDailyRow {
  adGroupId: string
  criterionId: string
  /**
   * Impressions divided by search impression share for that day, so share can be
   * re-computed for any range as sum(impressions) / sum(eligibleImpressions).
   * Omitted when Google did not report a share.
   */
  eligibleImpressions?: number
}

export interface SearchTermDailyRow extends AdsDailyRow {
  searchTerm: string
  /** Match source or match type as reported by Google, e.g. EXACT, PHRASE, AI_MAX. */
  matchSource: string
  campaignId: string
  adGroupId: string
}

export interface AdsLandingPageDailyRow extends AdsDailyRow {
  /** Path only. Query strings are stripped before storage. */
  path: string
}

export interface ConversionDailyRow {
  date: string
  conversionActionId: string
  /** Counted in the Conversions column (primary actions only). */
  conversions: number
  /** Counted in All conversions (primary and secondary). */
  allConversions: number
}

export interface AssetDailyRow {
  date: string
  assetId: string
  /** Which link these metrics belong to. The same asset on two campaigns is two rows. */
  level: 'customer' | 'campaign' | 'ad_group'
  campaignId?: string
  adGroupId?: string
  impressions: number
  clicks: number
  cost: number
}

export interface CampaignMeta {
  id: string
  name: string
  status: string
  /** Google enum, e.g. TARGET_SPEND (Maximize clicks), MAXIMIZE_CONVERSIONS. */
  biddingStrategyType: string
  /** Max CPC cap for Maximize clicks, if set. */
  maxCpcCap?: number
  dailyBudget?: number
  channelType?: string
}

export interface AdGroupMeta {
  id: string
  campaignId: string
  name: string
  status: string
  defaultCpcBid?: number
}

export interface AdMeta {
  id: string
  adGroupId: string
  campaignId: string
  status: string
  type: string
  headlines: string[]
  descriptions: string[]
  /** Paths only, no query strings. */
  finalUrls: string[]
  path1?: string
  path2?: string
}

export interface KeywordMeta {
  criterionId: string
  adGroupId: string
  campaignId: string
  text: string
  matchType: string
  status: string
  /** The keyword's own CPC bid. Omitted when it inherits the ad group bid. */
  cpcBid?: number
}

export interface AssetMeta {
  id: string
  type: 'SITELINK' | 'CALL' | string
  /** Where it is linked: account, campaign or ad group. */
  level: 'customer' | 'campaign' | 'ad_group'
  campaignId?: string
  adGroupId?: string
  status?: string
  linkText?: string
  description1?: string
  description2?: string
  /** Business phone number shown in the call asset (clinic line, not a patient number). */
  phoneNumber?: string
  finalUrls?: string[]
  /** Callout text. Callouts have no URL. */
  calloutText?: string
  snippetHeader?: string
  snippetValues?: string[]
}

export interface ConversionActionMeta {
  id: string
  name: string
  category: string
  status: string
  /** Primary actions count toward Conversions and bidding. */
  primary: boolean
  origin?: string
}

export interface AdsData {
  customerId: string
  accountName?: string
  currency: string
  timeZone: string
  campaigns: CampaignMeta[]
  adGroups: AdGroupMeta[]
  ads: AdMeta[]
  keywords: KeywordMeta[]
  assets: AssetMeta[]
  conversionActions: ConversionActionMeta[]
  daily: {
    account: AccountDailyRow[]
    campaigns: CampaignDailyRow[]
    adGroups: AdGroupDailyRow[]
    ads: AdDailyRow[]
    keywords: KeywordDailyRow[]
    searchTerms: SearchTermDailyRow[]
    landingPages: AdsLandingPageDailyRow[]
    conversions: ConversionDailyRow[]
    assets: AssetDailyRow[]
  }
}

export interface Ga4TotalsDailyRow {
  date: string
  /** GA4 sessionDefaultChannelGroup, e.g. "Paid Search", "Organic Search". */
  channel: string
  sessions: number
  engagedSessions: number
  keyEvents: number
}

export interface Ga4LandingPageDailyRow extends Ga4TotalsDailyRow {
  /** Path only, no query string. */
  path: string
}

export interface Ga4EventDailyRow {
  date: string
  channel: string
  eventName: string
  eventCount: number
}

export interface Ga4Data {
  propertyId: string
  daily: {
    totals: Ga4TotalsDailyRow[]
    landingPages: Ga4LandingPageDailyRow[]
    events: Ga4EventDailyRow[]
  }
}

export interface Snapshot {
  schemaVersion: 1
  generatedAt: string
  /** True only for the bundled fixture. The UI shows an "Example data" banner. */
  isExample: boolean
  /** Days covered by the daily rows. */
  range: DateRange
  sources: {
    ads: SourceStatus
    ga4: SourceStatus
  }
  ads: AdsData | null
  ga4: Ga4Data | null
}

export interface OfflineEntry {
  date: string
  phoneLeads: number
  bookedPatients: number
  /** Free text, no patient info. Max 280 characters. */
  note?: string
  updatedAt: string
}

export interface OfflineLeads {
  schemaVersion: 1
  entries: OfflineEntry[]
}
