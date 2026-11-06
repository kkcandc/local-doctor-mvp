/*
  Intent landing page routes and their search metadata.

  Plain data with no React imports: vite.config.ts reads this file at build time
  to write a static HTML shell per route, so crawlers and ad review see the right
  title, description, and canonical before JavaScript runs.
*/

export const siteOrigin = 'https://trylocaldoctor.com'

export const landingSlugs = [
  'dementia-evaluation',
  'alzheimers-evaluation',
  'memory-evaluation',
  'alzheimers-doctor-maryland',
  'memory-specialist-maryland',
  'alzheimers-second-opinion',
  'dementia-test-online',
  'memory-doctor-near-me',
] as const

export type LandingSlug = (typeof landingSlugs)[number]

export type LandingMeta = { title: string; description: string }

export const landingMeta: Record<LandingSlug, LandingMeta> = {
  'dementia-evaluation': {
    title: 'Dementia Evaluation by Telehealth in Maryland | Local Doctor',
    description:
      'Request a virtual dementia evaluation with a neurology specialist licensed in Maryland. Video visits from home, with labs or imaging at local sites only if ordered.',
  },
  'alzheimers-evaluation': {
    title: "Alzheimer's Evaluation Online for Maryland | Local Doctor",
    description:
      "Start an Alzheimer's evaluation with a virtual specialist visit. Review symptoms, history, and past results, then learn which tests, if any, make sense next.",
  },
  'memory-evaluation': {
    title: 'Memory Evaluation From Home in Maryland | Local Doctor',
    description:
      'Concerned about memory changes in yourself or a loved one? Request a memory evaluation by video with a neurology specialist. Family members are welcome to join.',
  },
  'alzheimers-doctor-maryland': {
    title: "Alzheimer's and Dementia Doctors Serving Maryland | Local Doctor",
    description:
      "Virtual visits with a neurology clinician licensed in Maryland for Alzheimer's and dementia concerns. No office to drive to; local labs and imaging only when needed.",
  },
  'memory-specialist-maryland': {
    title: 'Virtual Memory Specialist Near You in Maryland | Local Doctor',
    description:
      'Looking for a memory specialist near you in Maryland? Meet a neurology specialist by video from home. Only ordered tests happen in person, at sites near you.',
  },
  'alzheimers-second-opinion': {
    title: "Alzheimer's or Dementia Second Opinion | Local Doctor",
    description:
      "Get a second opinion on an Alzheimer's or dementia diagnosis. A neurology specialist reviews your records and history by video and explains clear next steps.",
  },
  'dementia-test-online': {
    title: 'Online Dementia Test vs. Clinical Evaluation | Local Doctor',
    description:
      'What an online dementia test can and cannot tell you, how screening, evaluation, and diagnosis differ, and how to request a clinician evaluation in Maryland.',
  },
  'memory-doctor-near-me': {
    title: 'Memory Doctor Near You in Maryland | Local Doctor',
    description:
      'Looking for a memory doctor, dementia doctor, or neurologist for memory near you? A Maryland clinician can see you by video from home, so you do not have to drive.',
  },
}

// Sitemap for the intent pages. Adding a slug above adds its URL here, the same
// way the build writes that page's HTML shell.
export function landingSitemapXml(): string {
  const paths = ['/', ...landingSlugs.map((slug) => `/${slug}`)]
  const urls = paths.map((path) => `  <url><loc>${siteOrigin}${path}</loc></url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

export function isLandingSlug(value: string): value is LandingSlug {
  return (landingSlugs as readonly string[]).includes(value)
}

export function landingCanonical(slug: LandingSlug): string {
  return `${siteOrigin}/${slug}`
}
