import { mkdirSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { landingCanonical, landingMeta, landingSlugs } from '../src/landing/landingMeta'

const screenshotDir = process.env.SCREENSHOT_DIR

for (const slug of landingSlugs) {
  test(`/${slug} is live with its own metadata and a working Get Started`, async ({ page, request }, testInfo) => {
    const response = await request.get(`/${slug}`)
    expect(response.status()).toBe(200)
    const html = await response.text()
    expect(html).toContain(`<title>${landingMeta[slug].title.replace(/&/g, '&amp;')}</title>`)
    expect(html).toContain(`<link rel="canonical" href="${landingCanonical(slug)}" />`)

    await page.goto(`/${slug}`)
    await expect(page.locator(`.landing-page[data-landing="${slug}"]`)).toBeVisible()
    await expect(page).toHaveTitle(landingMeta[slug].title)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', landingCanonical(slug))
    expect(await page.locator('a[href*="livspecialtycare" i]').count()).toBe(0)
    expect(await page.locator('main').innerText()).not.toMatch(/[\u2013\u2014]/)
    await page.waitForLoadState('load')
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0)

    if (screenshotDir) {
      mkdirSync(screenshotDir, { recursive: true })
      await page.screenshot({ path: `${screenshotDir}/${testInfo.project.name}-${slug}.png` })
    }

    const hero = page.locator('[data-cta-location="hero"]')
    await expect(hero).toHaveText('Get Started')
    await expect(hero).toHaveAttribute('href', '/get-started')
    await hero.click()
    await expect(page).toHaveURL(/\/get-started$/)
    await expect(page.locator('.typeform-live-embed iframe')).toBeVisible({ timeout: 20_000 })

    if (screenshotDir && slug === 'dementia-evaluation') {
      await page.waitForTimeout(1500)
      await page.screenshot({ path: `${screenshotDir}/${testInfo.project.name}-cta-intake.png` })
    }
  })
}
