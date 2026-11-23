export const marylandPhone = '(240) 376-5730'
export const virginiaPhone = '(571) 609-5338'

export const publicPhone = marylandPhone

export const VIRGINIA_LANDING_SLUGS = ['alzheimers-doctor-virginia', 'memory-specialist-virginia'] as const

export function isVirginiaLandingSlug(slug: string): boolean {
  return (VIRGINIA_LANDING_SLUGS as readonly string[]).includes(slug)
}

export function telHref(phone: string): string {
  return `tel:+1${phone.replace(/\D/g, '')}`
}

export type ClinicPhone = {
  display: string
  href: string
  telephone: string
}

export function clinicPhoneForLanding(slug?: string): ClinicPhone {
  if (slug && isVirginiaLandingSlug(slug)) {
    return {
      display: virginiaPhone,
      href: telHref(virginiaPhone),
      telephone: '+1-571-609-5338',
    }
  }
  return {
    display: marylandPhone,
    href: telHref(marylandPhone),
    telephone: '+1-240-376-5730',
  }
}
