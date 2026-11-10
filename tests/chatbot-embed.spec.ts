import { expect, test } from '@playwright/test'
import { publicSitemapPaths } from '../src/siteMap'

// The chatbot tag is added by src/chatbot.ts, not by index.html. It is never loaded on the
// booking and evaluation pages, loads after window load on desktop, and waits for a scroll (or a
// long idle) on mobile so it cannot cover the hero reassurance line.
// playwright.config.ts blocks the chatbot host, so these checks never reach the live agent.
const CHATBOT_SCRIPT =
  'script[src="https://forms.mylocalinfusion.com/agent/embedjs/01a1b1d2aee870008666e6dab388dee90d6f/embed.js"]'
const hiddenPaths = ['/get-started', '/evaluation']

test.describe('chatbot embed on desktop', () => {
  for (const path of publicSitemapPaths.filter((item) => !hiddenPaths.includes(item))) {
    test(`${path} adds the chatbot script once, loaded async`, async ({ page }) => {
      await page.goto(path)
      const tag = page.locator(CHATBOT_SCRIPT)
      await expect(tag).toHaveCount(1)
      await expect(tag).toHaveAttribute('async', '')
    })
  }

  for (const path of hiddenPaths) {
    test(`${path} never loads the chatbot`, async ({ page }) => {
      await page.goto(path)
      await page.waitForTimeout(1500)
      await expect(page.locator(CHATBOT_SCRIPT)).toHaveCount(0)
      await expect(page.locator('html')).toHaveAttribute('data-chatbot-hidden', 'true')
    })
  }

  test('navigating into /get-started in the app hides the chatbot', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator(CHATBOT_SCRIPT)).toHaveCount(1)
    await page.locator('.hero-actions').getByRole('button', { name: 'Book a Neurologist today' }).click()
    await expect(page).toHaveURL(/\/get-started/)
    await expect(page.locator('html')).toHaveAttribute('data-chatbot-hidden', 'true')
  })

  test('the app still renders when the chatbot host is unreachable', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1').first()).toBeVisible()
  })
})

test.describe('chatbot embed on mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('waits for a scroll before adding the chatbot script', async ({ page }) => {
    await page.goto('/dementia-evaluation')
    await page.waitForTimeout(1500)
    await expect(page.locator(CHATBOT_SCRIPT)).toHaveCount(0)
    await page.evaluate(() => window.scrollTo(0, 1500))
    await expect(page.locator(CHATBOT_SCRIPT)).toHaveCount(1)
  })
})
