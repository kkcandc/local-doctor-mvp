import { gunzipSync } from 'node:zlib'
import { mkdirSync } from 'node:fs'
import { expect, test, type Page, type Request } from '@playwright/test'
import { isAllowedExternalHref, landingDestinations, resolveDestination } from '../src/landing/destinations'
import { landingPages } from '../src/landing/landingContent'
import { landingHtml } from '../src/landing/landingHtml'
import { landingCanonical, landingMeta, landingSitemapXml, landingSlugs, siteOrigin, type LandingSlug } from '../src/landing/landingMeta'

const HOME_H1 = /Treatment that slows down Alzheimer/
const CLINIC_TEL = 'tel:+12403765730'
const CLINIC_PHONE = '(240) 376-5730'
const HERO_REASSURANCE = 'Virtual visit from home with a Maryland-licensed doctor.'
const DASHES = /[\u2013\u2014]/
const TYPEFORM_LIVE_ID = '01M6Q39ZHJB5XWV15ABEYGFGS1'

const heroCtaLabels: Record<LandingSlug, string> = {
  'dementia-evaluation': 'Book Your Evaluation',
  'alzheimers-evaluation': 'Book Your Evaluation',
  'memory-evaluation': 'Book Your Evaluation',
  'alzheimers-doctor-maryland': "See an Alzheimer's Doctor",
  'memory-specialist-maryland': 'Talk to a Memory Specialist',
  'alzheimers-second-opinion': 'Request a Second Opinion',
  'dementia-test-online': 'Talk to a Memory Doctor',
  'memory-doctor-near-me': 'See a Memory Doctor',
}

const viewports = [
  { name: 'desktop', use: { viewport: { width: 1366, height: 900 } } },
  { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
] as const

test('every landing route has its own title, description, and canonical', () => {
  const titles = landingSlugs.map((slug) => landingMeta[slug].title)
  const descriptions = landingSlugs.map((slug) => landingMeta[slug].description)
  expect(new Set(titles).size).toBe(landingSlugs.length)
  expect(new Set(descriptions).size).toBe(landingSlugs.length)
  for (const slug of landingSlugs) {
    expect(landingCanonical(slug)).toBe(`${siteOrigin}/${slug}`)
    expect(landingMeta[slug].title.length).toBeLessThanOrEqual(70)
    expect(landingMeta[slug].description.length).toBeLessThanOrEqual(170)
    expect(`${landingMeta[slug].title} ${landingMeta[slug].description}`).not.toMatch(DASHES)
    expect(landingPages[slug].ctaLabel).toBe(heroCtaLabels[slug])
    expect(landingPages[slug].reassurance).toBe(HERO_REASSURANCE)
    expect(landingPages[slug].reassurance).not.toMatch(/referral|wait|price|insurance|\$/i)
  }
})

test('the sitemap lists every intent page the same way', () => {
  const xml = landingSitemapXml()
  expect(xml).toContain('<loc>https://trylocaldoctor.com/</loc>')
  expect(xml).not.toMatch(DASHES)
  expect(xml).not.toMatch(/livspecialtycare/i)
  for (const slug of landingSlugs) {
    expect(xml).toContain(`<loc>${landingCanonical(slug)}</loc>`)
  }
  expect(xml.match(/<loc>/g)?.length).toBe(landingSlugs.length + 1)
})

test('the static shell for a landing route carries its own head tags', () => {
  const shell = `<html><head>\n    <meta\n      name="description"\n      content="default"\n    />\n    <meta property="og:title" content="default" />\n    <meta\n      property="og:description"\n      content="default"\n    />\n    <title>Default</title>\n  </head><body></body></html>`
  const html = landingHtml(shell, 'alzheimers-second-opinion')
  expect(html).toContain("<title>Alzheimer's or Dementia Second Opinion | Local Doctor</title>")
  expect(html).toContain('<link rel="canonical" href="https://trylocaldoctor.com/alzheimers-second-opinion" />')
  expect(html).toContain('<meta property="og:url" content="https://trylocaldoctor.com/alzheimers-second-opinion" />')
  expect(html).toContain(`content="${landingMeta['alzheimers-second-opinion'].description}"`)
  expect(html).not.toContain('content="default"')
})

test('the homepage hero CTA label stays Get Started', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.hero-actions').getByRole('button', { name: 'Get Started' })).toBeVisible()
})

test('landing CTAs use the existing intake until a new form is configured', () => {
  expect(landingDestinations.evaluation).toEqual({ kind: 'intake' })
  expect(landingDestinations.onlineScreening).toEqual({ kind: 'intake' })
  expect(isAllowedExternalHref('https://localdoctor.typeform.com/to/abc123')).toBe(true)
  expect(isAllowedExternalHref('https://form.typeform.com/to/abc123')).toBe(true)
  expect(isAllowedExternalHref('http://form.typeform.com/to/abc123')).toBe(false)
  expect(isAllowedExternalHref('https://livspecialtycare.com/start')).toBe(false)
  expect(isAllowedExternalHref('https://typeform.com.evil.example/x')).toBe(false)
  expect(isAllowedExternalHref('not a url')).toBe(false)
  expect(resolveDestination({ kind: 'external', href: 'https://livspecialtycare.com' })).toEqual({ kind: 'intake' })
})

for (const viewport of viewports) {
  test.describe(`landing pages on ${viewport.name}`, () => {
    test.use(viewport.use)

    for (const slug of landingSlugs) {
      test(`/${slug} renders, links correctly, and fits the screen`, async ({ page }) => {
        await page.goto(`/${slug}`)
        const landing = page.locator(`.landing-page[data-landing="${slug}"]`)
        await expect(landing).toBeVisible()
        await expect(page.locator('h1')).toHaveCount(1)
        await expect(page.locator('h1')).not.toHaveText(HOME_H1)

        await expect(page).toHaveTitle(landingMeta[slug].title)
        await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', landingMeta[slug].description)
        await expect(page.locator('link[rel="canonical"]')).toHaveCount(1)
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', landingCanonical(slug))
        await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', landingCanonical(slug))

        const ctas = landing.locator('[data-cta-location]')
        expect(await ctas.count()).toBeGreaterThanOrEqual(2)
        for (const cta of await ctas.all()) {
          await expect(cta).toHaveText(heroCtaLabels[slug])
          await expect(cta).toHaveAttribute('href', '/get-started')
        }

        const hero = landing.locator('[data-cta-location="hero"]')
        await expect(hero).toHaveAttribute('aria-describedby', `${slug}-reassurance`)
        await expect(landing.locator(`#${slug}-reassurance`)).toHaveText(HERO_REASSURANCE)
        const phone = landing.locator('.landing-phone').first()
        await expect(phone).toBeVisible()
        await expect(phone).toContainText(CLINIC_PHONE)

        const tels = await landing.locator('a[href^="tel:"]').evaluateAll((links) => links.map((link) => link.getAttribute('href')))
        expect(tels.length).toBeGreaterThan(0)
        expect(new Set(tels)).toEqual(new Set([CLINIC_TEL]))

        const hrefs = await page.locator('a[href]').evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''))
        expect(hrefs.filter((href) => /livspecialtycare/i.test(href))).toEqual([])
        for (const href of hrefs.filter((value) => value.startsWith('#'))) {
          await expect(page.locator(href)).toHaveCount(1)
        }

        const text = await page.locator('main').innerText()
        expect(text).not.toMatch(DASHES)
        expect(text).not.toMatch(/livspecialtycare|LIV Specialty/i)

        await page.waitForLoadState('load')
        await page.evaluate(() => document.fonts.ready)
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        expect(overflow).toBeLessThanOrEqual(0)

        const heroBox = await hero.boundingBox()
        const phoneBox = await phone.boundingBox()
        const reassuranceBox = await landing.locator(`#${slug}-reassurance`).boundingBox()
        expect(heroBox, 'hero CTA').not.toBeNull()
        expect(phoneBox, 'phone CTA').not.toBeNull()
        expect(reassuranceBox, 'reassurance').not.toBeNull()
        const fold = viewport.use.viewport.height
        expect(heroBox!.y + heroBox!.height, 'hero CTA above the fold').toBeLessThanOrEqual(fold)
        expect(phoneBox!.y + phoneBox!.height, 'phone above the fold').toBeLessThanOrEqual(fold)
        expect(reassuranceBox!.y + reassuranceBox!.height, 'reassurance above the fold').toBeLessThanOrEqual(fold)
      })
    }

    test('every internal link on the landing pages opens a real page', async ({ page }) => {
      const internal = new Set<string>()
      for (const slug of landingSlugs) {
        await page.goto(`/${slug}`)
        const hrefs = await page.locator('main a[href^="/"]').evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''))
        hrefs.forEach((href) => internal.add(href.split('#')[0]))
      }
      internal.delete('/')
      expect(internal.size).toBeGreaterThan(landingSlugs.length)
      for (const href of internal) {
        await page.goto(href)
        await expect(page.locator('h1').first(), href).toBeVisible()
        await expect(page.locator('h1').first(), href).not.toHaveText(HOME_H1)
        expect(new URL(page.url()).pathname, href).toBe(href)
      }
    })

    test('the hero CTA opens the existing intake from each landing page', async ({ page }) => {
      for (const slug of landingSlugs) {
        await page.goto(`/${slug}`)
        await expect(page.locator('[data-cta-location="hero"]')).toHaveText(heroCtaLabels[slug])
        await page.locator('[data-cta-location="hero"]').click()
        await expect(page).toHaveURL(/\/get-started$/)
        await expect(page.locator('.typeform-live-embed')).toHaveAttribute('data-tf-live', TYPEFORM_LIVE_ID)
        expect(await page.evaluate(() => window.scrollY)).toBe(0)
        await expect(page.locator('link[rel="canonical"]')).toHaveCount(0)
      }
    })

    test('related links move between landing pages and update the metadata', async ({ page }) => {
      await page.goto('/dementia-evaluation')
      await page.locator('.landing-related').getByRole('link', { name: /Alzheimer's evaluation/ }).click()
      await expect(page).toHaveURL(/\/alzheimers-evaluation$/)
      await expect(page).toHaveTitle(landingMeta['alzheimers-evaluation'].title)
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', landingCanonical('alzheimers-evaluation'))
      await page.goBack()
      await expect(page).toHaveTitle(landingMeta['dementia-evaluation'].title)
    })
  })
}

test.describe('the online dementia test page', () => {
  test('says plainly that no online screening is offered and does not pose as a test', async ({ page }) => {
    await page.goto('/dementia-test-online')
    const landing = page.locator('.landing-page')
    await expect(landing.getByText('Local Doctor does not offer an online dementia test or screening quiz', { exact: false })).toBeVisible()
    await expect(landing.getByText('It is not a test, it does not score memory, and it does not give a result.')).toBeVisible()
    await expect(landing.locator('#three-steps')).toContainText('Screening')
    await expect(landing.locator('#three-steps')).toContainText('Evaluation')
    await expect(landing.locator('#three-steps')).toContainText('Diagnosis')

    await expect(landing.locator('form, input, select, textarea, [role="radiogroup"], [role="slider"]')).toHaveCount(0)
    const actionLabels = await landing.locator('a, button').evaluateAll((items) => items.map((item) => item.textContent?.trim() ?? ''))
    expect(actionLabels.filter((label) => /start (online|the)? ?(test|screen)|take (the|a) test|begin (test|quiz)|coming soon/i.test(label))).toEqual([])
    expect(await landing.innerText()).not.toMatch(/coming soon|waitlist/i)
  })
})

// posthog-js ignores headless Chrome, so present as plain Chrome (same as tests/posthog.spec.ts).
test.describe('CTA attribution', () => {
  test.use({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' })

  function decode(request: Request): string {
    const buffer = request.postDataBuffer()
    if (!buffer) return ''
    let text: string
    try {
      text = gunzipSync(buffer).toString('utf8')
    } catch {
      text = buffer.toString('utf8')
    }
    if (text.startsWith('data=')) text = Buffer.from(decodeURIComponent(text.slice(5)), 'base64').toString('utf8')
    return text
  }

  async function recordEvents(page: Page) {
    const events: { event: string; properties: Record<string, unknown> }[] = []
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false })
      Object.defineProperty(navigator, 'userAgentData', { get: () => undefined })
    })
    await page.route('**/__posthog/**', async (route) => {
      const request = route.request()
      if (request.method() === 'POST') {
        try {
          const parsed = JSON.parse(decode(request))
          const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.batch) ? parsed.batch : [parsed]
          for (const item of list) if (typeof item?.event === 'string') events.push(item)
        } catch {
          // Non-JSON bodies (replay chunks) are not events.
        }
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    })
    return events
  }

  test('a landing CTA reports the source page and button slot only', async ({ page }) => {
    const events = await recordEvents(page)
    await page.goto('/memory-evaluation')
    await page.locator('[data-cta-location="caregiver_path"]').click()
    await expect(page).toHaveURL(/\/get-started$/)
    await expect
      .poll(() => events.find((e) => e.event === 'eligibility_check_started')?.properties, { timeout: 20_000 })
      .toMatchObject({ source_path: '/memory-evaluation', cta_location: 'caregiver_path' })
  })
})

test.describe('screenshots', () => {
  test.skip(!process.env.SCREENSHOT_DIR, 'Set SCREENSHOT_DIR to capture landing page screenshots.')

  for (const viewport of viewports) {
    test.describe(viewport.name, () => {
      test.use(viewport.use)
      for (const slug of landingSlugs) {
        test(`capture /${slug}`, async ({ page }) => {
          const dir = process.env.SCREENSHOT_DIR!
          mkdirSync(dir, { recursive: true })
          await page.goto(`/${slug}`)
          await page.waitForLoadState('load')
          await page.evaluate(() => document.fonts.ready)
          await page.screenshot({ path: `${dir}/${viewport.name}-${slug}-hero.png` })
          await page.screenshot({ path: `${dir}/${viewport.name}-${slug}-full.png`, fullPage: true })
        })
      }
    })
  }
})
