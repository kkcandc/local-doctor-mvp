import { expect, test, type Page } from '@playwright/test'

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

async function scrollToBottom(page: Page) {
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
}

// Deliberately not polled: the user must already be at the top once the new page is on screen,
// not eventually, so an animated scroll that is still running counts as a failure.
async function expectAtTop(page: Page) {
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
}

test('mobile menu links land at the top of the new page after scrolling to the footer', async ({ page }) => {
  await page.goto('/')
  await scrollToBottom(page)

  await page.getByRole('button', { name: 'Open menu' }).click()
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'Treatments' }).click()

  await expect(page.getByRole('heading', { level: 1, name: /FDA-approved treatments/ })).toBeVisible()
  await expectAtTop(page)
})

test('footer links land at the top of the new page', async ({ page }) => {
  await page.goto('/')
  await scrollToBottom(page)

  await page.locator('footer').getByRole('button', { name: 'How it works' }).click()
  await expect(page).toHaveURL(/\/how-it-works$/)
  await expectAtTop(page)

  await scrollToBottom(page)
  await page.locator('footer').getByRole('button', { name: 'FAQs' }).click()
  await expect(page.getByRole('heading', { level: 1, name: /Answers to what patients/ })).toBeVisible()
  await expectAtTop(page)
})

test('blog cards land at the top of the post', async ({ page }) => {
  await page.goto('/blog')
  await scrollToBottom(page)

  await page.locator('.blog-card').first().click()
  await expect(page).toHaveURL(/\/blog\/.+/)
  await expectAtTop(page)
})

test('the footer logo scrolls the home page back to the top', async ({ page }) => {
  await page.goto('/')
  await scrollToBottom(page)

  await page.locator('footer').getByRole('link', { name: 'Local Doctor home' }).click()
  await expectAtTop(page)
})

test('in-page section links keep scrolling to their section', async ({ page }) => {
  await page.goto('/faq')

  const firstJump = page.locator('.faq-jump-list a').nth(1)
  const target = (await firstJump.getAttribute('href'))!.slice(1)
  await firstJump.click()

  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  await expect
    .poll(() => page.evaluate((id) => Math.round(document.getElementById(id)!.getBoundingClientRect().top), target))
    .toBeLessThan(200)
})
