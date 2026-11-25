import { expect, test, type Page } from '@playwright/test'
import { DEFAULT_GA_MEASUREMENT_ID } from '../src/analytics/googleAnalyticsConfig'
import { publicPhone } from '../src/compliancePages'

/*
  /services: where it sits in the header, the search and type filters, and where the cards and
  the closing buttons go. The numbers below (12 services: 7 visits, 2 treatments, 3 tests) are
  written out on purpose, so adding or removing a service has to update this spec too.
*/

const gaId = DEFAULT_GA_MEASUREMENT_ID
const query = '?gclid=TEST_GCLID&utm_source=google&email=jane@example.com'
const heading = 'Find the care you need'

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

const cards = (page: Page) => page.locator('.services-card')
const cardNames = (page: Page) => page.locator('.services-card h2')
const search = (page: Page) => page.getByRole('textbox', { name: 'Search services' })

test.describe('on a desktop screen', () => {
  test('the header lists Services between How it works and Treatments', async ({ page }) => {
    await page.goto('/')
    const items = page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button')
    await expect(items).toHaveText(['How it works', 'Services', 'Treatments', 'About'])
  })

  test('the header link opens /services at the top of the page', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))

    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Services' }).click()

    await expect(page).toHaveURL(/\/services$/)
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
    await expect(page).toHaveTitle('Memory and brain health services | Local Doctor')
    await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Services' })).toHaveClass(/active/)
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
  })

  test('the footer links to Services before Treatments', async ({ page }) => {
    await page.goto('/')
    const links = page.locator('footer').getByRole('button')
    const labels = await links.allTextContents()
    expect(labels.indexOf('Services')).toBeGreaterThan(-1)
    expect(labels.indexOf('Services')).toBe(labels.indexOf('Treatments') - 1)
  })

  test('a direct visit lists every service with its type counts', async ({ page }) => {
    await page.goto('/services')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading)
    await expect(cards(page)).toHaveCount(12)
    await expect(page.locator('.services-count')).toHaveText('12 services')
    await expect(cardNames(page)).toHaveText([
      'Memory evaluation',
      'Leqembi (lecanemab)',
      "Alzheimer's blood test",
      'Concentration difficulty',
      'Dementia evaluation',
      'Visit with a neurologist doctor',
      'Brain fog evaluation',
      "Alzheimer's genetic testing",
      'Cognitive evaluation',
      'Kisunla (donanemab)',
      "Alzheimer's evaluation",
      'Brain MRI',
    ])
    await expect(page.getByRole('button', { name: 'Visits 7' })).toHaveAttribute('aria-pressed', 'false')
    await expect(page.getByRole('button', { name: 'Treatments 2' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Tests 3' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Clear all' })).toHaveCount(0)
  })

  test('each card shows its type, name, price line, and a Book now button', async ({ page }) => {
    await page.goto('/services')
    const blood = cards(page).filter({ hasText: "Alzheimer's blood test" })
    await expect(blood.locator('.services-card-type')).toHaveText('Test')
    await expect(blood.locator('.services-card-price strong')).toHaveText('from $25')
    await expect(blood).toContainText('with or without insurance')
    await expect(blood.locator('.services-card-action')).toHaveText('Book now')
    await expect(blood.locator('img')).toHaveJSProperty('complete', true)
  })

  test('every card without a page of its own has a Book now button and logs it as Book now', async ({ page }) => {
    await page.goto('/services')
    await expect(cards(page)).toHaveCount(12)
    // The three cards with a page (Memory evaluation, Leqembi, Kisunla) say Learn more and open
    // that page instead; the other nine are bookings.
    const actions = await page.locator('.services-card-action').allTextContents()
    expect(actions.filter((label) => label === 'Book now')).toHaveLength(9)
    expect(actions.filter((label) => label === 'Learn more')).toHaveLength(3)
    const locations = await cards(page).evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-cta-location')))
    expect(locations.filter((location) => location === 'service_card')).toHaveLength(9)
    expect(locations.filter((location) => location === null)).toHaveLength(3)

    // Visits and tests that book all log the same label.
    for (const name of ['Dementia evaluation', 'Brain MRI']) {
      await page.goto('/services')
      await cards(page).filter({ has: page.getByRole('heading', { name }) }).click()
      await expect(page).toHaveURL(/\/get-started/)
      const click = ga(await events(page), 'cta_click')
      expect(click, name).toHaveLength(1)
      expect(click[0].params, name).toMatchObject({ cta_label: 'Book now', cta_location: 'service_card' })
    }
  })

  test('a type chip filters the cards and toggles off again', async ({ page }) => {
    await page.goto('/services')
    const chip = page.getByRole('button', { name: 'Treatments 2' })

    await chip.click()
    await expect(chip).toHaveAttribute('aria-pressed', 'true')
    await expect(cardNames(page)).toHaveText(['Leqembi (lecanemab)', 'Kisunla (donanemab)'])
    await expect(page.locator('.services-count')).toHaveText('2 services · Treatments')

    await page.getByRole('button', { name: 'Tests 3' }).click()
    await expect(chip).toHaveAttribute('aria-pressed', 'false')
    await expect(cards(page)).toHaveCount(3)

    await page.getByRole('button', { name: 'Tests 3' }).click()
    await expect(cards(page)).toHaveCount(12)
    await expect(page.getByRole('button', { name: 'Clear all' })).toHaveCount(0)
  })

  test('search matches names, types, and hidden keywords, ignoring case', async ({ page }) => {
    await page.goto('/services')
    const live = page.locator('.services-count')
    await expect(live).toHaveAttribute('aria-live', 'polite')

    await search(page).fill('MRI')
    await expect(cardNames(page)).toHaveText(['Brain MRI'])
    await expect(live).toHaveText('1 service matching “MRI”')

    await search(page).fill('apoe')
    await expect(cardNames(page)).toHaveText(["Alzheimer's genetic testing"])

    await search(page).fill('lecanemab')
    await expect(cardNames(page)).toHaveText(['Leqembi (lecanemab)'])

    await search(page).fill('donanemab')
    await expect(cardNames(page)).toHaveText(['Kisunla (donanemab)'])

    await search(page).fill('  treatments ')
    await expect(cardNames(page)).toHaveText(['Leqembi (lecanemab)', 'Kisunla (donanemab)'])

    // Search and the type chip both have to match.
    await search(page).fill('amyloid')
    await expect(cards(page)).toHaveCount(3)
    await page.getByRole('button', { name: 'Tests 3' }).click()
    await expect(cardNames(page)).toHaveText(["Alzheimer's blood test"])
    await expect(live).toHaveText('1 service · Tests matching “amyloid”')
  })

  test('the clear button empties the search and returns focus to it', async ({ page }) => {
    await page.goto('/services')
    await expect(page.getByRole('button', { name: 'Clear search' })).toHaveCount(0)

    await search(page).fill('memory')
    await expect(cards(page)).not.toHaveCount(12)
    await page.getByRole('button', { name: 'Clear search' }).click()

    await expect(search(page)).toHaveValue('')
    await expect(search(page)).toBeFocused()
    await expect(cards(page)).toHaveCount(12)
  })

  test('a search with no match offers a way back, and Clear all resets everything', async ({ page }) => {
    await page.goto('/services')
    await search(page).fill('zzzz')
    await expect(cards(page)).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 2, name: 'No services match that search' })).toBeVisible()
    await expect(page.locator('.services-count')).toHaveText('0 services matching “zzzz”')
    await expect(page.locator('.services-empty').getByRole('link', { name: 'Book now' })).toHaveAttribute('href', '/get-started')

    await page.getByRole('button', { name: 'Show all services' }).click()
    await expect(search(page)).toHaveValue('')
    await expect(cards(page)).toHaveCount(12)

    await page.getByRole('button', { name: 'Visits 7' }).click()
    await search(page).fill('memory')
    await page.getByRole('button', { name: 'Clear all' }).click()
    await expect(search(page)).toHaveValue('')
    await expect(page.getByRole('button', { name: 'Visits 7' })).toHaveAttribute('aria-pressed', 'false')
    await expect(cards(page)).toHaveCount(12)
  })

  test('cards open their own page when they have one and /get-started otherwise, keeping the ad params', async ({ page }) => {
    await page.goto(`/services${query}`)
    // The three services with a page of their own (see servicesData.ts); every other card books.
    const pages: Record<string, string> = {
      'Memory evaluation': '/services/memory-evaluation',
      'Leqembi (lecanemab)': '/services/leqembi',
      'Kisunla (donanemab)': '/services/kisunla',
    }
    for (const card of await cards(page).all()) {
      const name = (await card.locator('h2').textContent()) ?? ''
      const href = (await card.getAttribute('href')) ?? ''
      const url = new URL(href, 'https://trylocaldoctor.com')
      expect(url.pathname, name).toBe(pages[name] ?? '/get-started')
      expect(url.searchParams.get('gclid')).toBe('TEST_GCLID')
      expect(url.searchParams.get('utm_source')).toBe('google')
      expect(href).not.toContain('jane')
      await expect(card.locator('.services-card-action')).toHaveText(pages[name] ? 'Learn more' : 'Book now')
    }
  })

  test('a card with a page opens it without logging a booking click', async ({ page }) => {
    await page.goto(`/services${query}`)
    await cards(page).filter({ hasText: 'Memory evaluation' }).click()
    await expect(page).toHaveURL(/\/services\/memory-evaluation\?.*gclid=TEST_GCLID/)
    expect(page.url()).not.toContain('jane')
    await expect(page.getByRole('heading', { level: 1, name: 'Memory evaluation' })).toBeVisible()
    expect(ga(await events(page), 'cta_click')).toHaveLength(0)
  })

  test('a card without a page opens /get-started and logs the click', async ({ page }) => {
    await page.goto(`/services${query}`)
    await cards(page).filter({ hasText: "Alzheimer's blood test" }).click()
    await expect(page).toHaveURL(/\/get-started\?.*gclid=TEST_GCLID/)
    expect(page.url()).not.toContain('jane')
    const click = ga(await events(page), 'cta_click')
    expect(click).toHaveLength(1)
    expect(click[0].params).toMatchObject({ cta_label: 'Book now', cta_location: 'service_card', cta_destination: '/get-started', page_path: '/services' })
  })

  test('the closing buttons start the booking flow or call the clinic', async ({ page }) => {
    await page.goto(`/services${query}`)
    const closing = page.locator('.services-cta')
    await expect(closing.getByRole('heading', { level: 2, name: 'Not sure where to start?' })).toBeVisible()
    await expect(closing.getByRole('link', { name: `Call ${publicPhone}` })).toHaveAttribute('href', 'tel:+12403765730')

    await closing.getByRole('link', { name: 'Book now' }).click()
    await expect(page).toHaveURL(/\/get-started\?.*gclid=TEST_GCLID/)
    const click = ga(await events(page), 'cta_click')
    expect(click).toHaveLength(1)
    expect(click[0].params).toMatchObject({ cta_label: 'Book now', cta_location: 'services_closing', cta_destination: '/get-started', page_path: '/services' })
  })

  test('the page has no en or em dashes', async ({ page }) => {
    await page.goto('/services')
    expect(await page.locator('main').innerText()).not.toMatch(/[–—]/)
  })
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 375, height: 800 }, isMobile: true, hasTouch: true })

  test('the menu lists Services between How it works and Treatments and opens the page', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Open menu' }).click()
    const menu = page.getByRole('navigation', { name: 'Mobile navigation' })
    expect((await menu.getByRole('button').allTextContents()).slice(0, 3)).toEqual(['How it works', 'Services', 'Treatments'])

    await menu.getByRole('button', { name: 'Services' }).click()
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
  })

  test('the cards stack in one column without sideways scrolling', async ({ page }) => {
    await page.goto('/services')
    await expect(cards(page)).toHaveCount(12)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    const lefts = await cards(page).evaluateAll((nodes) => nodes.map((node) => Math.round(node.getBoundingClientRect().left)))
    expect(new Set(lefts).size).toBe(1)
    const widths = await cards(page).evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().width))
    for (const width of widths) expect(width).toBeLessThanOrEqual(375)
  })

  test('the search box and chips fit the screen and are easy to tap', async ({ page }) => {
    await page.goto('/services')
    const box = await search(page).boundingBox()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(375)
    for (const chip of await page.locator('.services-chip').all()) {
      const size = await chip.boundingBox()
      expect(size!.height).toBeGreaterThanOrEqual(44)
      expect(size!.x + size!.width).toBeLessThanOrEqual(375)
    }
  })
})
