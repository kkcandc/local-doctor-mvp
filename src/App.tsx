import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  Brain,
  Building2,
  CalendarClock,
  ChevronDown,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  HeartHandshake,
  MapPin,
  Menu,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import './App.css'

type Route =
  | 'home'
  | 'treatments'
  | 'how'
  | 'about'
  | 'start'
  | 'faq'
  | 'resources'
  | 'blog'
  | 'refer'
  | 'pilot'
  | 'leqembiLocal'

const typeformLiveId = '01M49714FSNRJ3YKS1V0XVG66M'
const typeformEmbedScript = 'https://embed.typeform.com/next/embed.js'

const routePaths: Record<Route, string> = {
  home: '/',
  treatments: '/treatments',
  how: '/how-it-works',
  about: '/about',
  start: '/get-started',
  faq: '/faq',
  resources: '/resources',
  blog: '/blog',
  refer: '/refer-a-patient',
  pilot: '/pilot-plan',
  leqembiLocal: '/leqembi/florida/miami',
}

const pathRoutes: Record<string, Route> = {
  '': 'home',
  treatments: 'treatments',
  'how-it-works': 'how',
  about: 'about',
  'get-started': 'start',
  faq: 'faq',
  resources: 'resources',
  blog: 'blog',
  'refer-a-patient': 'refer',
  'pilot-plan': 'pilot',
}

const discoveryPaths = [
  {
    title: 'I am worried about memory changes',
    copy: 'A low-commitment virtual check helps you understand whether specialist review may be useful.',
    action: 'Take the check',
    route: 'start' as Route,
    icon: Brain,
  },
  {
    title: 'I already have a diagnosis',
    copy: 'Skip basic education and start with treatment-eligibility and second-opinion questions.',
    action: 'Review eligibility',
    route: 'treatments' as Route,
    icon: BadgeCheck,
  },
  {
    title: 'I am helping someone I love',
    copy: 'The path is built for patients and caregivers together, without writing the patient out of the decision.',
    action: 'See how it works',
    route: 'how' as Route,
    icon: HeartHandshake,
  },
  {
    title: 'I am a referring clinician',
    copy: 'Refer a patient for treatment-readiness review while preserving your relationship with them.',
    action: 'Refer a patient',
    route: 'refer' as Route,
    icon: Stethoscope,
  },
]

const valueProps = [
  {
    title: 'Speed to a specialist',
    copy: 'Virtual first, so your evaluation does not wait on a local neurology opening. See a specialist in weeks, not months.',
    icon: CalendarClock,
  },
  {
    title: 'A real second opinion',
    copy: 'From specialists focused on disease-modifying treatment eligibility, not general memory care.',
    icon: BadgeCheck,
  },
  {
    title: 'A path into treatment',
    copy: 'If you qualify, a direct connection into a national infusion network, not just another referral.',
    icon: Building2,
  },
]

const treatmentRows = [
  ['Route', 'IV infusion every two weeks; can transition to a once-weekly at-home injection after 18 months', 'IV infusion every four weeks'],
  ['MRI monitoring', 'Baseline, then before your 3rd, 5th, 7th, and 14th infusions', 'Baseline, then before your 2nd, 3rd, 4th, and 7th doses'],
  ['Duration', 'No amyloid-based stopping rule built into treatment today', 'Can stop once amyloid reaches minimal levels on a PET scan, a defined finish line'],
  ['Infusion reactions', 'Not broken out by genotype in sources reviewed', 'Overall 9%, mostly within the first four infusions'],
]

const fitChecks = [
  'You have a diagnosis already, or memory changes serious enough to justify specialist review.',
  'You are looking for a treatment-readiness answer, not only general memory-care advice.',
  'You can complete a virtual visit and local testing if the clinician recommends it.',
  'A family member or care partner can participate in planning when needed.',
  'You have not already started a disease-modifying Alzheimer\'s treatment elsewhere.',
]

const safetyChecks = [
  'Medication and anticoagulant review',
  'MRI compatibility and prior imaging review',
  'APOE-informed risk discussion when appropriate',
  'Clear escalation instructions for urgent symptoms',
]

const payerNames = [
  'Aetna',
  'Anthem',
  'Cigna',
  'Humana',
  'Medicare',
  'MultiPlan',
  'TRICARE',
  'UnitedHealthcare',
  'Wellcare',
  'Fidelis Care',
  'WellSense',
  'Community Health Options',
]

const simpleProcess = [
  ['Tell us what is going on', 'A short form gathers symptoms, diagnosis status, caregiver context, insurance, and location.'],
  ['Meet the specialist team', 'A virtual visit reviews records, history, goals, and what testing may be needed next.'],
  ['Get a clearer answer', 'Labs, imaging, biomarker confirmation, and safety factors are reviewed before planning.'],
  ['Move locally if appropriate', 'Patients who qualify can be routed into local treatment follow-through.'],
]

const journeySteps = [
  {
    title: 'Tell us what is going on',
    meta: 'Virtual',
    points: [
      'Reach out as the patient, a caregiver, or a physician referral.',
      'Complete a short intake covering symptoms, daily activities, medications, insurance, and caregiver information.',
      'Your form routes to the right next step, including what to do if this is not the right fit.',
    ],
  },
  {
    title: 'Meet your specialist',
    meta: 'Virtual - 60-90 min',
    points: [
      'We verify insurance in parallel, so it is ready before your visit.',
      'Diagnostic intake visit with your caregiver present: history, cognitive screen, medication review, and a plan for what is next.',
      'Orders placed when appropriate: standard labs, amyloid biomarker testing, genetic testing, and brain MRI.',
    ],
  },
  {
    title: 'Get your workup and results',
    meta: 'Local + Virtual - about 2-3 weeks',
    points: [
      'A single blood draw can cover labs and biomarker testing when available.',
      'Brain MRI is completed locally, with careful review for treatment-safety questions.',
      'The clinical team reviews your full workup before the next visit.',
      'Results and treatment-planning visit covers diagnosis, options, logistics, and honest risk discussion.',
    ],
  },
  {
    title: 'Start treatment and stay monitored',
    meta: 'Hybrid',
    points: [
      'If you qualify, the team helps route you to an in-network infusion center near you.',
      'A monitoring calendar keeps infusions, MRIs, and follow-up steps on schedule.',
      'Clear triage instructions and regular check-ins help watch for side effects.',
    ],
  },
]

const howFaqItems = [
  ['Is this legitimate, or some kind of online scam?', 'Local Doctor is designed as a focused specialty-care front door connected to Local Infusion\'s established care network. Clinical decisions still require licensed review.'],
  ['Will my insurance cover this?', 'Coverage depends on your plan, clinical criteria, testing, and treatment requirements. The team should review details before you commit to a care path.'],
  ['Will this replace my relationship with my current doctor?', 'No. Local Doctor is meant to work alongside existing clinicians, not erase those relationships.'],
  ['I do not trust something this serious being handled virtually.', 'The early evaluation and coordination can start virtually. Testing and any treatment follow-through happen locally or in person when required.'],
  ['What if I do not qualify?', 'You should still leave with a clearer explanation and a sensible next step. A not-yet answer can be useful, not a dead end.'],
]

const faqCategories = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    items: [
      ['Is this legitimate, or some kind of online scam?', 'Local Doctor is designed as a focused specialty-care front door connected to Local Infusion\'s established care network. Clinical decisions still require licensed review.'],
      ['Do I need a referral from my current doctor?', 'No referral is required to start. If you move forward, the team can coordinate with your existing physician so information does not get lost.'],
      ['How long does the intake process take?', 'The first intake step is short. If review makes sense, the next steps are records, insurance, scheduling, and clinical evaluation.'],
      ['What if I do not qualify?', 'You should still leave with a clearer explanation and a sensible next step. A not-yet answer can be useful, not a dead end.'],
    ],
  },
  {
    id: 'diagnosis',
    title: 'Diagnosis & Evaluation',
    items: [
      ['I do not have a diagnosis yet. Can I still start here?', 'Yes. Some people start with memory concerns and no formal diagnosis. The right path depends on history, symptoms, records, and clinician review.'],
      ['What does a full workup involve?', 'A full evaluation may include cognitive assessment, medical history, medication review, labs, MRI, amyloid confirmation, and risk discussion.'],
      ['Can I get a second opinion if I was diagnosed elsewhere?', 'Yes. A second opinion is one of the clearest use cases. Existing records can help the team avoid starting from zero.'],
      ['Will this replace my current doctor?', 'No. Local Doctor is meant to work alongside existing clinicians, not erase those relationships.'],
    ],
  },
  {
    id: 'treatment',
    title: 'Treatment & Safety',
    items: [
      ['What treatments are being reviewed?', 'The first pathway focuses on Leqembi and Kisunla readiness for certain people with early Alzheimer\'s who may qualify after evaluation.'],
      ['Is this handled entirely online?', 'The early evaluation and coordination can start virtually. Testing and any treatment follow-through happen locally or in person when required.'],
      ['What is ARIA?', 'ARIA is a known safety concern involving brain swelling or small bleeds visible on MRI. Monitoring and symptom education are part of treatment-readiness review.'],
      ['How soon might I notice a difference?', 'These treatments are evaluated by slowing decline over time, not by a sudden day-to-day improvement. Expectations should be reviewed with a clinician.'],
    ],
  },
  {
    id: 'cost',
    title: 'Cost & Insurance',
    items: [
      ['Will insurance cover this?', 'Coverage depends on your plan, clinical criteria, testing, and treatment requirements. The team should review details before you commit to a care path.'],
      ['What if I am on Medicare?', 'Medicare coverage can depend on clinical criteria and registry or policy requirements. Your specific situation should be checked during intake.'],
      ['Will I get surprise bills?', 'The goal is to review expected costs and coverage before next steps. Final launch copy should be reviewed against the actual billing workflow.'],
    ],
  },
  {
    id: 'visits',
    title: 'Visits & Logistics',
    items: [
      ['Where do infusions take place?', 'If treatment is clinically appropriate, infusions take place at an appropriate local infusion setting, not through the website.'],
      ['Can a family member or caregiver join?', 'Yes. Care partners are welcome and often helpful for history, logistics, visit notes, and monitoring.'],
      ['Who do I contact in a medical emergency?', 'Call 911 immediately. Local Doctor provides specialist evaluation and care coordination. It does not replace emergency care.'],
    ],
  },
]

const keywordGroups = [
  {
    title: 'Treatment and eligibility',
    intent: 'Highest intent',
    terms: ['Leqembi eligibility', 'Kisunla eligibility', 'Alzheimer\'s treatment second opinion', 'disease modifying Alzheimer\'s treatment'],
  },
  {
    title: 'Access and second opinion',
    intent: 'High intent',
    terms: ['Alzheimer\'s specialist near me', 'memory clinic waitlist', 'dementia second opinion', 'neurologist for Alzheimer\'s'],
  },
  {
    title: 'Symptom uncertainty',
    intent: 'Earlier stage',
    terms: ['mild memory change', 'early dementia symptoms', 'memory loss doctor online', 'is this Alzheimer\'s'],
  },
  {
    title: 'Provider/referral',
    intent: 'Warmest path',
    terms: ['refer for Alzheimer\'s treatment eligibility', 'anti amyloid treatment referral', 'Leqembi infusion referral support'],
  },
]

const resources = [
  {
    title: 'Early Alzheimer\'s signs vs. normal aging',
    label: 'Signs and symptoms',
    copy: 'A patient-friendly guide to memory and thinking changes that may justify a real medical conversation.',
  },
  {
    title: 'What to expect in a full evaluation',
    label: 'Evaluation',
    copy: 'Cognitive assessment, records, labs, imaging, amyloid confirmation, and clinical next steps in plain language.',
  },
  {
    title: 'Leqembi and Kisunla readiness checklist',
    label: 'Treatment readiness',
    copy: 'What a clinician may need to review before deciding whether anti-amyloid treatment should be considered.',
  },
  {
    title: 'Brain health habits worth discussing',
    label: 'Brain health',
    copy: 'Physical activity, heart-healthy nutrition, social connection, sleep, and mental engagement prompts for a clinician conversation.',
  },
  {
    title: 'Care partner guide for virtual visits',
    label: 'Caregiver support',
    copy: 'How spouses, adult children, and trusted supporters can help without taking over the patient\'s voice.',
  },
  {
    title: 'Insurance, records, and local testing',
    label: 'Access',
    copy: 'A practical checklist for benefits review, prior authorizations, MRI logistics, and downstream infusion planning.',
  },
]

const blogPosts = [
  {
    title: 'Leqembi and Kisunla: what they are, and what they are not',
    label: 'Treatment-stage',
    copy: 'A claim-safe overview of anti-amyloid treatment, eligibility review, safety monitoring, and why these drugs are not cures.',
  },
  {
    title: 'What to gather before an Alzheimer\'s second opinion',
    label: 'Records',
    copy: 'Diagnosis notes, medication lists, cognitive testing, imaging, lab work, insurance cards, and caregiver observations.',
  },
  {
    title: 'What amyloid testing can and cannot answer',
    label: 'Testing',
    copy: 'How biomarker testing may fit into a complete evaluation, and why it should not be treated as a standalone diagnosis.',
  },
  {
    title: 'When memory changes deserve a doctor conversation',
    label: 'Symptoms',
    copy: 'A plain-language distinction between occasional forgetfulness and changes that become more frequent or disruptive.',
  },
  {
    title: 'Why the care partner matters in treatment planning',
    label: 'Care partner',
    copy: 'Advanced Alzheimer\'s therapy decisions involve logistics, monitoring, consent, transportation, and shared understanding.',
  },
  {
    title: 'Brain health basics while you wait for answers',
    label: 'Brain health',
    copy: 'Educational prompts around activity, diet, sleep, social connection, and staying engaged, with clinician guidance.',
  },
]

function App() {
  const [route, setRoute] = useState<Route>('home')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    function applyPath() {
      const path = window.location.pathname.replace(/^\/+|\/+$/g, '')
      setRoute(path.startsWith('leqembi/') ? 'leqembiLocal' : pathRoutes[path] ?? 'home')
      setMenuOpen(false)
    }

    applyPath()
    window.addEventListener('popstate', applyPath)
    return () => window.removeEventListener('popstate', applyPath)
  }, [])

  function navigate(next: Route) {
    setRoute(next)
    setMenuOpen(false)
    const path = routePaths[next]
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main>
      <Header route={route} menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((open) => !open)} onNavigate={navigate} />
      {route === 'home' && <HomePage onNavigate={navigate} />}
      {route === 'treatments' && <TreatmentsPage onNavigate={navigate} />}
      {route === 'how' && <HowPage onNavigate={navigate} />}
      {route === 'about' && <AboutPage onNavigate={navigate} />}
      {route === 'start' && <StartPage />}
      {route === 'faq' && <FaqPage onNavigate={navigate} />}
      {route === 'resources' && <ResourcesPage onNavigate={navigate} />}
      {route === 'blog' && <BlogPage onNavigate={navigate} />}
      {route === 'refer' && <ReferPage onNavigate={navigate} />}
      {route === 'pilot' && <PilotPage onNavigate={navigate} />}
      {route === 'leqembiLocal' && <LeqembiLocalPage onNavigate={navigate} />}
      <Footer onNavigate={navigate} />
    </main>
  )
}

function Header({
  route,
  menuOpen,
  onToggleMenu,
  onNavigate,
}: {
  route: Route
  menuOpen: boolean
  onToggleMenu: () => void
  onNavigate: (route: Route) => void
}) {
  const navItems: Array<[Route, string]> = [
    ['how', 'How it works'],
    ['treatments', 'Treatments'],
    ['about', 'Meet the Team'],
  ]
  const resourcesActive = route === 'resources' || route === 'blog' || route === 'faq'

  return (
    <header className="site-header">
      <div className="header-inner">
        <button className="brand-button" type="button" onClick={() => onNavigate('home')}>
          <img src="/assets/mark-color.svg" alt="" />
          <span>Local Doctor</span>
        </button>
        <nav className="desktop-nav" aria-label="Main navigation">
          {navItems.map(([itemRoute, label]) => (
            <button className={route === itemRoute ? 'active' : ''} key={itemRoute} type="button" onClick={() => onNavigate(itemRoute)}>
              {label}
            </button>
          ))}
          <div className="nav-dropdown">
            <button className={resourcesActive ? 'active' : ''} type="button" onClick={() => onNavigate('resources')}>
              Resources
            </button>
            <div>
              <button type="button" onClick={() => onNavigate('resources')}>Guides</button>
              <button type="button" onClick={() => onNavigate('blog')}>Blog</button>
              <button type="button" onClick={() => onNavigate('faq')}>FAQ</button>
            </div>
          </div>
        </nav>
        <button className="header-cta" type="button" onClick={() => onNavigate('start')}>
          Check eligibility
        </button>
        <button className="menu-button" type="button" aria-label="Menu" onClick={onToggleMenu}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {menuOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navItems.map(([itemRoute, label]) => (
            <button key={itemRoute} type="button" onClick={() => onNavigate(itemRoute)}>
              {label}
            </button>
          ))}
          <button type="button" onClick={() => onNavigate('resources')}>Guides</button>
          <button type="button" onClick={() => onNavigate('blog')}>Blog</button>
          <button type="button" onClick={() => onNavigate('faq')}>FAQ</button>
          <button type="button" onClick={() => onNavigate('start')}>Check eligibility</button>
        </nav>
      )}
    </header>
  )
}

function HomePage({ onNavigate }: { onNavigate: (route: Route) => void }) {
  return (
    <>
      <section className="hero">
        <img className="hero-image" src="/assets/hero-patient-caregiver.webp" alt="Older adults walking together outdoors" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="hero-copy">
            <p className="eyebrow light">Virtual Alzheimer's specialty clinic</p>
            <h1>Treatment that goes after Alzheimer's directly. <em>Fast.</em></h1>
            <p>
              New FDA-approved treatments can slow early Alzheimer&apos;s progression. Get a second opinion from clinicians who specialize in disease-modifying treatment and cognitive impairment to see if you may be eligible.
            </p>
            <div className="hero-actions">
              <button className="primary light-primary" type="button" onClick={() => onNavigate('start')}>Check eligibility</button>
              <button className="secondary light-secondary" type="button" onClick={() => onNavigate('how')}>Learn more</button>
            </div>
            <div className="trust-note"><span /> Backed by a national infusion network and a focused treatment-readiness pathway.</div>
          </div>
        </div>
      </section>

      <section className="stat-band">
        <Metric value="3.5 years" label="average gap between first symptoms and diagnosis, nationally" />
        <Metric value="6-9 months" label="typical wait for a first specialist visit elsewhere" />
        <Metric value="~300" label="referring physicians already in the network" />
        <Metric value="97%+" label="patient satisfaction across the network" />
      </section>

      <section className="section white">
        <SectionIntro eyebrow="Why Local Doctor" title="Built around one job: a fast, clear answer on treatment readiness." />
        <div className="value-grid">
          {valueProps.map((prop) => {
            const Icon = prop.icon
            return (
              <article className="value-card" key={prop.title}>
                <span><Icon size={24} /></span>
                <h3>{prop.title}</h3>
                <p>{prop.copy}</p>
              </article>
            )
          })}
        </div>
      </section>

      <InsuranceStrip />

      <section className="section mist">
        <div className="section-row">
          <SectionIntro eyebrow="How it works" title="From first concern to treatment readiness, in 4 steps." />
          <button className="text-link" type="button" onClick={() => onNavigate('how')}>See the full process <ArrowRight size={15} /></button>
        </div>
        <ProcessGrid />
      </section>

      <section className="section white">
        <TreatmentPreview onNavigate={onNavigate} />
      </section>

      <AudienceSplit onNavigate={onNavigate} />

      <section className="section mist">
        <SectionIntro eyebrow="Start in the right place" title="Different visitors need different first steps." copy="A symptom search, a drug-name search, a caregiver visit, and a physician referral should not all land on the same generic form." />
        <div className="path-grid">
          {discoveryPaths.map((path) => {
            const Icon = path.icon
            return (
              <button className="path-card" type="button" key={path.title} onClick={() => onNavigate(path.route)}>
                <Icon size={24} />
                <strong>{path.title}</strong>
                <span>{path.copy}</span>
                <small>{path.action} <ArrowRight size={14} /></small>
              </button>
            )
          })}
        </div>
      </section>

      <ConversionPanel onNavigate={onNavigate} />
    </>
  )
}

function TreatmentsPage({ onNavigate }: { onNavigate: (route: Route) => void }) {
  return (
    <>
      <section className="treatment-hero">
        <div>
          <p className="eyebrow">Treatments</p>
          <h1>FDA-approved to go after Alzheimer's directly.</h1>
          <p>Leqembi and Kisunla are the first FDA-approved therapies shown to act on the underlying disease, not just its symptoms. Here is what they do and who they may be for.</p>
          <button className="primary" type="button" onClick={() => onNavigate('start')}>Check eligibility <ArrowRight size={15} /></button>
        </div>
        <img src="/assets/hero-memory-care.webp" alt="Patient and caregiver speaking with a clinician" />
      </section>
      <section className="section white">
        <div className="honest-card">
          <ShieldAlert size={24} />
          <div>
            <h2>What to expect, honestly</h2>
            <p>
              In clinical trials, both treatments showed a real, moderate slowing of cognitive decline. Neither is a cure, and neither reverses symptoms already present. The point is to weigh the potential benefit clearly, without overstating it.
            </p>
          </div>
        </div>
      </section>
      <section className="section mist">
        <SectionIntro eyebrow="Compare" title="Leqembi and Kisunla, side by side." />
        <TreatmentComparison />
        <div className="disclaimer">
          Treatment information must be reviewed against current prescribing information and payer requirements before launch.
        </div>
      </section>
      <section className="section white fit-section">
        <SectionIntro eyebrow="What we look for" title="Who these treatments may be for." copy="This pathway is for a specific group of patients who want to understand whether treatment targeting amyloid may be an option." />
        <CheckList items={fitChecks} />
      </section>
      <section className="section mist fit-section">
        <SectionIntro eyebrow="Safety" title="The safety screen is part of the product, not an afterthought." copy="The clinical model should make risks and monitoring visible early, then route people to licensed review before any treatment decision." />
        <div className="safety-grid">
          {safetyChecks.map((item) => (
            <article key={item}>
              <ShieldAlert size={20} />
              <span>{item}</span>
            </article>
          ))}
        </div>
      </section>
      <ConversionPanel onNavigate={onNavigate} />
    </>
  )
}

function HowPage({ onNavigate }: { onNavigate: (route: Route) => void }) {
  return (
    <>
      <PageHero
        eyebrow="How it works"
        title="A clear path from first concern to treatment."
        copy="Every step is virtual where it can be, and in-person only where it has to be."
        icon={<CalendarClock size={38} />}
        onPrimary={() => onNavigate('start')}
        primaryLabel="Start the check"
      />
      <section className="section white">
        <div className="journey-list">
          {journeySteps.map((step, index) => (
            <article key={step.title} className="journey-step">
              <b>{index + 1}</b>
              <div>
                <div className="journey-heading">
                  <h3>{step.title}</h3>
                  <span>{step.meta}</span>
                </div>
                <div className="journey-points">
                  {step.points.map((point) => (
                    <p key={point}>
                      <CheckCircle2 size={18} />
                      <span>{point}</span>
                    </p>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="section cost-band">
        <div>
          <p className="eyebrow">Insurance & Cost</p>
          <h2>What this costs you, honestly.</h2>
          <p>Most patients access care through commercial insurance or Medicare. Coverage for diagnosis and treatment depends on your specific plan and, for traditional Medicare, participation in a national treatment registry. We will walk through your specific coverage before you commit to anything. There is no blanket promise here, because there is not a blanket policy.</p>
        </div>
      </section>
      <InsuranceStrip />
      <section className="section mist mini-faq-section">
        <SectionIntro eyebrow="FAQ" title="Questions people actually ask." />
        <div className="mini-faq-list">
          {howFaqItems.map(([question, answer]) => (
            <article key={question}>
              <h3>{question}</h3>
              <p>{answer}</p>
            </article>
          ))}
        </div>
      </section>
      <ConversionPanel onNavigate={onNavigate} title="Ready to find out where you stand?" copy="A short intake is all it takes to get started." secondaryLabel="See treatments" secondaryRoute="treatments" />
    </>
  )
}

function AboutPage({ onNavigate }: { onNavigate: (route: Route) => void }) {
  return (
    <>
      <PageHero
        eyebrow="Care model"
        title="A specialist evaluation built around getting you an answer."
        copy="Local Doctor is designed as a focused virtual Alzheimer's specialty clinic, supported by navigators, diagnostic partners, prescribing clinicians, and Local Infusion's local treatment network."
        icon={<UsersRound size={38} />}
        onPrimary={() => onNavigate('start')}
        primaryLabel="Check eligibility"
      />
      <section className="section white">
        <SectionIntro eyebrow="Care team roles" title="The model is coordinated, not a directory of disconnected appointments." />
        <div className="team-grid">
          {[
            ['Navigator', 'Coordinates benefits, records, diagnostic orders, scheduling, prior authorization, and handoff.'],
            ['Intake coordinator', 'Follows up on missing information, caregiver context, MRI compatibility, and scheduling constraints.'],
            ['Virtual clinician', 'Reviews history, orders and interprets workup, discusses risks, and determines next clinical steps.'],
            ['Central reader', 'Supports consistent MRI review for ARIA and microhemorrhage interpretation.'],
          ].map(([role, copy]) => (
            <article className="team-card" key={role}>
              <UserRound size={24} />
              <h3>{role}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>
      <ConversionPanel onNavigate={onNavigate} />
    </>
  )
}

function StartPage() {
  return (
    <>
      <PageHero
        eyebrow="Get started"
        title="Let's find out if treatment is right for you."
        copy="Most people leave with a clear next step, including what to do if the honest answer is not yet."
        icon={<ClipboardCheck size={38} />}
        primaryLabel="Start eligibility check"
        onPrimary={() => document.getElementById('intake')?.scrollIntoView({ behavior: 'smooth' })}
      />
      <section className="section white">
        <StartExperience />
      </section>
    </>
  )
}

function ReferPage({ onNavigate }: { onNavigate: (route: Route) => void }) {
  return (
    <>
      <PageHero
        eyebrow="For referring clinicians"
        title="Refer patients for Alzheimer's treatment-readiness review without ending your relationship."
        copy="Local Doctor is a focused pathway for patients who may need anti-amyloid treatment eligibility review, diagnostic workup coordination, payer support, and local infusion follow-through."
        icon={<Stethoscope size={38} />}
        onPrimary={() => onNavigate('start')}
        primaryLabel="Prepare a referral"
      />
      <section className="section white">
        <div className="provider-grid">
          <article>
            <h2>Good-fit referrals</h2>
            <ul>
              <li>Suspected or diagnosed early Alzheimer's or mild cognitive impairment</li>
              <li>Patient needs a specialist-level second opinion on treatment eligibility</li>
              <li>Records, biomarker confirmation, MRI, or payer requirements are blocking action</li>
              <li>Patient may need local infusion follow-through if they qualify</li>
            </ul>
          </article>
          <article>
            <h2>Not a fit for this pilot</h2>
            <ul>
              <li>Moderate or severe dementia as the primary need</li>
              <li>Emergency neurologic symptoms or rapid decline</li>
              <li>Patient already actively receiving Leqembi or Kisunla elsewhere</li>
              <li>Known hard exclusion that rules out MRI or anti-amyloid therapy</li>
            </ul>
          </article>
        </div>
      </section>
    </>
  )
}

function FaqPage({ onNavigate }: { onNavigate: (route: Route) => void }) {
  const [openItem, setOpenItem] = useState('getting-started-0')

  return (
    <>
      <PageHero eyebrow="FAQ" title="Answers to what patients and families ask us most." copy="Straight, specific answers about eligibility, diagnosis, treatment, safety, and cost." icon={<FileText size={38} />} onPrimary={() => onNavigate('start')} primaryLabel="Check eligibility" />
      <section className="section white faq-section">
        <div className="faq-jump-list">
          {faqCategories.map((category) => (
            <a key={category.id} href={`#${category.id}`}>{category.title}</a>
          ))}
        </div>
        {faqCategories.map((category) => (
          <section className="faq-category" id={category.id} key={category.id}>
            <p className="eyebrow">{category.title}</p>
            <div className="faq-accordion">
              {category.items.map(([question, answer], index) => {
                const itemId = `${category.id}-${index}`
                const isOpen = openItem === itemId
                return (
                  <article className={isOpen ? 'open' : ''} key={question}>
                    <button type="button" onClick={() => setOpenItem(isOpen ? '' : itemId)} aria-expanded={isOpen}>
                      <span>{question}</span>
                      <ChevronDown size={18} />
                    </button>
                    {isOpen && <p>{answer}</p>}
                  </article>
                )
              })}
            </div>
          </section>
        ))}
      </section>
      <section className="question-band">
        <div>
          <h2>Did not find your answer?</h2>
          <p>Our care team can respond with a next step, not an automated loop.</p>
        </div>
        <a className="primary" href="mailto:hello@trylocaldoctor.com">Email our team</a>
      </section>
      <ConversionPanel onNavigate={onNavigate} />
    </>
  )
}

function ResourcesPage({ onNavigate }: { onNavigate: (route: Route) => void }) {
  return (
    <>
      <PageHero eyebrow="Resources" title="Guides for treatment eligibility, records, and next steps." copy="SEO and patient education should start light during the pilot, then expand once search and intake data show what people actually need." icon={<FileText size={38} />} onPrimary={() => onNavigate('blog')} primaryLabel="Read articles" />
      <section className="section white">
        <div className="resource-grid">
          {resources.map((resource) => (
            <article className="resource-card" key={resource.title}>
              <span>{resource.label}</span>
              <h2>{resource.title}</h2>
              <p>{resource.copy}</p>
              <button type="button" onClick={() => onNavigate('blog')}>Open guide <ArrowRight size={14} /></button>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}

function BlogPage({ onNavigate }: { onNavigate: (route: Route) => void }) {
  return (
    <>
      <PageHero eyebrow="Blog" title="Straight answers on diagnosis, eligibility, and treatment." copy="A lightweight content layer for launch, built around the questions paid-search visitors and referral patients are already asking." icon={<Sparkles size={38} />} onPrimary={() => onNavigate('start')} primaryLabel="Take the check" />
      <section className="section white">
        <div className="blog-grid">
          {blogPosts.map((post) => (
            <article className="blog-card" key={post.title}>
              <span>{post.label}</span>
              <h2>{post.title}</h2>
              <p>{post.copy}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}

function PilotPage({ onNavigate }: { onNavigate: (route: Route) => void }) {
  return (
    <>
      <PageHero eyebrow="Pilot plan" title="A narrow test to acquire the first 10 qualified patients." copy="This page is for internal review only: one condition, one licensure-driven market, Google Search first, and clinical/legal review before spend." icon={<MapPin size={38} />} onPrimary={() => onNavigate('start')} primaryLabel="Open patient flow" />
      <section className="section white">
        <SectionIntro eyebrow="Keyword map" title="Separate search intent before budget goes live." />
        <div className="keyword-grid">
          {keywordGroups.map((group) => (
            <article className="keyword-card" key={group.title}>
              <span>{group.intent}</span>
              <h2>{group.title}</h2>
              <div>
                {group.terms.map((term) => <small key={term}>{term}</small>)}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}

function LeqembiLocalPage({ onNavigate }: { onNavigate: (route: Route) => void }) {
  const market = getMarketFromPath()

  return (
    <>
      <section className="local-seo-hero">
        <div>
          <p className="eyebrow">Leqembi eligibility review</p>
          <h1>Leqembi treatment-readiness review near {market}.</h1>
          <p>
            If you are researching Leqembi for early Alzheimer&apos;s, Local Doctor helps you understand what records, testing, safety review, and local follow-through may be needed before a licensed clinician can make a treatment decision.
          </p>
          <button className="primary" type="button" onClick={() => onNavigate('start')}>Start eligibility check <ArrowRight size={15} /></button>
        </div>
        <aside>
          <BadgeCheck size={26} />
          <strong>Not a prescription from a webpage.</strong>
          <span>Leqembi requires clinical evaluation, amyloid confirmation, MRI review, safety monitoring, and payer-specific requirements.</span>
        </aside>
      </section>
      <section className="section white">
        <SectionIntro eyebrow="What this page answers" title="A search landing page should help the patient decide if the next step is worth taking." />
        <div className="seo-answer-grid">
          {[
            ['Who may be considered', 'People in earlier symptomatic stages, such as mild cognitive impairment or mild dementia due to Alzheimer\'s, after clinician review.'],
            ['What testing may be needed', 'Cognitive assessment, records, amyloid confirmation, MRI safety review, labs, medication review, and risk discussion.'],
            ['What Local Doctor does', 'Routes patients toward specialist review, testing coordination, insurance readiness, and local treatment planning when appropriate.'],
            ['What happens locally', 'If treatment is clinically appropriate, the care path can connect into local infusion follow-through and monitoring logistics.'],
          ].map(([title, copy]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="section mist fit-section">
        <SectionIntro eyebrow="Before treatment" title="What to gather before a Leqembi second opinion." copy="This mirrors what high-intent search visitors need: not a generic article, but a checklist that moves them toward a qualified next step." />
        <CheckList items={[
          'Current diagnosis or reason Alzheimer\'s disease is suspected',
          'Prior cognitive testing, neurology notes, MRI reports, or memory-clinic records',
          'Medication list, especially blood thinners or drugs that may affect risk review',
          'Insurance information and a local testing or infusion geography',
          'A care partner who can join visits and help with monitoring logistics',
        ]} />
      </section>
      <ConversionPanel onNavigate={onNavigate} />
    </>
  )
}

function getMarketFromPath() {
  const [, state = '', city = ''] = window.location.pathname.replace(/^\/+|\/+$/g, '').split('/')
  const pieces = [city, state].filter(Boolean).map((piece) => piece.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '))
  return pieces.length ? pieces.join(', ') : 'your area'
}

function StartExperience() {
  return (
    <div className="start-experience">
      <EligibilityLeadForm />
      <ScheduleCallWidget />
      <section className="before-call">
        {[
          ['What if I do not qualify?', 'You will still get a clear explanation of why and what a sensible next step may be.'],
          ['Will this replace my current doctor?', 'No. This is a focused specialist pathway that can work alongside the clinicians you already trust.'],
          ['Can a caregiver be part of this?', 'Yes. Care partners are welcome and often helpful for history, logistics, and next-step planning.'],
        ].map(([title, copy]) => (
          <article key={title}>
            <h3>{title}</h3>
            <p>{copy}</p>
          </article>
        ))}
      </section>
    </div>
  )
}

function EligibilityLeadForm() {
  useEffect(() => {
    const previousScript = document.querySelector('script[data-local-doctor-typeform]')
    previousScript?.remove()

    const script = document.createElement('script')
    script.src = typeformEmbedScript
    script.async = true
    script.dataset.localDoctorTypeform = 'true'
    document.body.appendChild(script)
  }, [])

  return (
    <section className="lead-card intake-embed-card" id="intake">
      <div className="intake-copy">
        <p className="eyebrow">Eligibility intake</p>
        <h2>Complete the secure intake.</h2>
        <p>This secure intake collects the information the team needs to understand your situation and decide whether clinical review may make sense.</p>
      </div>
      <div className="intake-frame-wrap">
        <div className="typeform-live-embed" data-tf-live={typeformLiveId} />
      </div>
    </section>
  )
}

function ScheduleCallWidget() {
  const days = useMemo(() => getNextWeekdays(), [])
  const [day, setDay] = useState('')
  const [time, setTime] = useState('')
  const [booked, setBooked] = useState(false)
  const slots = ['9:00 AM', '10:30 AM', '1:00 PM', '2:30 PM', '4:00 PM']
  const selectedDay = days.find((item) => item.value === day)

  return (
    <section className="consult-card" id="consult">
      <div>
        <p className="eyebrow">Schedule a call</p>
        <h2>Speak with a member of our team.</h2>
        <p>A 30-minute call to understand your needs, verify insurance directionally, and decide whether clinical review makes sense. No obligation.</p>
        {booked ? (
          <div className="booking-success">
            <CheckCircle2 size={24} />
            <strong>You are booked for {selectedDay?.label} at {time}.</strong>
            <span>We will call you then. No forms to fill out first.</span>
            <button type="button" onClick={() => {
              setBooked(false)
              setTime('')
            }}>Choose a different time</button>
          </div>
        ) : (
          <>
            <div className="day-picker">
              {days.map((item) => (
                <button className={day === item.value ? 'selected' : ''} type="button" key={item.value} onClick={() => {
                  setDay(item.value)
                  setTime('')
                }}>
                  <span>{item.weekday}</span>
                  <strong>{item.monthDay}</strong>
                </button>
              ))}
            </div>
            {day && (
              <div className="time-picker">
                {slots.map((slot) => (
                  <button className={time === slot ? 'selected' : ''} type="button" key={slot} onClick={() => setTime(slot)}>{slot}</button>
                ))}
              </div>
            )}
            <button className="primary" type="button" disabled={!day || !time} onClick={() => setBooked(true)}>Confirm call <ArrowRight size={15} /></button>
          </>
        )}
      </div>
      <aside>
        <h3>What to expect</h3>
        <ol>
          <li>Enrollment team calls at the selected time.</li>
          <li>You talk through symptoms, goals, and coverage basics.</li>
          <li>If appropriate, the team helps schedule clinical review.</li>
        </ol>
        <h3>What to have handy</h3>
        <ul>
          <li>Insurance card</li>
          <li>Medication list</li>
          <li>Recent testing or imaging</li>
        </ul>
      </aside>
    </section>
  )
}

function getNextWeekdays() {
  const formatter = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const days: Array<{ value: string; label: string; weekday: string; monthDay: string }> = []
  const current = new Date()

  while (days.length < 6) {
    current.setDate(current.getDate() + 1)
    const weekdayIndex = current.getDay()
    if (weekdayIndex === 0 || weekdayIndex === 6) continue
    const [weekday, monthDay] = formatter.format(current).split(', ')
    const value = current.toISOString().slice(0, 10)
    days.push({ value, label: `${weekday}, ${monthDay}`, weekday, monthDay })
  }

  return days
}

function InsuranceStrip() {
  const payerLoop = [...payerNames, ...payerNames]

  return (
    <section className="insurance-strip">
      <div>
        <h2>Local Doctor accepts most major health insurance</h2>
        <p>We are committed to financial transparency. No surprise bills or hidden costs, and financial assistance support for every eligible patient. We do what it takes to minimize your costs.</p>
        <div className="payer-marquee" aria-label="Representative payer names">
          <div>
            {payerLoop.map((payer, index) => <span key={`${payer}-${index}`}>{payer}</span>)}
          </div>
        </div>
      </div>
    </section>
  )
}

function ProcessGrid() {
  return (
    <div className="process-grid">
      {simpleProcess.map(([title, copy], index) => (
        <article key={title}>
          <div>
            <b>{index + 1}</b>
            {index < simpleProcess.length - 1 && <span />}
          </div>
          <h3>{title}</h3>
          <p>{copy}</p>
        </article>
      ))}
    </div>
  )
}

function TreatmentPreview({ onNavigate }: { onNavigate: (route: Route) => void }) {
  return (
    <>
      <SectionIntro eyebrow="Treatments" title="Two FDA-approved treatments for early Alzheimer's." copy="Leqembi and Kisunla are IV anti-amyloid treatments for certain people with early Alzheimer&apos;s. Local Doctor helps families understand the requirements, risks, testing, and next step." />
      <div className="treatment-card-grid">
        <article>
          <h3>Leqembi</h3>
          <span>lecanemab-irmb</span>
          <p>An IV anti-amyloid treatment for certain patients with early Alzheimer&apos;s, requiring careful eligibility review and monitoring.</p>
        </article>
        <article>
          <h3>Kisunla</h3>
          <span>donanemab-azbt</span>
          <p>An IV anti-amyloid treatment for certain patients with early Alzheimer&apos;s, with treatment planning tied to label, safety, and response.</p>
        </article>
      </div>
      <button className="text-link treatment-link" type="button" onClick={() => onNavigate('treatments')}>See treatment details <ArrowRight size={15} /></button>
    </>
  )
}

function AudienceSplit({ onNavigate }: { onNavigate: (route: Route) => void }) {
  return (
    <section className="audience-split">
      <article>
        <div>
          <h3>For caregivers</h3>
          <p>You are part of the decision, not just the person who found the website. The flow speaks to patients and families together.</p>
          <button type="button" onClick={() => onNavigate('how')}>See how it works <ArrowRight size={15} /></button>
        </div>
      </article>
      <article>
        <div>
          <h3>For referring physicians</h3>
          <p>Send patients for treatment-readiness review, records support, safety screening, and local follow-through without replacing the referring relationship.</p>
          <button type="button" onClick={() => onNavigate('refer')}>Refer a patient <ArrowRight size={15} /></button>
        </div>
      </article>
    </section>
  )
}

function TreatmentComparison() {
  return (
    <div className="compare-wrap">
      <div className="compare-head">
        <span />
        <MedicineHeading color="purple" name="Leqembi" generic="lecanemab-irmb" />
        <MedicineHeading color="green" name="Kisunla" generic="donanemab-azbt" />
      </div>
      <div className="compare-table" role="table" aria-label="Treatment comparison">
        {treatmentRows.map(([label, leqembi, kisunla]) => (
          <div className="compare-row" role="row" key={label}>
            <span>{label}</span>
            <p>{leqembi}</p>
            <p>{kisunla}</p>
          </div>
        ))}
        <div className="compare-row visual-row" role="row">
          <span>Risk discussion</span>
          <RiskBars tone="purple" labels={['Genotype', 'MRI', 'Medication']} />
          <RiskBars tone="green" labels={['ARIA', 'Infusion', 'Monitoring']} />
        </div>
      </div>
    </div>
  )
}

function MedicineHeading({ color, name, generic }: { color: 'purple' | 'green'; name: string; generic: string }) {
  return (
    <div className="medicine-heading">
      <span className={color} />
      <div>
        <strong>{name}</strong>
        <small>{generic}</small>
      </div>
    </div>
  )
}

function RiskBars({ tone, labels }: { tone: 'purple' | 'green'; labels: string[] }) {
  const widths = tone === 'purple' ? ['82%', '64%', '46%'] : ['72%', '54%', '38%']

  return (
    <div className="risk-bars">
      {labels.map((label, index) => (
        <div key={label}>
          <div><span>{label}</span><small>review</small></div>
          <b><i className={tone} style={{ width: widths[index] }} /></b>
        </div>
      ))}
    </div>
  )
}

function CheckList({ items }: { items: string[] }) {
  return (
    <div className="check-list">
      {items.map((item) => (
        <div key={item}>
          <CheckCircle2 size={14} />
          <span>{item}</span>
        </div>
      ))}
    </div>
  )
}

function PageHero({
  eyebrow,
  title,
  copy,
  icon,
  primaryLabel,
  onPrimary,
  href,
}: {
  eyebrow: string
  title: string
  copy: string
  icon: ReactNode
  primaryLabel: string
  onPrimary?: () => void
  href?: string
}) {
  return (
    <section className="page-hero">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{copy}</p>
        {href ? (
          <a className="primary" href={href} target="_blank" rel="noreferrer">{primaryLabel} <ArrowRight size={15} /></a>
        ) : (
          <button className="primary" type="button" onClick={onPrimary}>{primaryLabel} <ArrowRight size={15} /></button>
        )}
      </div>
      <aside>
        {icon}
        <strong>Clinical decisions require licensed review.</strong>
        <span>The website is a front door, not a diagnosis or treatment promise.</span>
      </aside>
    </section>
  )
}

function ConversionPanel({
  onNavigate,
  title = 'Start with a short check, then move to full intake only when it makes sense.',
  copy = 'The pilot should measure qualified starts, not raw leads.',
  secondaryLabel,
  secondaryRoute,
}: {
  onNavigate: (route: Route) => void
  title?: string
  copy?: string
  secondaryLabel?: string
  secondaryRoute?: Route
}) {
  return (
    <section className="conversion-panel">
      <div>
        <p className="eyebrow light">Ready to find out where you stand?</p>
        <h2>{title}</h2>
        <p>{copy}</p>
      </div>
      <div className="conversion-actions">
        <button className="primary light-primary" type="button" onClick={() => onNavigate('start')}>Check eligibility <ArrowRight size={15} /></button>
        {secondaryLabel && secondaryRoute && (
          <button className="secondary light-secondary" type="button" onClick={() => onNavigate(secondaryRoute)}>{secondaryLabel}</button>
        )}
      </div>
    </section>
  )
}

function SectionIntro({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return (
    <div className="section-intro">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {copy && <p>{copy}</p>}
    </div>
  )
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <article>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  )
}

function Footer({ onNavigate }: { onNavigate: (route: Route) => void }) {
  return (
    <footer className="footer">
      <div>
        <button className="brand-button footer-brand" type="button" onClick={() => onNavigate('home')}>
          <img src="/assets/mark-color.svg" alt="" />
          <span>Local Doctor</span>
        </button>
        <p>A virtual Alzheimer&apos;s specialty clinic connecting patients to specialist evaluation, care coordination, and treatment-readiness review.</p>
      </div>
      <div>
        <strong>Explore</strong>
        <button type="button" onClick={() => onNavigate('home')}>Home</button>
        <button type="button" onClick={() => onNavigate('how')}>How it works</button>
        <button type="button" onClick={() => onNavigate('treatments')}>Treatments</button>
        <button type="button" onClick={() => onNavigate('about')}>Meet the Team</button>
      </div>
      <div>
        <strong>Get started</strong>
        <button type="button" onClick={() => onNavigate('start')}>Check eligibility</button>
        <button type="button" onClick={() => onNavigate('how')}>How it works</button>
        <button type="button" onClick={() => onNavigate('refer')}>For physicians</button>
        <a href="mailto:hello@trylocaldoctor.com">Talk to our team</a>
      </div>
      <div>
        <strong>Legal</strong>
        <a href="mailto:hello@trylocaldoctor.com">Contact</a>
          <button type="button" onClick={() => onNavigate('start')}>Intake form</button>
        <small>Individual results vary. Local Doctor does not replace emergency care. Call 911 for a medical emergency.</small>
      </div>
    </footer>
  )
}

export default App
