import { expect, test } from '@playwright/test'

const LIGHT_BLUE = 'rgb(140, 196, 245)'
const YELLOW = 'rgb(255, 229, 138)'
const DASHES = /[–—]/

test.describe('home page', () => {
  test('hero reads Finally. Today. and the CTA says Book a Neurologist today', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toHaveText("Treatment that slows down Alzheimer's. Finally. Today.")
    await expect(page.locator('.hero-actions').getByRole('button', { name: 'Book a Neurologist today' })).toBeVisible()
    await page.locator('.hero-actions').getByRole('button', { name: 'Book a Neurologist today' }).click()
    await expect(page).toHaveURL(/\/get-started$/)
  })

  test('the banner shows In days, and only In days and 1,500+ are light blue', async ({ page }) => {
    await page.goto('/')
    const stats = page.locator('.stat-band article')
    await expect(stats).toHaveCount(4)
    await expect(stats.locator('strong')).toHaveText(['3.5 years', '6-9 months', 'In days', '1,500+'])
    await expect(stats.nth(2).locator('span')).toHaveText('See a board-certified Neurologist in days from the comfort of your home')
    const colors = await stats.locator('strong').evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).color))
    expect(colors).toEqual([YELLOW, YELLOW, LIGHT_BLUE, LIGHT_BLUE])
  })

  test('the first section asks for a fast, credible answer', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 2, name: "We're designed around one goal: a fast, credible answer on treatment options." })).toBeVisible()
  })

  test('how it works shows the new header and four steps, and Book now opens Get Started', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 2, name: 'Real treatment in 4 easy steps and an answer in days' })).toBeVisible()
    const steps = page.locator('.process-grid article')
    await expect(steps.locator('h3')).toHaveText([
      'Book visit with a neurologist',
      'Meet your specialist',
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

  test('the page has no long dashes', async ({ page }) => {
    await page.goto('/')
    expect(await page.locator('main').innerText()).not.toMatch(DASHES)
  })
})

test.describe('how it works page', () => {
  test('hero header, copy, and Book now button', async ({ page }) => {
    await page.goto('/how-it-works')
    await expect(page.locator('h1')).toHaveText('A fast path you can trust from first concern to treatment.')
    await expect(page.locator('.page-hero p').last()).toHaveText(
      'Our trusted team of neurology specialists has over 20 years of experience in treating dementia and mild cognitive impairment.',
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
      'Book a same-week appointment with a Neurologist',
      'Meet your specialist',
      'Get your tests done and review results in a follow up visit',
      'Treatment begins',
    ])
    const bullets = (index: number) => steps.nth(index).locator('.journey-points span')
    await expect(bullets(0)).toHaveText([
      'Book your appointment today - our providers are available to see you every Wednesday',
      'You will receive an appointment confirmation via text or email, whichever you prefer',
      'We will be in touch with you on the same day or the next business day to share more information about the visit, confirm eligibility, and answer any questions you have',
    ])
    await expect(bullets(1)).toHaveText([
      'You and a loved one attend the visit to share your concerns, questions, and provide all information needed for the evaluation by your specialist including medical history, medications, recent testing, and more.',
      'Your specialist shares their clinical summary and recommended plan of care with you. It may include orders for new tests such as an MRI or PET scan, bloodwork, and genetic testing.',
    ])
    await expect(bullets(2)).toHaveText([
      'If new test orders were placed with your care plan, you schedule appointments with a local imaging center and a lab (Quest or LabCorp) to get them completed.',
      'Your neurologist reviews the test results and a follow up appointment is scheduled for you to discuss them together.',
      'You and a loved one attend the follow up visit to review your results and treatment options with the specialist and align on the path that is best for you.',
    ])
    await expect(bullets(3)).toHaveCount(3)
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
