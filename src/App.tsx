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
