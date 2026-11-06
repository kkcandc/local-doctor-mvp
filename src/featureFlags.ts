/*
  Page visibility flags.

  Defaults live here and are reviewed in PRs. A build-time env var overrides a
  default per Vercel environment, e.g. VITE_PAGE_ABOUT=true shows Meet the Team
  on Preview while Production keeps it hidden. Changing an env var needs a
  redeploy. A hidden page is not secured: its code stays in the JS bundle.
*/
const pageDefaults = {
  home: true,
  treatments: true,
  how: true,
  about: false,
  start: true,
  faq: true,
  blog: true,
  refer: true,
  privacy: true,
  terms: true,
  patientRights: true,
  consent: true,
  contact: true,
  // Intent landing pages in src/landing (VITE_PAGE_LANDINGPAGES).
  landingPages: true,
}

export type PageFlag = keyof typeof pageDefaults

function readOverride(page: PageFlag): boolean | undefined {
  const raw = import.meta.env[`VITE_PAGE_${page.toUpperCase()}`]
  if (raw === 'true' || raw === '1') return true
  if (raw === 'false' || raw === '0') return false
  return undefined
}

export function isPageEnabled(page: PageFlag): boolean {
  // Home is the redirect target for hidden pages, so it can never be turned off.
  if (page === 'home') return true
  return readOverride(page) ?? pageDefaults[page]
}
