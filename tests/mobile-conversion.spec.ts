import { expect, test, type Page } from '@playwright/test'
import { DEFAULT_GOOGLE_ADS_ID } from '../src/analytics/googleAdsConfig'
import { DEFAULT_GA_MEASUREMENT_ID } from '../src/analytics/googleAnalyticsConfig'
import { landingDestinations, resolveBookingUrl, resolveDestination } from '../src/landing/destinations'
import { landingPages } from '../src/landing/landingContent'
import { landingSlugs, type LandingSlug } from '../src/landing/landingMeta'

const mobile = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }
const desktop = { viewport: { width: 1366, height: 900 } }
const clickQuery = '?gclid=test_gclid_123&utm_source=google'
const DASHES = /[\u2013\u2014]/
const NEXT_DAY = /next[\s-]?day|tomorrow|same[\s-]?day/i
// The chatbot launcher sits in the bottom right corner; the bar keeps this much room for it.
const CHATBOT_GUTTER = 64

type StickyCase = { path: string; label: string; href: string; stops: string[] }

function landingHref(slug: LandingSlug) {
  const destination = resolveDestination(landingDestinations[landingPages[slug].funnel])
  return destination.kind === 'external' ? destination.href : `/get-started${clickQuery}`
}

const stickyCases: StickyCase[] = [
  { path: '/', label: 'Get Started', href: `/get-started${clickQuery}`, stops: ['.conversion-panel', '.footer'] },
  { path: '/get-started', label: 'Fill out the form', href: '#intake', stops: ['.start-form-section', '.footer'] },
  ...landingSlugs.map((slug) => ({
    path: `/${slug}`,
    label: landingPages[slug].ctaLabel,
    href: landingHref(slug),
    stops: ['.landing-mid-cta', '.landing-section-cta', '.landing-column-cta', '.landing-closing', '.footer'],
  })),
]

async function stubTypeform(page: Page) {
  await page.route('https://localdoctor.typeform.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Typeform stub</title>' }),
  )
}

async function ctaEvents(page: Page) {
  return page.evaluate(() => {
    const layer = (window as { dataLayer?: unknown[] }).dataLayer ?? []
    return layer
      .map((item) => (item && typeof item === 'object' && 'length' in item ? Array.from(item as ArrayLike<unknown>) : null))
      .filter((item): item is unknown[] => Array.isArray(item) && item[0] === 'event')
      .map((item) => ({ name: item[1] as string, params: (item[2] ?? {}) as Record<string, unknown> }))
  })
}

async function stopsInViewport(page: Page, stops: string[]) {
  return page.evaluate((selectors) => {
    const height = window.innerHeight
    return selectors.some((selector) =>
      Array.from(document.querySelectorAll(selector)).some((element) => {
        const box = element.getBoundingClientRect()
        return box.bottom > 0 && box.top < height && box.height > 0
      }),
    )
  }, stops)
}

test.describe('mobile sticky Get Started', () => {
  test.use(mobile)

  for (const item of stickyCases) {
    test(`${item.path} shows the sticky CTA, with the page label and destination, only away from other CTAs and the form`, async ({ page }) => {
      await stubTypeform(page)
      await page.goto(`${item.path}${clickQuery}`)
      await expect(page.locator('h1')).toBeVisible()
      const sticky = page.locator('[data-sticky-cta] a')
      await expect(sticky).toHaveCount(0)

      const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight)
      let seen = 0
      for (let y = 0; y <= pageHeight; y += 280) {
        await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y)
        await page.waitForTimeout(120)
        const visible = (await sticky.count()) > 0
        if (!visible) continue
        seen += 1
        await expect(sticky).toHaveText(item.label)
        await expect(sticky).toHaveAttribute('href', item.href)
        expect(await stopsInViewport(page, item.stops), `sticky overlaps a CTA, the form, or the footer at y=${y}`).toBe(false)
        const box = await sticky.boundingBox()
        expect(box).not.toBeNull()
        expect(box!.x + box!.width).toBeLessThanOrEqual(390 - CHATBOT_GUTTER)
        expect(box!.y + box!.height).toBeLessThanOrEqual(844)
        expect(box!.height).toBeGreaterThanOrEqual(44)
      }
      expect(seen, 'sticky CTA never appeared').toBeGreaterThan(0)

      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      await expect(sticky).toHaveCount(0)
      await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
      await expect(sticky).toHaveCount(0)
    })

  }

  test('homepage sticky goes to /get-started with gclid and sends one cta_click to GA4 and Ads', async ({ page }) => {
    await page.goto(`/${clickQuery}`)
    await page.evaluate(() => window.scrollTo({ top: 1200, behavior: 'instant' }))
    const sticky = page.locator('[data-sticky-cta] a')
    await expect(sticky).toBeVisible()
    const before = (await ctaEvents(page)).length
    await sticky.click()
    await expect(page).toHaveURL(/\/get-started\?gclid=test_gclid_123&utm_source=google$/)
    const events = (await ctaEvents(page)).slice(before)
    const clicks = events.filter((event) => event.name === 'cta_click')
    expect(clicks.map((event) => event.params.send_to).sort()).toEqual([DEFAULT_GOOGLE_ADS_ID, DEFAULT_GA_MEASUREMENT_ID].sort())
    for (const click of clicks) {
      expect(click.params).toMatchObject({ page_path: '/', cta_location: 'sticky_mobile', cta_label: 'Get Started' })
    }
    expect(events.some((event) => event.name === 'conversion')).toBe(false)
  })

  for (const slug of ['alzheimers-doctor-maryland', 'dementia-evaluation'] as const) {
    test(`/${slug} sticky click dispatches exactly one GA4 and one Ads cta_click`, async ({ page }) => {
      await stubTypeform(page)
      await page.goto(`/${slug}${clickQuery}`)
      await page.evaluate(() => window.scrollTo({ top: 1100, behavior: 'instant' }))
      const sticky = page.locator('[data-sticky-cta] a')
      await expect(sticky).toBeVisible()
      // Hold the page so the dataLayer can be read after an external link click.
      await page.evaluate(() => document.addEventListener('click', (event) => event.preventDefault(), { capture: true, once: true }))
      const before = (await ctaEvents(page)).length
      await sticky.click()
      await page.waitForTimeout(200)
      const events = (await ctaEvents(page)).slice(before)
      const clicks = events.filter((event) => event.name === 'cta_click')
      expect(clicks).toHaveLength(2)
      expect(clicks.map((event) => event.params.send_to).sort()).toEqual([DEFAULT_GOOGLE_ADS_ID, DEFAULT_GA_MEASUREMENT_ID].sort())
      for (const click of clicks) {
        expect(click.params).toMatchObject({ page_path: `/${slug}`, cta_location: 'sticky_mobile', cta_label: landingPages[slug].ctaLabel })
        expect(Object.keys(click.params).sort()).toEqual(['cta_label', 'cta_location', 'page_path', 'send_to'])
      }
      expect(events.some((event) => event.name === 'conversion')).toBe(false)
    })
  }

  test('/get-started sticky and hero jump link scroll to the form without sending events', async ({ page }) => {
    await page.goto(`/get-started${clickQuery}`)
    const heroJump = page.locator('.page-hero-secondary a')
    await expect(heroJump).toHaveText('Fill out the form')
    await expect(heroJump).toHaveAttribute('href', '#intake')

    await page.evaluate(() => window.scrollTo({ top: 1000, behavior: 'instant' }))
    const sticky = page.locator('[data-sticky-cta] a')
    await expect(sticky).toBeVisible()
    const before = (await ctaEvents(page)).length
    await sticky.click()
    await expect
      .poll(() => page.evaluate(() => document.getElementById('intake')!.getBoundingClientRect().top))
      .toBeLessThan(200)
    await expect(sticky).toHaveCount(0)
    const header = await page.locator('.site-header').boundingBox()
    const intake = await page.locator('#intake').boundingBox()
    expect(intake!.y).toBeGreaterThanOrEqual(header!.y + header!.height - 1)
    const events = (await ctaEvents(page)).slice(before)
    expect(events.filter((event) => event.name !== 'page_view')).toEqual([])
  })
})

test.describe('desktop', () => {
  test.use(desktop)

  for (const item of stickyCases) {
    test(`${item.path} never shows the sticky CTA on desktop`, async ({ page }) => {
      await stubTypeform(page)
      await page.goto(item.path)
      for (const top of [1200, 2400]) {
        await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), top)
        await page.waitForTimeout(120)
        const sticky = page.locator('[data-sticky-cta]')
        if ((await sticky.count()) > 0) await expect(sticky).toBeHidden()
      }
    })
  }
})

for (const [name, use] of [['desktop', desktop], ['mobile', mobile]] as const) {
  test.describe(`${name} section CTAs and copy`, () => {
    test.use(use)

    for (const slug of landingSlugs) {
      test(`/${slug} steps CTAs use the page label and destination`, async ({ page }) => {
        await stubTypeform(page)
        await page.goto(`/${slug}${clickQuery}`)
        const stepsCtas = page.locator('.landing-section-cta [data-cta-location="steps"]')
        const count = await stepsCtas.count()
        expect(count).toBe(landingPages[slug].sections.filter((section) => section.kind === 'steps').length)
        expect(count).toBeGreaterThan(0)
        for (let index = 0; index < count; index += 1) {
          const cta = stepsCtas.nth(index)
          await expect(cta).toHaveText(landingPages[slug].ctaLabel)
          await expect(cta).toHaveAttribute('href', landingHref(slug))
          const describedBy = await cta.getAttribute('aria-describedby')
          expect(describedBy).toBeTruthy()
          await expect(page.locator(`[id="${describedBy}"]`)).toHaveCount(1)
        }
      })
    }

    for (const path of ['/', '/get-started', ...landingSlugs.map((slug) => `/${slug}`)]) {
      test(`${path} has no next-day or same-day text and no long dashes`, async ({ page }) => {
        await stubTypeform(page)
        await page.goto(path)
        await expect(page.locator('h1')).toBeVisible()
        const text = await page.locator('main').innerText()
        expect(text).not.toMatch(NEXT_DAY)
        expect(text).not.toMatch(DASHES)
      })
    }
  })
}

test('evaluation pages describe the evaluation form, not the Get Started intake', () => {
  for (const slug of ['dementia-evaluation', 'alzheimers-evaluation', 'memory-evaluation'] as const) {
    const page = landingPages[slug]
    expect(page.funnel).toBe('evaluationForm')
    expect(page.ctaLabel).toBe('Start Evaluation')
    expect(page.ctaContext).toMatch(/^Start Evaluation opens/)
    expect(page.ctaContext).toContain('does not book a visit')
    expect(page.heroSecondary).toEqual({ label: 'How the evaluation works', href: '#how-it-works' })
    expect(page.sections.some((section) => section.kind === 'steps' && section.id === 'how-it-works')).toBe(true)
    const copy = JSON.stringify(page)
    expect(copy).not.toMatch(/Get Started form|behind Get Started|our intake form/)
  }
})

test('the booking slot only accepts an allowed https URL and is off by default', () => {
  expect(resolveBookingUrl(undefined)).toBeNull()
  expect(resolveBookingUrl('')).toBeNull()
  expect(resolveBookingUrl('   ')).toBeNull()
  expect(resolveBookingUrl('http://trylocaldoctor.com/book')).toBeNull()
  expect(resolveBookingUrl('https://example.com/book')).toBeNull()
  expect(resolveBookingUrl('javascript:alert(1)')).toBeNull()
  expect(resolveBookingUrl('https://localdoctor.typeform.com/book')).toBe('https://localdoctor.typeform.com/book')
})

test('without a booking URL, /get-started keeps the Typeform intake and makes no booking claim', async ({ page }) => {
  await page.goto('/get-started')
  await expect(page.locator('#intake .typeform-live-embed')).toHaveAttribute('data-tf-live', '01M64J1XGXT19BH7GGWPKJ243K')
  await expect(page.getByText('Book your neurologist appointment')).toHaveCount(0)
  await expect(page.locator('.expect-section ol li').first()).toContainText('Sending the form does not book a visit.')
  const text = await page.locator('main').innerText()
  expect(text).not.toMatch(/appointment (is )?confirmed|booking confirmed|you are booked/i)
})
