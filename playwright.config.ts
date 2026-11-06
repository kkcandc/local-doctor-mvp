import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://127.0.0.1:5175',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5175 --strictPort',
    url: 'http://127.0.0.1:5175',
    reuseExistingServer: false,
    timeout: 120_000,
    // Point PostHog at a path on the dev server so test runs never reach a real project.
    // Ads and GA ids match production so landing-route tracking tests can assert real tags.
    env: {
      VITE_POSTHOG_KEY: 'phc_playwright_test_token',
      VITE_POSTHOG_HOST: 'http://127.0.0.1:5175/__posthog',
      VITE_GOOGLE_ADS_ID: 'AW-18413556843',
      VITE_GOOGLE_ADS_LEAD_LABEL: 'KA47CJbG9LAdEOuoosxE',
      VITE_GOOGLE_ADS_PHONE_LABEL: 'gJr-CJnG9LAdEOuoosxE',
      VITE_GA_MEASUREMENT_ID: 'G-PR7CJ8TK79',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
