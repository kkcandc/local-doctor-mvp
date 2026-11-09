import { expect, test, type Page } from '@playwright/test'
import {
  DEFAULT_GOOGLE_ADS_ID,
  DEFAULT_GOOGLE_ADS_LEAD_LABEL,
  DEFAULT_GOOGLE_ADS_PHONE_LABEL,
  pathWithAdsParams,
  typeformTransitiveSearchParams,
} from '../src/analytics/googleAdsConfig'
import { DEFAULT_GA_MEASUREMENT_ID } from '../src/analytics/googleAnalyticsConfig'
import { googleTagHtml } from '../src/analytics/googleAdsConfig'
import { landingDestinations, resolveDestination } from '../src/landing/destinations'
import { landingHtml } from '../src/landing/landingHtml'
import { landingPages } from '../src/landing/landingContent'
import { landingSlugs } from '../src/landing/landingMeta'

const adsId = DEFAULT_GOOGLE_ADS_ID
const gaId = DEFAULT_GA_MEASUREMENT_ID
const leadSendTo = `${adsId}/${DEFAULT_GOOGLE_ADS_LEAD_LABEL}`
const phoneSendTo = `${adsId}/${DEFAULT_GOOGLE_ADS_PHONE_LABEL}`
const trackedRoutes = [...landingSlugs, 'get-started'] as const
const clickQuery = '?gclid=test_gclid_123&utm_source=google&utm_medium=cpc&email=jane@example.com'

type GtagEntry = unknown[]

async function gtagEntries(page: Page): Promise<GtagEntry[]> {
  return page.evaluate(() => {
    const layer = (window as { dataLayer?: unknown[] }).dataLayer ?? []
    return layer
      .map((item) => {
        if (Array.isArray(item)) return item
        if (item && typeof item === 'object' && 'length' in item) return Array.from(item as ArrayLike<unknown>)
        return null
      })
      .filter((item): item is GtagEntry => Array.isArray(item))
  })
}

function matchesCta(params: unknown, expected: { page_path: string; cta_location: string; cta_label: string }) {
  const value = params as { page_path?: string; cta_location?: string; cta_label?: string } | undefined
  return value?.page_path === expected.page_path && value?.cta_location === expected.cta_location && value?.cta_label === expected.cta_label
}

function expectCtaClickSent(entries: GtagEntry[], ctaParams: { page_path: string; cta_location: string; cta_label: string }) {
  for (const sendTo of [gaId, adsId]) {
    expect(
      entries.some(
        (entry) =>
          entry[0] === 'event' &&
          entry[1] === 'cta_click' &&
          (entry[2] as { send_to?: string } | undefined)?.send_to === sendTo &&
          matchesCta(entry[2], ctaParams),
      ),
    ).toBe(true)
  }
  expect(entries.some((entry) => entry[0] === 'event' && entry[1] === 'conversion')).toBe(false)
}

async function waitForGtagEvent(page: Page, eventName: string, timeout = 10_000) {
  await expect
    .poll(
      async () => {
        const entries = await gtagEntries(page)
        return entries.some((entry) => entry[0] === 'event' && entry[1] === eventName)
      },
      { timeout },
    )
    .toBe(true)
}

test('built landing shells keep the Ads and GA4 tags from the shared snippet', () => {
  const snippet = googleTagHtml(adsId, gaId) ?? ''
  expect(snippet).toContain(adsId)
  expect(snippet).toContain(gaId)
  for (const slug of landingSlugs) {
    const html = landingHtml(`<!doctype html><html><head>${snippet}\n<title>Default</title></head><body></body></html>`, slug)
    expect(html).toContain(`gtag('config', '${adsId}'`)
    expect(html).toContain(`gtag('config', '${gaId}'`)
    expect(html).toContain('googletagmanager.com/gtag/js')
  }
})

test('CTA URLs keep gclid and drop contact params', () => {
  expect(pathWithAdsParams('/get-started', clickQuery)).toBe(
    '/get-started?gclid=test_gclid_123&utm_source=google&utm_medium=cpc',
  )
  expect(typeformTransitiveSearchParams).toContain('gclid')
  expect(typeformTransitiveSearchParams).toContain('utm_source')
})

for (const route of trackedRoutes) {
  test(`/${route} loads Ads + GA4 and tracks CTA, phone, and page hits`, async ({ page }) => {
    await page.addInitScript(() => {
      // Keep gtag as a dataLayer pusher even if the remote script fails to load in tests.
      window.dataLayer = window.dataLayer || []
      window.gtag = function gtag(...args: unknown[]) {
        window.dataLayer?.push(args)
      }
    })

    await page.goto(`/${route}${clickQuery}`)
    await page.waitForLoadState('load')

    const script = page.locator('script[src*="googletagmanager.com/gtag/js"]')
    await expect(script.first()).toHaveAttribute('src', new RegExp(`id=${adsId}|id=${gaId}`))

    await expect
      .poll(async () => {
        const entries = await gtagEntries(page)
        const adsConfig = entries.find((entry) => entry[0] === 'config' && entry[1] === adsId)
        const gaConfig = entries.find((entry) => entry[0] === 'config' && entry[1] === gaId)
        return Boolean(adsConfig && gaConfig)
      })
      .toBe(true)

    const entries = await gtagEntries(page)
    const adsConfig = entries.find((entry) => entry[0] === 'config' && entry[1] === adsId)
    const gaConfig = entries.find((entry) => entry[0] === 'config' && entry[1] === gaId)
    const adsLocation = String((adsConfig?.[2] as { page_location?: string } | undefined)?.page_location ?? '')
    const gaLocation = String((gaConfig?.[2] as { page_location?: string } | undefined)?.page_location ?? '')
    expect(adsLocation).toContain(`/${route}`)
    expect(adsLocation).toContain('gclid=test_gclid_123')
    expect(adsLocation).not.toContain('jane@')
    expect(gaLocation).toContain(`/${route}`)
    expect(gaLocation).toContain('gclid=test_gclid_123')

    if (route === 'get-started') {
      await expect(page.locator('.calendly-inline-widget')).toHaveAttribute('data-url', /^https:\/\/calendly\.com\/local-doctor\//)

      // Calendly posts this from its iframe after a booking. Only the event name is read.
      await page.evaluate(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: 'https://calendly.com',
            data: { event: 'calendly.event_scheduled', payload: { invitee: { uri: 'ignored' } } },
          }),
        )
      })
      await waitForGtagEvent(page, 'generate_lead')
      await waitForGtagEvent(page, 'conversion')
      const afterLead = await gtagEntries(page)
      expect(afterLead.some((entry) => entry[0] === 'event' && entry[1] === 'generate_lead')).toBe(true)
      expect(
        afterLead.some(
          (entry) =>
            entry[0] === 'event' &&
            entry[1] === 'conversion' &&
            (entry[2] as { send_to?: string } | undefined)?.send_to === leadSendTo,
        ),
      ).toBe(true)
    } else {
      const landing = page.locator(`.landing-page[data-landing="${route}"]`)
      await expect(landing).toBeVisible()
      await expect(landing.locator('.landing-reassurance')).toContainText('Board-certified neurologist. Insurance accepted. No referral needed.')
      await expect(landing.locator('.landing-reassurance')).toContainText('Phone answered on weekdays.')
      await expect(landing.locator('.landing-reassurance')).toContainText('No referral needed')

      const hero = landing.locator('[data-cta-location="hero"]')
      const destination = resolveDestination(landingDestinations[landingPages[route].funnel])
      const ctaParams = { page_path: `/${route}`, cta_location: 'hero', cta_label: landingPages[route].ctaLabel }

      if (destination.kind === 'external') {
        // The button leaves the site for an external form, which would discard this page's dataLayer.
        // Block the navigation (the click handler still runs) so the recorded events can be checked.
        await expect(hero).toHaveAttribute('href', destination.href)
        await page.evaluate(() => document.addEventListener('click', (event) => event.preventDefault(), true))
        await hero.click()
        await waitForGtagEvent(page, 'cta_click')
        expect(new URL(page.url()).pathname).toBe(`/${route}`)
        expectCtaClickSent(await gtagEntries(page), ctaParams)
      } else {
        await expect(hero).toHaveAttribute('href', /\/get-started\?.*gclid=test_gclid_123/)
        await hero.click()
        await expect(page).toHaveURL(/\/get-started\?/)
        expect(page.url()).toContain('gclid=test_gclid_123')
        expect(page.url()).toContain('utm_source=google')
        expect(page.url()).not.toContain('jane@')
        await waitForGtagEvent(page, 'cta_click')
        await waitForGtagEvent(page, 'page_view')

        const afterCta = await gtagEntries(page)
        expectCtaClickSent(afterCta, ctaParams)
        expect(
          afterCta.some(
            (entry) =>
              entry[0] === 'event' &&
              entry[1] === 'page_view' &&
              (entry[2] as { send_to?: string; page_path?: string } | undefined)?.send_to === gaId &&
              (entry[2] as { page_path?: string } | undefined)?.page_path === '/get-started',
          ),
        ).toBe(true)

        await expect(page.locator('.calendly-inline-widget')).toBeVisible()
      }
    }

    // Phone conversion from the clinic tel link on the page (landing hero or site header).
    await page.goto(`/${route}${clickQuery}`)
    const phone = page.locator(`a[href="tel:+12403765730"]`).first()
    await expect(phone).toBeVisible()
    await phone.click()
    await waitForGtagEvent(page, 'phone_click')
    const afterPhone = await gtagEntries(page)
    expect(afterPhone.some((entry) => entry[0] === 'event' && entry[1] === 'phone_click')).toBe(true)
    expect(
      afterPhone.some(
        (entry) =>
          entry[0] === 'event' &&
          entry[1] === 'conversion' &&
          (entry[2] as { send_to?: string } | undefined)?.send_to === phoneSendTo,
      ),
    ).toBe(true)
  })
}
