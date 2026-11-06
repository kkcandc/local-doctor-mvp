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
import { landingHtml } from '../src/landing/landingHtml'
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
      const embed = page.locator('.typeform-live-embed')
      await expect(embed).toHaveAttribute('data-tf-on-submit', 'localDoctorOnTypeformSubmit')
      await expect(embed).toHaveAttribute('data-tf-transitive-search-params', typeformTransitiveSearchParams)
      await expect(embed).toHaveAttribute('data-tf-live', /.+/)

      await page.evaluate(() => {
        window.localDoctorOnTypeformSubmit?.()
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
      await expect(landing.locator('.landing-reassurance')).toContainText('Next-day virtual visits')
      await expect(landing.locator('.landing-reassurance')).toContainText('No referral needed')

      const hero = landing.locator('[data-cta-location="hero"]')
      await expect(hero).toHaveAttribute('href', /\/get-started\?.*gclid=test_gclid_123/)
      await hero.click()
      await expect(page).toHaveURL(/\/get-started\?/)
      expect(page.url()).toContain('gclid=test_gclid_123')
      expect(page.url()).toContain('utm_source=google')
      expect(page.url()).not.toContain('jane@')
      await waitForGtagEvent(page, 'cta_click')
      await waitForGtagEvent(page, 'page_view')

      const afterCta = await gtagEntries(page)
      expect(
        afterCta.some(
          (entry) =>
            entry[0] === 'event' &&
            entry[1] === 'cta_click' &&
            (entry[2] as { page_path?: string; cta_location?: string } | undefined)?.page_path === `/${route}` &&
            (entry[2] as { cta_location?: string } | undefined)?.cta_location === 'hero',
        ),
      ).toBe(true)
      expect(
        afterCta.some(
          (entry) =>
            entry[0] === 'event' &&
            entry[1] === 'page_view' &&
            (entry[2] as { send_to?: string; page_path?: string } | undefined)?.send_to === gaId &&
            (entry[2] as { page_path?: string } | undefined)?.page_path === '/get-started',
        ),
      ).toBe(true)

      await expect(page.locator('.typeform-live-embed')).toHaveAttribute(
        'data-tf-transitive-search-params',
        typeformTransitiveSearchParams,
      )
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
