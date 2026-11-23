import { expect, test, type Locator, type Page } from '@playwright/test'
import { DEFAULT_GA_MEASUREMENT_ID } from '../src/analytics/googleAnalyticsConfig'
import { publicPhone } from '../src/compliancePages'
import { publicSitemapPaths } from '../src/siteMap'
import { serviceBySlug } from '../src/services/servicesData'
import { availabilityLine, priceNote, regionNote, servicePageSlugs, servicePages, type ServicePageSlug } from '../src/services/servicePages'

/*
  The individual service pages (/services/memory-evaluation, /leqembi, /kisunla). They share one
  layout, so most checks run once per page. The drug pages must also agree with /treatments, which
  is checked against the live comparison table rather than a copy of its numbers.
*/

const gaId = DEFAULT_GA_MEASUREMENT_ID
const query = '?gclid=TEST_GCLID&utm_source=google&email=jane@example.com'
const drugSlugs: ServicePageSlug[] = ['leqembi', 'kisunla']

type Entry = { name: string; params: Record<string, unknown> }

async function events(page: Page): Promise<Entry[]> {
  return page.evaluate(() => {
    const layer = (window as { dataLayer?: unknown[] }).dataLayer ?? []
    return layer
      .map((item) => (item && typeof item === 'object' && 'length' in item ? Array.from(item as ArrayLike<unknown>) : null))
      .filter((item): item is unknown[] => Array.isArray(item) && item[0] === 'event')
      .map((item) => ({ name: item[1] as string, params: (item[2] ?? {}) as Record<string, unknown> }))
  })
}

const ga = (list: Entry[], name: string) => list.filter((entry) => entry.name === name && entry.params.send_to === gaId)

const root = (slug: ServicePageSlug) => `.service-page[data-service="${slug}"]`

test.describe('on a desktop screen', () => {
  for (const slug of servicePageSlugs) {
    const content = servicePages[slug]
    const service = serviceBySlug(slug)

    test.describe(`/services/${slug}`, () => {
      test('renders its H1, title, canonical, and the same picture and price as its Services card', async ({ page }) => {
        await page.goto('/services')
        const card = page.locator('.services-card').filter({ hasText: service.name })
        const cardImage = await card.locator('img').getAttribute('src')
        const cardPrice = await card.locator('.services-card-price strong').textContent()

        await page.goto(`/services/${slug}`)
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(content.title)
        await expect(page).toHaveTitle(content.meta.title)
        await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', content.meta.description)
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://trylocaldoctor.com/services/${slug}`)

        const hero = page.locator(`${root(slug)} .sp-media img`)
        expect(await hero.getAttribute('src')).toBe(cardImage)
        await expect(hero).toHaveJSProperty('complete', true)
        expect(await hero.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
        await expect(page.locator(`${root(slug)} .sp-price`)).toContainText(`${cardPrice} ${priceNote}`.replace(/^f/, 'F'))
        await expect(page.locator(`${root(slug)} .sp-availability`)).toHaveText(availabilityLine)
        await expect(page.locator(`${root(slug)} .sp-region`)).toHaveText(regionNote)
      })

      test('keeps Services highlighted in the header and links back to all services', async ({ page }) => {
        await page.goto(`/services/${slug}${query}`)
        await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Services' })).toHaveClass(/active/)
        await page.getByRole('link', { name: 'All services' }).click()
        await expect(page).toHaveURL(/\/services\?.*gclid=TEST_GCLID/)
        expect(page.url()).not.toContain('jane')
        await expect(page.getByRole('heading', { level: 1, name: 'Find the care you need' })).toBeVisible()
      })

      test('every booking button opens /get-started with the ad params and logs its own location', async ({ page }) => {
        const buttons = [
          { location: 'service_hero', label: 'Book now' },
          { location: 'service_options', label: 'Book now' },
          { location: 'service_band', label: 'Book a visit' },
          { location: 'service_help', label: 'Get started' },
          { location: 'service_care_team', label: 'Get started' },
        ]
        for (const { location, label } of buttons) {
          await page.goto(`/services/${slug}${query}`)
          const button = page.locator(`${root(slug)} [data-cta-location="${location}"]`)
          await expect(button).toHaveText(label)
          const href = (await button.getAttribute('href')) ?? ''
          // A page with a bookingHash sends every one of its booking buttons to that section.
          const hash = content.bookingHash ? `#${content.bookingHash}` : ''
          expect(new URL(href, 'https://trylocaldoctor.com').pathname).toBe('/get-started')
          expect(new URL(href, 'https://trylocaldoctor.com').hash).toBe(hash)
          expect(href).toContain('gclid=TEST_GCLID')
          expect(href).not.toContain('jane')

          await button.click()
          await expect(page).toHaveURL(/\/get-started\?.*gclid=TEST_GCLID/)
          expect(new URL(page.url()).hash).toBe(hash)
          expect(page.url()).not.toContain('jane')
          const click = ga(await events(page), 'cta_click')
          expect(click, location).toHaveLength(1)
          expect(click[0].params).toMatchObject({
            cta_label: label,
            cta_location: location,
            cta_destination: '/get-started',
            page_path: `/services/${slug}`,
          })
        }
      })

      test('the help card also offers the clinic phone number', async ({ page }) => {
        await page.goto(`/services/${slug}`)
        await expect(page.locator(`${root(slug)} .sp-help`).getByRole('link', { name: `Call ${publicPhone}` })).toHaveAttribute('href', 'tel:+12403765730')
      })

      test('the FAQ opens one answer at a time', async ({ page }) => {
        await page.goto(`/services/${slug}`)
        const questions = page.locator(`${root(slug)} .faq-accordion button`)
        await expect(questions).toHaveCount(content.faqs.length)
        await expect(questions.first()).toHaveAttribute('aria-expanded', 'true')
        await questions.nth(1).click()
        await expect(questions.nth(1)).toHaveAttribute('aria-expanded', 'true')
        await expect(questions.first()).toHaveAttribute('aria-expanded', 'false')
        await expect(page.locator(`${root(slug)} .faq-accordion article p`)).toHaveCount(1)
        await questions.nth(1).click()
        await expect(page.locator(`${root(slug)} .faq-accordion article p`)).toHaveCount(0)
      })

      test('has no dashes, sample reviews, or placeholder people', async ({ page }) => {
        await page.goto(`/services/${slug}`)
        const text = await page.locator('main').innerText()
        expect(text).not.toMatch(/[–—]/)
        expect(text).not.toMatch(/sample review|replace with verified|clinician name|patient stories/i)
        // The mockups quoted a slowing percentage; only the ARIA rates from /treatments are allowed.
        expect(text).not.toMatch(/\d+\s*%\s*(slowing|slower|reduction)/i)
      })

      test('the More care row links to a page when one exists and to /get-started otherwise', async ({ page }) => {
        await page.goto(`/services/${slug}${query}`)
        const cards = page.locator(`${root(slug)} .sp-more-card`)
        await expect(cards).toHaveCount(content.moreCare.length)
        for (const card of await cards.all()) {
          const name = (await card.locator('.sp-more-name').textContent()) ?? ''
          const href = (await card.getAttribute('href')) ?? ''
          const pathname = new URL(href, 'https://trylocaldoctor.com').pathname
          const sibling = servicePageSlugs.find((other) => other !== slug && serviceNameFor(other) === name)
          expect(pathname, name).toBe(sibling ? `/services/${sibling}` : '/get-started')
          expect(href).toContain('gclid=TEST_GCLID')
        }
      })
    })
  }

  test('Memory evaluation Book now opens the calendar section of /get-started and scrolls to it', async ({ page }) => {
    await page.goto(`/services/memory-evaluation${query}`)
    await page.locator('.service-page [data-cta-location="service_hero"]').click()
    await expect(page).toHaveURL(/\/get-started\?.*gclid=TEST_GCLID.*#book$/)
    expect(page.url()).not.toContain('jane')
    // The page scrolls (smoothly) to the section. In the live site it settles just under the sticky
    // header; here the calendar widget is blocked, so the page is short and stops a little lower. Either
    // way the section ends up in the top part of the screen, where opening /get-started plain leaves it
    // below the first screen (about 680px down).
    await expect.poll(() => page.locator('#book').evaluate((section) => Math.round(section.getBoundingClientRect().top))).toBeLessThan(300)
    await expect(page.locator('#book')).toBeInViewport()
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
    // It is still counted as a booking click on /get-started.
    expect(ga(await events(page), 'cta_click')[0].params).toMatchObject({ cta_location: 'service_hero', cta_destination: '/get-started' })
  })

  test('the Leqembi and Kisunla booking buttons still open the top of /get-started', async ({ page }) => {
    for (const slug of drugSlugs) {
      await page.goto(`/services/${slug}`)
      const href = (await page.locator(`${root(slug)} [data-cta-location="service_hero"]`).getAttribute('href')) ?? ''
      expect(new URL(href, 'https://trylocaldoctor.com').hash).toBe('')
    }
  })

  test('the Memory evaluation FAQ links to the Leqembi page', async ({ page }) => {
    await page.goto('/services/memory-evaluation')
    await page.locator('.service-page .faq-accordion button').nth(4).click()
    await page.locator('.faq-accordion').getByRole('link', { name: 'Leqembi' }).click()
    await expect(page).toHaveURL(/\/services\/leqembi$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Leqembi' })).toBeVisible()
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
  })

  test('the Leqembi and Kisunla pages link to each other', async ({ page }) => {
    await page.goto('/services/leqembi')
    await page.getByRole('link', { name: 'Compare with Kisunla' }).click()
    await expect(page).toHaveURL(/\/services\/kisunla$/)
    await expect(page).toHaveTitle(servicePages.kisunla.meta.title)
    await page.getByRole('link', { name: 'Compare with Leqembi' }).click()
    await expect(page).toHaveURL(/\/services\/leqembi$/)
  })

  test('the Memory evaluation page has no drug facts or safety section', async ({ page }) => {
    await page.goto('/services/memory-evaluation')
    await expect(page.locator('.sp-facts')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'How we monitor for side effects' })).toHaveCount(0)
  })

  for (const slug of drugSlugs) {
    test(`the ${slug} facts match the comparison table on /treatments`, async ({ page }) => {
      await page.goto('/treatments')
      const table = await page.locator('.compare-row').evaluateAll((rows) =>
        rows.map((row) => ({
          label: row.querySelector('span')?.textContent ?? '',
          leqembi: (row.querySelectorAll('p')[0]?.textContent ?? '').replace(/^Leqembi/, ''),
          kisunla: (row.querySelectorAll('p')[1]?.textContent ?? '').replace(/^Kisunla/, ''),
        })),
      )
      expect(table.length).toBeGreaterThan(0)

      await page.goto(`/services/${slug}`)
      const facts = await page.locator('.sp-facts > div').evaluateAll((rows) =>
        rows.map((row) => ({ label: row.querySelector('dt')?.textContent ?? '', value: row.querySelector('dd')?.textContent ?? '' })),
      )
      expect(facts.map((fact) => fact.label)).toEqual(table.map((row) => row.label))
      for (const [index, fact] of facts.entries()) expect(fact.value, fact.label).toBe(table[index][slug === 'leqembi' ? 'leqembi' : 'kisunla'])
    })

    test(`the ${slug} page keeps the 24/7 line, the safety screen, and the 911 reminder`, async ({ page }) => {
      await page.goto(`/services/${slug}`)
      await expect(page.locator(root(slug))).toContainText('24/7 triage line')
      await expect(page.locator(root(slug))).toContainText('call 911')
      for (const item of servicePages[slug].safety?.screen ?? []) await expect(page.locator('.sp-screen')).toContainText(item)
    })

    test(`the ${slug} page links to the manufacturer's safety information in a new tab`, async ({ page }) => {
      await page.goto(`/services/${slug}`)
      const link = page.getByRole('link', { name: /Important Safety Information/ })
      await expect(link).toHaveAttribute('target', '_blank')
      await expect(link).toHaveAttribute('rel', /noopener/)
      expect(await link.getAttribute('href')).toMatch(/^https:\/\/www\.(leqembihcp|lilly)\.com\//)
    })
  }

  test('the Kisunla page shows its own IV bag, not the Leqembi one whose label reads LECANEMAB', async ({ page }) => {
    await page.goto('/services/kisunla')
    const hero = page.locator(`${root('kisunla')} .sp-media img`)
    const src = (await hero.getAttribute('src')) ?? ''
    expect(src).toContain('/assets/services/kisunla')
    expect(src).not.toContain('hero-leqembi-iv')
    await expect(hero).toHaveAttribute('alt', 'Kisunla (donanemab) IV infusion bag')
  })

  // Each bag is a cut-out on its own plain backdrop, shown whole. The frame behind it has to match
  // that backdrop on the card and on the page, or the bars beside the picture show an edge.
  const frames: Record<string, string> = { leqembi: 'rgb(224, 239, 255)', kisunla: 'rgb(184, 216, 242)' }
  for (const slug of drugSlugs) {
    test(`the ${slug} IV bag is shown whole on a frame that matches its picture, on the card and the page`, async ({ page }) => {
      await page.goto('/services')
      const card = page.locator('.services-card').filter({ hasText: serviceBySlug(slug).name })
      await expect(card.locator('.services-card-media')).toHaveAttribute('data-fit', 'contain')
      await expect(card.locator('.services-card-media')).toHaveCSS('background-color', frames[slug])

      await page.goto(`/services/${slug}`)
      await expect(page.locator(`${root(slug)} .sp-media`)).toHaveAttribute('data-fit', 'contain')
      await expect(page.locator(`${root(slug)} .sp-media`)).toHaveCSS('background-color', frames[slug])
      await expect(page.locator(`${root(slug)} .sp-media img`)).toHaveCSS('object-fit', 'contain')
    })
  }

  test('every service page is in the sitemap', () => {
    for (const slug of servicePageSlugs) expect(publicSitemapPaths).toContain(`/services/${slug}`)
  })

  test('a path under /services that is not a service goes home', async ({ page }) => {
    await page.goto('/services/not-a-service')
    await expect(page.locator('.service-page')).toHaveCount(0)
  })
})

function serviceNameFor(slug: ServicePageSlug) {
  return serviceBySlug(slug).name
}

// Scrolls so the element's bottom edge sits 40px below the top of the screen. That leaves the hero and the
// options button above the screen, which scrollIntoView would not (the page's scroll-padding-top for the
// sticky header pushes the element down).
function justBelow(locator: Locator) {
  return locator.evaluate((element) => window.scrollTo({ top: element.getBoundingClientRect().bottom + window.scrollY - 40, behavior: 'instant' }))
}

test.describe('on a phone', () => {
  test.use({ viewport: { width: 375, height: 800 }, isMobile: true, hasTouch: true })

  for (const slug of servicePageSlugs) {
    test(`/services/${slug} fits the screen and has easy-to-tap buttons`, async ({ page }) => {
      await page.goto(`/services/${slug}`)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      const hero = page.locator(`${root(slug)} [data-cta-location="service_hero"]`)
      const box = await hero.boundingBox()
      expect(box!.height).toBeGreaterThanOrEqual(44)
      expect(box!.x).toBeGreaterThanOrEqual(0)
      expect(box!.x + box!.width).toBeLessThanOrEqual(375)
      for (const button of await page.locator(`${root(slug)} .faq-accordion button`).all()) {
        expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44)
      }
    })

    test(`/services/${slug} shows the sticky Book now bar after the hero and hides it near the closing buttons`, async ({ page }) => {
      // A short phone screen, so the dark band (a place the bar hides) is not on screen below the trust list.
      await page.setViewportSize({ width: 375, height: 640 })
      await page.goto(`/services/${slug}${query}`)
      const bar = page.locator('[data-sticky-cta]')
      await expect(bar).toHaveCount(0)

      await justBelow(page.locator(`${root(slug)} .sp-trust`))
      await expect(bar).toBeVisible()
      await expect(bar.getByRole('link', { name: 'Book now' })).toHaveAttribute('href', /gclid=TEST_GCLID/)
      // The bar goes where the page's other booking buttons go, including a section of /get-started.
      const stickyHref = (await bar.getByRole('link', { name: 'Book now' }).getAttribute('href')) ?? ''
      const bookingHash = servicePages[slug].bookingHash
      expect(new URL(stickyHref, 'https://trylocaldoctor.com').hash).toBe(bookingHash ? `#${bookingHash}` : '')

      await page.locator(`${root(slug)} .sp-help`).evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
      await expect(bar).toHaveCount(0)

      await justBelow(page.locator(`${root(slug)} .sp-trust`))
      await bar.getByRole('link', { name: 'Book now' }).click()
      await expect(page).toHaveURL(/\/get-started\?.*gclid=TEST_GCLID/)
      const click = ga(await events(page), 'cta_click')
      expect(click).toHaveLength(1)
      expect(click[0].params).toMatchObject({ cta_label: 'Book now', cta_location: 'sticky_mobile', cta_destination: '/get-started', page_path: `/services/${slug}` })
    })
  }

  test('the menu keeps Services between How it works and Treatments and the page opens from it', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Open menu' }).click()
    await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'Services' }).click()
    await page.locator('.services-card').filter({ hasText: 'Kisunla' }).click()
    await expect(page).toHaveURL(/\/services\/kisunla$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Kisunla' })).toBeVisible()
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
  })
})
