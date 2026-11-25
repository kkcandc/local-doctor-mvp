import { expect, test, type Locator, type Page } from '@playwright/test'
import { DEFAULT_GA_MEASUREMENT_ID } from '../src/analytics/googleAnalyticsConfig'
import { publicPhone } from '../src/compliancePages'
import { landingSlugs } from '../src/landing/landingMeta'
import { publicSitemapPaths } from '../src/siteMap'
import { serviceBySlug } from '../src/services/servicesData'
import { availabilityLine, bookingHash, priceNote, servicePageSlugs, servicePages, type ServicePageSlug } from '../src/services/servicePages'

/*
  The twelve individual service pages (/services/<slug>): six visits, three tests, two treatments,
  and Memory evaluation. They share one layout, so most checks run once per page. The drug pages must
  also agree with /treatments, which is checked against the live comparison table rather than a copy
  of its numbers. The test pages carry an "At a glance" table of their own.
*/

const gaId = DEFAULT_GA_MEASUREMENT_ID
const query = '?gclid=TEST_GCLID&utm_source=google&email=jane@example.com'
const drugSlugs: ServicePageSlug[] = ['leqembi', 'kisunla']
const testSlugs: ServicePageSlug[] = ['alzheimers-blood-test', 'alzheimers-genetic-testing', 'brain-mri']

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
        // A page whose search a landing page owns is noindex and has no canonical (see the test below).
        if (!content.meta.noindex) {
          await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://trylocaldoctor.com/services/${slug}`)
        }

        const hero = page.locator(`${root(slug)} .sp-media img`)
        expect(await hero.getAttribute('src')).toBe(cardImage)
        await expect(hero).toHaveJSProperty('complete', true)
        expect(await hero.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
        await expect(page.locator(`${root(slug)} .sp-price`)).toContainText(`${cardPrice} ${priceNote}`.replace(/^f/, 'F'))
        await expect(page.locator(`${root(slug)} .sp-availability`)).toHaveText(availabilityLine)
        // The hero no longer has a region line.
        await expect(page.locator(`${root(slug)} .sp-region`)).toHaveCount(0)
        await expect(page.locator(`${root(slug)} .sp-hero`)).not.toContainText('Video visits for patients located in Maryland')
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
          { location: 'service_band', label: 'Book a visit' },
          { location: 'service_help', label: 'Get started' },
        ]
        for (const { location, label } of buttons) {
          await page.goto(`/services/${slug}${query}`)
          const button = page.locator(`${root(slug)} [data-cta-location="${location}"]`)
          await expect(button).toHaveText(label)
          const href = (await button.getAttribute('href')) ?? ''
          // Every booking button goes to the calendar section of /get-started (the shared bookingHash).
          const hash = bookingHash ? `#${bookingHash}` : ''
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

      test('has no options or care team section, and no booking buttons beyond hero, band, and help', async ({ page }) => {
        await page.goto(`/services/${slug}`)
        const text = await page.locator(root(slug)).innerText()
        expect(text).not.toMatch(/visit options|test options|getting started|your care team|choose how you start/i)
        await expect(page.locator(`${root(slug)} .sp-option, ${root(slug)} .sp-trust, ${root(slug)} .sp-care-team`)).toHaveCount(0)
        const locations = await page.locator(`${root(slug)} [data-cta-location]`).evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-cta-location')))
        expect(locations).toEqual(['service_hero', 'service_band', 'service_help'])
        // A treatment page keeps its honest card right under the hero; the others have none.
        const honest = page.getByRole('heading', { name: 'What to expect, honestly' })
        await expect(honest).toHaveCount(drugSlugs.includes(slug) ? 1 : 0)
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
        // The site makes no claims about attention disorders or their medicines.
        expect(text).not.toMatch(/adhd|attention deficit|stimulant/i)
      })

      test('the More care row links to a page when one exists and to /get-started otherwise', async ({ page }) => {
        await page.goto(`/services/${slug}${query}`)
        // Each name has to match a card in servicesData.ts (a name that does not is dropped, so the
        // count below would come up short), and a page never lists itself.
        expect(content.moreCare).not.toContain(service.name)
        expect(content.moreCare.length).toBeGreaterThanOrEqual(3)
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

  // Every page's buttons carry the same hash (checked per page above); this follows one all the way.
  test('Book now opens the calendar section of /get-started and scrolls to it', async ({ page }) => {
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

  test('a visit page has no facts table or safety section', async ({ page }) => {
    for (const slug of servicePageSlugs.filter((other) => !drugSlugs.includes(other) && !testSlugs.includes(other))) {
      await page.goto(`/services/${slug}`)
      await expect(page.locator('.sp-facts'), slug).toHaveCount(0)
      await expect(page.getByRole('heading', { name: 'How we monitor for side effects' }), slug).toHaveCount(0)
    }
  })

  for (const slug of testSlugs) {
    test(`the ${slug} page has an "At a glance" table, and none of the drug-only links or safety section`, async ({ page }) => {
      const details = servicePages[slug].details!
      await page.goto(`/services/${slug}`)
      const rows = await page.locator('.sp-facts > div').evaluateAll((nodes) =>
        nodes.map((node) => ({ label: node.querySelector('dt')?.textContent ?? '', value: node.querySelector('dd')?.textContent ?? '' })),
      )
      expect(rows).toEqual(details.rows.map(([label, value]) => ({ label, value })))
      await expect(page.locator(`${root(slug)} .sp-links`)).toHaveCount(0)
      await expect(page.getByRole('link', { name: /Important Safety Information/ })).toHaveCount(0)
      await expect(page.getByRole('heading', { name: 'How we monitor for side effects' })).toHaveCount(0)
      await expect(page.locator(root(slug))).not.toContainText('24/7 triage line')
    })
  }

  test('the test pages stay within what the site and its sources say', async ({ page }) => {
    for (const slug of testSlugs) {
      await page.goto(`/services/${slug}`)
      const text = await page.locator(`${root(slug)}`).innerText()
      // Nothing about how fast results come back, or what the price covers, or which lab runs the test.
      expect(text, slug).not.toMatch(/within \d+|same[- ]day|next[- ]day|results in \d+|business days?|\bquest\b|labcorp|fda[- ]cleared|lumipulse/i)
    }
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

  // A service page that shares its slug with a landing page (/dementia-evaluation and so on) would
  // compete with it in search, so it is noindex, has no canonical, and is left out of the sitemap.
  // Every other service page is indexed and listed.
  test('a service page is noindex exactly when a landing page has the same name', () => {
    for (const slug of servicePageSlugs) {
      expect(Boolean(servicePages[slug].meta.noindex), slug).toBe((landingSlugs as readonly string[]).includes(slug))
    }
  })

  test('indexed service pages are in the sitemap and noindex ones are not', () => {
    for (const slug of servicePageSlugs) {
      const path = `/services/${slug}`
      if (servicePages[slug].meta.noindex) expect(publicSitemapPaths, slug).not.toContain(path)
      else expect(publicSitemapPaths, slug).toContain(path)
    }
  })

  test('a noindex service page tells search engines to skip it and has no canonical', async ({ page }) => {
    for (const slug of servicePageSlugs) {
      await page.goto(`/services/${slug}`)
      if (servicePages[slug].meta.noindex) {
        await expect(page.locator('meta[name="robots"]'), slug).toHaveAttribute('content', /noindex/)
        await expect(page.locator('link[rel="canonical"]'), slug).toHaveCount(0)
      } else {
        await expect(page.locator('meta[name="robots"]'), slug).toHaveCount(0)
        await expect(page.locator('link[rel="canonical"]'), slug).toHaveAttribute('href', `https://trylocaldoctor.com/services/${slug}`)
      }
    }
  })

  test('a path under /services that is not a service goes home', async ({ page }) => {
    await page.goto('/services/not-a-service')
    await expect(page.locator('.service-page')).toHaveCount(0)
  })
})

function serviceNameFor(slug: ServicePageSlug) {
  return serviceBySlug(slug).name
}

// Scrolls so the hero's bottom edge sits 40px above the top of the screen, which leaves the whole hero (and
// its Book now button) off screen. scrollIntoView would not, because the page's scroll-padding-top for the
// sticky header pushes the element down.
function pastHero(locator: Locator) {
  return locator.evaluate((element) => window.scrollTo({ top: element.getBoundingClientRect().bottom + window.scrollY + 40, behavior: 'instant' }))
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
      // A short phone screen, so the dark band (a place the bar hides) is not on screen just below the hero.
      await page.setViewportSize({ width: 375, height: 640 })
      await page.goto(`/services/${slug}${query}`)
      const bar = page.locator('[data-sticky-cta]')
      await expect(bar).toHaveCount(0)

      await pastHero(page.locator(`${root(slug)} .sp-hero`))
      await expect(bar).toBeVisible()
      await expect(bar.getByRole('link', { name: 'Book now' })).toHaveAttribute('href', /gclid=TEST_GCLID/)
      // The bar goes where the page's other booking buttons go, including a section of /get-started.
      const stickyHref = (await bar.getByRole('link', { name: 'Book now' }).getAttribute('href')) ?? ''
      expect(new URL(stickyHref, 'https://trylocaldoctor.com').hash).toBe(bookingHash ? `#${bookingHash}` : '')

      await page.locator(`${root(slug)} .sp-help`).evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
      await expect(bar).toHaveCount(0)

      await pastHero(page.locator(`${root(slug)} .sp-hero`))
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
