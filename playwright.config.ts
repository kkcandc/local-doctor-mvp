import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://127.0.0.1:5175',
    trace: 'retain-on-failure',
    // The site-wide chatbot embed loads more scripts and an iframe from this host. Keep test
    // runs off the network for it so page loads stay fast and nothing talks to the live agent.
    // The /get-started Calendly scheduler is kept off the network the same way, so no test books
    // against the live calendar. Specs that need its widget script stub it with page.route.
    launchOptions: {
      args: [
        // Google collection endpoints are blocked as well, so a test run never sends a hit or a
        // conversion to GA4 or Ads. gtag.js still loads from googletagmanager.com and builds its requests.
        // The Typeform embed (form.typeform.com) is stubbed per test with page.route.
        `--host-resolver-rules=${[
          'forms.mylocalinfusion.com',
          'assets.calendly.com',
          'calendly.com',
          'www.google.com',
          'google.com',
          'www.googleadservices.com',
          'googleadservices.com',
          'google-analytics.com',
          '*.google-analytics.com',
          'analytics.google.com',
          '*.analytics.google.com',
          '*.doubleclick.net',
        ]
          .map((host) => `MAP ${host} ~NOTFOUND`)
          .join(', ')}`,
      ],
    },
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
