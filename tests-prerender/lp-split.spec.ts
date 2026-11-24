import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import middleware from '../middleware'
import { DEFAULT_GA_MEASUREMENT_ID } from '../src/analytics/googleAnalyticsConfig'

/*
  The Evaluation split against the production build. serve-dist.mjs has no Vercel middleware,
  so each request to a split path is passed through the real middleware.ts here and its answer
  applied: a rewrite fetches /lp/<letter> from dist and returns it at the original URL with the
  middleware's headers, which is what Vercel does.
*/

const gaId = DEFAULT_GA_MEASUREMENT_ID
const human = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

async function applyMiddleware(context: BrowserContext) {
  await context.route(/\/(dementia-evaluation|alzheimers-evaluation|memory-evaluation)(\?|$)/, async (route) => {
    const request = route.request()
    if (request.resourceType() !== 'document') return route.continue()
    const headers = new Headers(await request.allHeaders())
    const answer = middleware(new Request(request.url(), { headers }))
    const target = answer.headers.get('x-middleware-rewrite')
    const extra: Record<string, string> = {}
    answer.headers.forEach((value, key) => {
      if (!key.startsWith('x-middleware-')) extra[key] = value
    })
    if (!target) {
      const response = await route.fetch()
      return route.fulfill({ response, headers: { ...response.headers(), ...extra } })
    }
    const local = new URL(target)
    const origin = new URL(request.url())
    local.protocol = origin.protocol
    local.host = origin.host
    const response = await route.fetch({ url: local.toString() })
    return route.fulfill({ response, headers: { ...response.headers(), ...extra } })
  })
}

async function newVisitor(browser: import('@playwright/test').Browser) {
  const context = await browser.newContext({ userAgent: human, viewport: { width: 390, height: 844 } })
  await applyMiddleware(context)
  return context
}

async function servedVariant(page: Page) {
  return page.locator('[data-lp-root]').getAttribute('data-lp-root', { timeout: 5000 }).catch(() => null)
}

async function gaEvents(page: Page, name: string) {
  return page.evaluate(
    ({ name, gaId }) =>
      ((window as { dataLayer?: unknown[] }).dataLayer ?? [])
        .map((item) => (item && typeof item === 'object' && 'length' in item ? Array.from(item as ArrayLike<unknown>) : null))
        .filter((entry): entry is unknown[] => Array.isArray(entry) && entry[0] === 'event' && entry[1] === name)
        .map((entry) => entry[2] as Record<string, unknown>)
        .filter((params) => params?.send_to === gaId),
    { name, gaId },
  )
}

for (const variant of ['a', 'b', 'c'] as const) {
  test(`?lp=${variant} serves variant ${variant} at /dementia-evaluation and hydrates it`, async ({ browser }) => {
    const context = await newVisitor(browser)
    const page = await context.newPage()
    const errors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error' && /hydrat|did not match/i.test(message.text())) errors.push(message.text())
    })
    await page.goto(`/dementia-evaluation?lp=${variant}&gclid=qa_gclid`)
    expect(new URL(page.url()).pathname).toBe('/dementia-evaluation')
    expect(await servedVariant(page)).toBe(variant)
    await page.waitForFunction(() => typeof (window as { gtag?: unknown }).gtag === 'function')
    // Still the variant after hydration, with no site header.
    await page.waitForTimeout(500)
    expect(await servedVariant(page)).toBe(variant)
    await expect(page.locator('.site-header')).toHaveCount(0)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    expect(errors).toEqual([])
    expect((await context.cookies()).find((cookie) => cookie.name === 'ld_lp')).toBeUndefined()
    await context.close()
  })
}

test('an ad click is assigned, stays sticky, and tags events with lp_variant', async ({ browser }) => {
  const context = await newVisitor(browser)
  const page = await context.newPage()
  await page.goto('/dementia-evaluation?gclid=test_gclid_123&utm_source=google')
  const first = await servedVariant(page)
  expect(['a', 'b', 'c']).toContain(first)
  const cookie = (await context.cookies()).find((item) => item.name === 'ld_lp')
  expect(cookie?.value).toBe(first)

  // Booking button: cta_click carries the variant and the gclid reaches /get-started.
  await page.waitForFunction(() => typeof (window as { gtag?: unknown }).gtag === 'function')
  const book = first === 'a' ? page.locator('.landing-hero a.primary').first() : first === 'b' ? null : page.locator('.lp-c-hero .lp-c-book')
  if (book) {
    await book.click()
    await expect(page).toHaveURL(/\/get-started\?gclid=test_gclid_123/)
    const clicks = await gaEvents(page, 'cta_click')
    expect(clicks.some((params) => params.lp_variant === first && params.page_path === '/dementia-evaluation')).toBe(true)
    // Back keeps the variant at the original URL.
    await page.goBack()
    await expect(page).toHaveURL(/\/dementia-evaluation/)
    expect(await servedVariant(page)).toBe(first)
  } else {
    await expect(page.locator('.lp-b-booking .calendly-inline-widget')).toHaveCount(1)
  }

  for (const path of ['/dementia-evaluation?gclid=another', '/memory-evaluation?gclid=x', '/alzheimers-evaluation']) {
    await page.goto(path)
    expect(await servedVariant(page), path).toBe(first)
  }
  await context.close()
})

test('organic visitors and other pages get the normal page', async ({ browser }) => {
  const context = await newVisitor(browser)
  const page = await context.newPage()
  await page.goto('/dementia-evaluation')
  expect(await servedVariant(page)).toBeNull()
  await expect(page.locator('.site-header')).toHaveCount(1)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://trylocaldoctor.com/dementia-evaluation')
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0)
  expect((await context.cookies()).find((cookie) => cookie.name === 'ld_lp')).toBeUndefined()

  await page.goto('/memory-doctor-near-me?gclid=abc')
  expect(await servedVariant(page)).toBeNull()
  expect((await context.cookies()).find((cookie) => cookie.name === 'ld_lp')).toBeUndefined()
  await context.close()
})
