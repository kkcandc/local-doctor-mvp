import type { ReactNode } from 'react'
import privacyPolicy from './legal/privacy-policy.md?raw'
import termsOfUse from './legal/terms-of-use.md?raw'
import patientRightsNotices from './legal/patient-rights-notices.md?raw'
import { patientRightsPhraseLinks, privacyPhraseLinks, termsPhraseLinks, termsReplacements } from './legal/documentLinks'
import { patientRightsHeadings, privacyHeadings, termsHeadings } from './legal/headings'
import { legalDocumentTitle } from './legal/legalMarkdown'
import { LegalDocument } from './legal/renderLegalDocument'

export const publicEmail = 'hello@trylocaldoctor.com'

export const legalEntity =
  'Local Infusion Inc. (doing business as Local Doctor), a Delaware corporation'

export const clinicalPractice =
  'LIV Specialty Care CT, P.C., a physician-owned professional corporation'

export const physicalAddress = '4900 Centennial Blvd, Suite 300, Box 104, Nashville, TN 37209'

export const publicPhone = '(240) 376-5730'

export const licensedStates = 'Maryland'

export const providerName = 'Deborah Kathleen Rose'

export const providerSpecialty = 'Neurology'

export const effectiveDate = 'October 2026'

// Terms of Use section 19 governs nonclinical platform disputes under Delaware law.
export const governingLaw = 'the laws of the State of Delaware'

export function LegalIdentity() {
  return (
    <dl className="identity-block">
      <div>
        <dt>Legal entity</dt>
        <dd>{legalEntity}</dd>
      </div>
      <div>
        <dt>Clinical care provided by</dt>
        <dd>{clinicalPractice}</dd>
      </div>
      <div>
        <dt>Physical address</dt>
        <dd>{physicalAddress}</dd>
      </div>
      <div>
        <dt>Phone</dt>
        <dd><a href="tel:+12403765730">{publicPhone}</a></dd>
      </div>
      <div>
        <dt>Email</dt>
        <dd><a href={`mailto:${publicEmail}`}>{publicEmail}</a></dd>
      </div>
      <div>
        <dt>State where patients may be seen</dt>
        <dd>{licensedStates}</dd>
      </div>
    </dl>
  )
}

export function ProviderRoster() {
  return (
    <article className="provider-card">
      <h3>{providerName}</h3>
      <dl className="identity-block provider-facts">
        <div>
          <dt>Specialty</dt>
          <dd>{providerSpecialty}</dd>
        </div>
        <div>
          <dd>Licensed in {licensedStates}</dd>
        </div>
      </dl>
    </article>
  )
}

function ComplianceLayout({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string
  title: string
  lede?: string
  children: ReactNode
}) {
  return (
    <section className="section white">
      <article className="blog-article legal-doc">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {lede ? <p className="legal-lede">{lede}</p> : null}
        <LegalIdentity />
        {children}
      </article>
    </section>
  )
}

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

export function ConsentPage() {
  return (
    <ComplianceLayout
      eyebrow="Telehealth"
      title="Telehealth Consent"
      lede="This page explains virtual visits. Reading it does not sign a consent, and this page does not record one."
    >
      <div className="article-body">
        <h2>What a virtual visit is</h2>
        <p>
          Telehealth here means a live audio and video visit between you, a care partner if you want one present, and a clinician who is somewhere else.
          The visit platform is not named on this website.
          Some steps, including labs, MRI, and any infusion, happen in person at a local site.
        </p>

        <h2>Who may see you</h2>
        <p>
          Clinical care is provided by {clinicalPractice}.
          The clinician must be licensed in the state where you are located during the visit. That state is {licensedStates}.
          The clinician&apos;s name and specialty are on the <a href="/about#providers">Meet the Team</a> page.
        </p>

        <h2>Benefits, risks, and alternatives</h2>
        <ul>
          <li>A virtual visit can start the evaluation when that step does not have to be in person.</li>
          <li>Technology can fail, a video exam can miss something an in-person exam would catch, and a connection or a room that is not private can expose the conversation.</li>
          <li>You can choose in-person care with a local clinician, or you can decline a video visit. Other alternatives offered by this practice are not listed on this page.</li>
        </ul>

        <h2>Privacy, records, and prescriptions</h2>
        <p>
          Health information from a visit is handled under the <a href="/patient-rights#notice-of-privacy-practices">Notice of Privacy Practices</a>.
          A separate records custodian is not named on this page. The organization responsible for health information is {legalEntity}.
          The website does not prescribe or dispense medication. A prescription, if one is appropriate, comes from the evaluating clinician and follows the law of the state where you are located.
        </p>

        <h2>Emergencies</h2>
        <p>
          Telehealth through this site is not emergency care. Call 911 if you have a medical emergency. Do not wait for a virtual visit or an email reply.
        </p>

        <h2>How consent is collected, and how to withdraw it</h2>
        <p>
          Before a virtual visit, this website does not record consent. Contact us through our <a href="/contact">contact page</a>.
          You may stop a video visit or withdraw consent by contacting us through our <a href="/contact">contact page</a>.
          This page does not describe another way to withdraw consent.
          Withdrawing consent does not erase a record the practice is required to keep.
          If you do not consent, the visit should not proceed by video.
        </p>
      </div>
    </ComplianceLayout>
  )
}

export function ContactPage() {
  return (
    <section className="section white">
      <article className="blog-article legal-doc">
        <p className="eyebrow">Contact</p>
        <h1>Contact Local Doctor</h1>
        <p className="legal-lede">
          Use this page for the company name, the physical address, and the clinician who may see patients.
        </p>
        <div className="consult-actions">
          <a className="primary" href={`mailto:${publicEmail}`}>Email {publicEmail}</a>
          <a className="secondary" href="/get-started">Go to the intake</a>
        </div>
        <div id="company">
          <LegalIdentity />
        </div>
        <div className="article-body" id="providers">
          <h2>Licensed providers</h2>
          <p>
            A virtual visit is available only when the clinician is licensed in the state where the patient is located during the visit.
            State where patients may be seen: {licensedStates}.
          </p>
          <ProviderRoster />
          <h2>Policies</h2>
          <ul>
            <li><a href="/privacy">Privacy Policy</a></li>
            <li><a href="/terms">Terms of Use</a></li>
            <li><a href="/patient-rights">Patient Rights & Notices</a></li>
          </ul>
        </div>
      </article>
    </section>
  )
}
