export type PhraseLink = {
  phrase: string
  href: string
}

export type TextReplacement = {
  source: string
  prefix: string
  label: string
  href: string
}

const patientRightsNotice = '/patient-rights#notice-of-privacy-practices'

export const privacyPhraseLinks: PhraseLink[] = [
  { phrase: 'HIPAA Notice of Privacy Practices', href: patientRightsNotice },
  { phrase: 'Terms & Conditions', href: '/terms' },
  { phrase: 'Terms of Use', href: '/terms' },
]

export const termsPhraseLinks: PhraseLink[] = [
  { phrase: 'HIPAA Notices of Privacy Practices', href: patientRightsNotice },
  { phrase: 'Privacy Policy', href: '/privacy' },
]

export const termsReplacements: TextReplacement[] = [
  {
    source: 'Privacy Policy: [LINK]',
    prefix: 'Privacy Policy: ',
    label: 'https://trylocaldoctor.com/privacy',
    href: '/privacy',
  },
  {
    source: 'HIPAA Notice of Privacy Practices: [LINK]',
    prefix: 'HIPAA Notice of Privacy Practices: ',
    label: 'https://trylocaldoctor.com/patient-rights#notice-of-privacy-practices',
    href: patientRightsNotice,
  },
  {
    source: 'Patient Rights & Notices: [LINK]',
    prefix: 'Patient Rights & Notices: ',
    label: 'https://trylocaldoctor.com/patient-rights',
    href: '/patient-rights',
  },
]

export const patientRightsPhraseLinks: PhraseLink[] = [
  { phrase: 'Terms of Use', href: '/terms' },
  { phrase: 'contact page', href: '/contact' },
]
