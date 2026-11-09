import { expect, test } from '@playwright/test'
import {
  adsPageLocation,
  conversionSendTo,
  ctaTrackingCalls,
  DEFAULT_GOOGLE_ADS_LEAD_LABEL,
  DEFAULT_GOOGLE_ADS_PHONE_LABEL,
  googleAdsTagHtml,
  isCalendlyScheduledMessage,
  isTrackedClinicPhone,
  isTypeformSubmitMessage,
  keptAdsSearchParams,
  leadTrackingCalls,
  pathWithAdsParams,
  phoneTrackingCalls,
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
  const gaId = 'G-PR7CJ8TK79'
  const calls = ctaTrackingCalls('/alzheimers-doctor-maryland?gclid=abc', 'hero', {
    gaId,
    adsId,
    ctaLabel: "See an Alzheimer's Doctor",
  })
  expect(calls).toEqual([
    ['event', 'cta_click', {
      page_path: '/alzheimers-doctor-maryland',
      cta_location: 'hero',
      cta_label: "See an Alzheimer's Doctor",
      send_to: gaId,
    }],
    ['event', 'cta_click', {
      page_path: '/alzheimers-doctor-maryland',
      cta_location: 'hero',
      cta_label: "See an Alzheimer's Doctor",
      send_to: adsId,
    }],
  ])
  const json = JSON.stringify(calls)
  expect(json).not.toContain(DEFAULT_GOOGLE_ADS_LEAD_LABEL)
  expect(json).not.toContain(DEFAULT_GOOGLE_ADS_PHONE_LABEL)
  expect(json).not.toContain('conversion')
  expect(ctaTrackingCalls('/memory-evaluation', 'hero', {
    gaId,
    adsId,
    ctaLabel: 'jane@example.com',
  })[0]?.[2]).not.toHaveProperty('cta_label')
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

test('official Ads labels become send_to conversions without contact fields', () => {
  const leadLabel = 'KA47CJbG9LAdEOuoosxE'
  const phoneLabel = 'gJr-CJnG9LAdEOuoosxE'
  const lead = leadTrackingCalls(adsId, leadLabel, '/get-started?email=jane@example.com')
  const phone = phoneTrackingCalls(adsId, phoneLabel, '/')
  const json = JSON.stringify({ lead, phone })

  expect(lead).toEqual([
    ['event', 'generate_lead', { page_path: '/get-started' }],
    ['event', 'conversion', { send_to: `${adsId}/${leadLabel}` }],
  ])
  expect(phone).toEqual([
    ['event', 'phone_click', { page_path: '/' }],
    ['event', 'conversion', { send_to: `${adsId}/${phoneLabel}` }],
  ])
  expect(json).not.toContain('jane')
  expect(json).not.toContain('@')
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

test('calendly booking detection reads only the event name and ignores foreign origins', () => {
  const payload = {
    event: 'calendly.event_scheduled',
    payload: {
      event: { uri: 'https://api.calendly.com/scheduled_events/abc' },
      invitee: { uri: 'https://api.calendly.com/invitees/xyz', email: 'jane@example.com', name: 'Jane Doe' },
    },
  }
  expect(isCalendlyScheduledMessage('https://calendly.com', payload)).toBe(true)
  expect(isCalendlyScheduledMessage('https://calendly.com', { event: 'calendly.event_type_viewed' })).toBe(false)
  expect(isCalendlyScheduledMessage('https://calendly.com', { event: 'calendly.date_and_time_selected' })).toBe(false)
  expect(isCalendlyScheduledMessage('https://calendly.com', 'calendly.event_scheduled')).toBe(false)
  expect(isCalendlyScheduledMessage('https://calendly.com', null)).toBe(false)
  expect(isCalendlyScheduledMessage('https://evil.example', payload)).toBe(false)
  expect(isCalendlyScheduledMessage('https://calendly.com.evil.com', payload)).toBe(false)
  expect(isCalendlyScheduledMessage('http://calendly.com', payload)).toBe(false)
  expect(isCalendlyScheduledMessage('https://assets.calendly.com', payload)).toBe(false)

  const calls = leadTrackingCalls(adsId, undefined, '/get-started')
  expect(JSON.stringify(calls)).not.toContain('jane@example.com')
  expect(JSON.stringify(calls)).not.toContain('Jane Doe')
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
