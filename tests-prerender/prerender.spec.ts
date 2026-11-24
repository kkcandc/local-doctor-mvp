import fs from 'node:fs'
import path from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { DEFAULT_GA_MEASUREMENT_ID } from '../src/analytics/googleAnalyticsConfig'
import { EVALUATION_FORM_ID } from '../src/evaluationForm'
import { landingMeta, landingSlugs } from '../src/landing/landingMeta'

/*
  Checks the production build (npm run test:prerender builds it and serves dist like Vercel).
  Every public route must arrive as rendered HTML with its own H1, title, description, and
  canonical, and React must hydrate that HTML in place, with no console errors.
*/

const gaId = DEFAULT_GA_MEASUREMENT_ID
const dist = path.join(process.cwd(), 'dist')
const sitemapPaths = [...fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8').matchAll(/<loc>https:\/\/trylocaldoctor\.com([^<]*)<\/loc>/g)].map(
  (match) => match[1],
)
const routes = [...sitemapPaths, '/evaluation']

function decode(text: string) {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim()
}

function parse(html: string) {
  const body = html.slice(html.indexOf('<div id="root">'))
  return {
    rootHasContent: /<div id="root"><main>/.test(html),
    // React streaming placeholders: content that only shows once a script runs.
    deferredContent: /<template id="B:|<div hidden id="S:/.test(html),
    h1s: [...body.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((match) => decode(match[1])),
    title: decode(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ''),
    description: html.match(/<meta\s+name="description"\s+content="([^"]*)"/)?.[1] ?? '',
    canonical: html.match(/<link rel="canonical" href="([^"]*)"/)?.[1] ?? null,
    noindex: /<meta name="robots" content="noindex/.test(html),
    text: decode(body.replace(/<script[\s\S]*?<\/script>/g, '')),
  }
}

// Console errors from this site's own code. Blocked third-party requests (see the host rules in
// playwright.config.ts) and messages logged inside third-party frames are left out.
function watchConsole(page: Page) {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() !== 'error') return
    if (message.text().startsWith('Failed to load resource')) return
    const source = message.location().url
    if (source && new URL(source).origin !== new URL(page.url()).origin) return
    errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

// Records the H1 element the server sent, before any script runs, so the test can tell a
// hydrated page (same node, now owned by React) from one React threw away and rendered again.
async function markServerH1(page: Page) {
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      ;(window as unknown as { serverH1: Element | null }).serverH1 = document.querySelector('h1')
    })
  })
}

async function waitForHydration(page: Page) {
  await expect
    .poll(() => page.evaluate(() => {
      const h1 = document.querySelector('h1')
      return Boolean(h1 && Object.keys(h1).some((key) => key.startsWith('__reactFiber')))
    }))
    .toBe(true)
}

for (const route of routes) {
  test(`${route} ships rendered HTML and hydrates it in place`, async ({ browser, page, request }) => {
    const response = await request.get(route)
    expect(response.status()).toBe(200)
    const raw = parse(await response.text())

    expect(raw.rootHasContent, 'root holds the rendered page').toBe(true)
    expect(raw.deferredContent, 'no content waiting on a script').toBe(false)
    expect(raw.h1s, 'one H1 in the HTML').toHaveLength(1)
    expect(raw.h1s[0].length).toBeGreaterThan(5)
    expect(raw.title).toMatch(/Local Doctor/)
    expect(raw.description.length).toBeGreaterThan(40)
    expect(raw.text.length, 'page text in the HTML').toBeGreaterThan(300)
    if (route === '/evaluation') {
      expect(raw.noindex).toBe(true)
      expect(raw.canonical).toBeNull()
    } else if (route.startsWith('/blog/')) {
      expect(raw.canonical).toMatch(/^https:\/\/mylocalinfusion\.com\//)
    } else {
      expect(raw.noindex).toBe(false)
      expect(raw.canonical).toBe(`https://trylocaldoctor.com${route}`)
    }
    const slug = route.slice(1)
    if ((landingSlugs as readonly string[]).includes(slug)) {
      expect(raw.title).toBe(landingMeta[slug as keyof typeof landingMeta].title)
      expect(raw.description).toBe(landingMeta[slug as keyof typeof landingMeta].description)
    }

    const noScript = await browser.newContext({ javaScriptEnabled: false })
    const staticPage = await noScript.newPage()
    await staticPage.goto(route)
    await expect(staticPage.locator('h1'), 'H1 visible without JavaScript').toBeVisible()
    await expect(staticPage.locator('h1')).toHaveText(raw.h1s[0])
    await noScript.close()

    const errors = watchConsole(page)
    await markServerH1(page)
    await page.goto(route)
    await waitForHydration(page)
    expect(await page.evaluate(() => (window as unknown as { serverH1: Element | null }).serverH1 === document.querySelector('h1'))).toBe(true)
    await expect(page.locator('h1')).toHaveText(raw.h1s[0])
    await expect(page).toHaveTitle(raw.title)
    if (raw.canonical) await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', raw.canonical)
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(raw.canonical ? 1 : 0)
    await page.waitForLoadState('load')
    expect(errors).toEqual([])
  })
}

test('a path with no prerendered page gets the SPA shell and renders in the browser', async ({ page, request }) => {
  const raw = await (await request.get('/blog/not-a-real-post')).text()
  expect(raw).toContain('<div id="root"></div>')
  const errors = watchConsole(page)
  await page.goto('/blog/not-a-real-post')
  await expect(page.locator('h1')).toHaveText('This article is not on Local Doctor.')
  expect(errors).toEqual([])
})

type Entry = { name: string; params: Record<string, unknown> }

function gaEvents(page: Page): Promise<Entry[]> {
  return page.evaluate(() => {
    const layer = (window as { dataLayer?: unknown[] }).dataLayer ?? []
    return layer
      .map((item) => (item && typeof item === 'object' && 'length' in item ? Array.from(item as ArrayLike<unknown>) : null))
      .filter((item): item is unknown[] => Array.isArray(item) && item[0] === 'event')
      .map((item) => ({ name: item[1] as string, params: (item[2] ?? {}) as Record<string, unknown> }))
  })
}

const gaNamed = async (page: Page, name: string) => (await gaEvents(page)).filter((entry) => entry.name === name && entry.params.send_to === gaId)

test('a hydrated landing page keeps ad params on CTAs and fires cta_click and phone_tap to GA4', async ({ page }) => {
  const errors = watchConsole(page)
  await markServerH1(page)
  await page.goto('/memory-doctor-near-me?gclid=TEST_GCLID&utm_source=google')
  await waitForHydration(page)

  const hero = page.locator('.landing-page[data-landing="memory-doctor-near-me"] [data-cta-location="hero"]')
  await expect(hero).toHaveAttribute('href', /gclid=TEST_GCLID/)

  await page.evaluate(() => {
    document.addEventListener('click', (event) => {
      if ((event.target as Element).closest('a[href^="tel:"]')) event.preventDefault()
    })
  })
  await page.locator('.landing-hero a[href^="tel:"]').click()
  await expect.poll(async () => (await gaNamed(page, 'phone_tap')).length).toBe(1)

  await hero.click()
  await expect(page).toHaveURL(/\/get-started\?gclid=TEST_GCLID/)
  await expect.poll(async () => (await gaNamed(page, 'cta_click')).length).toBe(1)
  const [click] = await gaNamed(page, 'cta_click')
  expect(click.params.cta_location).toBe('hero')
  await expect(page.locator('.calendly-inline-widget')).toHaveAttribute('data-url', /utm_source=google/)
  expect(errors).toEqual([])
})

test('prerendered /evaluation mounts the Typeform with the hidden fields and fires its events', async ({ page }) => {
  await page.route(`https://form.typeform.com/to/${EVALUATION_FORM_ID}**`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: `<!doctype html><title>Typeform stub</title><body>stub form<script>
        window.sendToParent = function (type) {
          var embedId = new URLSearchParams(location.search).get('typeform-embed-id');
          parent.postMessage({ type: type, embedId: embedId, formId: '${EVALUATION_FORM_ID}', responseId: 'resp' }, '*');
        };
      </script></body>`,
    }),
  )
  const errors = watchConsole(page)
  await markServerH1(page)
  await page.goto('/evaluation?gclid=TEST_GCLID&utm_campaign=camp')
  await waitForHydration(page)

  const iframe = page.locator('.evaluation-form-widget iframe')
  await expect(iframe).toHaveCount(1)
  const fragment = new URLSearchParams(new URL((await iframe.getAttribute('src')) ?? '').hash.replace(/^#/, ''))
  expect(fragment.get('gclid')).toBe('TEST_GCLID')
  expect(fragment.get('utm_campaign')).toBe('camp')

  await expect.poll(() => page.frames().some((frame) => frame.url().startsWith('https://form.typeform.com/'))).toBe(true)
  const frame = page.frames().find((candidate) => candidate.url().startsWith('https://form.typeform.com/'))!
  await frame.evaluate(() => (window as unknown as { sendToParent: (type: string) => void }).sendToParent('form-started'))
  await frame.evaluate(() => (window as unknown as { sendToParent: (type: string) => void }).sendToParent('form-submit'))
  await expect.poll(async () => (await gaNamed(page, 'evaluation_started')).length).toBe(1)
  await expect.poll(async () => (await gaNamed(page, 'evaluation_submitted')).length).toBe(1)
  expect(errors).toEqual([])
})

test('a booking on prerendered /get-started sends the lead events', async ({ page }) => {
  const errors = watchConsole(page)
  await markServerH1(page)
  await page.goto('/get-started')
  await waitForHydration(page)
  await page.evaluate(() =>
    window.dispatchEvent(new MessageEvent('message', { origin: 'https://calendly.com', data: { event: 'calendly.event_scheduled', payload: {} } })),
  )
  await expect.poll(async () => (await gaNamed(page, 'visit_booked')).length).toBe(1)
  await expect.poll(async () => (await gaNamed(page, 'generate_lead')).length).toBe(1)
  expect(errors).toEqual([])
})

test('a CTA tapped before the app hydrates still carries the ad params', async ({ page }) => {
  await page.route(/\/assets\/index-[^/]+\.js$/, (route) => route.abort())
  await page.goto('/dementia-evaluation?gclid=EARLY_GCLID&utm_source=google&email=jane@example.com')
  await page.locator('.landing-page [data-cta-location="hero"]').click()
  await expect(page).toHaveURL(/\/evaluation\?/)
  const url = new URL(page.url())
  expect(url.searchParams.get('gclid')).toBe('EARLY_GCLID')
  expect(url.searchParams.get('utm_source')).toBe('google')
  expect(url.searchParams.has('email')).toBe(false)
})

test.describe('before JavaScript runs', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })

  test('/get-started on a phone shows only the photo below the scheduler', async ({ page }) => {
    await page.goto('/get-started')
    await expect(page.locator('h1')).toHaveText('Book a video visit with a board-certified neurologist to find out if treatment is right for you.')
    await expect(page.locator('.page-hero-image')).toBeHidden()
    await expect(page.locator('.start-photo-below')).toBeVisible()
  })

  test('a landing page shows its hero, sections, and FAQ', async ({ page }) => {
    await page.goto('/memory-doctor-near-me')
    await expect(page.locator('.landing-hero h1')).toBeVisible()
    await expect(page.locator('.landing-faq')).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()
  })
})
