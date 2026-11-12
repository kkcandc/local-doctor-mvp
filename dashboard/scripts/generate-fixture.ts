/*
  Generates fixtures/example-snapshot.json: EXAMPLE data only, made up with a
  seeded random generator so the UI renders without credentials. Nothing here
  comes from a real account. Run: npm run fixture
*/
import { writeFileSync } from 'node:fs'
import type {
  AccountDailyRow,
  AdDailyRow,
  AdGroupDailyRow,
  AdsLandingPageDailyRow,
  AssetDailyRow,
  AssetMeta,
  CampaignDailyRow,
  ConversionDailyRow,
  Ga4EventDailyRow,
  Ga4LandingPageDailyRow,
  Ga4TotalsDailyRow,
  KeywordDailyRow,
  SearchTermDailyRow,
  Snapshot,
} from '../lib/types.ts'

const END = '2026-11-11'
const DAYS = 100

let seed = 20261111
function rand() {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}
function poisson(mean: number) {
  if (mean <= 0) return 0
  const l = Math.exp(-Math.min(mean, 30))
  let k = 0
  let p = 1
  do {
    k++
    p *= rand()
  } while (p > l)
  return mean > 30 ? Math.round(mean + (rand() - 0.5) * Math.sqrt(mean) * 2) : k - 1
}
function binomial(n: number, p: number) {
  let k = 0
  for (let i = 0; i < n; i++) if (rand() < p) k++
  return k
}
const round2 = (n: number) => Math.round(n * 100) / 100

function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
const START = addDays(END, -(DAYS - 1))
const dates = Array.from({ length: DAYS }, (_, i) => addDays(START, i))

const campaigns = [
  { id: '101', name: '[Example] Memory Evaluation - Search', status: 'ENABLED', biddingStrategyType: 'TARGET_SPEND', maxCpcCap: 6, dailyBudget: 50, channelType: 'SEARCH' },
  { id: '102', name: "[Example] Alzheimer's Doctor Maryland - Search", status: 'ENABLED', biddingStrategyType: 'TARGET_SPEND', maxCpcCap: 5, dailyBudget: 30, channelType: 'SEARCH' },
  { id: '103', name: '[Example] Brand - Local Doctor', status: 'PAUSED', biddingStrategyType: 'MANUAL_CPC', dailyBudget: 10, channelType: 'SEARCH' },
]
const brandPausedFrom = addDays(START, 60)

const adGroups = [
  { id: '201', campaignId: '101', name: 'Dementia evaluation', status: 'ENABLED', path: '/dementia-evaluation' },
  { id: '202', campaignId: '101', name: 'Memory evaluation', status: 'ENABLED', path: '/memory-evaluation' },
  { id: '203', campaignId: '102', name: "Alzheimer's doctor", status: 'ENABLED', path: '/alzheimers-doctor-maryland' },
  { id: '204', campaignId: '102', name: 'Memory specialist', status: 'ENABLED', path: '/memory-specialist-maryland' },
  { id: '205', campaignId: '103', name: 'Brand', status: 'ENABLED', path: '/', defaultCpcBid: 1.5 },
]

const ads = [
  {
    id: '301', adGroupId: '201', campaignId: '101',
    headlines: ['Dementia Evaluation Online', 'Talk to a Neurologist', 'Virtual Visits in Maryland', 'Start Your Evaluation', 'Local Doctor', 'Book a Video Visit'],
    descriptions: ['Start an online memory evaluation from home, then meet a neurologist by video.', 'Simple online form. Our team calls to review history and insurance.'],
    path1: 'dementia', path2: 'evaluation',
  },
  {
    id: '302', adGroupId: '202', campaignId: '101',
    headlines: ['Memory Concerns? Start Here', 'Online Memory Evaluation', 'Virtual Neurology Visits', 'For Patients and Caregivers', 'Local Doctor'],
    descriptions: ['A clear first step for memory concerns. Start online in a few minutes.', 'Video visits with a neurologist. Serving Maryland.'],
    path1: 'memory', path2: 'evaluation',
  },
  {
    id: '303', adGroupId: '203', campaignId: '102',
    headlines: ["Alzheimer's Doctor in Maryland", 'Neurologist Video Visits', 'Book a Visit Online', 'Local Doctor', 'Serving Maryland Families'],
    descriptions: ["See a neurologist about Alzheimer's concerns by video from home.", 'Book online or call. Our team helps with insurance questions.'],
    path1: 'alzheimers', path2: 'doctor',
  },
  {
    id: '304', adGroupId: '204', campaignId: '102',
    headlines: ['Memory Specialist Maryland', 'Virtual Memory Care Visits', 'Talk to a Neurologist', 'Local Doctor'],
    descriptions: ['Meet a memory specialist by video. Start online today.', 'Serving Maryland. Book online or call the clinic.'],
    path1: 'memory', path2: 'specialist',
  },
  {
    id: '305', adGroupId: '205', campaignId: '103',
    headlines: ['Local Doctor', 'Official Site', 'Virtual Neurology Visits'],
    descriptions: ['Local Doctor offers virtual neurology visits in Maryland.', 'Book online or call.'],
    path1: '', path2: '',
  },
]

type Kw = { criterionId: string; adGroupId: string; text: string; matchType: string; cpcBid?: number; impr: number; ctr: number; cpc: number; share: number; terms: [string, string][] }
const keywords: Kw[] = [
  { criterionId: '401', adGroupId: '201', text: 'dementia evaluation', matchType: 'PHRASE', impr: 22, ctr: 0.07, cpc: 4.2, share: 0.42, terms: [['dementia evaluation', 'EXACT'], ['dementia evaluation near me', 'PHRASE'], ['online dementia evaluation', 'PHRASE']] },
  { criterionId: '402', adGroupId: '201', text: 'dementia test online', matchType: 'EXACT', impr: 18, ctr: 0.05, cpc: 3.1, share: 0.55, terms: [['dementia test online', 'EXACT'], ['online dementia test', 'NEAR_EXACT']] },
  { criterionId: '403', adGroupId: '201', text: 'dementia assessment', matchType: 'BROAD', impr: 30, ctr: 0.03, cpc: 3.6, share: 0.18, terms: [['dementia assessment', 'BROAD'], ['cognitive assessment for elderly', 'BROAD'], ['memory loss test', 'BROAD']] },
  { criterionId: '404', adGroupId: '202', text: 'memory evaluation', matchType: 'PHRASE', impr: 16, ctr: 0.065, cpc: 3.9, share: 0.38, terms: [['memory evaluation', 'EXACT'], ['memory evaluation near me', 'PHRASE']] },
  { criterionId: '405', adGroupId: '202', text: 'memory test for seniors', matchType: 'BROAD', impr: 20, ctr: 0.035, cpc: 2.8, share: 0.22, terms: [['memory test for seniors', 'BROAD'], ['memory screening', 'BROAD'], ['short term memory test', 'BROAD']] },
  { criterionId: '406', adGroupId: '202', text: 'memory loss doctor', matchType: 'PHRASE', impr: 12, ctr: 0.06, cpc: 4.6, share: 0.33, terms: [['memory loss doctor', 'EXACT'], ['doctor for memory loss', 'NEAR_PHRASE']] },
  { criterionId: '407', adGroupId: '203', text: "alzheimer's doctor maryland", matchType: 'EXACT', impr: 9, ctr: 0.09, cpc: 4.8, share: 0.61, terms: [["alzheimer's doctor maryland", 'EXACT'], ['alzheimers doctor md', 'NEAR_EXACT']] },
  { criterionId: '408', adGroupId: '203', text: 'alzheimer specialist', matchType: 'PHRASE', impr: 14, ctr: 0.055, cpc: 4.4, share: 0.29, terms: [['alzheimer specialist near me', 'PHRASE'], ['alzheimer specialist baltimore', 'PHRASE']] },
  { criterionId: '409', adGroupId: '203', text: 'neurologist for alzheimers', matchType: 'BROAD', impr: 24, ctr: 0.03, cpc: 4.1, share: 0.15, terms: [['neurologist for alzheimers', 'BROAD'], ['best neurologist for memory', 'BROAD'], ['neurologist near me', 'BROAD']] },
  { criterionId: '410', adGroupId: '204', text: 'memory specialist maryland', matchType: 'EXACT', impr: 7, ctr: 0.08, cpc: 4.0, share: 0.58, terms: [['memory specialist maryland', 'EXACT']] },
  { criterionId: '411', adGroupId: '204', text: 'memory doctor near me', matchType: 'PHRASE', impr: 15, ctr: 0.05, cpc: 3.7, share: 0.31, terms: [['memory doctor near me', 'EXACT'], ['memory clinic near me', 'NEAR_PHRASE']] },
  { criterionId: '412', adGroupId: '204', text: 'geriatric memory clinic', matchType: 'BROAD', impr: 10, ctr: 0.03, cpc: 3.2, share: 0.2, terms: [['geriatric memory clinic', 'BROAD'], ['memory care clinic', 'BROAD']] },
  { criterionId: '413', adGroupId: '205', text: 'local doctor', matchType: 'EXACT', cpcBid: 1.5, impr: 6, ctr: 0.2, cpc: 0.9, share: 0.85, terms: [['local doctor', 'EXACT'], ['try local doctor', 'NEAR_EXACT']] },
  { criterionId: '414', adGroupId: '205', text: 'trylocaldoctor', matchType: 'PHRASE', cpcBid: 1.5, impr: 3, ctr: 0.3, cpc: 0.7, share: 0.9, terms: [['trylocaldoctor', 'EXACT'], ['trylocaldoctor.com', 'PHRASE']] },
]

const conversionActions = [
  { id: '501', name: 'Evaluation submitted', category: 'SUBMIT_LEAD_FORM', status: 'ENABLED', primary: true, p: 0.045 },
  { id: '502', name: 'Visit booked (Calendly)', category: 'BOOK_APPOINTMENT', status: 'ENABLED', primary: true, p: 0.018 },
  { id: '503', name: 'Phone click', category: 'PHONE_CALL_LEAD', status: 'ENABLED', primary: false, p: 0.04 },
  { id: '504', name: 'CTA click', category: 'ENGAGEMENT', status: 'ENABLED', primary: false, p: 0.3 },
  { id: '505', name: 'Evaluation started', category: 'BEGIN_CHECKOUT', status: 'ENABLED', primary: false, p: 0.09 },
  { id: '506', name: 'Engaged visit', category: 'ENGAGEMENT', status: 'ENABLED', primary: false, p: 0.4 },
  { id: '507', name: 'Calendly time selected', category: 'ENGAGEMENT', status: 'ENABLED', primary: false, p: 0.03 },
  { id: '508', name: 'Calls from ads', category: 'PHONE_CALL_LEAD', status: 'ENABLED', primary: false, p: 0 },
]

const assets = [
  { id: '601', type: 'SITELINK', level: 'customer', status: 'ENABLED', linkText: 'Start your evaluation', description1: 'Online form, a few minutes', description2: 'Then a video visit', finalUrls: ['/evaluation'] },
  { id: '602', type: 'SITELINK', level: 'customer', status: 'ENABLED', linkText: 'How it works', description1: 'Three simple steps', description2: 'From home, by video', finalUrls: ['/how-it-works'] },
  { id: '603', type: 'SITELINK', level: 'campaign', campaignId: '101', status: 'ENABLED', linkText: 'For caregivers', description1: 'Help a loved one start', description2: 'Guidance for families', finalUrls: ['/memory-evaluation'] },
  { id: '604', type: 'SITELINK', level: 'campaign', campaignId: '102', status: 'ENABLED', linkText: 'Book a visit', description1: 'See open visit times', description2: 'Video visits', finalUrls: ['/get-started'] },
  { id: '605', type: 'CALL', level: 'customer', status: 'ENABLED', phoneNumber: '(410) 555-0100' },
]

const account: AccountDailyRow[] = []
const campaignDaily: CampaignDailyRow[] = []
const adGroupDaily: AdGroupDailyRow[] = []
const adDaily: AdDailyRow[] = []
const keywordDaily: KeywordDailyRow[] = []
const searchTermDaily: SearchTermDailyRow[] = []
const landingDaily: AdsLandingPageDailyRow[] = []
const conversionDaily: ConversionDailyRow[] = []
const assetDaily: AssetDailyRow[] = []
const ga4Totals: Ga4TotalsDailyRow[] = []
const ga4Landing: Ga4LandingPageDailyRow[] = []
const ga4Events: Ga4EventDailyRow[] = []

const zero = () => ({ impressions: 0, clicks: 0, cost: 0, conversions: 0, allConversions: 0 })
type M = ReturnType<typeof zero>
const addTo = (a: M, b: M) => {
  a.impressions += b.impressions
  a.clicks += b.clicks
  a.cost += b.cost
  a.conversions += b.conversions
  a.allConversions += b.allConversions
}
const roundM = (m: M): M => ({ ...m, cost: round2(m.cost) })

dates.forEach((date, i) => {
  // Gentle growth over the period plus a weekday pattern.
  const dow = new Date(`${date}T00:00:00Z`).getUTCDay()
  const trend = 0.75 + (i / DAYS) * 0.6
  const weekday = dow === 0 || dow === 6 ? 0.7 : 1.05
  const actionCounts = new Map<string, { c: number; a: number }>()
  const agTotals = new Map<string, M>()

  for (const kw of keywords) {
    const ag = adGroups.find((g) => g.id === kw.adGroupId)!
    if (ag.campaignId === '103' && date >= brandPausedFrom) continue
    const impressions = poisson(kw.impr * trend * weekday)
    const clicks = binomial(impressions, kw.ctr)
    const cost = clicks * kw.cpc * (0.8 + rand() * 0.4)
    let conversions = 0
    let allConversions = 0
    for (const action of conversionActions) {
      const n = binomial(clicks, action.p)
      if (!n) continue
      const prev = actionCounts.get(action.id) ?? { c: 0, a: 0 }
      prev.a += n
      allConversions += n
      if (action.primary) {
        prev.c += n
        conversions += n
      }
      actionCounts.set(action.id, prev)
    }
    const m = { impressions, clicks, cost, conversions, allConversions }
    if (impressions > 0) {
      const share = Math.min(0.95, Math.max(0.0999, kw.share * (0.85 + rand() * 0.3)))
      keywordDaily.push({ date, adGroupId: kw.adGroupId, criterionId: kw.criterionId, ...roundM(m), eligibleImpressions: Math.round((impressions / share) * 10) / 10 })
      // Split the keyword's traffic across its search terms.
      let left = { ...m }
      kw.terms.forEach(([term, source], idx) => {
        const last = idx === kw.terms.length - 1
        const f = last ? 1 : 0.35 + rand() * 0.3
        const part = {
          impressions: last ? left.impressions : Math.round(left.impressions * f),
          clicks: last ? left.clicks : Math.min(left.clicks, Math.round(left.clicks * f)),
          cost: 0,
          conversions: last ? left.conversions : Math.min(left.conversions, Math.round(left.conversions * f)),
          allConversions: last ? left.allConversions : Math.min(left.allConversions, Math.round(left.allConversions * f)),
        }
        part.cost = left.clicks ? (left.cost * part.clicks) / left.clicks : 0
        left = {
          impressions: left.impressions - part.impressions,
          clicks: left.clicks - part.clicks,
          cost: left.cost - part.cost,
          conversions: left.conversions - part.conversions,
          allConversions: left.allConversions - part.allConversions,
        }
        if (part.impressions > 0) {
          searchTermDaily.push({ date, searchTerm: term, matchSource: source, campaignId: ag.campaignId, adGroupId: ag.id, ...roundM(part) })
        }
      })
    }
    const agm = agTotals.get(ag.id) ?? zero()
    addTo(agm, m)
    agTotals.set(ag.id, agm)
  }

  const campTotals = new Map<string, M & { phoneCalls: number }>()
  for (const ag of adGroups) {
    const m = agTotals.get(ag.id)
    if (!m) continue
    adGroupDaily.push({ date, campaignId: ag.campaignId, adGroupId: ag.id, ...roundM(m) })
    const ad = ads.find((a) => a.adGroupId === ag.id)!
    adDaily.push({ date, adGroupId: ag.id, adId: ad.id, ...roundM(m) })
    landingDaily.push({ date, path: ag.path, ...roundM(m) })
    const c = campTotals.get(ag.campaignId) ?? { ...zero(), phoneCalls: 0 }
    addTo(c, m)
    campTotals.set(ag.campaignId, c)
  }
  const acct = { ...zero(), phoneCalls: 0 }
  for (const [campaignId, m] of campTotals) {
    m.phoneCalls = campaignId === '103' ? 0 : poisson(0.35 * trend)
    acct.phoneCalls += m.phoneCalls
    campaignDaily.push({ date, campaignId, ...roundM(m), phoneCalls: m.phoneCalls })
    addTo(acct, m)
  }
  if (acct.phoneCalls) {
    actionCounts.set('508', { c: 0, a: acct.phoneCalls })
    acct.allConversions += acct.phoneCalls
  }
  account.push({ date, ...roundM(acct), phoneCalls: acct.phoneCalls })
  for (const [conversionActionId, v] of actionCounts) {
    conversionDaily.push({ date, conversionActionId, conversions: v.c, allConversions: v.a })
  }
  for (const a of assets) {
    const share = a.type === 'CALL' ? 0.5 : 0.18 + rand() * 0.1
    const impressions = Math.round(acct.impressions * share)
    const clicks = a.type === 'CALL' ? acct.phoneCalls : binomial(Math.round(acct.clicks * 0.4), 0.25)
    assetDaily.push({ date, assetId: a.id, impressions, clicks, cost: round2(clicks * (acct.clicks ? acct.cost / acct.clicks : 0)) })
  }

  // GA4: paid sessions track ad clicks, plus organic and direct traffic.
  const channels: { channel: string; sessions: number; pages: [string, number][] }[] = [
    { channel: 'Paid Search', sessions: Math.round(acct.clicks * (0.82 + rand() * 0.1)), pages: adGroups.filter((g) => agTotals.has(g.id)).map((g) => [g.path, agTotals.get(g.id)!.clicks + 0.01] as [string, number]) },
    { channel: 'Organic Search', sessions: poisson(14 * trend * weekday), pages: [['/', 3], ['/blog', 2], ['/alzheimers-blood-test', 2], ['/dementia-evaluation', 1], ['/faq', 1]] },
    { channel: 'Direct', sessions: poisson(6 * weekday), pages: [['/', 5], ['/get-started', 2], ['/evaluation', 1]] },
  ]
  for (const ch of channels) {
    if (!ch.sessions) continue
    const engagedSessions = binomial(ch.sessions, ch.channel === 'Paid Search' ? 0.58 : 0.5)
    const rates: Record<string, number> = {
      cta_click: 0.27, phone_tap: 0.035, engaged_visit: 0.36, calendly_viewed: 0.09, calendly_time_selected: 0.035,
      evaluation_started: 0.07, evaluation_submitted: 0.032, visit_booked: 0.013,
    }
    const counts: Record<string, number> = {}
    for (const [name, r] of Object.entries(rates)) counts[name] = binomial(ch.sessions, r)
    counts.phone_click = counts.phone_tap
    counts.generate_lead = counts.visit_booked
    counts.cta_click += binomial(ch.sessions, 0.08)
    const keyEvents = counts.evaluation_submitted + counts.visit_booked + counts.phone_tap
    ga4Totals.push({ date, channel: ch.channel, sessions: ch.sessions, engagedSessions, keyEvents })
    for (const [eventName, eventCount] of Object.entries(counts)) {
      if (eventCount) ga4Events.push({ date, channel: ch.channel, eventName, eventCount })
    }
    const weight = ch.pages.reduce((s, [, w]) => s + w, 0)
    let sLeft = ch.sessions
    let eLeft = engagedSessions
    let kLeft = keyEvents
    ch.pages.forEach(([path, w], idx) => {
      const last = idx === ch.pages.length - 1
      const s = last ? sLeft : Math.min(sLeft, Math.round((ch.sessions * w) / weight))
      const e = last ? eLeft : Math.min(eLeft, Math.round((engagedSessions * w) / weight))
      const k = last ? kLeft : Math.min(kLeft, Math.round((keyEvents * w) / weight))
      sLeft -= s
      eLeft -= e
      kLeft -= k
      if (s > 0) ga4Landing.push({ date, channel: ch.channel, path, sessions: s, engagedSessions: Math.min(e, s), keyEvents: k })
    })
  }
})

const snapshot: Snapshot & { _comment: string } = {
  _comment:
    'EXAMPLE DATA. Generated by scripts/generate-fixture.ts with a seeded random generator. Not from any real account. Shown with an "Example data" banner.',
  schemaVersion: 1,
  generatedAt: `${addDays(END, 1)}T06:00:00.000Z`,
  isExample: true,
  range: { start: START, end: END },
  sources: {
    ads: { state: 'ok', lastSuccessAt: `${addDays(END, 1)}T06:00:00.000Z` },
    ga4: { state: 'ok', lastSuccessAt: `${addDays(END, 1)}T06:00:00.000Z` },
  },
  ads: {
    customerId: '0000000000',
    accountName: 'Example account',
    currency: 'USD',
    timeZone: 'America/New_York',
    campaigns,
    adGroups: adGroups.map(({ path: _path, ...g }) => g),
    ads: ads.map((a) => ({
      ...a,
      status: a.adGroupId === '205' ? 'PAUSED' : 'ENABLED',
      type: 'RESPONSIVE_SEARCH_AD',
      finalUrls: [adGroups.find((g) => g.id === a.adGroupId)!.path],
      path1: a.path1 || undefined,
      path2: a.path2 || undefined,
    })),
    keywords: keywords.map((k) => ({
      criterionId: k.criterionId,
      adGroupId: k.adGroupId,
      campaignId: adGroups.find((g) => g.id === k.adGroupId)!.campaignId,
      text: k.text,
      matchType: k.matchType,
      status: 'ENABLED',
      cpcBid: k.cpcBid,
    })),
    assets: assets as AssetMeta[],
    conversionActions: conversionActions.map(({ p: _p, ...c }) => c),
    daily: {
      account,
      campaigns: campaignDaily,
      adGroups: adGroupDaily,
      ads: adDaily,
      keywords: keywordDaily,
      searchTerms: searchTermDaily,
      landingPages: landingDaily,
      conversions: conversionDaily,
      assets: assetDaily,
    },
  },
  ga4: {
    propertyId: '000000000',
    daily: { totals: ga4Totals, landingPages: ga4Landing, events: ga4Events },
  },
}

const out = new URL('../fixtures/example-snapshot.json', import.meta.url)
writeFileSync(out, JSON.stringify(snapshot))
console.log(`Wrote ${out.pathname} (${dates.length} days, ${(JSON.stringify(snapshot).length / 1024).toFixed(0)} KB)`)
