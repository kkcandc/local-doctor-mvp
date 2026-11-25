import { expect, test } from '@playwright/test'
import { landingSlugs } from '../src/landing/landingMeta'

const LIGHT_BLUE = 'rgb(140, 196, 245)'
const YELLOW = 'rgb(255, 229, 138)'
const DASHES = /[–—]/

test.describe('home page', () => {
  test('hero header is about memory and thinking, and the CTA says Speak with a neurologist', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.hero h1')).toHaveText('Get specialist care and treatment for changes in memory and thinking')
    await expect(page.locator('.hero h1 em')).toHaveText('memory and thinking')
    await expect(page.locator('.hero .eyebrow')).toHaveCount(0)
    await expect(page.locator('.hero')).not.toContainText("Virtual Alzheimer's specialty clinic")
    await expect(page.locator('.hero-actions').getByRole('button', { name: 'Speak with a neurologist' })).toBeVisible()
    await page.locator('.hero-actions').getByRole('button', { name: 'Speak with a neurologist' }).click()
    await expect(page).toHaveURL(/\/get-started#book$/)
  })

  test('the hero button lands on the booking section of Get Started, keeping ad click ids', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 })
    await page.goto('/?gclid=test_gclid_123&utm_source=google')
    await page.locator('.hero-actions').getByRole('button', { name: 'Speak with a neurologist' }).click()
    await expect(page).toHaveURL(/\/get-started\?gclid=test_gclid_123&utm_source=google#book$/)
    // Wait for the scroll to finish with the section just below the sticky header.
    await expect
      .poll(() =>
        page.evaluate(() => {
          const top = document.getElementById('book')!.getBoundingClientRect().top
          const headerBottom = document.querySelector('.site-header')!.getBoundingClientRect().bottom
          return top >= headerBottom - 1 && top < 200
        }),
      )
      .toBe(true)
    await expect(page.locator('#book .calendly-inline-widget')).toBeInViewport()
  })

  test('the hero sub-header says the path to better care starts here', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.hero-copy > p').first()).toHaveText(
      'Your path to better care starts here. With neurologists who care and tailor treatment to your specific needs.',
    )
  })

  test('the hero is a light blue wash over the family photo, with dark blue text', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.hero-image')).toHaveAttribute('src', '/assets/hero-home-family.webp')
    await expect(page.locator('.hero-image')).toHaveJSProperty('complete', true)
    // The wash is light blue at 0.88 opaque (not the old dark blue), and the text on it is dark blue.
    await expect(page.locator('.hero-overlay')).toHaveCSS('background-color', 'rgba(228, 240, 251, 0.88)')
    await expect(page.locator('.hero h1')).toHaveCSS('color', 'rgb(10, 44, 99)')
    await expect(page.locator('.hero-actions .primary')).toHaveCSS('background-color', 'rgb(15, 63, 140)')
  })

  test('on a standard desktop the hero fills most of the screen and half the stat band shows below it', async ({ page }) => {
    for (const viewport of [
      { width: 1366, height: 768 },
      { width: 1440, height: 900 },
      { width: 1920, height: 1080 },
    ]) {
      const label = `${viewport.width}x${viewport.height}`
      await page.setViewportSize(viewport)
      await page.goto('/')
      const hero = (await page.locator('.hero').boundingBox())!
      const band = (await page.locator('.stat-band').boundingBox())!
      // The whole hero is in view, with no scrolling, and it takes the large majority of the screen.
      expect(hero.y + hero.height, label).toBeLessThanOrEqual(viewport.height)
      expect(hero.height, label).toBeGreaterThanOrEqual(viewport.height * 0.65)
      // The band starts about 100px above the bottom edge and runs past it, so about half of it shows.
      expect(band.y, label).toBeGreaterThanOrEqual(viewport.height - 140)
      expect(band.y, label).toBeLessThanOrEqual(viewport.height - 60)
      expect(band.y + band.height, label).toBeGreaterThan(viewport.height)
    }
  })

  test('on a phone the hero stays as tall as its text', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    const hero = (await page.locator('.hero').boundingBox())!
    expect(hero.height).toBeLessThan(812 * 0.8)
  })

  test('the hero text column is about 25% wider than the old 590px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    const width = (await page.locator('.hero-copy').boundingBox())!.width
    expect(width).toBeGreaterThanOrEqual(720)
    expect(width).toBeLessThanOrEqual(760)
  })

  test('the Dementia specialists card has the new copy', async ({ page }) => {
    await page.goto('/')
    const card = page.locator('.value-card').filter({ has: page.getByRole('heading', { name: 'Dementia specialists' }) })
    await expect(card.locator('p')).toHaveText(
      'A valued, credible opinion from board-certified neurologists who specialize in dementia and cognitive impairment, not general memory care.',
    )
  })

  test('the banner shows From home, and only From home and 1,500+ are light blue', async ({ page }) => {
    await page.goto('/')
    const stats = page.locator('.stat-band article')
    await expect(stats).toHaveCount(4)
    await expect(stats.locator('strong')).toHaveText(['3.5 years', '6-9 months', 'From home', '1,500+'])
    await expect(stats.nth(2).locator('span')).toHaveText('Video visits with a board-certified neurologist from the comfort of your home')
    const colors = await stats.locator('strong').evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).color))
    expect(colors).toEqual([YELLOW, YELLOW, LIGHT_BLUE, LIGHT_BLUE])
  })

  test('the first section asks for a clear, credible answer', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 2, name: "We're designed around one goal: a clear, credible answer on treatment options." })).toBeVisible()
  })

  test('how it works shows the new header and four steps, and Book now opens Get Started', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 2, name: 'Real treatment in 4 easy steps' })).toBeVisible()
    const steps = page.locator('.process-grid article')
    await expect(steps.locator('h3')).toHaveText([
      'Book visit with a neurologist',
      'Meet neurologist',
      'Get a clear answer',
      'Start treatment',
    ])
    await expect(steps.nth(0).locator('p')).toHaveText(
      "Schedule your appointment now and we'll get in touch with you to share more information about your visit and what to expect.",
    )
    await expect(steps.nth(1).locator('p')).toHaveText(
      'A video call with the neurologist to dive into your questions, concerns, and goals. It all leads to clear direction on next steps and if new imaging or bloodwork are needed.',
    )
    await expect(steps.nth(2).locator('p')).toHaveText(
      'The neurologist uses your results and medical history to provide a clear answer on diagnosis and treatment options.',
    )
    await expect(steps.nth(3).locator('p')).toHaveText(
      'Patients who qualify for and opt in to infusion treatment are treated seamlessly at a local infusion center.',
    )
    await expect(page.locator('.process-grid button')).toHaveCount(1)
    await steps.nth(0).getByRole('button', { name: 'Book now' }).click()
    await expect(page).toHaveURL(/\/get-started$/)
  })

  test('neurologist is lower case everywhere, including the hero button', async ({ page }) => {
    await page.goto('/')
    const text = await page.locator('main').innerText()
    expect(text).not.toContain('Neurologist')
    await expect(page.locator('.hero-actions').getByRole('button', { name: 'Speak with a neurologist' })).toHaveText(
      'Speak with a neurologist',
    )
  })

  test('the page has no long dashes', async ({ page }) => {
    await page.goto('/')
    expect(await page.locator('main').innerText()).not.toMatch(DASHES)
  })

  test('the bottom banner asks to book a visit and its button says Book now', async ({ page }) => {
    await page.goto('/')
    const panel = page.locator('.conversion-panel')
    await expect(panel.locator('h2')).toHaveText('Book a video visit with a board-certified neurologist.')
    await expect(panel.locator('p:not(.eyebrow)')).toHaveText(
      'Our neurologists specialize in cognitive impairment and can help you understand your treatment options. Insurance accepted, including Medicare.',
    )
    await expect(panel.getByRole('button', { name: 'Get Started' })).toHaveCount(0)
    await panel.getByRole('button', { name: 'Book now' }).click()
    await expect(page).toHaveURL(/\/get-started$/)
  })
})

// The How it works banner says "neurologist" in lower case. The Treatments banner keeps "Neurologist".
for (const [path, title, other] of [
  ['/how-it-works', 'Ready to meet with a neurologist?', 'See treatments'],
  ['/treatments', 'Ready to meet with a Neurologist?', 'See how it works'],
] as const) {
  test(`${path} bottom banner asks to meet a neurologist and its button says Book now`, async ({ page }) => {
    await page.goto(path)
    const panel = page.locator('.conversion-panel')
    await expect(panel.locator('h2')).toHaveText(title)
    await expect(panel.locator('p')).toHaveText('Book a video visit with a board-certified neurologist. Insurance accepted, including Medicare.')
    await expect(panel.getByRole('button', { name: 'Get Started' })).toHaveCount(0)
    await expect(panel.getByRole('button', { name: other })).toBeVisible()
    await panel.getByRole('button', { name: 'Book now' }).click()
    await expect(page).toHaveURL(/\/get-started$/)
  })
}

test.describe('how it works page', () => {
  test('hero header, copy, and Book now button', async ({ page }) => {
    await page.goto('/how-it-works')
    await expect(page.locator('h1')).toHaveText('A clear path you can trust from first concern to treatment')
    await expect(page.locator('.page-hero p').last()).toHaveText(
      "Our trusted team of neurologists and specialists have over 20 years of experience in treating Alzheimer's disease, dementia, and mild cognitive impairment. We can help you understand what you might be facing and your best options going forward.",
    )
    const hero = page.locator('.page-hero').getByRole('button', { name: 'Book now' })
    await expect(hero).toBeVisible()
    await expect(page.locator('.page-hero').getByRole('button', { name: 'Get Started' })).toHaveCount(0)
    await hero.click()
    await expect(page).toHaveURL(/\/get-started$/)
  })

  test('the four steps have the new titles and bullets', async ({ page }) => {
    await page.goto('/how-it-works')
    const steps = page.locator('.journey-step')
    await expect(steps.locator('h3')).toHaveText([
      'Book your appointment with a neurologist',
      'Meet neurologist',
      'Get your tests done and review results in a follow up visit',
      'Treatment begins',
    ])
    const bullets = (index: number) => steps.nth(index).locator('.journey-points span')
    await expect(bullets(0)).toHaveText([
      'Pick a time for a video visit online or by phone. Our neurologists specialize in cognitive impairment and disease-modifying treatments.',
    ])
    await expect(bullets(1)).toHaveText([
      'You and a loved one attend the visit to share your concerns, questions, and provide all information needed for the evaluation by the neurologist including medical history, medications, recent testing, and more.',
      'The neurologist shares their clinical summary and recommended plan of care with you. It may include orders for new tests such as an MRI or PET scan, bloodwork, and genetic testing.',
    ])
    await expect(bullets(2)).toHaveText([
      'If new test orders were placed with your care plan, you schedule appointments with a local imaging center and a lab (Quest or LabCorp) to get them completed.',
      'Your neurologist reviews the test results and a follow up appointment is scheduled for you to discuss them together.',
      'You and a loved one attend the follow up visit to review your results and treatment options with the specialist and align on the path that is best for you.',
    ])
    await expect(bullets(3)).toHaveCount(3)
  })

  test('the page writes neurologist in lower case and never says "our providers"', async ({ page }) => {
    await page.goto('/how-it-works')
    const text = await page.locator('main').innerText()
    expect(text).not.toContain('Neurologist')
    expect(text).not.toMatch(/our providers/i)
    expect(text).toContain('Our neurologists specialize in cognitive impairment and disease-modifying treatments.')
    expect(text).not.toContain('Wednesday')
  })

  test('the services FAQ has the new answer', async ({ page }) => {
    await page.goto('/how-it-works')
    const item = page.locator('.mini-faq-list article').filter({ has: page.getByRole('heading', { name: 'What services does Local Doctor provide?' }) })
    await expect(item.locator('p')).toHaveText(
      "Local Doctor is a virtual Alzheimer's clinic focused on accelerating access to life-changing therapies. Our initial focus is evaluation, diagnosis, treatment eligibility, treatment initiation, and required oversight of disease-modifying therapies. Whether you already have a neurologist or you're searching for one, Local Doctor is designed to help you find treatment faster. We complement your existing doctors and will work with them as needed.",
    )
  })

  test('every step bullet ends with a period', async ({ page }) => {
    await page.goto('/how-it-works')
    const bullets = await page.locator('.journey-points span').allTextContents()
    expect(bullets).toHaveLength(9)
    for (const bullet of bullets) expect(bullet.trim(), bullet).toMatch(/\.$/)
  })

  test('step 1 has a Book now button instead of the Phone call pill, and the other steps keep their pills', async ({ page }) => {
    await page.goto('/how-it-works')
    const steps = page.locator('.journey-step')
    await expect(page.getByText('Phone call')).toHaveCount(0)
    await expect(steps.nth(0).locator('.journey-heading span')).toHaveCount(0)
    await expect(steps.nth(1).locator('.journey-heading span')).toHaveText('Video visit - 1 hour')
    await expect(steps.nth(2).locator('.journey-heading span')).toHaveText('Local + Virtual')
    await expect(steps.nth(3).locator('.journey-heading span')).toHaveText('Local')
    await steps.nth(0).getByRole('button', { name: 'Book now' }).click()
    await expect(page).toHaveURL(/\/get-started$/)
  })
})

const OUT_OF_POCKET =
  'Provider visits with our neurology specialists will be at low to no out-of-pocket cost to you, depending on your insurance coverage. In case you need new labs and imaging exams to confirm a diagnosis or for treatment prescription, their cost will depend on the sites you use and your insurance coverage.'

const SERVICES_ANSWER =
  "Local Doctor is a virtual Alzheimer's clinic focused on accelerating access to life-changing therapies. Our initial focus is evaluation, diagnosis, treatment eligibility, treatment initiation, and required oversight of disease-modifying therapies. Whether you already have a neurologist or you're searching for one, Local Doctor is designed to help you find treatment faster. We complement your existing doctors and will work with them as needed."

test.describe('FAQ page', () => {
  // Each FAQ opens as an accordion, one at a time. Check the question, then its answer.
  async function answerFor(page: import('@playwright/test').Page, question: string) {
    const button = page.getByRole('button', { name: question, exact: true })
    // The first FAQ is open on load, and clicking an open one closes it.
    if ((await button.getAttribute('aria-expanded')) !== 'true') await button.click()
    return page.locator('.faq-accordion article.open p')
  }

  test('the services question is first under Getting Started and open by default', async ({ page }) => {
    await page.goto('/faq')
    const items = page.locator('#getting-started .faq-accordion article')
    await expect(items.first().locator('button span')).toHaveText('What services does Local Doctor provide?')
    await expect(items.first()).toHaveClass(/open/)
    await expect(items.first().locator('p')).toHaveText(SERVICES_ANSWER)
    await expect(items.nth(1).locator('button span')).toHaveText('Who is eligible for services?')
    // The same question is not repeated in another category.
    await expect(page.getByRole('button', { name: 'What services does Local Doctor provide?' })).toHaveCount(1)
  })

  test('the How it works FAQ shows the same services answer', async ({ page }) => {
    await page.goto('/how-it-works')
    const item = page.locator('.mini-faq-list article').filter({ has: page.getByRole('heading', { name: 'What services does Local Doctor provide?' }) })
    await expect(item.locator('p')).toHaveText(SERVICES_ANSWER)
  })

  test('questions and answers have the new copy', async ({ page }) => {
    await page.goto('/faq')
    const cases: Array<[string, string]> = [
      [
        'Who is eligible for services?',
        "Adults experiencing cognitive symptoms or with dementia or Alzheimer's disease residing in Maryland or Virginia are commonly strong candidates for our program. We will confirm via a quick phone call after you schedule your visit, before your appointment.",
      ],
      [
        'How does the eligibility check work?',
        "Our eligibility process is simple - we will call you after you schedule your appointment and the call should take 15-30 minutes. Please have the patient's insurance details, medication list, and medical history handy to make it go smoother.",
      ],
      ['How much will this cost?', OUT_OF_POCKET],
      [
        'Which insurance plans are currently accepted?',
        "We accept many insurances including Medicare, Medicaid, Aetna, CareFirst, Cigna, Kaiser, and United. If you don't see your insurance on this list, we may still accept it and will confirm when we speak with you.",
      ],
      [
        'How does the first visit with the provider work and how long will it be?',
        'You will receive a visit confirmation email and reminders to your contact method of choice, including on the day of the visit, that will have the link to join the video call for the first visit. This visit should last about 1 hour. Please ensure you are in a setting with strong access to Wi-Fi or data service with a device that has video and audio capabilities. It would be valuable and preferable for you to join with a care partner or family member who is involved in your care and day-to-day life so they can help answer any questions during the evaluation by the provider. If you have any other questions about this visit just let us know when you speak to us before the appointment!',
      ],
      [
        'Is everything virtual or is there any in-person component?',
        'The clinical virtual visits happen via a video platform. MRIs, PET Scans, bloodwork, and the infusions themselves happen at in-person facilities of your choice.',
      ],
      [
        'Where do infusions take place?',
        'If treatment is clinically appropriate, infusions take place at a local infusion center that is most convenient for you.',
      ],
      [
        'Who do I contact in a medical emergency?',
        'Call 911 immediately. Local Doctor provides specialist evaluation and treatment. It does not replace emergency care. After receiving 911 or emergency services, please let us know so that our Neurologist team can stay in the loop, understand your situation, and help however they can.',
      ],
    ]
    for (const [question, answer] of cases) {
      await expect(await answerFor(page, question), question).toHaveText(answer)
    }
    await expect(page.getByRole('button', { name: 'How long does the eligibility process take?' })).toHaveCount(0)
  })

  test('"Who is eligible for services?" links "schedule your visit" to the booking section', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 })
    await page.goto('/faq?gclid=test_gclid_123')
    const answer = await answerFor(page, 'Who is eligible for services?')
    const link = answer.getByRole('link', { name: 'schedule your visit' })
    await expect(link).toHaveCount(1)
    await expect(link).toHaveAttribute('href', '/get-started?gclid=test_gclid_123#book')
    await link.click()
    await expect(page).toHaveURL(/\/get-started\?gclid=test_gclid_123#book$/)
    await expect(page.locator('#book .calendly-inline-widget')).toBeInViewport()
  })

  test('"How soon can I be seen?" links to the booking section', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 })
    await page.goto('/faq?gclid=test_gclid_123')
    const answer = await answerFor(page, 'How soon can I be seen?')
    await expect(answer).toHaveText(
      'Availability depends on our neurologists\' schedules. Click here to see current open visit times and pick the one that works best for you.',
    )
    const link = answer.getByRole('link', { name: 'Click here' })
    await expect(link).toHaveAttribute('href', '/get-started?gclid=test_gclid_123#book')
    await link.click()
    await expect(page).toHaveURL(/\/get-started\?gclid=test_gclid_123#book$/)
    await expect(page.locator('#book .calendly-inline-widget')).toBeInViewport()
  })

  test('"Do I need a referral" links to the booking section', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 })
    await page.goto('/faq')
    const answer = await answerFor(page, 'Do I need a referral from my current doctor?')
    await expect(answer).toHaveText(
      'No referral is needed. Book your virtual visit here, and we will call you within a day or so to confirm your eligibility and insurance prior to the appointment.',
    )
    await answer.getByRole('link', { name: 'Book your virtual visit here' }).click()
    await expect(page).toHaveURL(/\/get-started#book$/)
    await expect(page.locator('#book .calendly-inline-widget')).toBeInViewport()
  })

  test('the "Did not find your answer?" band lists chat, email and phone', async ({ page }) => {
    await page.goto('/faq')
    const band = page.locator('.question-band')
    await expect(band.locator('h2')).toHaveText('Did not find your answer?')
    await expect(band.locator('p')).toHaveText(
      'Our care team can help address any other question you have via the live chat option on this website, emailing hello@trylocaldoctor.com, or texting/calling (240) 376-5730.',
    )
  })
})

test('the How it works FAQ spells out-of-pocket with hyphens', async ({ page }) => {
  await page.goto('/how-it-works')
  const item = page.locator('.mini-faq-list article').filter({ has: page.getByRole('heading', { name: 'How much will this cost?' }) })
  await expect(item.locator('p')).toHaveText(OUT_OF_POCKET)
  expect(await page.locator('main').innerText()).not.toContain('out of pocket')
})

test('the blog hero has the new header and copy, and each post still credits Local Infusion', async ({ page }) => {
  await page.goto('/blog')
  await expect(page.locator('h1')).toHaveText('Our resources can help guide you along your journey')
  await expect(page.locator('.page-hero p').last()).toHaveText('We look forward to helping you find the best care possible.')
  await page.locator('.blog-card').first().click()
  await expect(page.getByText('Originally published by')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Local Infusion', exact: true })).toBeVisible()
})

// A hero header carries no trailing period, unless it is two sentences (two or more periods).
test.describe('hero headers have no trailing period', () => {
  const paths = [
    '/',
    '/treatments',
    '/how-it-works',
    '/about',
    '/get-started',
    '/refer-a-patient',
    '/faq',
    '/blog',
    '/services',
    '/services/memory-evaluation',
    '/lp/a',
    '/lp/b',
    '/lp/c',
    ...landingSlugs.map((slug) => `/${slug}`),
  ]

  for (const path of paths) {
    test(path, async ({ page }) => {
      await page.goto(path)
      const text = ((await page.locator('h1').first().textContent()) ?? '').trim()
      expect(text.length).toBeGreaterThan(0)
      if (text.endsWith('.')) expect((text.match(/\./g) ?? []).length, text).toBeGreaterThanOrEqual(2)
    })
  }
})
