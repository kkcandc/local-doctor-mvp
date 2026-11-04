import { expect, test } from '@playwright/test'
import { googleAdsTagHtml, googleTagHtml, spaPageViewCall } from '../src/analytics/googleAdsConfig'
import { DEFAULT_GA_MEASUREMENT_ID, resolveGaMeasurementId } from '../src/analytics/googleAnalyticsConfig'
import { gaPageLocation, gaSpaPageViewCall } from '../src/analytics/googleAnalytics'

const adsId = 'AW-18413556843'
const gaId = 'G-0NF3ZM8GFF'

test('production builds default to the Local Doctor GA4 measurement id', () => {
  expect(DEFAULT_GA_MEASUREMENT_ID).toBe(gaId)
  expect(resolveGaMeasurementId(undefined, true)).toBe(gaId)
  expect(resolveGaMeasurementId('  ', true)).toBe(gaId)
  expect(resolveGaMeasurementId(`  ${gaId}  `, false)).toBe(gaId)
  expect(resolveGaMeasurementId('G-TEST123456', true)).toBe('G-TEST123456')
  expect(resolveGaMeasurementId('off', true)).toBeNull()
  expect(resolveGaMeasurementId('false', true)).toBeNull()
  expect(resolveGaMeasurementId('0', true)).toBeNull()
  expect(resolveGaMeasurementId('AW-18413556843', true)).toBeNull()
  expect(resolveGaMeasurementId('g-0nf3zm8gff', true)).toBeNull()
  expect(resolveGaMeasurementId('G-ABC', true)).toBeNull()
  expect(resolveGaMeasurementId(undefined, false)).toBeNull()
})

test('the shared snippet configs Ads and GA4 from one gtag.js load', () => {
  const html = googleTagHtml(adsId, gaId)
  expect(html).toBeTruthy()
  const snippet = html ?? ''
  const scriptLoads = snippet.match(/googletagmanager\.com\/gtag\/js/g) ?? []

  expect(scriptLoads).toHaveLength(1)
  expect(snippet).toContain(`https://www.googletagmanager.com/gtag/js?id=${adsId}`)
  expect(snippet).toContain(`data-ga-measurement-id="${gaId}"`)
  expect(snippet).toContain(`gtag('config', '${adsId}', { page_location: pageLocation })`)
  expect(snippet).toContain(`gtag('config', '${gaId}', { page_location: pageLocation })`)
  expect(snippet.indexOf("value.indexOf('@')")).toBeLessThan(snippet.indexOf(`gtag('config', '${adsId}'`))
  expect(snippet.indexOf(`gtag('config', '${adsId}'`)).toBeLessThan(snippet.indexOf(`gtag('config', '${gaId}'`))
  expect(snippet).toContain('gclid:1')
  expect(snippet).not.toContain('user_data')
  expect(snippet).not.toContain('form_start')
  expect(snippet).not.toContain('form_submit')
  expect(snippet).not.toContain('generate_lead')
})

test('GA4 can be omitted without changing the Ads snippet', () => {
  expect(googleTagHtml(adsId, null)).toBe(googleAdsTagHtml(adsId))
  expect(googleAdsTagHtml(adsId)).not.toContain(gaId)
  expect(googleAdsTagHtml(adsId)).not.toContain('data-ga-measurement-id')
  expect(googleTagHtml(null, null)).toBeNull()
})

test('GA4-only builds still sanitize page_location and do not invent an Ads id', () => {
  const html = googleTagHtml(null, gaId) ?? ''
  expect(html).toContain(`https://www.googletagmanager.com/gtag/js?id=${gaId}`)
  expect(html).toContain(`gtag('config', '${gaId}', { page_location: pageLocation })`)
  expect(html).not.toContain(adsId)
  expect(html).toContain("value.indexOf('@')")
})

test('GA page_location keeps ad click ids and drops contact and health details', () => {
  const href = [
    'https://trylocaldoctor.com/get-started',
    '?email=jane@example.com',
    '&phone=2403765730',
    '&name=Jane%20Doe',
    '&dob=1940-01-01',
    '&diagnosis=alzheimers',
    '&responseId=resp_123',
    '&gclid=abc123',
    '&gclid=jane@example.com',
    '&utm_source=google',
    '&utm_medium=cpc',
    '#notes',
  ].join('')

  expect(gaPageLocation(href)).toBe(
    'https://trylocaldoctor.com/get-started?gclid=abc123&utm_source=google&utm_medium=cpc',
  )
  expect(gaPageLocation('https://trylocaldoctor.com/get-started?email=jane@example.com')).not.toContain('jane')
  expect(gaPageLocation('https://trylocaldoctor.com/get-started?email=jane@example.com')).not.toContain('@')
  expect(gaPageLocation('https://trylocaldoctor.com/?phone=2403765730&dob=1940-01-01')).toBe('https://trylocaldoctor.com/')
})

test('spa page views skip the first load and send page_path only', () => {
  const landing = '/get-started?email=jane@example.com&phone=2403765730&diagnosis=alzheimers'
  expect(gaSpaPageViewCall(gaId, landing, null)).toEqual({
    nextPath: '/get-started',
    call: null,
  })

  const next = gaSpaPageViewCall(gaId, '/faq?dob=1940-01-01', '/get-started')
  expect(next).toEqual({
    nextPath: '/faq',
    call: ['event', 'page_view', { send_to: gaId, page_path: '/faq' }],
  })
  expect(next).toEqual(spaPageViewCall(gaId, '/faq?dob=1940-01-01', '/get-started'))

  const json = JSON.stringify(next)
  expect(json).not.toContain('jane')
  expect(json).not.toContain('240')
  expect(json).not.toContain('1940')
  expect(json).not.toContain('alzheimer')
  expect(json).not.toContain('page_location')
  expect(json).not.toContain('user_data')
})
