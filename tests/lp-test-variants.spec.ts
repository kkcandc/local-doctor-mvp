import { expect, test, type Page } from '@playwright/test'
import { DEFAULT_GA_MEASUREMENT_ID } from '../src/analytics/googleAnalyticsConfig'
import { publicSitemapPaths, siteSitemapXml } from '../src/siteMap'
import { lpVariants } from '../src/lp/lpVariants'

const gaId = DEFAULT_GA_MEASUREMENT_ID
const clickQuery = '?gclid=test_gclid_123&utm_source=google&utm_medium=cpc'

async function gaEvents(page: Page, name: string): Promise<Record<string, unknown>[]> {
  return page.evaluate(
    ({ name, gaId }) => {
      const layer = (window as { dataLayer?: unknown[] }).dataLayer ?? []
      return layer
        .map((item) => (item && typeof item === 'object' && 'length' in item ? Array.from(item as ArrayLike<unknown>) : null))
        .filter((entry): entry is unknown[] => Array.isArray(entry) && entry[0] === 'event' && entry[1] === name)
        .map((entry) => entry[2] as Record<string, unknown>)
        .filter((params) => params?.send_to === gaId)
    },
    { name, gaId },
  )
}

test('test variants stay out of the sitemap', () => {
  expect(publicSitemapPaths.some((path) => path.startsWith('/lp'))).toBe(false)
  expect(siteSitemapXml()).not.toContain('/lp/')
})

for (const variant of lpVariants) {
  test(`/lp/${variant} is noindex with no canonical, no site nav, and no drug names`, async ({ page }) => {
    await page.goto(`/lp/${variant}`)
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0)
    await expect(page.locator('.site-header')).toHaveCount(0)
    await expect(page.locator('.lp-header a[href="tel:+12403765730"]')).toHaveCount(1)
    const text = (await page.locator('body').innerText()).toLowerCase()
    for (const banned of ['leqembi', 'kisunla', 'lecanemab', 'donanemab', '\u2014', 'free', 'low cost', 'today', 'within days', 'this week']) {
      expect(text, `${banned} on /lp/${variant}`).not.toContain(banned)
    }
  })
}

for (const variant of ['a', 'c'] as const) {
  test(`/lp/${variant} books straight to the scheduler and tags the variant`, async ({ page }) => {
    await page.goto(`/lp/${variant}${clickQuery}`)
    await page.waitForFunction(() => typeof (window as { gtag?: unknown }).gtag === 'function')
    const button = variant === 'a' ? page.locator('.landing-hero a.primary').first() : page.locator('.lp-c-hero .lp-c-book')
    await button.click()
    await expect(page).toHaveURL(/\/get-started\?gclid=test_gclid_123/)
    const clicks = await gaEvents(page, 'cta_click')
    expect(clicks.some((params) => params.lp_variant === variant && params.page_path === `/lp/${variant}` && params.cta_destination === '/get-started')).toBe(true)
  })
}

test('/lp/c call button fires phone_tap with the variant', async ({ page }) => {
  await page.goto('/lp/c')
  await page.waitForFunction(() => typeof (window as { gtag?: unknown }).gtag === 'function')
  await page.locator('.lp-c-hero .lp-c-call').evaluate((link) => {
    link.addEventListener('click', (event) => event.preventDefault())
    ;(link as HTMLAnchorElement).click()
  })
  const taps = await gaEvents(page, 'phone_tap')
  expect(taps.some((params) => params.lp_variant === 'c')).toBe(true)
})

test('/lp/b puts the Calendly scheduler right under the headline', async ({ page }) => {
  await page.goto('/lp/b')
  const widget = page.locator('.lp-b-booking .calendly-inline-widget')
  await expect(widget).toHaveAttribute('data-url', /calendly\.com\/local-doctor\/virtualvisit/)
  const h1Box = await page.locator('h1').boundingBox()
  const widgetBox = await widget.boundingBox()
  expect(widgetBox!.y - (h1Box!.y + h1Box!.height)).toBeLessThan(250)
})
