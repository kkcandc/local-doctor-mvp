import { expect, test } from '@playwright/test'
import {
  adsPageLocation,
  conversionSendTo,
  googleAdsTagHtml,
  isTrackedClinicPhone,
  isTypeformSubmitMessage,
  leadTrackingCalls,
  phoneTrackingCalls,
  resolveGoogleAdsId,
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

test('lead and phone events keep page path and event name only', () => {
  const lead = leadTrackingCalls(adsId, 'leadLabel1', '/get-started?email=jane@example.com&phone=2403765730#notes')
  const phone = phoneTrackingCalls(adsId, undefined, '/get-started')
  const json = JSON.stringify({ lead, phone })

  expect(lead[0]).toEqual(['event', 'generate_lead', { page_path: '/get-started' }])
  expect(lead[1]).toEqual(['event', 'conversion', { send_to: `${adsId}/leadLabel1` }])
  expect(phone).toEqual([['event', 'phone_click', { page_path: '/get-started' }]])
  expect(json).not.toContain('jane')
  expect(json).not.toContain('example.com')
  expect(json).not.toContain('240')
  expect(json).not.toContain('response')
  expect(conversionSendTo(adsId, 'bad label')).toBeNull()
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

test('typeform submit detection ignores form answers and foreign origins', () => {
  const payload = {
    type: 'form-submit',
    formId: '01M64J1XGXT19BH7GGWPKJ243K',
    responseId: 'resp_123',
    answers: { email: 'jane@example.com', phone: '2403765730', diagnosis: 'alzheimer' },
  }
  expect(isTypeformSubmitMessage('https://form.typeform.com', payload)).toBe(true)
  expect(isTypeformSubmitMessage('https://embed.typeform.com', 'form-submit')).toBe(true)
  expect(isTypeformSubmitMessage('https://form.typeform.com', { type: 'form-ready' })).toBe(false)
  expect(isTypeformSubmitMessage('https://evil.example', payload)).toBe(false)
  expect(isTypeformSubmitMessage('https://form.typeform.com.evil.com', payload)).toBe(false)
  expect(isTypeformSubmitMessage('http://form.typeform.com', payload)).toBe(false)

  const calls = leadTrackingCalls(adsId, undefined, '/get-started')
  expect(JSON.stringify(calls)).not.toContain('resp_123')
  expect(JSON.stringify(calls)).not.toContain('jane@example.com')
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
