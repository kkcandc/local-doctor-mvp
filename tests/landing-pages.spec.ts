import { gunzipSync } from 'node:zlib'
import { mkdirSync } from 'node:fs'
import { expect, test, type Locator, type Page, type Request } from '@playwright/test'
import { isAllowedExternalHref, landingDestinations, resolveDestination } from '../src/landing/destinations'
import { landingPages } from '../src/landing/landingContent'
import { landingHtml } from '../src/landing/landingHtml'
import { landingCanonical, landingMeta, landingSlugs, siteOrigin, type LandingSlug } from '../src/landing/landingMeta'
import { publicSitemapPaths, siteSitemapXml } from '../src/siteMap'

const HOME_H1 = /Treatment that slows down Alzheimer/
const CLINIC_TEL = 'tel:+12403765730'
const CLINIC_PHONE = '(240) 376-5730'
const HERO_REASSURANCE =
  'Board-certified neurologist. Insurance accepted. No referral needed. Phone answered on weekdays.'
const TRUST_FACTS = [
  'Maryland video visits',
  'Board-certified neurologist',
  'Insurance accepted',
  'No referral needed',
]
const DASHES = /[\u2013\u2014]/
const TYPEFORM_EVALUATION = 'https://localdoctor.typeform.com/evaluation'

const heroCtaLabels: Record<LandingSlug, string> = {
  'dementia-evaluation': 'Start Evaluation',
  'alzheimers-evaluation': 'Start Evaluation',
  'memory-evaluation': 'Start Evaluation',
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

type Box = { x: number; y: number; width: number; height: number }

function horizontalGap(a: Box, b: Box) {
  const [left, right] = a.x <= b.x ? [a, b] : [b, a]
  return right.x - (left.x + left.width)
}

function sameRow(a: Box, b: Box) {
  return a.y < b.y + b.height - 1 && b.y < a.y + a.height - 1
}

async function boxOf(locator: Locator): Promise<Box> {
  const box = await locator.boundingBox()
  expect(box, locator.toString()).not.toBeNull()
  return box!
}

function expectedDestination(slug: LandingSlug) {
  return resolveDestination(landingDestinations[landingPages[slug].funnel])
}

// Keeps the browser off the real Typeform while still letting a click navigate there.
async function stubTypeform(page: Page) {
  await page.route('https://localdoctor.typeform.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Typeform stub</title>' }),
  )
}

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
    expect(landingPages[slug].facts.items.slice(0, TRUST_FACTS.length)).toEqual(TRUST_FACTS)
    expect(landingPages[slug].reassurance).not.toMatch(/waitlist|price|\$|seen in days/i)
  }
})

test('the sitemap lists the homepage, intake, and every public route', () => {
  const xml = siteSitemapXml()
  expect(xml.startsWith('<?xml')).toBe(true)
  expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
  expect(xml).not.toMatch(DASHES)
  expect(xml).not.toMatch(/livspecialtycare|<html/i)
  for (const path of publicSitemapPaths) {
    expect(xml).toContain(`<loc>${siteOrigin}${path}</loc>`)
  }
  expect(xml).toContain('<loc>https://trylocaldoctor.com/</loc>')
  expect(xml).toContain('<loc>https://trylocaldoctor.com/get-started</loc>')
  for (const slug of landingSlugs) {
    expect(xml).toContain(`<loc>${landingCanonical(slug)}</loc>`)
  }
  expect(xml.match(/<loc>/g)?.length).toBe(publicSitemapPaths.length)
})

test('sitemap.xml and robots.txt are served as real files', async ({ request }) => {
  const sitemap = await request.get('/sitemap.xml')
  expect(sitemap.status()).toBe(200)
  expect(sitemap.headers()['content-type'] ?? '').toContain('application/xml')
  const xml = await sitemap.text()
  expect(xml.startsWith('<?xml')).toBe(true)
  expect(xml).not.toContain('<html')
  expect(xml).toContain('<loc>https://trylocaldoctor.com/memory-doctor-near-me</loc>')
  expect(xml).toContain('<loc>https://trylocaldoctor.com/get-started</loc>')
  expect(xml.match(/<loc>/g)?.length).toBe(publicSitemapPaths.length)

  const robots = await request.get('/robots.txt')
  expect(robots.status()).toBe(200)
  const robotsBody = await robots.text()
  expect(robotsBody).toContain('Sitemap: https://trylocaldoctor.com/sitemap.xml')
  expect(robotsBody).not.toContain('<html')
})

test('memory specialist page asks visitors to request a visit', () => {
  const page = landingPages['memory-specialist-maryland']
  const steps = page.sections.find((section) => section.kind === 'steps')
  const mid = page.sections.find((section) => section.kind === 'midCta')
  expect(steps && steps.kind === 'steps' ? steps.title : '').toBe('Requesting a virtual memory visit.')
  expect(mid && mid.kind === 'midCta' ? mid.title : '').toBe('Request a visit with a memory specialist.')
  expect(JSON.stringify(page)).not.toMatch(/"title":"Book|"title":"Booking/)
})

test('homepage hero buttons share one row, 16px apart', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const actions = page.locator('.hero-actions')
  const primary = await boxOf(actions.getByRole('button', { name: 'Book a Neurologist today' }))
  const secondary = await boxOf(actions.getByRole('button', { name: 'Learn more' }))
  expect(sameRow(primary, secondary)).toBe(true)
  expect(horizontalGap(primary, secondary)).toBeCloseTo(16, 0)
})

for (const width of [1280, 1440]) {
  test.describe(`landing CTA rows at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } })

    test('hero buttons stay 16px apart and closing pairs stay paired', async ({ page }) => {
      for (const slug of landingSlugs) {
        await page.goto(`/${slug}`)
        const landing = page.locator(`.landing-page[data-landing="${slug}"]`)
        const hero = await boxOf(landing.locator('[data-cta-location="hero"]'))
        const phone = await boxOf(landing.locator('.landing-hero-buttons .landing-phone'))
        const reassurance = await boxOf(landing.locator(`#${slug}-reassurance`))
        const gap = horizontalGap(hero, phone)
        expect(sameRow(hero, phone), slug).toBe(true)
        expect(gap, slug).toBeCloseTo(16, 0)
        expect(reassurance.y, slug).toBeGreaterThanOrEqual(Math.max(hero.y + hero.height, phone.y + phone.height) - 1)
        expect(reassurance.x, slug).toBeLessThanOrEqual(hero.x + 2)

        const closing = landing.locator('.landing-closing .conversion-actions')
        await closing.scrollIntoViewIfNeeded()
        const closingPrimary = await boxOf(closing.locator('[data-cta-location="closing"]'))
        const closingPhone = await boxOf(closing.locator('.landing-phone'))
        expect(sameRow(closingPrimary, closingPhone), `${slug} closing`).toBe(true)
        expect(horizontalGap(closingPrimary, closingPhone), `${slug} closing`).toBeCloseTo(16, 0)
      }
    })
  })
}

test('alzheimers doctor and second opinion hero copy', () => {
  expect(landingPages['alzheimers-doctor-maryland'].h1).toBe("See an Alzheimer's doctor in Maryland, by video.")
  expect(landingMeta['alzheimers-doctor-maryland'].title).toBe("See an Alzheimer's Doctor in Maryland | Local Doctor")
  expect(landingPages['alzheimers-second-opinion'].heroNote).toBe(
    'Bring prior notes and results. A neurology specialist reviews them by video.',
  )
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

test('the homepage hero CTA reads Book a Neurologist today', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.hero-actions').getByRole('button', { name: 'Book a Neurologist today' })).toBeVisible()
})

test('only the three evaluation pages send their CTAs to the evaluation Typeform', () => {
  expect(landingDestinations.evaluationForm).toEqual({ kind: 'external', href: TYPEFORM_EVALUATION })
  expect(resolveDestination(landingDestinations.evaluationForm)).toEqual({ kind: 'external', href: TYPEFORM_EVALUATION })
  expect(landingDestinations.evaluation).toEqual({ kind: 'intake' })
  expect(landingDestinations.onlineScreening).toEqual({ kind: 'intake' })
  const typeformSlugs = landingSlugs.filter((slug) => expectedDestination(slug).kind === 'external')
  expect(typeformSlugs).toEqual(['dementia-evaluation', 'alzheimers-evaluation', 'memory-evaluation'])
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
        const destination = expectedDestination(slug)
        for (const cta of await ctas.all()) {
          await expect(cta).toHaveText(heroCtaLabels[slug])
          if (destination.kind === 'external') await expect(cta).toHaveAttribute('href', destination.href)
          else await expect(cta).toHaveAttribute('href', /\/get-started/)
        }

        const hero = landing.locator('[data-cta-location="hero"]')
        await expect(hero).toHaveAttribute('aria-describedby', `${slug}-reassurance`)
        await expect(landing.locator(`#${slug}-reassurance`)).toHaveText(HERO_REASSURANCE)
        const buttonRow = landing.locator('.landing-hero-buttons')
        await expect(buttonRow.locator('[data-cta-location="hero"]')).toBeVisible()
        await expect(buttonRow.locator('.landing-phone')).toHaveCount(1)
        await expect(buttonRow.locator('.landing-reassurance')).toHaveCount(0)
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
        if (viewport.name === 'desktop') {
          expect(sameRow(heroBox!, phoneBox!), 'hero and phone share a row').toBe(true)
          expect(horizontalGap(heroBox!, phoneBox!), 'hero to phone gap').toBeCloseTo(16, 0)
          expect(reassuranceBox!.y).toBeGreaterThanOrEqual(heroBox!.y + heroBox!.height - 1)
          expect(reassuranceBox!.y).toBeGreaterThanOrEqual(phoneBox!.y + phoneBox!.height - 1)
        } else {
          expect(phoneBox!.y, 'phone stacks under the hero button').toBeGreaterThanOrEqual(heroBox!.y + heroBox!.height - 1)
          expect(reassuranceBox!.y, 'reassurance follows both buttons').toBeGreaterThanOrEqual(phoneBox!.y + phoneBox!.height - 1)
          expect(Math.abs(heroBox!.width - phoneBox!.width), 'stacked buttons match width').toBeLessThanOrEqual(2)
        }
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

    test('the hero CTA opens its destination from each landing page', async ({ page }) => {
      await stubTypeform(page)
      for (const slug of landingSlugs) {
        await page.goto(`/${slug}`)
        await expect(page.locator('[data-cta-location="hero"]')).toHaveText(heroCtaLabels[slug])
        await page.locator('[data-cta-location="hero"]').click()
        const destination = expectedDestination(slug)
        if (destination.kind === 'external') {
          await expect(page).toHaveURL(destination.href)
          // Back must return to the landing page, not to an in-app /get-started entry.
          await page.goBack()
          await expect(page).toHaveURL(new RegExp(`/${slug}$`))
          await expect(page.locator(`.landing-page[data-landing="${slug}"]`)).toBeVisible()
          continue
        }
        await expect(page).toHaveURL(/\/get-started$/)
        await expect(page.locator('#book .calendly-inline-widget')).toHaveAttribute('data-url', /^https:\/\/calendly\.com\/local-doctor\//)
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
    const cta = page.locator('[data-cta-location="caregiver_path"]')
    await expect(cta).toHaveAttribute('href', TYPEFORM_EVALUATION)
    // Stay on the page so the recorded events are not cut off by leaving for Typeform.
    // Navigation itself is covered by the hero CTA test above.
    await page.evaluate(() => document.addEventListener('click', (event) => event.preventDefault(), true))
    await cta.click()
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
