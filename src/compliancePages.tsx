import type { ReactNode } from 'react'

export const publicEmail = 'hello@trylocaldoctor.com'

export function Placeholder({ value }: { value: string }) {
  return (
    <span className="placeholder-token" data-placeholder={value}>
      {value}
    </span>
  )
}

export function LegalIdentity() {
  return (
    <dl className="identity-block">
      <div>
        <dt>Legal entity</dt>
        <dd><Placeholder value="[LEGAL ENTITY]" /></dd>
      </div>
      <div>
        <dt>Brand</dt>
        <dd>Local Doctor</dd>
      </div>
      <div>
        <dt>Website</dt>
        <dd>trylocaldoctor.com</dd>
      </div>
      <div>
        <dt>Physical address</dt>
        <dd><Placeholder value="[ADDRESS]" /></dd>
      </div>
      <div>
        <dt>Phone</dt>
        <dd><Placeholder value="[PHONE]" /></dd>
      </div>
      <div>
        <dt>Email</dt>
        <dd><a href={`mailto:${publicEmail}`}>{publicEmail}</a></dd>
      </div>
      <div>
        <dt>States where patients may be seen</dt>
        <dd><Placeholder value="[LICENSED STATES]" /></dd>
      </div>
    </dl>
  )
}

export function ProviderRoster() {
  return (
    <article className="provider-card">
      <h3>
        <Placeholder value="[PROVIDER NAME]" />, <Placeholder value="[CREDENTIAL]" />
      </h3>
      <dl className="identity-block provider-facts">
        <div>
          <dt>Specialty</dt>
          <dd><Placeholder value="[SPECIALTY]" /></dd>
        </div>
        <div>
          <dt>NPI</dt>
          <dd><Placeholder value="[NPI]" /></dd>
        </div>
        <div>
          <dt>Licenses by state</dt>
          <dd>
            <ul className="license-list">
              <li>
                <Placeholder value="[STATE]" /> <Placeholder value="[LICENSE NUMBER]" />
              </li>
            </ul>
          </dd>
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
          This policy applies to trylocaldoctor.com, which is operated by <Placeholder value="[LEGAL ENTITY]" /> under the brand Local Doctor.
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
          Analytics, advertising pixels, and similar tools: <Placeholder value="[ANALYTICS AND ADVERTISING TOOLS]" />.
        </p>

        <h3>How that information is used</h3>
        <ul>
          <li>To respond to a request and decide whether a clinical review may be appropriate.</li>
          <li>To coordinate records, testing, coverage questions, and scheduling when a review moves forward.</li>
          <li>To operate, secure, and troubleshoot the website.</li>
        </ul>
        <p>
          Service providers that process information for the site, and where intake responses are sent, are listed at <Placeholder value="[SERVICE PROVIDERS]" />.
          Sale of personal information, and sharing for cross-context advertising, is <Placeholder value="[SALE OR ADVERTISING SHARING]" />.
        </p>

        <h3>Privacy contact</h3>
        <p>
          Privacy questions go to <Placeholder value="[PRIVACY OFFICER]" /> at <Placeholder value="[PRIVACY EMAIL]" />, <Placeholder value="[PHONE]" />, <Placeholder value="[ADDRESS]" />.
        </p>

        <h2 id="notice">Notice of Privacy Practices</h2>
        <p className="npp-banner">
          This notice describes how medical information about you may be used and disclosed and how you can get access to this information. Please review it carefully.
        </p>
        <p>
          The organization responsible for health information collected for Local Doctor services is <Placeholder value="[LEGAL ENTITY]" />.
          Its role under HIPAA is <Placeholder value="[HIPAA ROLE]" />.
          This notice applies to health information created or received for those services. It takes effect on <Placeholder value="[EFFECTIVE DATE]" />.
        </p>

        <h3>Uses and disclosures</h3>
        <p>Health information may be used or disclosed for these purposes:</p>
        <ul>
          <li>Treatment: evaluation, care coordination, orders, and handoff to a local testing or infusion setting when that is part of the plan.</li>
          <li>Payment: coverage review, prior authorization, and billing for services that are actually provided.</li>
          <li>Health care operations: quality review, training, and the work of running the practice.</li>
          <li>As required by law, including public-health, health-oversight, judicial, and serious-threat situations described in HIPAA.</li>
          <li>With your written authorization for uses that are not covered above. Authorization is handled by <Placeholder value="[AUTHORIZATION PROCESS]" />.</li>
        </ul>
        <p>
          Additional protections required by state law are described in <Placeholder value="[STATE PRIVACY LAW ADDENDUM]" />.
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
          To use these rights, contact <Placeholder value="[PRIVACY OFFICER]" /> at <Placeholder value="[PRIVACY EMAIL]" /> or <Placeholder value="[PHONE]" />.
        </p>

        <h3>Responsibilities and complaints</h3>
        <p>
          <Placeholder value="[LEGAL ENTITY]" /> is required to maintain the privacy of health information, to provide this notice, to follow the notice currently in effect, and to notify you of a breach when the law requires it.
          The current notice is posted at <a href="/privacy">https://trylocaldoctor.com/privacy</a>.
        </p>
        <p>
          You may complain to <Placeholder value="[PRIVACY OFFICER]" /> or to the U.S. Department of Health and Human Services, Office for Civil Rights.
          Filing a complaint will not be held against you.
        </p>
        <p>
          Clinician names, credentials, and license numbers by state are listed on the <a href="/about#providers">Meet the Team</a> and <a href="/contact">Contact</a> pages.
          Patients may be seen in <Placeholder value="[LICENSED STATES]" />.
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
          trylocaldoctor.com is operated by <Placeholder value="[LEGAL ENTITY]" />. Local Doctor is the brand on the site.
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
          Those states are <Placeholder value="[LICENSED STATES]" />.
          Telehealth consent is a separate step, described on the <a href="/telehealth-consent">Telehealth Consent</a> page, and is collected by <Placeholder value="[CONSENT METHOD]" />.
        </p>

        <h2>Intake and email</h2>
        <p>
          The eligibility intake is an embedded Typeform. Submitting it, or emailing {publicEmail}, is a request for follow-up.
          It does not reserve a call, confirm coverage, or promise that you will be seen.
          There is no patient login on this website. Any portal is <Placeholder value="[PATIENT PORTAL]" />.
        </p>

        <h2>Insurance and cost</h2>
        <p>
          The site does not promise that a health plan is accepted or that you will have no out-of-pocket cost.
          Coverage, prior authorization, and what you may owe depend on the plan, the services ordered, and where care is delivered.
        </p>

        <h2>Acceptable use and intellectual property</h2>
        <p>
          Do not misuse the site, attempt to break it, or submit information you do not have the right to share.
          Site content is owned by <Placeholder value="[LEGAL ENTITY]" />, except articles that are labeled as republished from Local Infusion and linked back to the original.
        </p>

        <h2>Third-party services</h2>
        <p>
          The intake is provided by Typeform. Other vendors are <Placeholder value="[SERVICE PROVIDERS]" />.
          Their own terms apply to their services.
        </p>

        <h2>Liability and governing law</h2>
        <p>
          Website text can be incomplete or out of date. Clinical decisions are made by a licensed clinician after an evaluation, not by these pages.
          Further limits on liability are <Placeholder value="[LIABILITY TERMS]" />.
          These terms are governed by <Placeholder value="[GOVERNING LAW]" />.
        </p>

        <h2>Changes and contact</h2>
        <p>
          Updated terms will be posted on this page. Questions can be sent to <a href={`mailto:${publicEmail}`}>{publicEmail}</a>, <Placeholder value="[PHONE]" />, <Placeholder value="[ADDRESS]" />.
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
          The visit platform is <Placeholder value="[TELEHEALTH PLATFORM]" />.
          Some steps, including labs, MRI, and any infusion, happen in person at a local site.
        </p>

        <h2>Who may see you</h2>
        <p>
          The clinician must be licensed in the state where you are located during the visit. Those states are <Placeholder value="[LICENSED STATES]" />.
          The clinician&apos;s name, credential, and license number for each state are on the <a href="/about#providers">Meet the Team</a> page.
        </p>

        <h2>Benefits, risks, and alternatives</h2>
        <ul>
          <li>A virtual visit can start the evaluation when that step does not have to be in person.</li>
          <li>Technology can fail, a video exam can miss something an in-person exam would catch, and a connection or a room that is not private can expose the conversation.</li>
          <li>You can choose in-person care with a local clinician, or you can decline a video visit. Other alternatives offered by this practice are <Placeholder value="[ALTERNATIVES]" />.</li>
        </ul>

        <h2>Privacy, records, and prescriptions</h2>
        <p>
          Health information from a visit is handled under the <a href="/privacy#notice">Notice of Privacy Practices</a>.
          The record of the visit is kept by <Placeholder value="[RECORDS CUSTODIAN]" />.
          The website does not prescribe or dispense medication. A prescription, if one is appropriate, comes from the evaluating clinician and follows the law of the state where you are located.
        </p>

        <h2>Emergencies</h2>
        <p>
          Telehealth through this site is not emergency care. Call 911 if you have a medical emergency. Do not wait for a virtual visit or an email reply.
        </p>

        <h2>How consent is collected, and how to withdraw it</h2>
        <p>
          Before a virtual visit, consent is collected by <Placeholder value="[CONSENT METHOD]" />.
          You may stop a video visit or withdraw consent. The way to do that is <Placeholder value="[WITHDRAWAL METHOD]" />.
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
          Use this page for the company name, the physical address, the phone number, and the clinicians who may see patients.
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
            States where patients may be seen: <Placeholder value="[LICENSED STATES]" />.
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
