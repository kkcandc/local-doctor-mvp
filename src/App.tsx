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

const typeformLiveId = '01M0ZD7ZA356YBE7W9E0GTFJ4T'
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
