import { isLpVariant, type LpVariant } from './lpLetters'

/*
  Site-side split for the Google Ads Evaluation campaigns. Pure functions with no DOM or
  platform imports: middleware.ts (Vercel Routing Middleware) calls decideSplit on each request
  to a split path, and the Playwright specs test the same function.

  Who is in the test
  - Only requests to the Evaluation campaigns' final URLs (LP_SPLIT_PATHS). Checked with a
    read-only GAQL query on 2026-11-24: MD 24437868716 and VA 24533466183 send ads to
    /dementia-evaluation, /alzheimers-evaluation, /memory-evaluation, and
    /alzheimers-second-opinion. The second-opinion ad groups are left out: different intent,
    and about 1 click in 14 days.
  - Only ad clicks. The account uses auto-tagging and has no tracking template or final URL
    suffix, so the signal is a Google click id (gclid, gbraid, or wbraid). If a utm_campaign is
    ever added, it must name an Evaluation campaign id or the request is left alone.
  - Never crawlers (Googlebot, AdsBot, and the like), so organic search and the canonical
    /dementia-evaluation page are unaffected.
  - A visitor already assigned (cookie ld_lp) keeps the same version on a split path.

  Assignment: random, weighted 34/33/33 for a/b/c, stored in a first-party cookie for 30 days.
  The cookie holds one letter and nothing else.

  QA override: ?lp=a, ?lp=b, or ?lp=c on a split path serves that version for that request,
  for anyone, without changing the cookie. ?lp=original serves the normal page and clears the
  cookie.
*/

export const LP_SPLIT_PATHS = ['/dementia-evaluation', '/alzheimers-evaluation', '/memory-evaluation'] as const

export const EVALUATION_CAMPAIGN_IDS = ['24437868716', '24533466183'] as const

export const LP_COOKIE = 'ld_lp'
export const LP_COOKIE_MAX_AGE_S = 30 * 24 * 60 * 60
export const LP_QUERY_PARAM = 'lp'
export const LP_ORIGINAL_VALUES = ['original', 'off', 'none'] as const

export const LP_WEIGHTS: ReadonlyArray<readonly [LpVariant, number]> = [
  ['a', 34],
  ['b', 33],
  ['c', 33],
]

const CLICK_ID_PARAMS = ['gclid', 'gbraid', 'wbraid'] as const

const BOT_UA = /bot\/|bot-|googlebot|bingbot|adsbot|applebot|duckduckbot|crawler|spider|slurp|mediapartners|google-inspectiontool|googleother|lighthouse|facebookexternalhit/i

export type SplitReason =
  | 'not_split_path'
  | 'override'
  | 'original_override'
  | 'bot'
  | 'other_campaign'
  | 'cookie'
  | 'not_ad_traffic'
  | 'assigned'

export type SplitDecision = {
  variant: LpVariant | null
  reason: SplitReason
  // Write ld_lp with this letter.
  setCookie?: LpVariant
  // Expire ld_lp.
  clearCookie?: boolean
}

export type SplitRequest = {
  pathname: string
  search: string
  cookieHeader?: string | null
  userAgent?: string | null
  // 0 <= random < 1. Injected so tests are deterministic.
  random?: number
}

export function normalizeSplitPath(pathname: string): string {
  const trimmed = pathname.toLowerCase().replace(/\/+$/, '')
  return trimmed || '/'
}

export function isSplitPath(pathname: string): boolean {
  return (LP_SPLIT_PATHS as readonly string[]).includes(normalizeSplitPath(pathname))
}

export function readLpCookie(cookieHeader?: string | null): LpVariant | null {
  if (!cookieHeader) return null
  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name !== LP_COOKIE) continue
    const value = rest.join('=').trim()
    return isLpVariant(value) ? value : null
  }
  return null
}

export function isBotUserAgent(userAgent?: string | null): boolean {
  return Boolean(userAgent && BOT_UA.test(userAgent))
}

export function isEvaluationCampaign(utmCampaign: string): boolean {
  return EVALUATION_CAMPAIGN_IDS.some((id) => utmCampaign.includes(id))
}

export function hasClickId(params: URLSearchParams): boolean {
  return CLICK_ID_PARAMS.some((key) => (params.get(key) ?? '').trim().length > 0)
}

// Maps a number in [0, 1) onto the weights. Always returns a variant.
export function pickVariant(random: number): LpVariant {
  const total = LP_WEIGHTS.reduce((sum, [, weight]) => sum + weight, 0)
  let point = Math.min(Math.max(random, 0), 0.999999) * total
  for (const [variant, weight] of LP_WEIGHTS) {
    if (point < weight) return variant
    point -= weight
  }
  return LP_WEIGHTS[LP_WEIGHTS.length - 1][0]
}

export function decideSplit({ pathname, search, cookieHeader, userAgent, random = Math.random() }: SplitRequest): SplitDecision {
  if (!isSplitPath(pathname)) return { variant: null, reason: 'not_split_path' }

  const params = new URLSearchParams(search)
  const override = (params.get(LP_QUERY_PARAM) ?? '').trim().toLowerCase()
  if (isLpVariant(override)) return { variant: override, reason: 'override' }
  if ((LP_ORIGINAL_VALUES as readonly string[]).includes(override)) {
    return { variant: null, reason: 'original_override', clearCookie: readLpCookie(cookieHeader) !== null }
  }

  if (isBotUserAgent(userAgent)) return { variant: null, reason: 'bot' }

  const utmCampaign = (params.get('utm_campaign') ?? '').trim()
  if (utmCampaign && !isEvaluationCampaign(utmCampaign)) return { variant: null, reason: 'other_campaign' }

  const assigned = readLpCookie(cookieHeader)
  if (assigned) return { variant: assigned, reason: 'cookie' }

  const fromEvaluationAd = utmCampaign ? isEvaluationCampaign(utmCampaign) : hasClickId(params)
  if (!fromEvaluationAd) return { variant: null, reason: 'not_ad_traffic' }

  const variant = pickVariant(random)
  return { variant, reason: 'assigned', setCookie: variant }
}

export function lpCookieHeader(variant: LpVariant): string {
  return `${LP_COOKIE}=${variant}; Path=/; Max-Age=${LP_COOKIE_MAX_AGE_S}; SameSite=Lax; Secure`
}

export function clearLpCookieHeader(): string {
  return `${LP_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax; Secure`
}
