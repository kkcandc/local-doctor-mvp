import { ComplianceLayout } from '../compliancePages'
import privacyPolicy from './privacy-policy.md?raw'
import termsOfUse from './terms-of-use.md?raw'
import patientRightsNotices from './patient-rights-notices.md?raw'
import { patientRightsPhraseLinks, privacyPhraseLinks, termsPhraseLinks, termsReplacements } from './documentLinks'
import { patientRightsHeadings, privacyHeadings, termsHeadings } from './headings'
import { legalDocumentTitle } from './legalMarkdown'
import { LegalDocument } from './renderLegalDocument'

// The long legal documents load in their own chunk (see routePages.ts).
export function PrivacyPage() {
  return (
    <ComplianceLayout eyebrow="Privacy" title={legalDocumentTitle(privacyPolicy)}>
      <LegalDocument markdown={privacyPolicy} headings={privacyHeadings} phraseLinks={privacyPhraseLinks} />
    </ComplianceLayout>
  )
}

export function TermsPage() {
  return (
    <ComplianceLayout eyebrow="Terms" title={legalDocumentTitle(termsOfUse)}>
      <LegalDocument
        markdown={termsOfUse}
        headings={termsHeadings}
        phraseLinks={termsPhraseLinks}
        replacements={termsReplacements}
      />
    </ComplianceLayout>
  )
}

export function PatientRightsPage() {
  return (
    <ComplianceLayout eyebrow="Patient rights" title={legalDocumentTitle(patientRightsNotices)}>
      <LegalDocument
        markdown={patientRightsNotices}
        headings={patientRightsHeadings}
        phraseLinks={patientRightsPhraseLinks}
      />
    </ComplianceLayout>
  )
}
