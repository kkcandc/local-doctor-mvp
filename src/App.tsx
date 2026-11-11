import { useEffect, useLayoutEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarClock,
  ChevronDown,
  CheckCircle2,
  Menu,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import {
  blogPosts,
  getBlogPost,
  medicalDisclaimer,
  type BlogBlock,
} from './blogPosts'
import {
  ContactPage,
  ConsentPage,
  LegalIdentity,
  PatientRightsPage,
  PrivacyPage,
  ProviderRoster,
  TermsPage,
  publicPhone,
  publicEmail,
} from './compliancePages'
import { isPageEnabled, type PageFlag } from './featureFlags'
import { noteSpaNavigation } from './analytics/googleAds'
import { pathWithAdsParams } from './analytics/googleAdsConfig'
import { noteGaSpaNavigation } from './analytics/googleAnalytics'
import { trackCtaClick as sendCtaClick } from './analytics/tracking'
import { syncChatbot } from './chatbot'
import { EvaluationPage } from './EvaluationPage'
import { evaluationMeta, startMeta } from './pageMeta'
import { noteEligibilityStarted } from './analytics/posthog'
import { CalendlyEmbed } from './CalendlyEmbed'
import { LandingPage, type CtaTarget } from './landing/LandingPage'
import { evaluationFormSlugs } from './landing/landingContent'
import { isLandingSlug, landingCanonical, landingMeta } from './landing/landingMeta'
import { StickyCta } from './StickyCta'
import './App.css'

type Route =
  | 'home'
  | 'treatments'
  | 'how'
  | 'about'
  | 'start'
  | 'evaluation'
  | 'faq'
  | 'blog'
  | 'blogPost'
  | 'refer'
  | 'privacy'
  | 'terms'
  | 'patientRights'
  | 'consent'
  | 'contact'
  | 'landing'

type Navigate = (next: Route, slug?: string, ctaLocation?: string, ctaLabel?: string, hash?: string) => void

const defaultTitle = "Local Doctor | Alzheimer's Treatment Eligibility Review"
const defaultDescription =
  "Local Doctor is a virtual Alzheimer's specialty clinic for treatment eligibility review, records, testing, insurance questions, and local follow-through for people who may qualify."
const defaultOgTitle = "Connect with Alzheimer's specialists and advanced treatment today"

const routeMeta: Partial<Record<Route, { title: string; description: string }>> = {
  start: startMeta,
  evaluation: evaluationMeta,
  privacy: {
    title: 'Privacy Policy | Local Doctor',
    description: 'Privacy Policy for Local Infusion Inc. services offered through trylocaldoctor.com.',
  },
  terms: {
    title: 'Terms of Use | Local Doctor',
    description: 'Terms of Use for the Local Doctor platform operated by Local Infusion, Inc.',
  },
  patientRights: {
    title: 'Patient Rights, Notices, and Notice of Privacy Practice | Local Doctor',
    description: 'Patient rights, nondiscrimination and good faith estimate notices, and the Notice of Privacy Practices.',
  },
  consent: {
    title: 'Telehealth Consent | Local Doctor',
    description: 'What a Local Doctor virtual visit is, the risks and alternatives, and how telehealth consent is collected.',
  },
  contact: {
    title: 'Contact | Local Doctor',
    description: 'Contact Local Doctor for the legal entity, physical address, and licensed provider.',
  },
  about: {
    title: 'Meet the Team | Local Doctor',
    description: 'Care team roles, the company that operates Local Doctor, and the licensed providers who may see patients.',
  },
}

const routePaths: Record<Exclude<Route, 'blogPost' | 'landing'>, string> = {
  home: '/',
  treatments: '/treatments',
  how: '/how-it-works',
  about: '/about',
  start: '/get-started',
  evaluation: '/evaluation',
  faq: '/faq',
  blog: '/blog',
  refer: '/refer-a-patient',
  privacy: '/privacy',
  terms: '/terms',
  patientRights: '/patient-rights',
  consent: '/telehealth-consent',
  contact: '/contact',
}

const pathRoutes: Record<string, Route> = {
  '': 'home',
  treatments: 'treatments',
  'how-it-works': 'how',
  about: 'about',
  'get-started': 'start',
  evaluation: 'evaluation',
  faq: 'faq',
  blog: 'blog',
  'refer-a-patient': 'refer',
  privacy: 'privacy',
  terms: 'terms',
  'patient-rights': 'patientRights',
  'telehealth-consent': 'consent',
  contact: 'contact',
}

const valueProps = [
  {
    title: 'Dementia specialists',
    copy: 'A valued, credible opinion from board-certified neurologists who specialize in dementia and cognitive impairment, not general memory care.',
    icon: BadgeCheck,
  },
  {
    title: 'Visits from home',
    copy: 'The specialist visit happens by video from home in Maryland, instead of a trip to an in-person neurologist.',
    icon: CalendarClock,
  },
  {
    title: 'Direct path to treatment',
    copy: 'If you qualify, a direct connection into a national infusion network, not just another referral or paper treatment plan.',
    icon: Building2,
  },
]

const treatmentRows = [
  ['Route', 'IV infusion every two weeks; can transition to a once-weekly at-home injection after 18 months', 'IV infusion every four weeks'],
  ['MRI monitoring', 'Baseline during your workup and before your 3rd, 5th, 7th, and 14th infusions', 'Baseline during your workup and before your 2nd, 3rd, 4th, 7th, and 13th infusions'],
  ['Duration', 'Can stop once amyloid reaches minimal levels on a PET scan', 'Can stop once amyloid reaches minimal levels on a PET scan'],
  ['ARIA risk', 'The ARIA-E risk was 13% vs 2% on placebo; The ARIA-H was 17% vs 9% on placebo', 'The ARIA-E risk was 24% vs 2% on placebo; The ARIA-H was 31% vs 13% on placebo'],
]

const fitChecks = [
  'You are located in Maryland.',
  'A family member or care partner can participate in planning when needed.',
  'There is a diagnosis already, or cognitive changes serious enough to justify specialist review.',
  'You are looking for an answer on infusion treatment-readiness, not purely general memory-care advice.',
  'You can complete virtual visits and labs/imaging testing and treatment locally in person, as appropriate.',
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

const simpleProcess: Array<{ title: string; copy: string; cta?: string }> = [
  {
    title: 'Book visit with a neurologist',
    copy: 'Schedule your appointment now and we\'ll get in touch with you to share more information about your visit and what to expect.',
    cta: 'Book now',
  },
  {
    title: 'Meet neurologist',
    copy: 'A video call with the neurologist to dive into your questions, concerns, and goals. It all leads to clear direction on next steps and if new imaging or bloodwork are needed.',
  },
  {
    title: 'Get a clear answer',
    copy: 'The neurologist uses your results and medical history to provide a clear answer on diagnosis and treatment options.',
  },
  {
    title: 'Start treatment',
    copy: 'Patients who qualify for and opt in to infusion treatment are treated seamlessly at a local infusion center.',
  },
]

// A step shows either a light-blue pill (meta) or, for the booking step, a Book now button (cta).
const journeySteps: Array<{ title: string; meta?: string; cta?: string; points: string[] }> = [
  {
    title: 'Book your appointment with a neurologist',
    cta: 'Book now',
    points: [
      'Book your appointment today. Our neurologists are specialized in cognitive impairment and disease-modifying treatments.',
    ],
  },
  {
    title: 'Meet neurologist',
    meta: 'Video visit - 1 hour',
    points: [
      'You and a loved one attend the visit to share your concerns, questions, and provide all information needed for the evaluation by the neurologist including medical history, medications, recent testing, and more.',
      'The neurologist shares their clinical summary and recommended plan of care with you. It may include orders for new tests such as an MRI or PET scan, bloodwork, and genetic testing.',
    ],
  },
  {
    title: 'Get your tests done and review results in a follow up visit',
    meta: 'Local + Virtual',
    points: [
      'If new test orders were placed with your care plan, you schedule appointments with a local imaging center and a lab (Quest or LabCorp) to get them completed.',
      'Your neurologist reviews the test results and a follow up appointment is scheduled for you to discuss them together.',
      'You and a loved one attend the follow up visit to review your results and treatment options with the specialist and align on the path that is best for you.',
    ],
  },
  {
    title: 'Treatment begins',
    meta: 'Local',
    points: [
      'If you\'re a candidate and decide to move forward with infusion treatment, we coordinate it and are with you every step of the way.',
      'We stay in constant touch with you to monitor how things move along and to coordinate the ongoing imaging needed.',
      'If you wish to move forward with other treatments or care, we help you find the best options and provide any referrals needed.',
    ],
  },
]

const costFaqAnswer = 'Provider visits with our neurology specialists will be at low to no out-of-pocket cost to you, depending on your insurance coverage. In case you need new labs and imaging exams to confirm a diagnosis or for treatment prescription, their cost will depend on the sites you use and your insurance coverage.'

const imagingFaqQuestion = 'Is ongoing imaging needed while on treatment? What does that entail?'
const imagingFaqAnswer = 'Yes, while receiving Leqembi or Kisunla treatment, you will need to have ongoing brain MRIs to monitor the presence of ARIA (amyloid related imaging abnormalities). This helps ensure treatment stays safe and that side effects are monitored appropriately.'

// Shown on both the How it works FAQ and the FAQ page (first under Getting Started).
const servicesFaqQuestion = 'What services does Local Doctor provide?'
const servicesFaqAnswer = 'Local Doctor is a virtual Alzheimer\'s clinic focused on accelerating access to life-changing therapies. Our initial focus is evaluation, diagnosis, treatment eligibility, treatment initiation, and required oversight of disease-modifying therapies. Whether you already have a neurologist or you\'re searching for one, Local Doctor is designed to help you find treatment faster. We complement your existing doctors and will work with them as needed.'

const howFaqItems: Array<[string, string[]]> = [
  [servicesFaqQuestion, [servicesFaqAnswer]],
  ['How much will this cost?', [costFaqAnswer]],
  ['Will I be seeing an MD or NP?', [
    'Our team of neurology specialists is each board-certified and works interchangeably. Appointment matching is subject to your location, availability, and other factors.',
  ]],
  ['What is Local Doctor\'s philosophy on anti-amyloid therapies for Alzheimer\'s disease?', [
    'We believe anti-amyloid therapies represent an important advancement in Alzheimer\'s care, with the potential to meaningfully slow disease progression for appropriately selected patients, particularly those in the early stages of the disease. Clinical trials have demonstrated approximately ~1/3 slower cognitive and functional decline on certain measures over 18 months compared with placebo. However, these therapies are not cures, benefits vary, and treatment carries real risks, including asymptomatic brain swelling or bleeding.',
    'Our approach is to carefully evaluate each patient\'s clinical eligibility, individual risk factors, and treatment goals. We support treatment when the anticipated benefits reasonably outweigh the risks and the patient, informed of the trade-offs, chooses to proceed. Our goal is to ensure the right patients have access to appropriate therapies at the right time.',
  ]],
  [imagingFaqQuestion, [imagingFaqAnswer]],
]

// An answer is one paragraph (a string) or several. A paragraph can also be a list of parts, where
// a part is plain text or a link to a section of /get-started (hash is the section's id).
type FaqLink = { linkText: string; hash: string }
type FaqParagraph = string | Array<string | FaqLink>
type FaqItem = [question: string, answer: string | FaqParagraph[]]

const faqCategories: { id: string; title: string; items: FaqItem[] }[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    items: [
      [servicesFaqQuestion, servicesFaqAnswer],
      ['Who is eligible for services?', [[
        'Adults experiencing cognitive symptoms or with dementia or Alzheimer\'s disease residing in Maryland are commonly strong candidates for our program. We will confirm via a quick phone call after you ',
        { linkText: 'schedule your visit', hash: 'book' },
        ', before your appointment.',
      ]]],
      ['How soon can I be seen?', [[
        'You can be seen by one of our neurology specialists within days or the same week. ',
        { linkText: 'Click here', hash: 'book' },
        ' to find a time that works best for you!',
      ]]],
      ['How does the eligibility check work?', 'Our eligibility process is simple - we will call you after you schedule your appointment and the call should take 15-30 minutes. Please have the patient\'s insurance details, medication list, and medical history handy to make it go smoother.'],
      ['Do I need a referral from my current doctor?', [[
        'No referral is needed. ',
        { linkText: 'Book your virtual visit here', hash: 'book' },
        ', and we will call you within a day or so to confirm your eligibility and insurance prior to the appointment.',
      ]]],
      ['What if I already have a diagnosis?', 'If you already have a diagnosis for mild cognitive impairment, dementia, or Alzheimer\'s disease, you may be a strong candidate for our program and it may expedite your path to treatment.'],
      ['Can I call on behalf of my spouse, parent, or loved one?', 'Absolutely! We welcome any loved one who wishes to be a part of the process and would prefer that one joins the first visit with the patient.'],
      ['What if I\'m not eligible for services?', 'If you don\'t happen to be eligible for our program yet, we will let you know transparently and why.'],
    ],
  },
  {
    id: 'cost',
    title: 'Cost & Insurance',
    items: [
      ['How much will this cost?', costFaqAnswer],
      ['Which insurance plans are currently accepted?', 'We accept many insurances including Medicare, Medicaid, Aetna, CareFirst, Cigna, Kaiser, and United. If you don\'t see your insurance on this list, we may still accept it and will confirm when we speak with you.'],
    ],
  },
  {
    id: 'visits',
    title: 'Visits & Logistics',
    items: [
      ['How does the first visit with the provider work and how long will it be?', 'You will receive a visit confirmation email and reminders to your contact method of choice, including on the day of the visit, that will have the link to join the video call for the first visit. This visit should last about 1 hour. Please ensure you are in a setting with strong access to Wi-Fi or data service with a device that has video and audio capabilities. It would be valuable and preferable for you to join with a care partner or family member who is involved in your care and day-to-day life so they can help answer any questions during the evaluation by the provider. If you have any other questions about this visit just let us know when you speak to us before the appointment!'],
      ['Will I be seeing an MD or NP?', 'Our neurology specialists are each board-certified and work interchangeably. Appointment matching is subject to your location, availability, and other factors.'],
      ['Is everything virtual or is there any in-person component?', 'The clinical virtual visits happen via a video platform. MRIs, PET Scans, bloodwork, and the infusions themselves happen at in-person facilities of your choice.'],
      ['Where do infusions take place?', 'If treatment is clinically appropriate, infusions take place at a local infusion center that is most convenient for you.'],
      ['What if we only need help with daily caregiving or medication management?', 'Local Doctor is designed to accelerate access to disease-modifying treatments. We partner with services that offer ongoing caregiving-support or general medication-management service who we can refer out to if appropriate. We will work with you to guide you in the best way possible.'],
    ],
  },
  {
    id: 'treatment',
    title: 'Treatment & Safety',
    items: [
      [
        'What is Local Doctor\'s stance on anti-amyloid IV therapies (Leqembi & Kisunla)?',
        [
          'We believe anti-amyloid therapies represent an important advancement in Alzheimer\'s care, with the potential to meaningfully slow disease progression for appropriately selected patients, particularly those in the early stages of the disease. Clinical trials have demonstrated approximately 1/3 slower cognitive and functional decline on certain measures over 18 months compared with placebo. However, these therapies are not cures, benefits vary, and treatment carries real risks, including brain swelling or bleeding.',
          'Our approach is to carefully evaluate each patient\'s clinical eligibility, individual risk factors, and treatment goals. We support treatment when the anticipated benefits reasonably outweigh the risks and the patient, informed of the trade-offs, chooses to proceed. Our goal is to ensure the right patients have access to appropriate therapies at the right time.',
        ],
      ],
      ['What if the patient can\'t have an MRI or takes blood thinners?', 'These may affect your eligibility for infusion treatment, so be sure to bring them up in your conversations with us.'],
      [imagingFaqQuestion, imagingFaqAnswer],
      ['Who do I contact in a medical emergency?', 'Call 911 immediately. Local Doctor provides specialist evaluation and treatment. It does not replace emergency care. After receiving 911 or emergency services, please let us know so that our Neurologist team can stay in the loop, understand your situation, and help however they can.'],
    ],
  },
]

// One booking path per page. The evaluation pages send the header button to /evaluation and keep it
// matching their own buttons. Every other page sends it to the scheduler under a plain "Get started",
// while that page's own buttons (and the /evaluation booking link) can still say "See open visit times".
const startEvaluationLabel = 'Start your evaluation'
const seeVisitTimesLabel = 'See open visit times'
const headerGetStartedLabel = 'Get started'

const headerPhone = '(240) 376-5730'
const headerPhoneHref = '+12403765730'

function routeEnabled(route: Route) {
  const flag: PageFlag = route === 'blogPost' ? 'blog' : route === 'landing' ? 'landingPages' : route
  return isPageEnabled(flag)
}

function enabledLinks<T extends readonly [Route, ...unknown[]]>(links: T[]) {
  return links.filter(([route]) => routeEnabled(route))
}

function normalizePath() {
  return window.location.pathname.replace(/^\/+|\/+$/g, '')
}

function readLocation(path = normalizePath()): { route: Route; slug: string } {
  if (isLandingSlug(path)) return { route: 'landing', slug: path }
  if (path === 'blog') return { route: 'blog', slug: '' }
  if (path.startsWith('blog/')) {
    const slug = decodeURIComponent(path.slice('blog/'.length).split('/')[0] ?? '')
    return { route: slug ? 'blogPost' : 'blog', slug }
  }
  return { route: pathRoutes[path as keyof typeof routePaths] ?? 'home', slug: '' }
}

function App() {
  const [route, setRoute] = useState<Route>('home')
  const [routeSlug, setRouteSlug] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrollRequest, setScrollRequest] = useState(0)

  useEffect(() => {
    function applyPath() {
      const path = normalizePath()
      const lowered = path.toLowerCase()
      if (lowered === 'blog/lecanemab-vs-aducanumab') {
        window.history.replaceState({}, '', '/blog')
      }
      if (
        path === 'pilot-plan' ||
        path.startsWith('pilot-plan/') ||
        lowered === 'leqembi' ||
        lowered.startsWith('leqembi/')
      ) {
        window.history.replaceState({}, '', '/')
      }
      if (path === 'privacy' && window.location.hash === '#notice') {
        window.history.replaceState({}, '', '/patient-rights#notice-of-privacy-practices')
      }
      let next = readLocation()
      if (!routeEnabled(next.route)) {
        window.history.replaceState({}, '', '/')
        next = { route: 'home', slug: '' }
      }
      setRoute(next.route)
      setRouteSlug(next.slug)
      setMenuOpen(false)
    }

    applyPath()
    window.addEventListener('popstate', applyPath)
    return () => window.removeEventListener('popstate', applyPath)
  }, [])

  useLayoutEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen)
    return () => document.body.classList.remove('menu-open')
  }, [menuOpen])

  // Scroll after the new route has rendered and the menu's overflow lock is released;
  // scrolling inside the click handler runs against the old page and gets clamped to the footer.
  useLayoutEffect(() => {
    if (scrollRequest === 0) return
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [scrollRequest])

  usePageMeta(route, routeSlug)

  useEffect(() => {
    noteSpaNavigation(window.location.pathname)
  }, [route, routeSlug])

  useEffect(() => {
    noteGaSpaNavigation(window.location.pathname)
  }, [route, routeSlug])

  useEffect(() => {
    syncChatbot(window.location.pathname)
  }, [route, routeSlug])

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '')
    if (!hash) return
    document.getElementById(hash)?.scrollIntoView()
  }, [route])

  function trackCtaClick(ctaLocation?: string, ctaLabel?: string, destinationPath?: string) {
    noteEligibilityStarted(window.location.pathname, ctaLocation)
    sendCtaClick(ctaLocation, ctaLabel, destinationPath)
  }

  function navigate(next: Route, slug = '', ctaLocation?: string, ctaLabel?: string, hash = '') {
    if (!routeEnabled(next)) {
      next = 'home'
      slug = ''
      hash = ''
    }
    if (next === 'start' || next === 'evaluation') trackCtaClick(ctaLocation, ctaLabel, routePaths[next])
    const path = next === 'blogPost' ? `/blog/${slug}` : next === 'landing' ? `/${slug}` : routePaths[next]
    // Keep gclid and utm_* across SPA navigations so Ads can attribute the visit and
    // Typeform can read them on /get-started. Contact and health params stay dropped.
    // An optional hash (for example #book) is added after the params. The hash effect above
    // scrolls to that element once the new page has rendered.
    const nextUrl = `${pathWithAdsParams(path, window.location.search)}${hash ? `#${hash}` : ''}`
    setRoute(next)
    setRouteSlug(next === 'blogPost' || next === 'landing' ? slug : '')
    setMenuOpen(false)
    if (`${window.location.pathname}${window.location.search}` !== nextUrl) {
      window.history.pushState({}, '', nextUrl)
    }
    setScrollRequest((count) => count + 1)
  }

  return (
    <main>
      <Header route={route} routeSlug={routeSlug} menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((open) => !open)} onNavigate={navigate} />
      {route === 'home' && <HomePage onNavigate={navigate} />}
      {route === 'treatments' && <TreatmentsPage onNavigate={navigate} />}
      {route === 'how' && <HowPage onNavigate={navigate} />}
      {route === 'about' && <AboutPage onNavigate={navigate} />}
      {route === 'start' && <StartPage />}
      {route === 'evaluation' && (
        <EvaluationPage onBookVisit={() => navigate('start', '', 'evaluation_secondary', seeVisitTimesLabel)} />
      )}
      {route === 'faq' && <FaqPage onNavigate={navigate} />}
      {route === 'blog' && <BlogPage onNavigate={navigate} />}
      {route === 'blogPost' && <BlogPostPage slug={routeSlug} onNavigate={navigate} />}
      {route === 'refer' && <ReferPage onNavigate={navigate} />}
      {route === 'privacy' && <PrivacyPage />}
      {route === 'terms' && <TermsPage />}
      {route === 'patientRights' && <PatientRightsPage />}
      {route === 'consent' && <ConsentPage />}
      {route === 'contact' && <ContactPage />}
      {route === 'landing' && isLandingSlug(routeSlug) && (
        <LandingPage
          key={routeSlug}
          slug={routeSlug}
          onStart={(target: CtaTarget, ctaLocation, ctaLabel) => navigate(target, '', ctaLocation, ctaLabel)}
          onTrackCta={trackCtaClick}
          onOpenPath={(path) => {
            const next = readLocation(path.replace(/^\/+|\/+$/g, ''))
            navigate(next.route, next.slug)
          }}
        />
      )}
      <Footer onNavigate={navigate} />
    </main>
  )
}

function BrandLink({ variant = 'color', onNavigate }: { variant?: 'color' | 'reverse'; onNavigate: Navigate }) {
  const src = variant === 'reverse' ? '/assets/brand/local-doctor-logo-reverse.svg' : '/assets/brand/local-doctor-logo.svg'

  return (
    <a
      className="brand-link"
      href="/"
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
        event.preventDefault()
        onNavigate('home')
      }}
    >
      <img src={src} alt="Local Doctor home" width={1337} height={270} />
    </a>
  )
}

function Header({
  route,
  routeSlug,
  menuOpen,
  onToggleMenu,
  onNavigate,
}: {
  route: Route
  routeSlug: string
  menuOpen: boolean
  onToggleMenu: () => void
  onNavigate: Navigate
}) {
  const evaluationFunnel = route === 'landing' && (evaluationFormSlugs as string[]).includes(routeSlug)
  const headerCta = evaluationFunnel
    ? { target: 'evaluation' as const, label: startEvaluationLabel }
    : { target: 'start' as const, label: headerGetStartedLabel }
  const navItems = enabledLinks<[Route, string]>([
    ['how', 'How it works'],
    ['treatments', 'Treatments'],
  ])
  const aboutItems = enabledLinks<[Route, string]>([
    ['about', 'Meet the Team'],
    ['blog', 'Blog'],
    ['faq', 'FAQs'],
  ])
  const aboutActive = route === 'about' || route === 'blog' || route === 'blogPost' || route === 'faq'

  return (
    <header className="site-header">
      <div className="header-inner">
        <BrandLink onNavigate={onNavigate} />
        <nav className="desktop-nav" aria-label="Main navigation">
          {navItems.map(([itemRoute, label]) => (
            <button className={route === itemRoute ? 'active' : ''} key={itemRoute} type="button" onClick={() => onNavigate(itemRoute)}>
              {label}
            </button>
          ))}
          {aboutItems.length > 0 && (
            <div className="nav-dropdown">
              <button className={aboutActive ? 'active' : ''} type="button" aria-haspopup="true">
                About
              </button>
              <div>
                {aboutItems.map(([itemRoute, label]) => (
                  <button key={itemRoute} type="button" onClick={() => onNavigate(itemRoute)}>{label}</button>
                ))}
              </div>
            </div>
          )}
        </nav>
        <div className="header-actions">
          <a className="header-phone" href={`tel:${headerPhoneHref}`}>{headerPhone}</a>
          <button className="header-cta" type="button" onClick={() => onNavigate(headerCta.target, '', 'header', headerCta.label)}>
            {headerCta.label}
          </button>
        </div>
        <a className="header-phone-mobile" href={`tel:${headerPhoneHref}`}>{headerPhone}</a>
        <button
          className="menu-button"
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={onToggleMenu}
        >
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
          {aboutItems.length > 0 && <span className="mobile-nav-label">About</span>}
          {aboutItems.map(([itemRoute, label]) => (
            <button className="mobile-nav-sub" key={itemRoute} type="button" onClick={() => onNavigate(itemRoute)}>
              {label}
            </button>
          ))}
          <a className="mobile-nav-phone" href={`tel:${headerPhoneHref}`}>
            <span className="mobile-nav-phone-label">Call or text</span> {headerPhone}
          </a>
          <button type="button" onClick={() => onNavigate(headerCta.target, '', 'header', headerCta.label)}>{headerCta.label}</button>
        </nav>
      )}
    </header>
  )
}

function HomePage({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <>
      <section className="hero">
        <img className="hero-image" src="/assets/hero-patient-caregiver.webp" alt="Older adults walking together outdoors" width={904} height={509} />
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="hero-copy">
            <p className="eyebrow">Virtual Alzheimer's specialty clinic</p>
            <h1>Treatment that slows down Alzheimer's. <em>Finally. Today.</em></h1>
            <p>
              FDA-approved treatments can slow down the progression of early Alzheimer&apos;s disease. Get evaluated as early as this week by our neurologists who specialize in cognitive impairment and disease-modifying treatments.
            </p>
            <div className="hero-actions">
              <button className="accent" type="button" onClick={() => onNavigate('start', '', 'hero', 'Book a Neurologist today', 'book')}>Book a Neurologist today</button>
              {routeEnabled('how') && <button className="secondary" type="button" onClick={() => onNavigate('how')}>Learn more</button>}
            </div>
            <div className="trust-note"><span /> Backed by a national infusion network and a focused treatment-readiness pathway.</div>
          </div>
        </div>
      </section>

      <section className="stat-band">
        <Metric value="3.5 years" label="average gap between first symptoms and diagnosis of Alzheimer's" />
        <Metric value="6-9 months" label="typical wait for a new patient visit with a neurologist in most areas" />
        <Metric tone="light" value="In days" label="See a board-certified neurologist in days from the comfort of your home" />
        <Metric tone="light" value="1,500+" label="patients treated successfully by our infusion network" />
      </section>

      <section className="section ivory compact-section">
        <SectionIntro eyebrow="Why Local Doctor" title="We're designed around one goal: a fast, credible answer on treatment options." />
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

      <InsuranceStrip
        tone="blue"
        title="We accept Medicare, Medicaid, and most major health plans"
        copy="Whether we're in network with your insurance or not, we're committed to financial transparency and we do whatever is in our control to minimize your costs. No surprise bills or hidden costs."
      />

      <section className="section white compact-section">
        <div className="section-row">
          <SectionIntro eyebrow="How it works" title="Real treatment in 4 easy steps and an answer in days" />
          {routeEnabled('how') && <button className="text-link" type="button" onClick={() => onNavigate('how')}>See the full process <ArrowRight size={16} /></button>}
        </div>
        <ProcessGrid onNavigate={onNavigate} />
      </section>

      <section className="section ivory compact-section">
        <TreatmentPreview onNavigate={onNavigate} />
      </section>

      <ConversionPanel
        onNavigate={onNavigate}
        eyebrow="Ready to make a step towards better memory care?"
        title="Book a visit with a neurologist today."
        copy="Our neurologists are on stand-by to help you find the best treatment options and can see you as soon as this week."
        ctaLabel="Book now"
      />
      <StickyCta
        label="Get Started"
        href={pathWithAdsParams(routePaths.start, typeof window === 'undefined' ? '' : window.location.search)}
        anchorSelector=".hero .hero-actions"
        stopSelectors={['.conversion-panel', '.footer']}
        onClick={(event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
          event.preventDefault()
          onNavigate('start', '', 'sticky_mobile', 'Get Started')
        }}
      />
    </>
  )
}

function TreatmentsPage({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <>
      <section className="treatment-hero">
        <div>
          <p className="eyebrow">Treatments</p>
          <h1>FDA-approved treatments for early Alzheimer's disease.</h1>
          <p>Leqembi and Kisunla are FDA-approved infusion treatments shown to slow the progression of Alzheimer&apos;s disease, not just treat its symptoms. In clinical trials they slowed decline for some patients but they are not a cure, they carry risks, and they are not right for everyone. We help you understand all of it.</p>
          <button className="primary" type="button" onClick={() => onNavigate('start', '', 'hero', 'Get started')}>Get started <ArrowRight size={20} /></button>
        </div>
        <img src="/assets/hero-leqembi-iv.webp" alt="Leqembi (lecanemab) IV infusion bag" width={1178} height={1335} fetchPriority="high" />
      </section>
      <section className="section white drug-info-section">
        <SectionIntro eyebrow="Drug information" title="Leqembi and Kisunla, side by side." />
        <TreatmentComparison />
        <div className="disclaimer">
          This information is from the primary trials performed with these medications and the pharmaceutical manufacturers directly. Most ARIA in the trials was asymptomatic and found on routine MRI, with the caveat that these were separate trials, not a head-to-head comparison. Prescribing information, monitoring schedules, and payer rules can change. This comparison is general information, not a recommendation.
        </div>
        <HonestCard />
      </section>
      <section className="section ivory fit-section">
        <SectionIntro eyebrow="Safety" title="The safety screen is part of the evaluation, not an afterthought." copy="Risks and monitoring are reviewed before any treatment decision. Urgent symptoms belong with emergency care." />
        <div className="safety-grid">
          {safetyChecks.map((item) => (
            <article key={item}>
              <ShieldAlert size={20} />
              <span>{item}</span>
            </article>
          ))}
        </div>
      </section>
      <QualificationSection tone="white" />
      <ConversionPanel onNavigate={onNavigate} eyebrow="" title="Ready to meet with a Neurologist?" copy="Book your appointment today and get seen within days." ctaLabel="Book now" secondaryLabel="See how it works" secondaryRoute="how" compact />
    </>
  )
}

function HowPage({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <>
      <PageHero
        eyebrow="How it works"
        title="A fast path you can trust from first concern to treatment."
        copy="Our trusted team of neurologists and specialists have over 20 years of experience in treating Alzheimer's disease, dementia, and mild cognitive impairment. We can help you understand what you might be facing and your best options going forward."
        icon={<CalendarClock size={38} />}
        aside={{ title: 'Family and loved ones', text: 'Our preference is for loved ones to join the virtual provider visits and be a part of the process.' }}
        onPrimary={() => onNavigate('start', '', 'hero', 'Book now')}
        primaryLabel="Book now"
        wideCopy
      />
      <section className="section white compact-section">
        <div className="journey-list">
          {journeySteps.map((step, index) => (
            <article key={step.title} className="journey-step">
              <b>{index + 1}</b>
              <div>
                <div className="journey-heading">
                  <h3>{step.title}</h3>
                  {step.cta ? (
                    <button className="primary journey-cta" type="button" onClick={() => onNavigate('start', '', 'journey_step', step.cta)}>
                      {step.cta}
                    </button>
                  ) : (
                    <span>{step.meta}</span>
                  )}
                </div>
                <div className="journey-points">
                  {step.points.map((point) => (
                    <p key={point}>
                      <CheckCircle2 size={20} />
                      <span>{point}</span>
                    </p>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="section ivory cost-band compact-section">
        <div>
          <p className="eyebrow">Insurance & Cost</p>
          <h2>What this costs you, honestly.</h2>
          <p>Most patients access care through Medicare, Medicaid, or major health plans (Aetna, Cigna, United, Kaiser, etc.). Coverage for our virtual visits and treatment depends on your specific plan but we do whatever is in our control to minimize your costs. Whether we&apos;re in network with your insurance or not, we will walk through your specific coverage before you commit to anything and you will never receive a surprise bill or hidden cost.</p>
        </div>
      </section>
      <section className="section white mini-faq-section compact-section">
        <SectionIntro eyebrow="FAQ" title="Questions you might have." />
        <div className="mini-faq-list">
          {howFaqItems.map(([question, answer]) => (
            <article key={question}>
              <h3>{question}</h3>
              {answer.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </article>
          ))}
        </div>
      </section>
      <ConversionPanel onNavigate={onNavigate} eyebrow="" title="Ready to meet with a neurologist?" copy="Book your appointment today and get seen within days." ctaLabel="Book now" secondaryLabel="See treatments" secondaryRoute="treatments" compact />
    </>
  )
}

function AboutPage({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <>
      <PageHero
        eyebrow="Care model"
        title="A specialist evaluation built around getting you an answer."
        copy="Local Doctor is a virtual Alzheimer's specialty clinic, supported by navigators, diagnostic partners, prescribing clinicians, and Local Infusion's local treatment network."
        icon={<UsersRound size={38} />}
        onPrimary={() => onNavigate('start', '', 'hero', 'Get Started')}
        primaryLabel="Get Started"
      />
      <section className="section white">
        <SectionIntro eyebrow="Care team roles" title="The clinic is coordinated, not a directory of disconnected appointments." />
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
      <section className="section ivory" id="company">
        <SectionIntro
          eyebrow="Company"
          title="Who operates Local Doctor."
          copy="The legal name, the practice that provides clinical care, physical address, phone, and the state where a patient may be seen are listed here."
        />
        <LegalIdentity />
      </section>
      <section className="section white" id="providers">
        <SectionIntro
          eyebrow="Licensed providers"
          title="Clinicians who may see patients."
          copy="A virtual visit is available only when the clinician is licensed in the state where the patient is located during the visit."
        />
        <ProviderRoster />
      </section>
      <ConversionPanel onNavigate={onNavigate} />
    </>
  )
}

const startPhoto = { src: '/assets/hero-get-started.jpg', alt: 'Three generations of a family sitting together on a lakeside dock' }
const COMPACT_QUERY = '(max-width: 980px)'

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setMatches(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [query])
  return matches
}

function StartPage() {
  // On a phone the hero is short, the scheduler comes right after it, and the photo sits below.
  const compact = useMediaQuery(COMPACT_QUERY)

  return (
    <div className="start-page">
      <PageHero
        eyebrow="Get started"
        title="Book a neurologist today to find out if treatment is right for you."
        copy="Everyone's situation is unique. Our neurology specialists listen to deeply understand yours and let you know if you're eligible for disease-modifying treatment."
        primaryLabel={`Call or text ${publicPhone}`}
        href={`tel:+1${publicPhone.replace(/\D/g, '')}`}
        secondary={{
          label: 'Book now',
          href: '#book',
          onClick: () => sendCtaClick('get_started_hero', 'Book now', routePaths.start),
        }}
        showAside={false}
        image={compact ? undefined : startPhoto}
      />
      <BookingSection />
      {compact && <img className="start-photo-below" src={startPhoto.src} alt={startPhoto.alt} width={385} height={515} loading="lazy" />}
      {/* No mobile sticky bar here for now: it did not behave well while scrolling. */}
    </div>
  )
}

function ReferPage({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <>
      <PageHero
        eyebrow="For referring clinicians"
        title="Refer patients for Alzheimer's treatment-readiness review without ending your relationship."
        copy="Local Doctor is a focused pathway for patients who may need anti-amyloid treatment eligibility review, diagnostic workup coordination, payer support, and local infusion follow-through."
        icon={<Stethoscope size={38} />}
        onPrimary={() => onNavigate('start', '', 'hero', 'Prepare a referral')}
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
            <h2>Not a fit for this pathway</h2>
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

// Renders an FAQ answer. A link part opens a section of /get-started (for example #book), keeping
// the visitor's ad click ids, and counts as a CTA click like the other Get Started buttons.
function FaqAnswer({ answer, onNavigate }: { answer: string | FaqParagraph[]; onNavigate: Navigate }) {
  const paragraphs = Array.isArray(answer) ? answer : [answer]
  const search = typeof window === 'undefined' ? '' : window.location.search

  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <p key={index}>
          {(typeof paragraph === 'string' ? [paragraph] : paragraph).map((part, partIndex) =>
            typeof part === 'string' ? (
              part
            ) : (
              <a
                key={partIndex}
                href={`${pathWithAdsParams(routePaths.start, search)}#${part.hash}`}
                onClick={(event) => {
                  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
                  event.preventDefault()
                  onNavigate('start', '', 'faq', 'Book now', part.hash)
                }}
              >
                {part.linkText}
              </a>
            ),
          )}
        </p>
      ))}
    </>
  )
}

function FaqPage({ onNavigate }: { onNavigate: Navigate }) {
  const [openItem, setOpenItem] = useState('getting-started-0')

  return (
    <>
      <PageHero eyebrow="FAQ" title="Answers to what patients and families ask us most." copy="Straight, specific answers about eligibility, cost, visits, treatment, and safety." showAside={false} onPrimary={() => onNavigate('start', '', 'hero', 'Get Started')} primaryLabel="Get Started" />
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
                    {isOpen && <FaqAnswer answer={answer} onNavigate={onNavigate} />}
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
          <p>Our care team can help address any other question you have via the live chat option on this website, emailing hello@trylocaldoctor.com, or texting/calling (240) 376-5730.</p>
        </div>
        <a className="primary" href="mailto:hello@trylocaldoctor.com">Email our team</a>
      </section>
      <ConversionPanel
        onNavigate={onNavigate}
        eyebrow="Ready to make a step towards better memory care?"
        title="A quick call will help us determine your eligibility."
        copy="We review your concerns, medical history, and insurance in a quick conversation before coordinating the visit with a neurology specialist."
      />
    </>
  )
}

function BlogPage({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <>
      <PageHero
        eyebrow="Blog"
        title="Our resources can help guide you along your journey."
        copy="We look forward to helping you find the best care possible."
        icon={<Sparkles size={38} />}
        onPrimary={() => onNavigate('start', '', 'hero', 'Get Started')}
        primaryLabel="Get Started"
      />
      <section className="section white">
        <div className="blog-grid">
          {blogPosts.map((post) => (
            <a
              className="blog-card"
              href={`/blog/${post.slug}`}
              key={post.slug}
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
                event.preventDefault()
                onNavigate('blogPost', post.slug)
              }}
            >
              <span>{post.label}</span>
              <h2>{post.title}</h2>
              <p>{post.excerpt}</p>
            </a>
          ))}
        </div>
      </section>
    </>
  )
}

function BlogPostPage({ slug, onNavigate }: { slug: string; onNavigate: Navigate }) {
  const post = getBlogPost(slug)

  if (!post) {
    return (
      <section className="section white blog-article-section">
        <div className="blog-article">
          <p className="eyebrow">Blog</p>
          <h1>This article is not on Local Doctor.</h1>
          <p>The address does not match one of the republished Local Infusion articles.</p>
          <button className="primary" type="button" onClick={() => onNavigate('blog')}>Back to the blog</button>
        </div>
      </section>
    )
  }

  const related = blogPosts.filter((item) => item.slug !== post.slug).slice(0, 3)

  return (
    <section className="section white blog-article-section">
      <article className="blog-article">
        <button className="text-link blog-back" type="button" onClick={() => onNavigate('blog')}>
          All articles
        </button>
        <p className="eyebrow">{post.label}</p>
        <h1>{post.title}</h1>
        <div className="article-body">
          {post.blocks.map((block, index) => (
            <BlogBlockView block={block} key={`${block.type}-${index}`} />
          ))}
        </div>
        <aside className="republication-credit">
          <p>
            Originally published by <a href="https://mylocalinfusion.com/">Local Infusion</a>. Written by {post.author}.
          </p>
          <p>
            Original article:{' '}
            <a href={post.originalUrl} rel="noopener noreferrer">{post.originalUrl}</a>
          </p>
          <p>This is a republication for Local Doctor readers, not an original Local Doctor article.</p>
        </aside>
        <p className="medical-disclaimer">{medicalDisclaimer}</p>
        <aside className="article-cta">
          <h2>Want a treatment-readiness review?</h2>
          <p>
            Local Doctor is a virtual front door for specialist evaluation. It does not operate infusion centers, set drug prices, or replace the clinician who would prescribe treatment.
          </p>
          <button className="primary" type="button" onClick={() => onNavigate('start', '', 'article', 'Get Started')}>
            Get Started <ArrowRight size={20} />
          </button>
        </aside>
        <div className="related-posts">
          <h2>More republished articles</h2>
          <div>
            {related.map((item) => (
              <a
                href={`/blog/${item.slug}`}
                key={item.slug}
                onClick={(event) => {
                  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
                  event.preventDefault()
                  onNavigate('blogPost', item.slug)
                }}
              >
                {item.title}
              </a>
            ))}
          </div>
        </div>
      </article>
    </section>
  )
}

function BlogBlockView({ block }: { block: BlogBlock }) {
  if (block.type === 'h2') return <h2>{block.text}</h2>
  if (block.type === 'h3') return <h3>{block.text}</h3>
  if (block.type === 'ul') {
    return (
      <ul>
        {block.items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    )
  }
  if (block.type === 'ol') {
    return (
      <ol>
        {block.items.map((item) => <li key={item}>{item}</li>)}
      </ol>
    )
  }
  return <p>{block.text}</p>
}

// Landing pages ship a static shell with page-specific Open Graph tags (vite.config.ts),
// so leaving one has to put the site defaults back.
function setOpenGraph({ title, description, url }: { title: string; description: string; url?: string }) {
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', title)
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', description)
  let ogUrl = document.querySelector('meta[property="og:url"]')
  if (!url) {
    ogUrl?.remove()
    return
  }
  if (!ogUrl) {
    ogUrl = document.createElement('meta')
    ogUrl.setAttribute('property', 'og:url')
    document.head.appendChild(ogUrl)
  }
  ogUrl.setAttribute('content', url)
}

function usePageMeta(route: Route, slug: string) {
  useEffect(() => {
    const description = document.querySelector('meta[name="description"]')
    const post = route === 'blogPost' ? getBlogPost(slug) : undefined

    // /evaluation stays out of search results. The built shell already carries this tag on a direct load.
    const robots = document.querySelector('meta[name="robots"]')
    if (route === 'evaluation') {
      if (!robots) {
        const tag = document.createElement('meta')
        tag.setAttribute('name', 'robots')
        tag.setAttribute('content', 'noindex, follow')
        document.head.appendChild(tag)
      }
    } else {
      robots?.remove()
    }

    const clearSyndicationTags = () => {
      document.querySelector('link[rel="canonical"]')?.remove()
      document.getElementById('blog-article-jsonld')?.remove()
    }

    if (post) {
      document.title = `${post.title} | Local Doctor`
      description?.setAttribute('content', post.excerpt)
      let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
      if (!canonical) {
        canonical = document.createElement('link')
        canonical.rel = 'canonical'
        document.head.appendChild(canonical)
      }
      canonical.href = post.originalUrl

      let jsonLd = document.getElementById('blog-article-jsonld')
      if (!jsonLd) {
        jsonLd = document.createElement('script')
        jsonLd.id = 'blog-article-jsonld'
        jsonLd.setAttribute('type', 'application/ld+json')
        document.head.appendChild(jsonLd)
      }
      jsonLd.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: post.excerpt,
        datePublished: post.published,
        dateModified: post.updated,
        author: { '@type': 'Person', name: post.author },
        publisher: {
          '@type': 'Organization',
          name: 'Local Infusion',
          url: 'https://mylocalinfusion.com/',
        },
        isBasedOn: post.originalUrl,
        sameAs: post.originalUrl,
        mainEntityOfPage: post.originalUrl,
      })
    } else if (route === 'blog') {
      clearSyndicationTags()
      document.title = 'Blog | Local Doctor'
      description?.setAttribute(
        'content',
        'Alzheimer’s articles originally published by Local Infusion and republished by Local Doctor with attribution and a link to each source.',
      )
    } else if (route === 'landing' && isLandingSlug(slug)) {
      clearSyndicationTags()
      const meta = landingMeta[slug]
      const url = landingCanonical(slug)
      document.title = meta.title
      description?.setAttribute('content', meta.description)
      const canonical = document.createElement('link')
      canonical.rel = 'canonical'
      canonical.href = url
      document.head.appendChild(canonical)
      setOpenGraph({ title: meta.title, description: meta.description, url })
    } else {
      clearSyndicationTags()
      const meta = routeMeta[route]
      document.title = meta?.title ?? defaultTitle
      description?.setAttribute('content', meta?.description ?? defaultDescription)
    }

    return () => {
      clearSyndicationTags()
      setOpenGraph({ title: defaultOgTitle, description: defaultDescription })
      document.title = defaultTitle
      description?.setAttribute('content', defaultDescription)
    }
  }, [route, slug])
}

function BookingSection() {
  return (
    <section className="section white expect-section start-booking-section" id="book">
      <h2 className="expect-heading">Book a neurologist</h2>
      <div className="booking-layout">
        <div className="booking-main">
          <p className="booking-trust">
            <strong>Video visit, about 1 hour.</strong> Board-certified neurologist. Insurance accepted. No referral needed.
          </p>
          <CalendlyEmbed />
        </div>
        <aside className="booking-aside">
          <div>
            <h3>What to expect</h3>
            <ol>
              <li>Book your appointment for the day and time that works best for you.</li>
              <li>We will call you to review your medical history and verify your insurance and eligibility.</li>
              <li>You join the virtual visit over a video call to meet your neurologist.</li>
            </ol>
          </div>
          <div>
            <h3>What to have handy</h3>
            <ul>
              <li>Insurance information</li>
              <li>Medication list</li>
              <li>Recent test results</li>
              <li>Any questions you and your family want to discuss</li>
            </ul>
          </div>
          <div>
            <h3>Prefer to speak with someone now?</h3>
            <p>
              Call or text <a href={`tel:+1${publicPhone.replace(/\D/g, '')}`}>{publicPhone}</a> to speak with a member of our team
            </p>
          </div>
        </aside>
      </div>
      <StartFaq />
    </section>
  )
}

function StartFaq() {
  return (
    <div className="expect-faq">
      {[
        ['How does this work with my existing doctors?', 'Think of our neurology team as an extension of your current doctors. Our providers do not replace any of your existing provider relationships, and will work with them as needed.'],
        ['Can a caregiver be a part of this?', 'Yes! We have even seen maximal results when any loved one is involved in this journey.'],
        ['What if my insurance is not covered?', 'Not a problem, we provide a transparent and low cost for your visits with our neurology team. Any other costs will be communicated transparently.'],
        ["What if I'm not eligible?", 'If the honest answer is "not yet" we will let you know why and recommend resources that might still be helpful to address any of your concerns.'],
      ].map(([question, answer]) => (
        <article key={question}>
          <h3>{question}</h3>
          <p>{answer}</p>
        </article>
      ))}
    </div>
  )
}

function InsuranceStrip({
  tone,
  title,
  copy,
}: {
  tone: 'white' | 'ivory' | 'blue'
  title: string
  copy: string
}) {
  return (
    <section className={`insurance-strip ${tone}`}>
      <div>
        <h2>{title}</h2>
        <p>{copy}</p>
        <div className="payer-marquee" aria-label="Examples of plans patients ask about, not a list of accepted insurance">
          <div>
            {payerNames.map((payer, index) => <span key={`${payer}-${index}`}>{payer}</span>)}
            {payerNames.map((payer, index) => <span className="payer-repeat" aria-hidden="true" key={`${payer}-repeat-${index}`}>{payer}</span>)}
          </div>
        </div>
      </div>
    </section>
  )
}

function ProcessGrid({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <div className="process-grid">
      {simpleProcess.map(({ title, copy, cta }, index) => (
        <article key={title}>
          <div>
            <b>{index + 1}</b>
            {index < simpleProcess.length - 1 && <span />}
          </div>
          <h3>{title}</h3>
          <p>{copy}</p>
          {cta && (
            <button className="primary process-cta" type="button" onClick={() => onNavigate('start', '', 'how_it_works', cta)}>
              {cta}
            </button>
          )}
        </article>
      ))}
    </div>
  )
}

function TreatmentPreview({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <>
      <SectionIntro eyebrow="Treatments" title="Two FDA-approved treatments for early Alzheimer's." copy="Leqembi and Kisunla are disease-modifying IV therapies for early Alzheimer&apos;s disease. In clinical trials, they showed a real, moderate slowing of cognitive decline - roughly 25-33% over 18 months. Not a cure, and not right for everyone, but the first treatments that act on the disease itself. We help you and your family understand the requirements, risks, and everything it entails." />
      <div className="treatment-card-grid">
        <article>
          <h3>Leqembi</h3>
          <span>lecanemab-irmb</span>
          <p>IV infusion every two weeks; can transition to a once-weekly at-home injection after 18 months.</p>
        </article>
        <article>
          <h3>Kisunla</h3>
          <span>donanemab-azbt</span>
          <p>Monthly IV infusion; can stop once amyloid reaches minimal levels on a PET scan.</p>
        </article>
      </div>
      {routeEnabled('treatments') && <button className="text-link treatment-link" type="button" onClick={() => onNavigate('treatments')}>See treatment details <ArrowRight size={16} /></button>}
    </>
  )
}

function TreatmentComparison() {
  return (
    <div className="compare-wrap">
      <div className="compare-head">
        <span />
        <MedicineHeading color="leqembi" name="Leqembi" generic="lecanemab-irmb" />
        <MedicineHeading color="kisunla" name="Kisunla" generic="donanemab-azbt" />
      </div>
      <div className="compare-table" role="table" aria-label="Treatment comparison">
        {treatmentRows.map(([label, leqembi, kisunla]) => (
          <div className="compare-row" role="row" key={label}>
            <span>{label}</span>
            <p><strong className="compare-drug">Leqembi</strong>{leqembi}</p>
            <p><strong className="compare-drug">Kisunla</strong>{kisunla}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function HonestCard() {
  return (
    <div className="honest-card">
      <ShieldAlert size={24} />
      <div>
        <h2>What to expect, honestly</h2>
        <p>
          In clinical trials, both treatments showed a real, moderate slowing of cognitive decline. Neither is a cure and neither reverses symptoms already present. The goal is to weigh the potential benefits and risks clearly with our neurology specialists and decide what works best for you.
        </p>
      </div>
    </div>
  )
}

function QualificationSection({ tone, eyebrow = 'Qualification' }: { tone: 'white' | 'ivory'; eyebrow?: string }) {
  return (
    <section className={`section ${tone} fit-section`}>
      <SectionIntro eyebrow={eyebrow} title="Who is most likely to qualify." copy="We help adults with Alzheimer's disease, and their families, who want to understand whether disease-modifying treatment is an option." />
      <CheckList items={fitChecks} />
    </section>
  )
}

function MedicineHeading({ color, name, generic }: { color: 'leqembi' | 'kisunla'; name: string; generic: string }) {
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

function CheckList({ items }: { items: string[] }) {
  return (
    <div className="check-list">
      {items.map((item) => (
        <div key={item}>
          <CheckCircle2 size={20} />
          <span>{item}</span>
        </div>
      ))}
    </div>
  )
}

const defaultHeroAside = {
  title: 'Clinical decisions require licensed review.',
  text: 'The website is a front door, not a diagnosis or treatment promise.',
}

function PageHero({
  eyebrow,
  title,
  copy,
  icon,
  primaryLabel,
  onPrimary,
  href,
  showAside = true,
  aside = defaultHeroAside,
  image,
  wideCopy = false,
  secondary,
}: {
  eyebrow: string
  title: string
  copy: string
  icon?: ReactNode
  primaryLabel: string
  onPrimary?: () => void
  href?: string
  secondary?: { label: string; href: string; onClick?: () => void }
  showAside?: boolean
  aside?: { title: string; text: string }
  image?: { src: string; alt: string }
  wideCopy?: boolean
}) {
  const isPhoneLink = href?.startsWith('tel:')
  const heroClass = ['page-hero', image && 'has-image', wideCopy && 'wide-copy'].filter(Boolean).join(' ')

  return (
    <div className="page-hero-band">
    <section className={heroClass}>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{copy}</p>
        {href ? (
          isPhoneLink ? (
            <a className="hero-phone-link" href={href}>{primaryLabel}</a>
          ) : (
            <a className="primary" href={href} target="_blank" rel="noreferrer">{primaryLabel} <ArrowRight size={20} /></a>
          )
        ) : (
          <button className="primary" type="button" onClick={onPrimary}>{primaryLabel} <ArrowRight size={20} /></button>
        )}
        {secondary && (
          <div className="page-hero-secondary">
            <a className="primary" href={secondary.href} onClick={secondary.onClick}>{secondary.label} <ArrowRight size={20} aria-hidden="true" /></a>
          </div>
        )}
      </div>
      {image && <img className="page-hero-image" src={image.src} alt={image.alt} width={385} height={515} fetchPriority="high" />}
      {showAside && (
        <aside>
          {icon}
          <strong>{aside.title}</strong>
          <span>{aside.text}</span>
        </aside>
      )}
    </section>
    </div>
  )
}

function ConversionPanel({
  onNavigate,
  eyebrow = 'Ready to find out where you stand?',
  title = 'Start with a short check, then move to full intake only when it makes sense.',
  copy = 'The intake is a request for review. It is not a diagnosis, a booked visit, or a promise of coverage.',
  ctaLabel = 'Get Started',
  secondaryLabel,
  secondaryRoute,
  compact = false,
}: {
  onNavigate: Navigate
  eyebrow?: string
  title?: string
  copy?: string
  ctaLabel?: string
  secondaryLabel?: string
  secondaryRoute?: Route
  compact?: boolean
}) {
  return (
    <section className={compact ? 'conversion-panel compact' : 'conversion-panel'}>
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
        <p>{copy}</p>
      </div>
      <div className="conversion-actions">
        <button className="primary" type="button" onClick={() => onNavigate('start', '', 'closing', ctaLabel)}>{ctaLabel} <ArrowRight size={20} /></button>
        {secondaryLabel && secondaryRoute && routeEnabled(secondaryRoute) && (
          <button className="secondary" type="button" onClick={() => onNavigate(secondaryRoute)}>{secondaryLabel}</button>
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

function Metric({ value, label, tone }: { value: string; label: string; tone?: 'light' }) {
  return (
    <article className={tone}>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  )
}

function Footer({ onNavigate }: { onNavigate: Navigate }) {
  const exploreLinks = enabledLinks<[Route, string]>([
    ['home', 'Home'],
    ['how', 'How it works'],
    ['treatments', 'Treatments'],
    ['about', 'Meet the Team'],
    ['blog', 'Blog'],
  ])
  const startLinksBeforeEmail = enabledLinks<[Route, string]>([
    ['start', 'Get Started'],
    ['faq', 'FAQs'],
  ])
  const startLinksAfterEmail = enabledLinks<[Route, string]>([
    ['refer', 'For physicians'],
  ])
  // The Contact page is live but intentionally not linked from the footer.
  const legalLinks = enabledLinks<[Route, string, string]>([
    ['privacy', '/privacy', 'Privacy Policy'],
    ['terms', '/terms', 'Terms of Use'],
    ['patientRights', '/patient-rights', 'Patient Rights & Notices'],
  ])

  return (
    <footer className="footer">
      <div>
        <BrandLink variant="reverse" onNavigate={onNavigate} />
        <p>A virtual Alzheimer&apos;s specialty clinic connecting patients to specialist evaluation and treatment.</p>
        <p className="footer-identity">Phone: {publicPhone}</p>
        <p className="footer-identity">Email: {publicEmail}</p>
      </div>
      <div>
        <strong>Explore</strong>
        {exploreLinks.map(([itemRoute, label]) => (
          <button key={label} type="button" onClick={() => onNavigate(itemRoute)}>{label}</button>
        ))}
      </div>
      <div>
        <strong>Get started</strong>
        {startLinksBeforeEmail.map(([itemRoute, label]) => (
          <button key={label} type="button" onClick={() => onNavigate(itemRoute, '', itemRoute === 'start' ? 'footer' : undefined, itemRoute === 'start' ? label : undefined)}>{label}</button>
        ))}
        <a href={`mailto:${publicEmail}`}>Email the team</a>
        {startLinksAfterEmail.map(([itemRoute, label]) => (
          <button key={label} type="button" onClick={() => onNavigate(itemRoute)}>{label}</button>
        ))}
      </div>
      <div>
        <strong>Legal</strong>
        {legalLinks.map(([, href, label]) => (
          <a key={href} href={href}>{label}</a>
        ))}
      </div>
      <div className="footer-legal">
        <p>
          Leqembi and Kisunla are FDA-approved to help slow the progression of early Alzheimer&apos;s disease in people who qualify. Individual results vary, and these treatments are not a cure. Local Doctor provides specialist evaluation and care coordination; it does not replace emergency care. If you are experiencing a medical emergency, call 911.
        </p>
        <p className="footer-copy">© {new Date().getFullYear()} Local Doctor. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default App
