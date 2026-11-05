import { defineConfig, devices } from '@playwright/test'

// Checks a deployed site: LIVE_BASE_URL=https://trylocaldoctor.com npx playwright test -c playwright.live.config.ts
// Read-only. It opens pages and the intake but never submits a form or places a call.
export default defineConfig({
  testDir: 'tests-live',
  retries: 1,
  use: {
    baseURL: process.env.LIVE_BASE_URL ?? 'https://trylocaldoctor.com',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
})
