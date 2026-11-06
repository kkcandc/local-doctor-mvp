import { gunzipSync } from 'node:zlib'
import { expect, test, type Page, type Request } from '@playwright/test'
import type { CaptureResult } from 'posthog-js'
import { dropIntakeEvents, isIntakePath } from '../src/analytics/posthogConfig'

function captured(overrides: Partial<CaptureResult> & { properties: CaptureResult['properties'] }): CaptureResult {
  return { uuid: 'test-uuid', event: '$pageview', ...overrides }
}

test('the intake path matches /get-started in any spelling and nothing else', () => {
  expect(isIntakePath('/get-started')).toBe(true)
  expect(isIntakePath('/get-started/')).toBe(true)
  expect(isIntakePath('/Get-Started?email=jane@example.com#intake')).toBe(true)
  expect(isIntakePath('/get-started/step-2')).toBe(true)
  expect(isIntakePath('https://trylocaldoctor.com/get-started?gclid=abc')).toBe(true)
  expect(isIntakePath('http://127.0.0.1:5175/get-started')).toBe(true)

  expect(isIntakePath('/')).toBe(false)
  expect(isIntakePath('/treatments')).toBe(false)
  expect(isIntakePath('/blog/get-started-guide')).toBe(false)
  expect(isIntakePath('/get-started-now')).toBe(false)
  expect(isIntakePath('')).toBe(false)
  expect(isIntakePath(undefined)).toBe(false)
})

test('events from the intake page are dropped', () => {
  for (const event of ['$pageview', '$autocapture', '$exception', '$snapshot', '$pageleave']) {
    const result = dropIntakeEvents(captured({ event, properties: { $current_url: 'https://trylocaldoctor.com/get-started' } }))
    expect(result).toBeNull()
  }
  expect(dropIntakeEvents(null)).toBeNull()
})

test('an event with no url falls back to the live page url', () => {
  expect(dropIntakeEvents(captured({ properties: {} }), 'https://trylocaldoctor.com/get-started')).toBeNull()
  expect(dropIntakeEvents(captured({ properties: {} }), 'https://trylocaldoctor.com/treatments')).not.toBeNull()
})

test('events from other pages pass through', () => {
  const event = captured({ properties: { $current_url: 'https://trylocaldoctor.com/treatments', $pathname: '/treatments' } })
  expect(dropIntakeEvents(event)?.properties).toEqual(event.properties)
})

test('later events do not remember an earlier visit to the intake page', () => {
  const event = captured({
    properties: {
      $current_url: 'https://trylocaldoctor.com/faq',
      $pathname: '/faq',
      $session_entry_url: 'https://trylocaldoctor.com/get-started?gclid=abc',
      $session_entry_pathname: '/get-started',
      $session_entry_utm_source: 'google',
      $prev_pageview_pathname: '/get-started',
      $prev_pageview_duration: 42,
      $prev_pageview_max_scroll: 800,
      $referrer: 'https://trylocaldoctor.com/get-started',
    },
    $set_once: {
      $initial_current_url: 'https://trylocaldoctor.com/get-started?gclid=abc',
      $initial_pathname: '/get-started',
      $initial_utm_source: 'google',
    },
  })

  const result = dropIntakeEvents(event)
  expect(result?.properties).toEqual({
    $current_url: 'https://trylocaldoctor.com/faq',
    $pathname: '/faq',
    $session_entry_utm_source: 'google',
  })
  expect(result?.$set_once).toEqual({ $initial_utm_source: 'google' })
  expect(JSON.stringify(result)).not.toContain('get-started')
  // The caller's object is left alone.
  expect(event.properties.$session_entry_pathname).toBe('/get-started')
})

// posthog-js ignores bots: a HeadlessChrome user agent or client hint, or navigator.webdriver.
// The browser tests present as plain Chrome so events are actually captured.
const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'

type Recorded = { event: string; url: string }

function decodeBody(request: Request): string {
  const buffer = request.postDataBuffer()
  if (!buffer) return ''
  let text: string
  try {
    text = gunzipSync(buffer).toString('utf8')
  } catch {
    text = buffer.toString('utf8')
  }
  if (text.startsWith('data=')) {
    text = Buffer.from(decodeURIComponent(text.slice(5)), 'base64').toString('utf8')
  }
  return text
}

function eventsIn(text: string): Recorded[] {
  try {
    const parsed = JSON.parse(text)
    const list: unknown[] = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.batch) ? parsed.batch : [parsed]
    return list
      .filter((item): item is { event: string; properties?: { $current_url?: string } } => typeof (item as { event?: unknown })?.event === 'string')
      .map((item) => ({ event: item.event, url: item.properties?.$current_url ?? '' }))
  } catch {
    return []
  }
}

// The test server points PostHog at /__posthog on the dev server (see playwright.config.ts).
async function recordPostHog(page: Page) {
  const bodies: string[] = []
  const events: Recorded[] = []
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
    Object.defineProperty(navigator, 'userAgentData', { get: () => undefined })
  })
  await page.route('**/__posthog/**', async (route) => {
    const request = route.request()
    if (request.method() === 'POST') {
      const body = decodeBody(request)
      bodies.push(body)
      events.push(...eventsIn(body))
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  })
  return { bodies, events }
}

async function goTo(page: Page, path: string) {
  await page.evaluate((next) => {
    window.history.pushState({}, '', next)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, path)
}

test.use({ userAgent: BROWSER_USER_AGENT })

test('PostHog stays silent on /get-started and keeps working elsewhere', async ({ page }) => {
  const { bodies, events } = await recordPostHog(page)

  await page.goto('/treatments')
  await expect.poll(() => events.some((e) => e.event === '$pageview' && e.url.endsWith('/treatments')), { timeout: 20_000 }).toBe(true)

  await goTo(page, '/get-started')
  await expect(page.locator('.typeform-live-embed')).toBeVisible()
  await goTo(page, '/faq')
  await expect.poll(() => events.some((e) => e.event === '$pageview' && e.url.endsWith('/faq')), { timeout: 20_000 }).toBe(true)

  expect(events.filter((e) => e.url.includes('get-started'))).toEqual([])
  expect(bodies.join('\n')).not.toContain('get-started')

  // Memory-only persistence: PostHog leaves nothing in cookies or browser storage.
  const stored = await page.evaluate(() => ({
    cookie: document.cookie,
    local: Object.keys(window.localStorage),
    session: Object.keys(window.sessionStorage),
  }))
  expect(stored.cookie).not.toMatch(/ph_|posthog/i)
  expect([...stored.local, ...stored.session].filter((key) => /^ph_|posthog/i.test(key))).toEqual([])
})

test('landing directly on /get-started sends nothing about it', async ({ page }) => {
  const { bodies, events } = await recordPostHog(page)

  await page.goto('/get-started')
  await expect(page.locator('.typeform-live-embed')).toBeVisible()
  await goTo(page, '/faq')
  await expect.poll(() => events.some((e) => e.event === '$pageview' && e.url.endsWith('/faq')), { timeout: 20_000 }).toBe(true)

  expect(events.filter((e) => e.url.includes('get-started'))).toEqual([])
  expect(bodies.join('\n')).not.toContain('get-started')
})
