import { expect, test } from '@playwright/test'
import { typeformHiddenFields } from '../src/analytics/googleAdsConfig'
import {
  ADS_CONVERSIONS,
  buildTrackingCalls,
  calendlyTrackedEvent,
  newFiredState,
  type TrackedEvent,
  type TrackingContext,
} from '../src/analytics/tracking'

const adsId = 'AW-18413556843'
const gaId = 'G-PR7CJ8TK79'
const context: TrackingContext = { adsId, gaId }
const details = { pathname: '/get-started?email=jane@example.com&gclid=abc' }

test('the label map holds the real Ads send_to labels and no unreplaced labels', () => {
  const sendTo = Object.fromEntries(Object.entries(ADS_CONVERSIONS).map(([event, value]) => [event, `${adsId}/${value?.label}`]))
  expect(sendTo).toEqual({
    visit_booked: `${adsId}/KA47CJbG9LAdEOuoosxE`,
    phone_tap: `${adsId}/gJr-CJnG9LAdEOuoosxE`,
    cta_click: `${adsId}/A54CCNK03bUdEOuoosxE`,
    calendly_time_selected: `${adsId}/CqZ_CKDm17UdEOuoosxE`,
    evaluation_started: `${adsId}/r0XvCNW03bUdEOuoosxE`,
    evaluation_submitted: `${adsId}/vOMaCO613bUdEOuoosxE`,
    engaged_visit: `${adsId}/DTk2CPG13bUdEOuoosxE`,
  })
  expect(ADS_CONVERSIONS.visit_booked).toMatchObject({ value: 300, currency: 'USD' })
  expect(ADS_CONVERSIONS.evaluation_submitted).toMatchObject({ value: 100, currency: 'USD' })
  expect(JSON.stringify(ADS_CONVERSIONS)).not.toMatch(/placeholder/i)
  expect(ADS_CONVERSIONS.calendly_viewed).toBeUndefined()
})

test('visit_booked sends GA4 visit_booked and generate_lead plus the booking conversion with its value', () => {
  const calls = buildTrackingCalls('visit_booked', details, context)
  expect(calls).toEqual([
    ['event', 'visit_booked', { page_path: '/get-started', booking_source: 'calendly', send_to: gaId }],
    ['event', 'generate_lead', { page_path: '/get-started', booking_source: 'calendly', send_to: gaId }],
    ['event', 'conversion', { send_to: `${adsId}/KA47CJbG9LAdEOuoosxE`, value: 300, currency: 'USD' }],
  ])
})

test('evaluation events never use the booking label', () => {
  const started = buildTrackingCalls('evaluation_started', { pathname: '/evaluation' }, context)
  const submitted = buildTrackingCalls('evaluation_submitted', { pathname: '/evaluation' }, context)
  expect(started).toEqual([
    ['event', 'evaluation_started', { page_path: '/evaluation', form_name: 'evaluation', send_to: gaId }],
    ['event', 'conversion', { send_to: `${adsId}/r0XvCNW03bUdEOuoosxE` }],
  ])
  expect(submitted).toEqual([
    ['event', 'evaluation_submitted', { page_path: '/evaluation', form_name: 'evaluation', send_to: gaId }],
    ['event', 'conversion', { send_to: `${adsId}/vOMaCO613bUdEOuoosxE`, value: 100, currency: 'USD' }],
  ])
  for (const calls of [started, submitted]) {
    const json = JSON.stringify(calls)
    expect(json).not.toContain('KA47CJbG9LAdEOuoosxE')
    expect(json).not.toContain('visit_booked')
    expect(json).not.toContain('generate_lead')
  }
})

test('each secondary event sends its own GA4 name and its own label', () => {
  const expected: Array<[TrackedEvent, string[], string | null]> = [
    ['phone_tap', ['phone_tap', 'phone_click'], 'gJr-CJnG9LAdEOuoosxE'],
    ['cta_click', ['cta_click'], 'A54CCNK03bUdEOuoosxE'],
    ['calendly_viewed', ['calendly_viewed'], null],
    ['calendly_time_selected', ['calendly_time_selected'], 'CqZ_CKDm17UdEOuoosxE'],
    ['engaged_visit', ['engaged_visit'], 'DTk2CPG13bUdEOuoosxE'],
  ]
  for (const [event, gaNames, label] of expected) {
    const calls = buildTrackingCalls(event, { pathname: '/' }, context)
    expect(calls.filter((call) => call[1] !== 'conversion').map((call) => call[1])).toEqual(gaNames)
    const conversions = calls.filter((call) => call[1] === 'conversion')
    if (label) expect(conversions).toEqual([['event', 'conversion', { send_to: `${adsId}/${label}` }]])
    else expect(conversions).toEqual([])
  }
})

test('a placeholder, empty, or invalid label skips the Ads call and still sends GA4', () => {
  for (const label of ['PLACEHOLDER_CTA_CLICK', 'placeholder_x', '', null, 'bad label']) {
    const calls = buildTrackingCalls(
      'cta_click',
      { pathname: '/', ctaLocation: 'hero', ctaLabel: 'Start your evaluation', ctaDestination: '/evaluation' },
      { adsId, gaId, labels: { cta_click: label } },
    )
    expect(calls).toHaveLength(1)
    expect(calls[0]).toEqual([
      'event',
      'cta_click',
      { page_path: '/', cta_location: 'hero', cta_label: 'Start your evaluation', cta_destination: '/evaluation', send_to: gaId },
    ])
  }
  const swapped = buildTrackingCalls('cta_click', { pathname: '/' }, { adsId, gaId, labels: { cta_click: 'NewLabel_123' } })
  expect(swapped.at(-1)).toEqual(['event', 'conversion', { send_to: `${adsId}/NewLabel_123` }])
})

test('Ads and GA4 destinations are independent', () => {
  expect(buildTrackingCalls('engaged_visit', { pathname: '/' }, { adsId, gaId: null }).map((call) => call[1])).toEqual(['conversion'])
  expect(buildTrackingCalls('engaged_visit', { pathname: '/' }, { adsId: null, gaId }).map((call) => call[1])).toEqual(['engaged_visit'])
  expect(buildTrackingCalls('engaged_visit', { pathname: '/' }, { adsId: null, gaId: null })).toEqual([])
})

test('each Ads conversion fires once per page session, and once events send GA4 once', () => {
  const fired = newFiredState()
  for (const event of ['visit_booked', 'calendly_time_selected', 'evaluation_started', 'evaluation_submitted', 'engaged_visit'] as const) {
    expect(buildTrackingCalls(event, { pathname: '/' }, context, fired).length).toBeGreaterThan(1)
    expect(buildTrackingCalls(event, { pathname: '/' }, context, fired)).toEqual([])
  }
  // Clicks report to GA4 every time, but the Ads conversion only once.
  const first = buildTrackingCalls('cta_click', { pathname: '/', ctaLabel: 'Book now' }, context, fired)
  const second = buildTrackingCalls('cta_click', { pathname: '/', ctaLabel: 'Book now' }, context, fired)
  expect(first.map((call) => call[1])).toEqual(['cta_click', 'conversion'])
  expect(second.map((call) => call[1])).toEqual(['cta_click'])
  const tap = buildTrackingCalls('phone_tap', { pathname: '/' }, context, fired)
  const tapAgain = buildTrackingCalls('phone_tap', { pathname: '/' }, context, fired)
  expect(tap.map((call) => call[1])).toEqual(['phone_tap', 'phone_click', 'conversion'])
  expect(tapAgain.map((call) => call[1])).toEqual(['phone_tap', 'phone_click'])
})

test('hits carry only the event name, page path, and CTA text and destination', () => {
  // Callers cannot add fields. Extra data passed in by mistake is not forwarded.
  const hostile = {
    pathname: '/evaluation?email=jane@example.com&phone=2403765730',
    ctaLabel: 'jane@example.com',
    ctaLocation: 'Bad Location!',
    ctaDestination: 'https://evil.example/path?answer=alzheimers',
    answers: { email: 'jane@example.com', diagnosis: 'alzheimers' },
    responseId: 'resp_secret_123',
    formId: 'KwfqI59c',
  }
  for (const event of ['cta_click', 'evaluation_started', 'evaluation_submitted', 'visit_booked', 'phone_tap'] as const) {
    const json = JSON.stringify(buildTrackingCalls(event, hostile, context))
    for (const secret of ['jane', '@', '2403765730', 'alzheimers', 'resp_secret_123', 'KwfqI59c', 'answers', 'evil.example', 'Bad Location']) {
      expect(json, `${event} leaked ${secret}`).not.toContain(secret)
    }
    for (const call of buildTrackingCalls(event, hostile, context)) {
      const keys = Object.keys(call[2] ?? {})
      expect(keys.every((key) => ['page_path', 'cta_location', 'cta_label', 'cta_destination', 'booking_source', 'form_name', 'send_to', 'value', 'currency'].includes(key))).toBe(true)
    }
  }
})

test('the CTA click keeps the real button text and destination path', () => {
  const calls = buildTrackingCalls(
    'cta_click',
    { pathname: '/', ctaLocation: 'hero', ctaLabel: 'Book a Neurologist today', ctaDestination: '/get-started?gclid=abc' },
    context,
  )
  expect(calls[0]).toEqual([
    'event',
    'cta_click',
    { page_path: '/', cta_location: 'hero', cta_label: 'Book a Neurologist today', cta_destination: '/get-started', send_to: gaId },
  ])
})

test('only Calendly messages from https://calendly.com are read, and only their event name', () => {
  const payload = { invitee: { email: 'jane@example.com', name: 'Jane Doe' } }
  expect(calendlyTrackedEvent('https://calendly.com', { event: 'calendly.event_scheduled', payload })).toBe('visit_booked')
  expect(calendlyTrackedEvent('https://calendly.com', { event: 'calendly.date_and_time_selected' })).toBe('calendly_time_selected')
  expect(calendlyTrackedEvent('https://calendly.com', { event: 'calendly.event_type_viewed' })).toBe('calendly_viewed')
  expect(calendlyTrackedEvent('https://calendly.com', { event: 'calendly.profile_page_viewed' })).toBeNull()
  expect(calendlyTrackedEvent('https://calendly.com', 'calendly.event_scheduled')).toBeNull()
  expect(calendlyTrackedEvent('https://calendly.com', null)).toBeNull()
  for (const origin of ['https://evil.example', 'https://calendly.com.evil.com', 'http://calendly.com', 'https://assets.calendly.com', 'https://form.typeform.com']) {
    expect(calendlyTrackedEvent(origin, { event: 'calendly.event_scheduled', payload })).toBeNull()
  }
  expect(JSON.stringify(buildTrackingCalls('visit_booked', { pathname: '/get-started' }, context))).not.toContain('jane')
})

test('Typeform hidden fields are the eight allow-listed params only', () => {
  const search =
    '?gclid=G1&gbraid=GB1&wbraid=WB1&utm_source=google&utm_medium=cpc&utm_campaign=c1&utm_term=memory&utm_content=ad1&utm_id=id9&dclid=D1&email=jane@example.com&phone=2403765730&name=Jane'
  expect(typeformHiddenFields(search)).toEqual({
    gclid: 'G1',
    gbraid: 'GB1',
    wbraid: 'WB1',
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: 'c1',
    utm_term: 'memory',
    utm_content: 'ad1',
  })
  expect(typeformHiddenFields('')).toEqual({})
  expect(typeformHiddenFields('?gclid=jane@example.com&utm_source=google')).toEqual({ utm_source: 'google' })
})
