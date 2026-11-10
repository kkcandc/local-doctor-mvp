import { gunzipSync } from 'node:zlib'
import { expect, test, type Page, type Request } from '@playwright/test'

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
  const events: Recorded[] = []
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
    Object.defineProperty(navigator, 'userAgentData', { get: () => undefined })
  })
  await page.route('**/__posthog/**', async (route) => {
    const request = route.request()
    if (request.method() === 'POST') events.push(...eventsIn(decodeBody(request)))
    // posthog-js only starts autocapture once remote config says it is not opted out, as PostHog does for a live project.
    const isRemoteConfig = /\/array\/[^/]+\/config$/.test(new URL(request.url()).pathname)
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: isRemoteConfig ? JSON.stringify({ autocapture_opt_out: false }) : '{}',
    })
  })
  return events
}

async function goTo(page: Page, path: string) {
  await page.evaluate((next) => {
    window.history.pushState({}, '', next)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, path)
}

function sawPageview(events: Recorded[], pathEnd: string) {
  return events.some((e) => e.event === '$pageview' && new URL(e.url).pathname === pathEnd)
}

test.use({ userAgent: BROWSER_USER_AGENT })

test('pageviews arrive on every page, including /get-started', async ({ page }) => {
  const events = await recordPostHog(page)

  await page.goto('/treatments')
  await expect.poll(() => sawPageview(events, '/treatments'), { timeout: 20_000 }).toBe(true)

  await goTo(page, '/get-started')
  await expect(page.locator('.calendly-inline-widget')).toBeVisible()
  await expect.poll(() => sawPageview(events, '/get-started'), { timeout: 20_000 }).toBe(true)

  await goTo(page, '/faq')
  await expect.poll(() => sawPageview(events, '/faq'), { timeout: 20_000 }).toBe(true)

  // Memory-only persistence: PostHog leaves nothing in cookies or browser storage.
  const stored = await page.evaluate(() => ({
    cookie: document.cookie,
    local: Object.keys(window.localStorage),
    session: Object.keys(window.sessionStorage),
  }))
  expect(stored.cookie).not.toMatch(/ph_|posthog/i)
  expect([...stored.local, ...stored.session].filter((key) => /^ph_|posthog/i.test(key))).toEqual([])
})

test('landing directly on /get-started is captured like any other page', async ({ page }) => {
  const events = await recordPostHog(page)

  await page.goto('/get-started')
  await expect(page.locator('.calendly-inline-widget')).toBeVisible()
  await expect.poll(() => sawPageview(events, '/get-started'), { timeout: 20_000 }).toBe(true)

  // Autocapture is not switched off on this page.
  await page.evaluate(() => {
    const button = document.createElement('button')
    button.id = 'posthog-test-button'
    button.textContent = 'Test'
    document.body.appendChild(button)
  })
  await page.locator('#posthog-test-button').click()
  await expect
    .poll(() => events.some((e) => e.event === '$autocapture' && new URL(e.url).pathname === '/get-started'), { timeout: 20_000 })
    .toBe(true)
})
