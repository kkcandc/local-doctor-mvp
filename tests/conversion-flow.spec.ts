import { expect, test, type Page } from '@playwright/test'
import { DEFAULT_GOOGLE_ADS_ID } from '../src/analytics/googleAdsConfig'
import { DEFAULT_GA_MEASUREMENT_ID } from '../src/analytics/googleAnalyticsConfig'
import { ENGAGED_VISIT_MS } from '../src/analytics/tracking'
import { EVALUATION_FORM_ID } from '../src/evaluationForm'
import { landingPages } from '../src/landing/landingContent'
import { landingSlugs } from '../src/landing/landingMeta'

const adsId = DEFAULT_GOOGLE_ADS_ID
const gaId = DEFAULT_GA_MEASUREMENT_ID
const query =
  '?gclid=TEST_GCLID&gbraid=TEST_GB&wbraid=TEST_WB&utm_source=google&utm_medium=cpc&utm_campaign=camp&utm_term=memory&utm_content=ad1&email=jane@example.com&phone=2403765730'
const evaluationSlugs = landingSlugs.filter((slug) => landingPages[slug].funnel === 'evaluationForm')
const bookingSlugs = landingSlugs.filter((slug) => landingPages[slug].funnel !== 'evaluationForm')

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

const conversions = (list: Entry[]) => list.filter((entry) => entry.name === 'conversion').map((entry) => entry.params)
const ga = (list: Entry[], name: string) => list.filter((entry) => entry.name === name && entry.params.send_to === gaId)

async function stubTypeform(page: Page) {
  await page.route(`https://form.typeform.com/to/${EVALUATION_FORM_ID}**`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: `<!doctype html><title>Typeform stub</title><body>stub form<script>
        window.sendToParent = function (type, extra) {
          var embedId = new URLSearchParams(location.search).get('typeform-embed-id');
          parent.postMessage(Object.assign({ type: type, embedId: embedId, formId: '${EVALUATION_FORM_ID}', responseId: 'resp_secret_123' }, extra || {}), '*');
        };
      </script></body>`,
    }),
  )
}

async function sendFromForm(page: Page, type: string, extra?: Record<string, unknown>) {
  const frame = page.frames().find((candidate) => candidate.url().startsWith('https://form.typeform.com/'))
  expect(frame, 'embedded Typeform frame').toBeTruthy()
  await frame!.evaluate(([messageType, more]) => (window as unknown as { sendToParent: (t: string, e?: unknown) => void }).sendToParent(messageType as string, more), [type, extra])
}

async function postFromCalendly(page: Page, event: string, origin = 'https://calendly.com') {
  await page.evaluate(
    ([eventName, from]) =>
      window.dispatchEvent(new MessageEvent('message', { origin: from, data: { event: eventName, payload: { invitee: { email: 'jane@example.com', name: 'Jane Doe' } } } })),
    [event, origin],
  )
}

test.describe('CTA destinations keep the allow-listed params', () => {
  for (const slug of evaluationSlugs) {
    test(`/${slug} buttons go to /evaluation and the header matches`, async ({ page }) => {
      await stubTypeform(page)
      await page.goto(`/${slug}${query}`)
      const expectedLabel = 'Start your evaluation'
      const ctas = page.locator('.landing-page [data-cta-location]')
      expect(await ctas.count()).toBeGreaterThanOrEqual(3)
      for (const href of await ctas.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href') ?? ''))) {
        const url = new URL(href, 'https://trylocaldoctor.com')
        expect(url.pathname).toBe('/evaluation')
        expect(url.origin).toBe('https://trylocaldoctor.com')
        for (const [key, value] of [['gclid', 'TEST_GCLID'], ['gbraid', 'TEST_GB'], ['wbraid', 'TEST_WB'], ['utm_source', 'google'], ['utm_medium', 'cpc'], ['utm_campaign', 'camp'], ['utm_term', 'memory'], ['utm_content', 'ad1']]) {
          expect(url.searchParams.get(key)).toBe(value)
        }
        expect(url.searchParams.get('email')).toBeNull()
        expect(href).not.toContain('jane')
        expect(href).not.toContain('typeform.com')
      }
      await expect(page.locator('[data-cta-location="hero"]')).toHaveText(expectedLabel)
      await expect(page.locator('.header-cta')).toHaveText(expectedLabel)

      await page.locator('[data-cta-location="hero"]').click()
      await expect(page).toHaveURL(/\/evaluation\?/)
      expect(page.url()).toContain('gclid=TEST_GCLID')
      expect(page.url()).not.toContain('jane')
      const sent = await events(page)
      const click = ga(sent, 'cta_click')
      expect(click).toHaveLength(1)
      expect(click[0].params).toMatchObject({ cta_label: expectedLabel, cta_location: 'hero', cta_destination: '/evaluation', page_path: `/${slug}` })
      expect(conversions(sent)).toEqual([{ send_to: `${adsId}/A54CCNK03bUdEOuoosxE` }])
    })
  }

  for (const slug of bookingSlugs) {
    test(`/${slug} buttons go to /get-started and the header matches`, async ({ page }) => {
      await page.goto(`/${slug}${query}`)
      const label = 'See open visit times'
      expect(landingPages[slug].ctaLabel).toBe(label)
      const ctas = page.locator('.landing-page [data-cta-location]')
      expect(await ctas.count()).toBeGreaterThanOrEqual(2)
      for (const href of await ctas.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href') ?? ''))) {
        const url = new URL(href, 'https://trylocaldoctor.com')
        expect(url.pathname).toBe('/get-started')
        expect(url.searchParams.get('gclid')).toBe('TEST_GCLID')
        expect(url.searchParams.get('utm_source')).toBe('google')
        expect(href).not.toContain('jane')
      }
      await expect(page.locator('[data-cta-location="hero"]')).toHaveText(label)
      await expect(page.locator('.header-cta')).toHaveText(label)

      await page.locator('[data-cta-location="hero"]').click()
      await expect(page).toHaveURL(/\/get-started\?.*gclid=TEST_GCLID/)
      const click = ga(await events(page), 'cta_click')
      expect(click).toHaveLength(1)
      expect(click[0].params).toMatchObject({ cta_label: label, cta_location: 'hero', cta_destination: '/get-started', page_path: `/${slug}` })
    })
  }

  test('the home hero logs the real button text, not Get Started', async ({ page }) => {
    await page.goto(`/${query}`)
    await page.locator('.hero-actions').getByRole('button', { name: 'Book a Neurologist today' }).click()
    await expect(page).toHaveURL(/\/get-started\?.*#book$/)
    const click = ga(await events(page), 'cta_click')
    expect(click).toHaveLength(1)
    expect(click[0].params).toMatchObject({ cta_label: 'Book a Neurologist today', cta_location: 'hero', cta_destination: '/get-started' })
  })

  test('the header button on other pages and on /evaluation points at the scheduler', async ({ page }) => {
    await stubTypeform(page)
    for (const path of ['/', '/how-it-works', '/evaluation', '/memory-doctor-near-me']) {
      await page.goto(`${path}${query}`)
      await expect(page.locator('.header-cta')).toHaveText('See open visit times')
    }
    await page.locator('.header-cta').click()
    await expect(page).toHaveURL(/\/get-started\?.*gclid=TEST_GCLID/)
  })

  test('the /get-started Book now jump logs a CTA click with the real text', async ({ page }) => {
    await page.goto(`/get-started${query}`)
    await page.locator('.page-hero-secondary a').click()
    const click = ga(await events(page), 'cta_click')
    expect(click).toHaveLength(1)
    expect(click[0].params).toMatchObject({ cta_label: 'Book now', cta_location: 'get_started_hero', cta_destination: '/get-started' })
  })
})

test.describe('/evaluation', () => {
  test('embeds the Typeform with the allow-listed params as hidden fields and is noindex', async ({ page }) => {
    await stubTypeform(page)
    const requests: string[] = []
    page.on('request', (request) => requests.push(request.url()))
    await page.goto(`/evaluation${query}`)

    await expect(page.locator('h1')).toHaveText('Start your evaluation')
    await expect(page.locator('.evaluation-trust')).toHaveText('Board-certified neurologist. Insurance accepted. No referral needed.')
    await expect(page).toHaveTitle('Start your evaluation | Local Doctor')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)

    const iframe = page.locator('.evaluation-form-widget iframe')
    await expect(iframe).toHaveCount(1)
    const src = new URL((await iframe.getAttribute('src')) ?? '')
    expect(`${src.origin}${src.pathname}`).toBe(`https://form.typeform.com/to/${EVALUATION_FORM_ID}`)
    const fragment = new URLSearchParams(src.hash.replace(/^#/, ''))
    for (const [key, value] of [['gclid', 'TEST_GCLID'], ['gbraid', 'TEST_GB'], ['wbraid', 'TEST_WB'], ['utm_source', 'google'], ['utm_medium', 'cpc'], ['utm_campaign', 'camp'], ['utm_term', 'memory'], ['utm_content', 'ad1']]) {
      expect(fragment.get(key), key).toBe(value)
    }
    const framed = decodeURIComponent(src.toString())
    expect(framed).not.toContain('jane')
    expect(framed).not.toContain('2403765730')
    expect(requests.some((url) => url.includes('localdoctor.typeform.com'))).toBe(false)

    const book = page.locator('.evaluation-book-link')
    await expect(book).toHaveText('See open visit times')
    const href = new URL((await book.getAttribute('href')) ?? '', 'https://trylocaldoctor.com')
    expect(href.pathname).toBe('/get-started')
    expect(href.searchParams.get('gclid')).toBe('TEST_GCLID')
    await expect(page.locator('script[data-local-doctor-chatbot]')).toHaveCount(0)
    await expect(page.locator('.page-hero-band').first()).toBeVisible()
  })

  test('form start and submit send only event names, the evaluation labels, and never the booking label', async ({ page }) => {
    await stubTypeform(page)
    const requestBodies: string[] = []
    page.on('request', (request) => requestBodies.push(`${request.url()} ${request.postData() ?? ''}`))
    await page.goto(`/evaluation${query}`)
    await expect(page.locator('.evaluation-form-widget iframe')).toHaveCount(1)
    await expect.poll(() => page.frames().some((frame) => frame.url().startsWith('https://form.typeform.com/'))).toBe(true)

    await sendFromForm(page, 'form-started')
    await sendFromForm(page, 'form-screen-changed', { ref: 'question_ref_1' })
    await sendFromForm(page, 'form-started')
    await expect.poll(async () => ga(await events(page), 'evaluation_started').length).toBe(1)

    await sendFromForm(page, 'form-submit', {
      answers: [{ field: { ref: 'email' }, email: 'jane@example.com' }],
      phone: '2403765730',
    })
    await sendFromForm(page, 'form-submit')
    await expect.poll(async () => ga(await events(page), 'evaluation_submitted').length).toBe(1)

    const sent = await events(page)
    expect(conversions(sent)).toEqual([
      { send_to: `${adsId}/r0XvCNW03bUdEOuoosxE` },
      { send_to: `${adsId}/vOMaCO613bUdEOuoosxE`, value: 100, currency: 'USD' },
    ])
    expect(sent.some((entry) => ['visit_booked', 'generate_lead'].includes(entry.name))).toBe(false)
    const everything = JSON.stringify(sent) + requestBodies.join('\n')
    expect(everything).not.toContain('KA47CJbG9LAdEOuoosxE')
    for (const secret of ['resp_secret_123', 'jane@example.com', '2403765730', 'question_ref_1']) {
      expect(JSON.stringify(sent), secret).not.toContain(secret)
      expect(requestBodies.filter((entry) => /^https?:\/\/[^/ ]*(google|doubleclick)/i.test(entry) && entry.includes(secret)), secret).toEqual([])
    }
    for (const entry of sent.filter((item) => item.name.startsWith('evaluation_'))) {
      expect(Object.keys(entry.params).sort()).toEqual(['form_name', 'page_path', 'send_to'])
    }
  })

})

test.describe('Calendly events on /get-started', () => {
  test('time selected and booked fire once, from calendly.com only', async ({ page }) => {
    await page.goto(`/get-started${query}`)

    await postFromCalendly(page, 'calendly.event_type_viewed')
    await postFromCalendly(page, 'calendly.event_type_viewed')
    await postFromCalendly(page, 'calendly.date_and_time_selected')
    await postFromCalendly(page, 'calendly.date_and_time_selected')
    await postFromCalendly(page, 'calendly.event_scheduled', 'https://evil.example')
    await postFromCalendly(page, 'calendly.event_scheduled', 'https://calendly.com.evil.com')
    let sent = await events(page)
    expect(ga(sent, 'visit_booked')).toHaveLength(0)
    expect(ga(sent, 'calendly_viewed')).toHaveLength(1)
    expect(ga(sent, 'calendly_time_selected')).toHaveLength(1)
    expect(conversions(sent)).toEqual([{ send_to: `${adsId}/CqZ_CKDm17UdEOuoosxE` }])

    await postFromCalendly(page, 'calendly.event_scheduled')
    await postFromCalendly(page, 'calendly.event_scheduled')
    sent = await events(page)
    expect(ga(sent, 'visit_booked')).toHaveLength(1)
    expect(ga(sent, 'generate_lead')).toHaveLength(1)
    expect(ga(sent, 'visit_booked')[0].params).toMatchObject({ booking_source: 'calendly', page_path: '/get-started' })
    expect(conversions(sent)).toEqual([
      { send_to: `${adsId}/CqZ_CKDm17UdEOuoosxE` },
      { send_to: `${adsId}/KA47CJbG9LAdEOuoosxE`, value: 300, currency: 'USD' },
    ])
    expect(JSON.stringify(sent)).not.toMatch(/jane|Jane Doe|@/)
  })
})

test.describe('phone taps and engaged visits', () => {
  test('phone tap reports to GA4 each time and to Ads once', async ({ page }) => {
    await page.goto(`/${query}`)
    const phone = page.locator('a[href="tel:+12403765730"]').first()
    await page.evaluate(() => document.addEventListener('click', (event) => event.preventDefault(), true))
    await phone.click()
    await phone.click()
    const sent = await events(page)
    expect(ga(sent, 'phone_tap')).toHaveLength(2)
    expect(ga(sent, 'phone_click')).toHaveLength(2)
    expect(conversions(sent)).toEqual([{ send_to: `${adsId}/gJr-CJnG9LAdEOuoosxE` }])
  })

  test('engaged visit needs 45 seconds visible and half the page scrolled, once', async ({ page }) => {
    await page.clock.install()
    await page.goto('/treatments')
    await page.waitForLoadState('load')
    await page.clock.runFor(ENGAGED_VISIT_MS + 5000)
    expect(ga(await events(page), 'engaged_visit')).toHaveLength(0)

    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
    await page.clock.runFor(2000)
    await page.clock.runFor(ENGAGED_VISIT_MS)
    const sent = await events(page)
    expect(ga(sent, 'engaged_visit')).toHaveLength(1)
    expect(conversions(sent)).toEqual([{ send_to: `${adsId}/DTk2CPG13bUdEOuoosxE` }])
    await page.clock.runFor(ENGAGED_VISIT_MS * 2)
    expect(ga(await events(page), 'engaged_visit')).toHaveLength(1)
  })

  test('scrolling alone is not an engaged visit', async ({ page }) => {
    await page.clock.install()
    await page.goto('/treatments')
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
    await page.clock.runFor(ENGAGED_VISIT_MS - 10_000)
    expect(ga(await events(page), 'engaged_visit')).toHaveLength(0)
  })
})

test.describe('page shells and copy', () => {
  test('/get-started and /evaluation have their own titles and the booking trust line', async ({ page }) => {
    await page.goto('/get-started')
    await expect(page).toHaveTitle('Book a video visit with a neurologist | Local Doctor')
    await expect(page.locator('.booking-trust')).toHaveText(
      'Video visit, about 1 hour. Board-certified neurologist. Insurance accepted. No referral needed.',
    )
    await page.goto('/evaluation')
    await expect(page).toHaveTitle('Start your evaluation | Local Doctor')
  })

  test('touched pages carry no long dashes', async ({ page }) => {
    for (const path of ['/get-started', '/evaluation']) {
      await page.goto(path)
      await expect(page.locator('h1')).toBeVisible()
      expect(await page.locator('main').innerText()).not.toMatch(/[\u2013\u2014]/)
    }
  })
})
