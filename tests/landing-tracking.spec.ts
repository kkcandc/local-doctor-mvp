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
import { landingPages } from '../src/landing/landingContent'
import { landingSlugs } from '../src/landing/landingMeta'

const adsId = DEFAULT_GOOGLE_ADS_ID
const gaId = DEFAULT_GA_MEASUREMENT_ID
const leadSendTo = `${adsId}/${DEFAULT_GOOGLE_ADS_LEAD_LABEL}`
const ctaSendTo = `${adsId}/A54CCNK03bUdEOuoosxE`
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

function expectCtaClickSent(entries: GtagEntry[], ctaParams: { page_path: string; cta_location: string; cta_label: string; cta_destination: string }) {
  expect(
    entries.some(
      (entry) =>
        entry[0] === 'event' &&
        entry[1] === 'cta_click' &&
        (entry[2] as { send_to?: string } | undefined)?.send_to === gaId &&
        matchesCta(entry[2], ctaParams) &&
        (entry[2] as { cta_destination?: string }).cta_destination === ctaParams.cta_destination,
    ),
  ).toBe(true)
  expect(
    entries.some(
      (entry) => entry[0] === 'event' && entry[1] === 'conversion' && (entry[2] as { send_to?: string } | undefined)?.send_to === ctaSendTo,
    ),
  ).toBe(true)
  expect(entries.some((entry) => entry[0] === 'event' && entry[1] === 'conversion' && (entry[2] as { send_to?: string } | undefined)?.send_to === leadSendTo)).toBe(false)
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

test('/alzheimers-blood-test secondary link keeps ad params and logs See open visit times', async ({ page }) => {
  await page.addInitScript(() => {
    window.dataLayer = window.dataLayer || []
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args)
    }
  })
  await page.goto(`/alzheimers-blood-test${clickQuery}`)
  const secondary = page.locator('[data-cta-location="visit_times"]')
  await expect(secondary).toHaveText('See open visit times')
  await expect(secondary).toHaveAttribute('href', /^\/get-started\?.*gclid=test_gclid_123/)
  await secondary.click()
  await expect(page).toHaveURL(/\/get-started\?/)
  expect(page.url()).toContain('gclid=test_gclid_123')
  expect(page.url()).toContain('utm_source=google')
  expect(page.url()).not.toContain('jane@')
  await waitForGtagEvent(page, 'cta_click')
  expectCtaClickSent(await gtagEntries(page), {
    page_path: '/alzheimers-blood-test',
    cta_location: 'visit_times',
    cta_label: 'See open visit times',
    cta_destination: '/get-started',
  })
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
      const widget = page.locator('.calendly-inline-widget')
      await expect(widget).toHaveAttribute('data-url', /^https:\/\/calendly\.com\/local-doctor\//)
      const embed = new URL((await widget.getAttribute('data-url')) ?? '')
      expect(embed.searchParams.get('hide_gdpr_banner')).toBe('1')
      expect(embed.searchParams.get('gclid')).toBe('test_gclid_123')
      expect(embed.searchParams.get('salesforce_uuid')).toBe('gclid:test_gclid_123')
      expect(embed.searchParams.get('utm_source')).toBe('google')
      expect(embed.searchParams.get('utm_medium')).toBe('cpc')
      expect(embed.searchParams.get('utm_content')).not.toBe('test_gclid_123')
      expect(embed.search).not.toContain('jane')

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
      await expect(landing.locator('.landing-reassurance')).toHaveText('Board-certified neurologist. Insurance accepted. No referral needed.')
      await expect(landing.locator('.landing-reassurance')).toContainText('No referral needed')

      const hero = landing.locator('[data-cta-location="hero"]')
      const targetPath = landingPages[route].funnel === 'evaluationForm' ? '/evaluation' : '/get-started'
      const ctaParams = { page_path: `/${route}`, cta_location: 'hero', cta_label: landingPages[route].ctaLabel, cta_destination: targetPath }

      await expect(hero).toHaveAttribute('href', new RegExp(`^${targetPath}\\?.*gclid=test_gclid_123`))
      await hero.click()
      await expect(page).toHaveURL(new RegExp(`${targetPath}\\?`))
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
            (entry[2] as { page_path?: string } | undefined)?.page_path === targetPath,
        ),
      ).toBe(true)
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
