/*
  Aggregate-only guards. Nothing user-level is stored: URLs lose their query
  string and fragment (gclid, utm, anything else), and the offline note rejects
  text that looks like contact details.
*/

/** Returns only the path of a URL (or path), lowercased host dropped, no query or fragment. */
export function pathOnly(url: string | undefined | null): string {
  if (!url) return '(not set)'
  let s = url.trim()
  if (/^https?:\/\//i.test(s)) {
    try {
      s = new URL(s).pathname
    } catch {
      s = s.replace(/^https?:\/\/[^/]+/i, '')
    }
  }
  s = s.split(/[?#]/)[0] || '/'
  if (!s.startsWith('/')) s = `/${s}`
  if (s.length > 1 && s.endsWith('/')) s = s.slice(0, -1)
  return s
}

/**
 * GA4 events kept in the snapshot. Event names only, never parameters.
 * Matches the site's tracking spec in docs/conversion-funnel.md.
 */
export const GA4_EVENTS = [
  'cta_click',
  'phone_tap',
  'phone_click',
  'engaged_visit',
  'calendly_viewed',
  'calendly_time_selected',
  'evaluation_started',
  'evaluation_submitted',
  'visit_booked',
  'generate_lead',
] as const

export const NOTE_MAX_LENGTH = 280

const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/
// 7 or more digits, allowing spaces, dots, dashes and parentheses between them.
const LONG_NUMBER_RE = /(?:\d[\s().-]*){7,}/
// Dates such as 3/14/1950 or 1950-03-14 could be a birth date.
const DATE_RE = /\b\d{1,4}[/-]\d{1,2}[/-]\d{1,4}\b/

export type NoteCheck = { ok: true; note: string | undefined } | { ok: false; error: string }

export function checkNote(input: unknown): NoteCheck {
  if (input == null) return { ok: true, note: undefined }
  if (typeof input !== 'string') return { ok: false, error: 'Note must be text.' }
  const note = input.trim()
  if (!note) return { ok: true, note: undefined }
  if (note.length > NOTE_MAX_LENGTH) return { ok: false, error: `Note must be ${NOTE_MAX_LENGTH} characters or fewer.` }
  if (EMAIL_RE.test(note)) return { ok: false, error: 'Note looks like it contains an email address. No patient info, please.' }
  if (LONG_NUMBER_RE.test(note)) return { ok: false, error: 'Note looks like it contains a phone or ID number. No patient info, please.' }
  if (DATE_RE.test(note)) return { ok: false, error: 'Note looks like it contains a date. Use the date field and keep notes general.' }
  return { ok: true, note }
}
