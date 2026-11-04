/*
  Google Analytics 4 configuration.

  This site is Vite, so the browser-visible env prefix is VITE_.
  Production builds use G-0NF3ZM8GFF when VITE_GA_MEASUREMENT_ID is unset.
  Set VITE_GA_MEASUREMENT_ID=off (or false or 0) to leave GA4 out of a build.

  GA4 shares the Ads gtag.js snippet and the same page_location sanitizer.
  Event payloads are page path and event name only: no names, emails, phone
  numbers, dates of birth, diagnoses, form answers, or Typeform response ids.
  Lead and phone conversions stay in the Google Ads code.
*/

export const DEFAULT_GA_MEASUREMENT_ID = 'G-0NF3ZM8GFF'

const GA_ID = /^G-[A-Z0-9]{8,12}$/

export function resolveGaMeasurementId(envValue: string | undefined, enableByDefault: boolean): string | null {
  const trimmed = envValue?.trim()
  if (trimmed === 'off' || trimmed === 'false' || trimmed === '0') return null
  if (trimmed) return GA_ID.test(trimmed) ? trimmed : null
  return enableByDefault ? DEFAULT_GA_MEASUREMENT_ID : null
}
