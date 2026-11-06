import { expect, test } from '@playwright/test'
import { DEFAULT_GOOGLE_ADS_ID, DEFAULT_GOOGLE_ADS_LEAD_LABEL, DEFAULT_GOOGLE_ADS_PHONE_LABEL } from '../src/analytics/googleAdsConfig'
import { DEFAULT_GA_MEASUREMENT_ID } from '../src/analytics/googleAnalyticsConfig'
import { landingPages } from '../src/landing/landingContent'

const gaId = DEFAULT_GA_MEASUREMENT_ID
const adsId = DEFAULT_GOOGLE_ADS_ID

function hitText(url: string, body: string | null) {
  return decodeURIComponent(`${url}${body ? `&${body}` : ''}`.replace(/\+/g, ' '))
}

test('CTA click sends cta_click to GA4 g/collect and does not fire a conversion', async ({ page }) => {
  const hits: string[] = []
  page.on('request', (request) => {
    const url = request.url()
    if (!url.includes('/g/collect') && !url.includes('/ccm/collect')) return
    hits.push(hitText(url, request.postData()))
  })

  await page.goto('/dementia-evaluation')
  const hero = page.locator('.landing-page[data-landing="dementia-evaluation"] [data-cta-location="hero"]')
  await expect(hero).toBeVisible()
  await hero.click()
  await expect(page).toHaveURL(/\/get-started/)

  await expect
    .poll(() => hits.filter((hit) => hit.includes('/g/collect') && hit.includes(`tid=${gaId}`) && hit.includes('en=cta_click')), {
      timeout: 20_000,
    })
    .toHaveLength(1)

  const gaHit = hits.find((hit) => hit.includes('/g/collect') && hit.includes(`tid=${gaId}`) && hit.includes('en=cta_click')) ?? ''
  expect(gaHit).toContain('ep.cta_location=hero')
  expect(gaHit).toContain('dp=/dementia-evaluation')
  expect(gaHit).toContain(`ep.cta_label=${landingPages['dementia-evaluation'].ctaLabel}`)
  expect(gaHit).not.toContain(DEFAULT_GOOGLE_ADS_LEAD_LABEL)
  expect(gaHit).not.toContain(DEFAULT_GOOGLE_ADS_PHONE_LABEL)
  expect(gaHit).not.toContain('en=conversion')

  const adsClicks = hits.filter((hit) => hit.includes(`tid=${adsId}`) && hit.includes('en=cta_click') && !hit.includes('/g/collect'))
  expect(adsClicks).toHaveLength(1)
  expect(hits.some((hit) => hit.includes('en=conversion'))).toBe(false)
})
