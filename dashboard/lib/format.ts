const dash = '-'

export function fmtInt(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return dash
  return Math.round(n).toLocaleString('en-US')
}

/** Conversions can be fractional (data-driven attribution). Show one decimal only when needed. */
export function fmtCount(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return dash
  const rounded = Math.round(n * 10) / 10
  return rounded.toLocaleString('en-US', { maximumFractionDigits: Number.isInteger(rounded) ? 0 : 1 })
}

export function fmtMoney(n: number | null | undefined, currency = 'USD', decimals?: number): string {
  if (n == null || Number.isNaN(n)) return dash
  const d = decimals ?? (Math.abs(n) >= 1000 ? 0 : 2)
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  })
}

export function fmtPct(n: number | null | undefined, decimals = 1): string {
  if (n == null || Number.isNaN(n)) return dash
  return `${(n * 100).toFixed(decimals)}%`
}

export function fmtDelta(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return ''
  const sign = n > 0 ? '+' : ''
  return `${sign}${(n * 100).toFixed(0)}%`
}

export function compact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return `${Math.round(n * 10) / 10}`
}

const ENUM_LABELS: Record<string, string> = {
  TARGET_SPEND: 'Maximize clicks',
  MAXIMIZE_CONVERSIONS: 'Maximize conversions',
  MAXIMIZE_CONVERSION_VALUE: 'Maximize conversion value',
  TARGET_CPA: 'Target CPA',
  TARGET_ROAS: 'Target ROAS',
  MANUAL_CPC: 'Manual CPC',
  ENHANCED_CPC: 'Enhanced CPC',
  TARGET_IMPRESSION_SHARE: 'Target impression share',
  ENABLED: 'Enabled',
  PAUSED: 'Paused',
  REMOVED: 'Removed',
  EXACT: 'Exact',
  PHRASE: 'Phrase',
  BROAD: 'Broad',
  NEAR_EXACT: 'Exact (close variant)',
  NEAR_PHRASE: 'Phrase (close variant)',
  AI_MAX: 'AI Max',
  AI_MAX_KEYWORDLESS: 'AI Max (keywordless)',
  AI_MAX_BROAD_MATCH: 'AI Max (broad match)',
  ADVERTISER_PROVIDED_KEYWORD: 'Keyword',
  PERFORMANCE_MAX: 'Performance Max',
  DYNAMIC_SEARCH_ADS: 'Dynamic search ads',
  RESPONSIVE_SEARCH_AD: 'Responsive search ad',
  SITELINK: 'Sitelink',
  CALL: 'Call',
  SEARCH: 'Search',
  UNKNOWN: 'Unknown',
  UNSPECIFIED: 'Unspecified',
}

/** Turns Google API enums like MAXIMIZE_CONVERSIONS into readable labels. */
export function enumLabel(value: string | undefined): string {
  if (!value) return dash
  if (ENUM_LABELS[value]) return ENUM_LABELS[value]
  const words = value.toLowerCase().split('_').join(' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}
