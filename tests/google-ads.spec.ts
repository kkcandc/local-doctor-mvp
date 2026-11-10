import { expect, test } from '@playwright/test'
import { calendlyEmbedHeightPx, calendlyEmbedUrl } from '../src/calendlyUrl'
import {
  adsPageLocation,
  conversionSendTo,
  DEFAULT_GOOGLE_ADS_LEAD_LABEL,
  DEFAULT_GOOGLE_ADS_PHONE_LABEL,
  googleAdsTagHtml,
  isTrackedClinicPhone,
  hrefWithAdsParams,
  keptAdsSearchParams,
  pathWithAdsParams,
  resolveGoogleAdsId,
  resolveGoogleAdsLeadLabel,
  resolveGoogleAdsPhoneLabel,
  safePagePath,
  spaPageViewCall,
} from '../src/analytics/googleAdsConfig'

const adsId = 'AW-18413556843'

test('production builds default to the Local Doctor Google Ads id', () => {
  expect(resolveGoogleAdsId(undefined, true)).toBe(adsId)
  expect(resolveGoogleAdsId('  ', true)).toBe(adsId)
  expect(resolveGoogleAdsId('AW-123456', true)).toBe('AW-123456')
  expect(resolveGoogleAdsId('off', true)).toBeNull()
  expect(resolveGoogleAdsId('G-ABCDEF', true)).toBeNull()
  expect(resolveGoogleAdsId(undefined, false)).toBeNull()
})

test('production builds default to the verified lead and phone conversion labels', () => {
  expect(DEFAULT_GOOGLE_ADS_LEAD_LABEL).toBe('KA47CJbG9LAdEOuoosxE')
  expect(DEFAULT_GOOGLE_ADS_PHONE_LABEL).toBe('gJr-CJnG9LAdEOuoosxE')
  expect(resolveGoogleAdsLeadLabel(undefined, true)).toBe(DEFAULT_GOOGLE_ADS_LEAD_LABEL)
  expect(resolveGoogleAdsPhoneLabel(undefined, true)).toBe(DEFAULT_GOOGLE_ADS_PHONE_LABEL)
  expect(resolveGoogleAdsLeadLabel('off', true)).toBeNull()
  expect(resolveGoogleAdsPhoneLabel(undefined, false)).toBeNull()
  expect(conversionSendTo(adsId, DEFAULT_GOOGLE_ADS_LEAD_LABEL)).toBe(`${adsId}/${DEFAULT_GOOGLE_ADS_LEAD_LABEL}`)
  expect(conversionSendTo(adsId, DEFAULT_GOOGLE_ADS_PHONE_LABEL)).toBe(`${adsId}/${DEFAULT_GOOGLE_ADS_PHONE_LABEL}`)
})

test('SPA paths keep gclid and utm params and drop contact details', () => {
  expect(keptAdsSearchParams('?gclid=abc&email=jane@example.com&utm_source=google')).toBe('gclid=abc&utm_source=google')
  expect(pathWithAdsParams('/get-started', '?gclid=abc&phone=2403765730')).toBe('/get-started?gclid=abc')
  expect(hrefWithAdsParams('https://localdoctor.typeform.com/evaluation', '')).toBe('https://localdoctor.typeform.com/evaluation')
  expect(hrefWithAdsParams('https://localdoctor.typeform.com/evaluation', '?gclid=TEST123&utm_source=google&utm_medium=cpc&utm_campaign=test&email=jane@example.com&phone=2403765730')).toBe(
    'https://localdoctor.typeform.com/evaluation?gclid=TEST123&utm_source=google&utm_medium=cpc&utm_campaign=test',
  )
  expect(hrefWithAdsParams('https://localdoctor.typeform.com/evaluation?utm_source=newsletter', '?utm_source=google&gclid=TEST123')).toBe(
    'https://localdoctor.typeform.com/evaluation?utm_source=newsletter&gclid=TEST123',
  )
})

test('Calendly embed URL hides the cookie banner and records the click id without contact details', () => {
  const bare = new URL(calendlyEmbedUrl(''))
  expect(bare.origin + bare.pathname).toBe('https://calendly.com/local-doctor/virtualvisit')
  expect(bare.searchParams.get('hide_event_type_details')).toBe('1')
  expect(bare.searchParams.get('hide_gdpr_banner')).toBe('1')
  expect(bare.searchParams.get('primary_color')).toBe('2970d6')
  expect(bare.searchParams.get('gclid')).toBeNull()
  expect(bare.searchParams.get('salesforce_uuid')).toBeNull()

  const search = '?gclid=TEST123&gbraid=GB1&wbraid=WB1&utm_source=google&utm_medium=cpc&utm_campaign=test&utm_term=memory&utm_content=ad1&utm_id=id9&email=jane@example.com&phone=2403765730&diagnosis=alzheimers'
  const url = new URL(calendlyEmbedUrl(search))
  expect(url.searchParams.get('utm_source')).toBe('google')
  expect(url.searchParams.get('utm_medium')).toBe('cpc')
  expect(url.searchParams.get('utm_campaign')).toBe('test')
  expect(url.searchParams.get('utm_term')).toBe('memory')
  expect(url.searchParams.get('utm_content')).toBe('ad1')
  expect(url.searchParams.get('utm_id')).toBe('id9')
  expect(url.searchParams.get('gclid')).toBe('TEST123')
  expect(url.searchParams.get('gbraid')).toBe('GB1')
  expect(url.searchParams.get('wbraid')).toBe('WB1')
  // salesforce_uuid is the field Calendly stores. utm_content stays the creative, not the click id.
  expect(url.searchParams.get('salesforce_uuid')).toBe('gclid:TEST123|gbraid:GB1|wbraid:WB1')
  expect(url.search).not.toContain('jane')
  expect(url.search).not.toContain('2403765730')
  expect(url.search).not.toContain('alzheimers')
  expect(url.search).not.toContain('@')

  const gbraidOnly = new URL(calendlyEmbedUrl('?gbraid=GBONLY'))
  expect(gbraidOnly.searchParams.get('salesforce_uuid')).toBe('gbraid:GBONLY')
  expect(gbraidOnly.searchParams.get('gclid')).toBeNull()

  expect(calendlyEmbedHeightPx('602px')).toBe(602)
  expect(calendlyEmbedHeightPx('662px')).toBe(662)
  expect(calendlyEmbedHeightPx(640)).toBe(640)
  expect(calendlyEmbedHeightPx('2px')).toBeNull()
  expect(calendlyEmbedHeightPx('26px')).toBeNull()
  expect(calendlyEmbedHeightPx('9000px')).toBeNull()
  expect(calendlyEmbedHeightPx('602')).toBeNull()
  expect(calendlyEmbedHeightPx(null)).toBeNull()
})

test('the tag snippet configures only the ads id', () => {
  const html = googleAdsTagHtml(adsId)
  expect(html).toContain(`https://www.googletagmanager.com/gtag/js?id=${adsId}`)
  expect(html).toContain(`gtag('config', '${adsId}', { page_location: pageLocation })`)
  expect(html).toContain('gclid:1')
  expect(html).toContain('page_location: pageLocation')
  expect(html).not.toContain('user_data')
})

test('the first page hit keeps ad click ids and drops contact details', () => {
  expect(adsPageLocation('https://trylocaldoctor.com/get-started?email=jane@example.com&phone=2403765730&gclid=abc123&utm_source=google')).toBe(
    'https://trylocaldoctor.com/get-started?gclid=abc123&utm_source=google',
  )
  expect(adsPageLocation('https://trylocaldoctor.com/?diagnosis=alzheimers#notes')).toBe('https://trylocaldoctor.com/')
})

test('phone tracking is limited to the clinic numbers', () => {
  expect(isTrackedClinicPhone('tel:+12403765730')).toBe(true)
  expect(isTrackedClinicPhone('tel:+1-240-376-5730')).toBe(true)
  expect(isTrackedClinicPhone('tel:2403765730')).toBe(true)
  expect(isTrackedClinicPhone('tel:+18445091404')).toBe(true)
  expect(isTrackedClinicPhone('tel:+18003681019')).toBe(false)
  expect(isTrackedClinicPhone('tel:+18005377697')).toBe(false)
  expect(isTrackedClinicPhone('tel:+18009853059')).toBe(false)
  expect(isTrackedClinicPhone('mailto:hello@trylocaldoctor.com')).toBe(false)
})

test('spa page views skip the first load and drop query strings', () => {
  expect(spaPageViewCall(adsId, '/?gclid=abc&email=jane@example.com', null)).toEqual({
    nextPath: '/',
    call: null,
  })
  expect(spaPageViewCall(adsId, '/get-started?email=jane@example.com', '/')).toEqual({
    nextPath: '/get-started',
    call: ['event', 'page_view', { send_to: adsId, page_path: '/get-started' }],
  })
  expect(safePagePath('https://trylocaldoctor.com/get-started')).toBe('/')
  expect(safePagePath('/blog/leqembi-infusion')).toBe('/blog/leqembi-infusion')
})
