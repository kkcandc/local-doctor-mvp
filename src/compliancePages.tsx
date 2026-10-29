import type { ReactNode } from 'react'

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

export const governingLaw = 'the laws of Tennessee'

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
  lede: string
  children: ReactNode
}) {
  return (
    <section className="section white">
      <article className="blog-article legal-doc">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="legal-lede">{lede}</p>
        <LegalIdentity />
        {children}
      </article>
    </section>
  )
}

export function PrivacyPage() {
  return (
    <ComplianceLayout
      eyebrow="Privacy"
      title="Privacy Policy and Notice of Privacy Practices"
      lede="This page describes how information submitted through trylocaldoctor.com is handled, and how health information may be used and disclosed."
    >
      <div className="article-body">
        <h2>Privacy Policy</h2>
        <p>
          This policy applies to trylocaldoctor.com, which is operated by {legalEntity} under the brand Local Doctor.
          The public email for the site is <a href={`mailto:${publicEmail}`}>{publicEmail}</a>.
        </p>

        <h3>Information the site collects</h3>
        <ul>
          <li>Information you submit in the eligibility intake. That form is embedded from Typeform.</li>
          <li>Information you send by email to {publicEmail}.</li>
          <li>Information a care partner or referring clinician submits about a patient, when they are the person completing the form.</li>
          <li>Technical information the hosting provider processes to deliver the site, such as IP address and browser type.</li>
        </ul>
        <p>
          Analytics, advertising pixels, and similar tools: no analytics or advertising tools are included in this website&apos;s code.
        </p>

        <h3>How that information is used</h3>
        <ul>
          <li>To respond to a request and decide whether a clinical review may be appropriate.</li>
          <li>To coordinate records, testing, coverage questions, and scheduling when a review moves forward.</li>
          <li>To operate, secure, and troubleshoot the website.</li>
        </ul>
        <p>
          The eligibility intake is an embedded Typeform on the get-started page. This website does not list other service providers, and it does not state where intake responses are sent after they are submitted.
          Sale of personal information, and sharing for cross-context advertising, is not stated on this website.
        </p>

        <h3>Privacy contact</h3>
        <p>
          Privacy questions go to {legalEntity} through the <a href="/contact">contact page</a>, by email at <a href={`mailto:${publicEmail}`}>{publicEmail}</a>, by mail at {physicalAddress}, or by phone at {publicPhone}.
        </p>

        <h2 id="ai-tools">Use of AI tools</h2>
        <p>
          Some website copy and site code are drafted with help from AI tools (Anthropic). Clinicians and counsel review published site content for accuracy. AI tools are not used to make clinical decisions or to access patient information.
        </p>

        <h2 id="notice">Notice of Privacy Practices</h2>
        <p className="npp-banner">
          This notice describes how medical information about you may be used and disclosed and how you can get access to this information. Please review it carefully.
        </p>
        <p>
          The organization responsible for health information collected for Local Doctor services is {legalEntity}.
          A HIPAA role, such as covered entity or business associate, is not stated on this page.
          This notice applies to health information created or received for those services. It takes effect on {effectiveDate}.
        </p>

        <h3>Uses and disclosures</h3>
        <p>Health information may be used or disclosed for these purposes:</p>
        <ul>
          <li>Treatment: evaluation, care coordination, orders, and handoff to a local testing or infusion setting when that is part of the plan.</li>
          <li>Payment: coverage review, prior authorization, and billing for services that are actually provided.</li>
          <li>Health care operations: quality review, training, and the work of running the practice.</li>
          <li>As required by law, including public-health, health-oversight, judicial, and serious-threat situations described in HIPAA.</li>
          <li>With your written authorization for uses that are not covered above. To ask about authorization, contact us through our <a href="/contact">contact page</a>.</li>
        </ul>
        <p>
          Additional protections required by state law are not set out in a separate addendum on this website.
        </p>

        <h3>Your rights</h3>
        <ul>
          <li>Request a copy of health information used to make decisions about you.</li>
          <li>Request a correction if you believe an entry is wrong or incomplete.</li>
          <li>Request an accounting of certain disclosures.</li>
          <li>Request a restriction on a use or disclosure, and request confidential communication at a different address or number.</li>
          <li>Request a paper copy of this notice.</li>
          <li>Receive notice of a breach of unsecured health information when the law requires it.</li>
        </ul>
        <p>
          To use these rights, contact us through our <a href="/contact">contact page</a> or email <a href={`mailto:${publicEmail}`}>{publicEmail}</a>, or call {publicPhone}.
        </p>

        <h3>Responsibilities and complaints</h3>
        <p>
          {legalEntity} is required to maintain the privacy of health information, to provide this notice, to follow the notice currently in effect, and to notify you of a breach when the law requires it.
          The current notice is posted at <a href="/privacy">https://trylocaldoctor.com/privacy</a>.
        </p>
        <p>
          You may complain to {legalEntity} through the <a href="/contact">contact page</a>, or to the U.S. Department of Health and Human Services, Office for Civil Rights.
          Filing a complaint will not be held against you.
        </p>
        <p>
          The clinician&apos;s name and specialty are listed on the <a href="/about#providers">Meet the Team</a> and <a href="/contact">Contact</a> pages.
          Patients may be seen in {licensedStates}.
        </p>
      </div>
    </ComplianceLayout>
  )
}

export function TermsPage() {
  return (
    <ComplianceLayout
      eyebrow="Terms"
      title="Terms of Use"
      lede="These terms cover use of trylocaldoctor.com. They are between you and the legal entity that operates the site."
    >
      <div className="article-body">
        <h2>The website and the clinic</h2>
        <p>
          trylocaldoctor.com is operated by {legalEntity}. Local Doctor is the brand on the site.
          The pages describe a virtual pathway for Alzheimer&apos;s treatment-eligibility review. They do not themselves provide a diagnosis, a prescription, or an appointment.
        </p>

        <h2>No emergency care and no relationship from browsing</h2>
        <p>
          Call 911 for a medical emergency. Reading this website, emailing {publicEmail}, or submitting the intake does not create a clinician-patient relationship.
          A relationship begins only when a licensed clinician accepts you for an evaluation.
        </p>

        <h2>Where a visit can happen</h2>
        <p>
          A virtual visit is offered only when the clinician is licensed to see a patient located in that state at the time of the visit.
          That state is {licensedStates}.
          Telehealth consent is a separate step, described on the <a href="/telehealth-consent">Telehealth Consent</a> page. This website describes that step and does not record a signature. Contact us through our <a href="/contact">contact page</a>.
        </p>

        <h2>Intake and email</h2>
        <p>
          The eligibility intake is an embedded Typeform. Submitting it, or emailing {publicEmail}, is a request for follow-up.
          It does not reserve a call, confirm coverage, or promise that you will be seen.
          There is no patient login on this website, and this website does not link to a patient portal.
        </p>

        <h2>Insurance and cost</h2>
        <p>
          The site does not promise that a health plan is accepted or that you will have no out-of-pocket cost.
          Coverage, prior authorization, and what you may owe depend on the plan, the services ordered, and where care is delivered.
        </p>

        <h2>Acceptable use and intellectual property</h2>
        <p>
          Do not misuse the site, attempt to break it, or submit information you do not have the right to share.
          Site content is owned by {legalEntity}, except articles that are labeled as republished from Local Infusion and linked back to the original.
        </p>

        <h2>Third-party services</h2>
        <p>
          The intake is provided by Typeform, and Typeform&apos;s own terms apply to that service. This website does not list other vendors.
        </p>

        <h2>Liability and governing law</h2>
        <p>
          Website text can be incomplete or out of date. Clinical decisions are made by a licensed clinician after an evaluation, not by these pages.
          Further limits on liability are not stated on this page.
          These terms are governed by {governingLaw}.
        </p>

        <h2>Changes and contact</h2>
        <p>
          Updated terms will be posted on this page. Questions can be sent to <a href={`mailto:${publicEmail}`}>{publicEmail}</a> or by mail to {physicalAddress}. Contact us through our <a href="/contact">contact page</a>. You can also call {publicPhone}.
        </p>
      </div>
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
          Health information from a visit is handled under the <a href="/privacy#notice">Notice of Privacy Practices</a>.
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
            <li><a href="/privacy#notice">Notice of Privacy Practices</a></li>
            <li><a href="/terms">Terms of Use</a></li>
            <li><a href="/telehealth-consent">Telehealth Consent</a></li>
          </ul>
        </div>
      </article>
    </section>
  )
}
