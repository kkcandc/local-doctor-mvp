/*
  The content of each individual service page (/services/<slug>). Plain data with no imports, so
  the page, the head tags, the sitemap, and the tests read the same text.

  Every service page uses one layout (ServicePage.tsx). A page only supplies its words, so adding
  the next service means adding a slug and one entry here, then pointing its card in servicesData.ts
  at that slug.

  Where a treatment fact also appears on /treatments (route, MRI schedule, stopping rule, ARIA
  rates), it is written exactly as it is there, and tests/service-pages.spec.ts compares the two.
  Like all claims on the site, these need clinical and legal review before paid traffic (see
  README, Prototype Boundaries). No dashes (en or em) anywhere in this copy.
*/

export const servicePageSlugs = ['memory-evaluation', 'leqembi', 'kisunla'] as const

export type ServicePageSlug = (typeof servicePageSlugs)[number]

export function isServicePageSlug(value: string): value is ServicePageSlug {
  return (servicePageSlugs as readonly string[]).includes(value)
}

// Text with an optional link to another service page inside it.
export type RichText = Array<string | { slug: ServicePageSlug; text: string }>

export type ServicePageContent = {
  // The H1.
  title: string
  // Small line under the H1, such as the generic drug name.
  generic?: string
  // Label above the H1: the kind of service.
  eyebrow: string
  imageAlt: string
  lede: string
  // Three short points beside the hero image.
  highlights: string[]
  // Optional text link under the hero button. Scrolls to the options section.
  heroSecondaryLabel?: string
  meta: { title: string; description: string }
  options: {
    eyebrow: string
    title: string
    copy: string
    name: string
    setting: string
    description: string
    coverTitle: string
    coverCopy: string
    checks: string[]
    // Treatments only: the honest "what to expect" card.
    honest?: { title: string; copy: string }
  }
  steps: { eyebrow: string; title: string; items: Array<{ title: string; copy: string }> }
  // Treatments only: the drug facts table.
  details?: {
    eyebrow: string
    title: string
    copy: string
    rows: Array<[label: string, value: string]>
    disclaimer: string
    safetyLink: { label: string; href: string }
    compare: { label: string; slug: ServicePageSlug }
  }
  band: { title: string; copy: string }
  fit: { eyebrow: string; title: string; copy: string; items: string[]; note: string }
  // Treatments only.
  safety?: {
    eyebrow: string
    title: string
    copy: string
    screenTitle: string
    screenCopy: string
    screen: string[]
    watchTitle: string
    watch: string[]
    note: string
  }
  careTeam: { title: string; copy: string }
  // Names of other services (as listed in servicesData.ts) shown in the "More care" row.
  moreCare: string[]
  faqs: Array<{ question: string; answer: RichText }>
}

// Wording shared by every service page. Change it here and every page follows.
export const availabilityLine = 'Appointments tomorrow'
export const priceNote = 'with or without insurance'
export const regionNote = 'Video visits for patients located in Maryland.'
export const bookLabel = 'Book now'

const aria = 'The ARIA-E risk was 13% vs 2% on placebo; The ARIA-H was 17% vs 9% on placebo'

const treatmentSteps: ServicePageContent['steps'] = {
  eyebrow: 'What to expect',
  title: 'From first concern to treatment',
  items: [
    {
      title: "Tell us what's going on",
      copy: 'Book a time for your first visit. We call you beforehand to review your medical history and verify your insurance and eligibility.',
    },
    {
      title: 'Meet your specialist',
      copy: 'A virtual diagnostic visit with your caregiver present, followed by orders for labs, an amyloid test, genetic testing, and a brain MRI.',
    },
    {
      title: 'Get your workup and results',
      copy: 'One blood draw covers labs and the amyloid biomarker. Your MRI is read centrally by the same specialist reader every time.',
    },
    {
      title: 'Start treatment and stay monitored',
      copy: 'If you qualify, we refer you to an in-network infusion center near you and keep every infusion and MRI on schedule.',
    },
  ],
}

const treatmentBand: ServicePageContent['band'] = {
  title: "All your care in one place. That's the Local Doctor difference.",
  copy: "We help you understand your options, connect you to the right specialists, coordinate every test and infusion, and keep an eye on your safety along the way. It's comprehensive care that makes it simple to move forward with confidence.",
}

const treatmentSafety: Omit<NonNullable<ServicePageContent['safety']>, 'note'> = {
  eyebrow: 'Safety',
  title: 'How we monitor for side effects',
  copy: 'The main safety concern is ARIA (amyloid-related imaging abnormalities): temporary swelling or small bleeds in the brain, usually without symptoms, caught early through the scheduled MRIs above.',
  screenTitle: 'The safety screen is part of the evaluation, not an afterthought.',
  screenCopy: 'Risks and monitoring are reviewed before any treatment decision. Urgent symptoms belong with emergency care.',
  screen: [
    'Medication and anticoagulant review',
    'MRI compatibility and prior imaging review',
    'APOE-informed risk discussion when appropriate',
    'Clear escalation instructions for urgent symptoms',
  ],
  watchTitle: 'What we watch for between visits',
  watch: ['Headache', 'Confusion', 'Nausea or vomiting', 'Unsteadiness or dizziness', 'Tremor', 'Vision or speech changes'],
}

const treatmentSafetyNote = 'Any of these triggers same-day evaluation through our 24/7 triage line. In a medical emergency, call 911.'

function treatmentFit(drug: string): ServicePageContent['fit'] {
  return {
    eyebrow: 'What we look for',
    title: `Is ${drug} right for you?`,
    copy: `${drug} is for a specific group of patients looking to address amyloid buildup directly, not those looking for general memory care. It tends to be a good fit if:`,
    items: [
      "You have a diagnosis already, or have experienced changes serious enough to suspect memory issues, mild cognitive impairment, dementia, or early Alzheimer's.",
      "You're looking for treatment that goes after the disease itself and slows amyloid buildup, not only a plan for managing symptoms day to day.",
      "You're comfortable completing a short form online and joining a video visit; most of the evaluation happens virtually.",
      "You're often in your early 60s to mid-70s, though age alone doesn't decide eligibility; your diagnosis and goals do.",
      "You haven't already started a disease-modifying treatment.",
      'You are located in Maryland.',
    ],
    note: "Still not sure? Book a visit and we'll go through the safety screening with you.",
  }
}

function honest(drug: string): NonNullable<ServicePageContent['options']['honest']> {
  return {
    title: 'What to expect, honestly',
    copy: `In clinical trials, ${drug} showed a real, moderate slowing of cognitive decline. It is not a cure and it does not reverse symptoms already present. The goal is to weigh the potential benefits and risks clearly with our neurology specialists and decide what works best for you.`,
  }
}

const treatmentOptions = {
  eyebrow: 'Getting started',
  title: 'Treatment begins with an evaluation',
  copy: 'We verify your insurance in parallel, so coverage is clear before you commit to anything.',
  name: 'Diagnostic intake visit',
  setting: 'Virtual · 30-60 min',
  description:
    'With your caregiver present: history, a cognitive screen, medication review, and a plan. If you qualify, we order an amyloid test, genetic testing, and a brain MRI.',
  coverTitle: 'Insurance accepted',
  coverCopy: 'We walk through your specific coverage before you commit.',
  checks: ['Most insurance accepted', 'Specialist-led care', 'No hidden fees', 'Virtual where it can be'],
}

const treatmentDisclaimer =
  'This information is from the primary trials performed with these medications and the pharmaceutical manufacturers directly. Most ARIA in the trials was asymptomatic and found on routine MRI. Prescribing information, monitoring schedules, and payer rules can change. This is general information, not a recommendation.'

const sharedMoreCare = ["Alzheimer's evaluation", "Alzheimer's blood test", 'Brain MRI', "Alzheimer's genetic testing"]

const eligibilityFaq = {
  question: 'Who may not be a candidate?',
  answer: [
    'Your evaluation includes safety screening: a recent brain MRI and genetic (ApoE) testing help determine your risk of ARIA. Certain MRI findings, or use of certain blood thinners, can affect eligibility. Your specialist reviews this with you.',
  ],
} satisfies ServicePageContent['faqs'][number]

const coverageFaq = {
  question: 'Will insurance cover it?',
  answer: [
    'Most patients access care through commercial insurance or Medicare. Coverage depends on your plan and, for traditional Medicare, participation in a national treatment registry. We walk through your specific coverage before you commit.',
  ],
} satisfies ServicePageContent['faqs'][number]

export const servicePages: Record<ServicePageSlug, ServicePageContent> = {
  'memory-evaluation': {
    title: 'Memory evaluation',
    eyebrow: 'Virtual visit',
    imageAlt: 'A smiling older woman outdoors',
    lede: "Occasional forgetfulness is a normal part of life, but ongoing or worsening memory changes are worth talking through with a specialist. This visit helps you understand what's typical, what isn't, and what to do next.",
    highlights: [
      '1:1 video visit with a clinician experienced in cognitive health',
      'Insurance accepted, with coverage checked before you book',
      'A care plan built from your full health history',
    ],
    meta: {
      title: 'Memory evaluation by video visit | Local Doctor',
      description:
        'Talk through memory changes with a clinician by video visit from home. Insurance accepted, with coverage checked before you book. Family members are welcome to join.',
    },
    options: {
      eyebrow: 'Visit options',
      title: 'Choose how you start',
      copy: "We'll check any insurance and show you your options before you book.",
      name: 'Video visit',
      setting: 'Virtual · from home',
      description: 'A 1:1 visit with a clinician experienced in cognitive health. Family members and caregivers are welcome to join.',
      coverTitle: 'Insurance accepted',
      coverCopy: 'We verify coverage and confirm your cost before you book.',
      checks: ['Most insurance accepted', 'Specialist-led care', 'No hidden fees', 'Virtual, from home'],
    },
    steps: {
      eyebrow: 'What to expect',
      title: 'What to expect from a memory evaluation',
      items: [
        { title: 'Share your health story', copy: "Tell us what you've noticed and how it's changed over time." },
        { title: 'Meet your clinician', copy: 'Discuss possible causes, including medications, sleep, and stress.' },
        { title: 'Get your care plan', copy: 'Leave with guidance, a referral for further evaluation, or a plan to monitor.' },
        { title: 'Own your health', copy: 'Follow up to track how things are going.' },
      ],
    },
    band: {
      title: "All your care in one place. That's the Local Doctor difference.",
      copy: "We help you understand your options, connect you to the right specialists, coordinate any needed evaluations, and keep an eye on your overall brain health along the way. It's comprehensive care that looks at the full picture (your goals, your history, your lifestyle) and makes it simple to move forward with confidence.",
    },
    fit: {
      eyebrow: 'Who it is for',
      title: 'Is a memory evaluation right for you?',
      copy: "Talking it through early helps you understand what's going on, whether it's a manageable cause or something needing more evaluation.",
      items: [
        "You've noticed memory changes that feel different from before.",
        'Family or friends have mentioned changes in your memory.',
        'You want to check whether a medication or health issue could be contributing.',
        "You're having trouble with daily tasks that used to be routine.",
        "You want a plan for further evaluation if it's needed.",
      ],
      note: "Not sure? Book a visit and we'll help you find the right next step.",
    },
    careTeam: {
      title: 'Talk to a clinician about your memory',
      copy: 'Meet a specialist who listens first, looks at the full picture, and explains what comes next.',
    },
    moreCare: ['Cognitive evaluation', 'Brain fog evaluation', "Alzheimer's blood test", 'Brain MRI', 'Leqembi (lecanemab)'],
    faqs: [
      {
        question: 'Is some memory trouble a normal part of aging?',
        answer: [
          "Yes. Occasionally misplacing keys or forgetting a name is common at any age and usually isn't a concern. Changes that are new, getting worse, or getting in the way of daily life are worth discussing with a clinician.",
        ],
      },
      {
        question: 'What memory changes are more concerning?',
        answer: [
          'Repeating questions, getting lost in familiar places, trouble with routine tasks like managing bills or following a recipe, difficulty finding words, or changes in mood or personality. Family noticing changes is also a meaningful signal.',
        ],
      },
      {
        question: 'Can medications or other health issues cause memory problems?',
        answer: [
          'Yes. Some medications, poor sleep, stress, depression, thyroid or vitamin B12 problems, and infections can all affect memory. Reviewing these is part of the visit, since many are treatable.',
        ],
      },
      {
        question: 'Will this visit diagnose dementia?',
        answer: [
          "Not on its own. Your clinician reviews your history, completes a cognitive screen, and recommends next steps, which may include labs, a brain MRI, or a dedicated Alzheimer's or dementia evaluation.",
        ],
      },
      {
        question: 'What treatments could come out of this visit?',
        answer: [
          "That depends on the cause. Your clinician explains options and risks before anything starts. If you qualify for an Alzheimer's treatment such as ",
          { slug: 'leqembi', text: 'Leqembi' },
          ', we walk through the specific risks with you honestly.',
        ],
      },
    ],
  },

  leqembi: {
    title: 'Leqembi',
    generic: 'lecanemab-irmb · FDA-approved',
    eyebrow: 'Treatment',
    imageAlt: 'Leqembi (lecanemab) IV infusion bag',
    lede: "An FDA-approved treatment that goes after amyloid, a driver of early Alzheimer's, rather than only managing symptoms. Here's what it does, who it's for, and how we keep you safe.",
    highlights: [
      'IV infusion every two weeks, with an option to move to a weekly at-home injection after 18 months',
      'Scheduled MRIs and a 24/7 triage line to watch for side effects',
      "A specialist evaluation first, to confirm you're a candidate",
    ],
    heroSecondaryLabel: 'How to get started',
    meta: {
      title: 'Leqembi (lecanemab) treatment evaluation | Local Doctor',
      description:
        'Learn how Leqembi works, who may qualify, and how safety is monitored. Book a video visit with a neurologist to find out if it is right for you.',
    },
    options: { ...treatmentOptions, honest: honest('Leqembi') },
    steps: treatmentSteps,
    details: {
      eyebrow: 'At a glance',
      title: 'Leqembi, in detail',
      copy: "How it's given, how we monitor you, and the numbers behind the safety profile.",
      rows: [
        ['Route', 'IV infusion every two weeks; can transition to a once-weekly at-home injection after 18 months'],
        ['MRI monitoring', 'Baseline during your workup and before your 3rd, 5th, 7th, and 14th infusions'],
        ['Duration', 'Can stop once amyloid reaches minimal levels on a PET scan'],
        ['ARIA risk', aria],
      ],
      disclaimer: treatmentDisclaimer,
      safetyLink: { label: 'Important Safety Information', href: 'https://www.leqembihcp.com/about/safety' },
      compare: { label: 'Compare with Kisunla', slug: 'kisunla' },
    },
    band: treatmentBand,
    fit: treatmentFit('Leqembi'),
    safety: { ...treatmentSafety, note: treatmentSafetyNote },
    careTeam: {
      title: 'Talk to a specialist about Leqembi',
      copy: "Meet a clinician who will review your history, explain the benefits and risks plainly, and tell you whether you're a candidate.",
    },
    moreCare: ['Kisunla (donanemab)', ...sharedMoreCare],
    faqs: [
      {
        question: 'What is Leqembi?',
        answer: [
          "Leqembi (lecanemab-irmb) is an FDA-approved antibody treatment that clears amyloid plaques from the brain. It's approved for mild cognitive impairment or mild dementia due to Alzheimer's disease, confirmed by an amyloid test.",
        ],
      },
      {
        question: "Does it cure or reverse Alzheimer's?",
        answer: [
          "No. In trials it slowed cognitive decline by a moderate amount over 18 months. It doesn't reverse symptoms already present, and individual results vary.",
        ],
      },
      eligibilityFaq,
      {
        question: 'How long would I stay on it?',
        answer: [
          'Leqembi can stop once amyloid reaches minimal levels on a PET scan, and until then you and your specialist review progress regularly. After 18 months, some patients can transition to a once-weekly at-home injection.',
        ],
      },
      coverageFaq,
    ],
  },

  kisunla: {
    title: 'Kisunla',
    generic: 'donanemab-azbt · FDA-approved',
    eyebrow: 'Treatment',
    imageAlt: 'An older woman and her friends walking together outdoors',
    lede: "An FDA-approved treatment that goes after amyloid, a driver of early Alzheimer's, rather than only managing symptoms. Here's what it does, who it's for, and how we keep you safe.",
    highlights: [
      'IV infusion every four weeks',
      'Scheduled MRIs and a 24/7 triage line to watch for side effects',
      "A specialist evaluation first, to confirm you're a candidate",
    ],
    heroSecondaryLabel: 'How to get started',
    meta: {
      title: 'Kisunla (donanemab) treatment evaluation | Local Doctor',
      description:
        'Learn how Kisunla works, who may qualify, and how safety is monitored. Book a video visit with a neurologist to find out if it is right for you.',
    },
    options: { ...treatmentOptions, honest: honest('Kisunla') },
    steps: treatmentSteps,
    details: {
      eyebrow: 'At a glance',
      title: 'Kisunla, in detail',
      copy: "How it's given, how we monitor you, and the numbers behind the safety profile.",
      rows: [
        ['Route', 'IV infusion every four weeks'],
        ['MRI monitoring', 'Baseline during your workup and before your 2nd, 3rd, 4th, 7th, and 13th infusions'],
        ['Duration', 'Can stop once amyloid reaches minimal levels on a PET scan'],
        ['ARIA risk', 'The ARIA-E risk was 24% vs 2% on placebo; The ARIA-H was 31% vs 13% on placebo'],
      ],
      disclaimer: treatmentDisclaimer,
      safetyLink: { label: 'Important Safety Information', href: 'https://www.lilly.com/hcp/product/kisunla/safety' },
      compare: { label: 'Compare with Leqembi', slug: 'leqembi' },
    },
    band: treatmentBand,
    fit: treatmentFit('Kisunla'),
    safety: { ...treatmentSafety, note: treatmentSafetyNote },
    careTeam: {
      title: 'Talk to a specialist about Kisunla',
      copy: "Meet a clinician who will review your history, explain the benefits and risks plainly, and tell you whether you're a candidate.",
    },
    moreCare: ['Leqembi (lecanemab)', ...sharedMoreCare],
    faqs: [
      {
        question: 'What is Kisunla?',
        answer: [
          "Kisunla (donanemab-azbt) is an FDA-approved antibody treatment that targets amyloid plaques in the brain. It's approved for mild cognitive impairment or mild dementia due to Alzheimer's disease, confirmed by an amyloid test.",
        ],
      },
      {
        question: "Does it cure or reverse Alzheimer's?",
        answer: [
          "No. In trials it slowed cognitive decline by a moderate amount. It doesn't reverse symptoms already present, and individual results vary.",
        ],
      },
      eligibilityFaq,
      {
        question: 'How long would I stay on it?',
        answer: [
          'Kisunla can stop once amyloid reaches minimal levels on a PET scan, and until then you and your specialist review progress regularly.',
        ],
      },
      {
        question: 'How is it different from Leqembi?',
        answer: [
          'Kisunla is given by IV infusion every four weeks. ',
          { slug: 'leqembi', text: 'Leqembi' },
          ' is given every two weeks and can transition to a once-weekly at-home injection after 18 months. These came from separate trials, not a head-to-head comparison, so your specialist helps you weigh the options for you.',
        ],
      },
      coverageFaq,
    ],
  },
}
