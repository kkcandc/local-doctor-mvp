import { expect, test } from '@playwright/test'
import { publicSitemapPaths } from '../src/siteMap'

// Every route is served from the one index.html shell, so the chatbot tag must be on each
// public page exactly once. It loads async so a slow chatbot host cannot hold up the app.
// playwright.config.ts blocks the chatbot host, so these checks never reach the live agent.
const CHATBOT_SCRIPT =
  'script[src="https://forms.mylocalinfusion.com/agent/embedjs/01a1b1d2aee870008666e6dab388dee90d6f/embed.js"]'

test.describe('site-wide chatbot embed', () => {
  for (const path of publicSitemapPaths) {
    test(`${path} includes the chatbot script once, loaded async`, async ({ page }) => {
      await page.goto(path)
      const tag = page.locator(CHATBOT_SCRIPT)
      await expect(tag).toHaveCount(1)
      await expect(tag).toHaveAttribute('async', '')
    })
  }

  test('the app still renders when the chatbot host is unreachable', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1').first()).toBeVisible()
  })
})
