import { defineConfig } from '@playwright/test'
import base from './playwright.config'

/*
  Runs the regular suite and tests-prerender/ against the production build with prerendered
  HTML, served the way Vercel serves dist (scripts/serve-dist.mjs). The build gets the same
  test env as the dev server in playwright.config.ts.
*/
const baseServer = Array.isArray(base.webServer) ? base.webServer[0] : base.webServer

export default defineConfig({
  ...base,
  testDir: '.',
  testMatch: ['tests/**/*.spec.ts', 'tests-prerender/**/*.spec.ts'],
  webServer: {
    ...baseServer,
    command: 'npm run build && node scripts/serve-dist.mjs 5175',
    timeout: 180_000,
  },
})
