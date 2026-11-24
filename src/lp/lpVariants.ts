/*
  Landing page test variants for paid search (Evaluation ad groups, Maryland).

  /lp/a  Current dementia evaluation page, booking first (no evaluation form gate).
  /lp/b  Calendar first: short headline, credential line, the Calendly scheduler right under it.
  /lp/c  Simple, large text, call first: one call button, one booking button, 3 steps.

  These are test URLs only. Every one is noindex, has no canonical, and is left out of
  sitemap.xml. Plain data with no React imports so routes, the prerender, and tracking can use it.
*/

export const lpVariants = ['a', 'b', 'c'] as const

export type LpVariant = (typeof lpVariants)[number]

export function isLpVariant(value: string): value is LpVariant {
  return (lpVariants as readonly string[]).includes(value)
}

export const lpMeta: Record<LpVariant, { title: string; description: string }> = {
  a: {
    title: 'Dementia Evaluation by Video | Local Doctor',
    description:
      'Book a video visit with a board-certified neurologist licensed in Maryland. Insurance accepted. No referral needed.',
  },
  b: {
    title: 'Pick a Time for a Memory Evaluation by Video | Local Doctor',
    description:
      'Choose a time for a video visit with a board-certified neurologist licensed in Maryland. Insurance accepted. No referral needed.',
  },
  c: {
    title: 'Talk With Us About a Memory Evaluation | Local Doctor',
    description:
      'Call us or book a video visit with a board-certified neurologist licensed in Maryland. Insurance accepted, including Medicare.',
  },
}

export function lpPath(variant: LpVariant): string {
  return `/lp/${variant}`
}

// "lp/a" (no leading or trailing slash) to "a".
export function lpVariantFromRoutePath(path: string): LpVariant | null {
  const match = /^lp\/([a-z])$/.exec(path.toLowerCase())
  return match && isLpVariant(match[1]) ? match[1] : null
}

export function lpVariantFromPathname(pathname: string): LpVariant | null {
  return lpVariantFromRoutePath(pathname.replace(/^\/+|\/+$/g, ''))
}

/*
  The variant a visitor landed on is kept for the browser session, so a booking or a call
  that happens after they move on to /get-started still carries the variant they saw.
  Only the single letter is stored.
*/
export const LP_VARIANT_STORAGE_KEY = 'ld_lp_variant'

export function rememberLpVariant(variant: LpVariant) {
  try {
    window.sessionStorage.setItem(LP_VARIANT_STORAGE_KEY, variant)
  } catch {
    // Storage can be blocked. Events on the test page itself still carry the variant from the path.
  }
}

export function currentLpVariant(pathname: string): LpVariant | null {
  const fromPath = lpVariantFromPathname(pathname)
  if (fromPath) return fromPath
  try {
    const stored = window.sessionStorage.getItem(LP_VARIANT_STORAGE_KEY) ?? ''
    return isLpVariant(stored) ? stored : null
  } catch {
    return null
  }
}
