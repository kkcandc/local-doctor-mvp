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
  'alzheimers-doctor-virginia',
  'memory-specialist-virginia',
  'alzheimers-second-opinion',
  'dementia-test-online',
  'memory-doctor-near-me',
  'alzheimers-blood-test',
] as const

export type LandingSlug = (typeof landingSlugs)[number]

export type LandingMeta = { title: string; description: string }

export const landingMeta: Record<LandingSlug, LandingMeta> = {
  'dementia-evaluation': {
    title: 'Dementia Evaluation by Telehealth | Local Doctor',
    description:
      'Request a virtual dementia evaluation with a neurology specialist in Maryland and Virginia. Video visits from home, with labs or imaging at local sites only if ordered.',
  },
  'alzheimers-evaluation': {
    title: "Alzheimer's Evaluation Online | Local Doctor",
    description:
      "Start an Alzheimer's evaluation with a virtual specialist visit. Review symptoms, history, and past results, then learn which tests, if any, make sense next.",
  },
  'memory-evaluation': {
    title: 'Memory Evaluation From Home | Local Doctor',
    description:
      'Concerned about memory changes in yourself or a loved one? Request a memory evaluation by video with a neurology specialist. Family members are welcome to join.',
  },
  'alzheimers-doctor-maryland': {
    title: "See an Alzheimer's Doctor in Maryland | Local Doctor",
    description:
      "See an Alzheimer's doctor in Maryland by video. Virtual visits from home with a board-certified neurologist. Insurance accepted. No referral needed.",
  },
  'memory-specialist-maryland': {
    title: 'Virtual Memory Specialist Near You in Maryland | Local Doctor',
    description:
      'Looking for a memory specialist near you in Maryland? Meet a neurology specialist by video from home. Only ordered tests happen in person, at sites near you.',
  },
  'alzheimers-doctor-virginia': {
    title: "See an Alzheimer's Doctor in Virginia | Local Doctor",
    description:
      "See an Alzheimer's doctor in Virginia by video. Virtual visits from home with a board-certified neurologist. Insurance accepted. No referral needed.",
  },
  'memory-specialist-virginia': {
    title: 'Virtual Memory Specialist Near You in Virginia | Local Doctor',
    description:
      'Looking for a memory specialist near you in Virginia? Meet a neurology specialist by video from home. Only ordered tests happen in person, at sites near you.',
  },
  'alzheimers-second-opinion': {
    title: "Alzheimer's or Dementia Second Opinion | Local Doctor",
    description:
      "Get a second opinion on an Alzheimer's or dementia diagnosis. A neurology specialist reviews your records and history by video and explains clear next steps.",
  },
  'dementia-test-online': {
    title: 'Online Dementia Test vs. Clinical Evaluation | Local Doctor',
    description:
      'What an online dementia test can and cannot tell you, how screening, evaluation, and diagnosis differ, and how to request a clinician evaluation in MD or VA.',
  },
  'memory-doctor-near-me': {
    title: 'Memory Doctor Near You | Local Doctor',
    description:
      'Looking for a memory doctor, dementia doctor, or neurologist for memory near you? A clinician licensed in MD or VA can see you by video from home, with no drive.',
  },
  'alzheimers-blood-test': {
    title: "Alzheimer's Blood Test (pTau217) | Local Doctor",
    description:
      "The pTau217 blood test measures a protein linked to Alzheimer's changes in the brain. Request it before a visit. Results are reviewed with a neurologist.",
  },
}

export function isLandingSlug(value: string): value is LandingSlug {
  return (landingSlugs as readonly string[]).includes(value)
}

export function landingCanonical(slug: LandingSlug): string {
  return `${siteOrigin}/${slug}`
}
