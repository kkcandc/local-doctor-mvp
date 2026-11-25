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

// In the order of the cards on /services.
export const servicePageSlugs = [
  'memory-evaluation',
  'leqembi',
  'alzheimers-blood-test',
  'concentration-difficulty',
  'dementia-evaluation',
  'neurologist-visit',
  'brain-fog-evaluation',
  'alzheimers-genetic-testing',
  'cognitive-evaluation',
  'kisunla',
  'alzheimers-evaluation',
  'brain-mri',
] as const

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
  meta: {
    title: string
    description: string
    // Keeps the page out of search results and sitemap.xml, with no canonical. Set it on a page
    // whose topic a landing page (src/landing) already owns, so the two do not compete.
    noindex?: boolean
  }
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
  // A facts table: the drug facts on a treatment page, an "at a glance" table on a test page.
  details?: {
    eyebrow: string
    title: string
    copy: string
    rows: Array<[label: string, value: string]>
    disclaimer: string
    // Treatments only: the manufacturer's safety information.
    safetyLink?: { label: string; href: string }
    // Treatments only: a link to the other drug's page.
    compare?: { label: string; slug: ServicePageSlug }
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
export const bookLabel = 'Book now'
// The section of /get-started that every booking button opens (an id, without the #): the calendar.
// Set it to '' to open the top of /get-started instead.
export const bookingHash = 'book'

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

// Shared by the video visit pages (memory, concentration, brain fog, cognitive, dementia,
// Alzheimer's, neurologist). Each page adds its own `description`.
const visitOptions = {
  eyebrow: 'Visit options',
  title: 'Choose how you start',
  copy: "We'll check any insurance and show you your options before you book.",
  name: 'Video visit',
  setting: 'Virtual · from home',
  coverTitle: 'Insurance accepted',
  coverCopy: 'We verify coverage and confirm your cost before you book.',
  checks: ['Most insurance accepted', 'Specialist-led care', 'No hidden fees', 'Virtual, from home'],
}

const visitBand: ServicePageContent['band'] = {
  title: "All your care in one place. That's the Local Doctor difference.",
  copy: "We help you understand your options, connect you to the right specialists, coordinate any needed evaluations, and keep an eye on your overall brain health along the way. It's comprehensive care that looks at the full picture (your goals, your history, your lifestyle) and makes it simple to move forward with confidence.",
}

const nextStepNote = "Not sure? Book a visit and we'll help you find the right next step."

const visitCoverageFaq = {
  question: 'Will insurance cover it?',
  answer: [
    'Most patients access care through Medicare, Medicaid, or major health plans. Whether we are in network with your plan or not, we walk through your specific coverage before you commit to anything. If labs or imaging are ordered afterward, their cost depends on the sites you use and your coverage.',
  ],
} satisfies ServicePageContent['faqs'][number]

const familyFaq = {
  question: 'Can a family member join the visit?',
  answer: [
    'Yes, and we prefer it for the first visit. Family members and caregivers can add details you might not think to mention, and hear the plan for themselves.',
  ],
} satisfies ServicePageContent['faqs'][number]

const emergencyFaq = {
  question: 'When should I call 911 instead?',
  answer: [
    'Sudden confusion, trouble speaking, facial drooping, or weakness on one side can be signs of a stroke or another emergency. Call 911. Do not wait for a form, a callback, or a virtual visit.',
  ],
} satisfies ServicePageContent['faqs'][number]

// The causes a visit about focus, fog, or thinking looks at. Wording follows the Memory evaluation FAQ.
const otherCausesAnswer =
  'Some medications, poor sleep, stress, depression, thyroid or vitamin B12 problems, hearing loss, and infections can all affect how you think and focus. Reviewing these is part of the visit, since many are treatable.'

const whatHappensAnswer =
  'Your clinician reviews your history and medications, asks about sleep, mood, and daily life, and completes a cognitive screen. They then explain what they found and recommend next steps, which may include labs, a brain MRI, or a more focused evaluation.'

// What the test pages say about themselves. These are general facts about each type of test, not
// claims about Local Doctor's own turnaround or lab (see README, Service Pages).
const testDisclaimer =
  'This is general information about this type of test, not a recommendation or a diagnosis. Your neurologist explains what a result means for you.'

export const servicePages: Record<ServicePageSlug, ServicePageContent> = {
  'memory-evaluation': {
    title: 'Memory evaluation',
    eyebrow: 'Virtual visit',
    imageAlt: 'A smiling older woman writing in a notebook at a table, with a laptop, a blood pressure cuff and medicine bottles',
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
      // /memory-evaluation (a landing page) already owns this search.
      noindex: true,
    },
    options: {
      ...visitOptions,
      description: 'A 1:1 visit with a clinician experienced in cognitive health. Family members and caregivers are welcome to join.',
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
    band: visitBand,
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
    imageAlt: 'Kisunla (donanemab) IV infusion bag',
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

  'concentration-difficulty': {
    title: 'Concentration difficulty',
    eyebrow: 'Virtual visit',
    imageAlt: 'A woman with glasses on her head looking down and writing, seen from above',
    lede: "Trouble focusing, losing your train of thought, or finding it harder to stay on task is common, and it has many possible causes. This visit looks at what's behind it and what to do next.",
    highlights: [
      '1:1 video visit with a clinician experienced in cognitive health',
      'A review of sleep, stress, mood, and medications, which can all affect focus',
      'Insurance accepted, with coverage checked before you book',
    ],
    meta: {
      title: 'Concentration difficulty evaluation by video visit | Local Doctor',
      description:
        'Talk through trouble concentrating with a clinician by video visit from home. Review common causes and next steps. Insurance accepted, with coverage checked before you book.',
    },
    options: {
      ...visitOptions,
      description: 'A 1:1 visit with a clinician experienced in cognitive health. Family members and friends are welcome to join.',
    },
    steps: {
      eyebrow: 'What to expect',
      title: 'What to expect from a concentration visit',
      items: [
        { title: 'Describe what you notice', copy: 'Tell us when your focus slips, how long it has been going on, and what it gets in the way of.' },
        { title: 'Look for causes', copy: 'Review medications, sleep, stress, mood, and other health issues that can affect concentration.' },
        { title: 'Get your plan', copy: 'Leave with guidance, a referral for further evaluation, or a plan to monitor.' },
        { title: 'Follow up', copy: 'Check in to see how things are going.' },
      ],
    },
    band: visitBand,
    fit: {
      eyebrow: 'Who it is for',
      title: 'Is this visit right for you?',
      copy: 'Concentration problems are worth talking through when they are new, getting worse, or getting in the way of daily life.',
      items: [
        "You're finding it harder to focus than you used to.",
        'You lose track of what you were doing or saying more often.',
        'Tasks that used to be routine now take more effort.',
        'You want to check whether a medication, poor sleep, or a health issue could be contributing.',
        'You want to know whether further evaluation makes sense.',
      ],
      note: nextStepNote,
    },
    careTeam: {
      title: 'Talk to a clinician about your focus',
      copy: 'Meet a specialist who listens first, looks at the full picture, and explains what comes next.',
    },
    moreCare: ['Brain fog evaluation', 'Cognitive evaluation', 'Memory evaluation', 'Visit with a neurologist doctor', 'Brain MRI'],
    faqs: [
      {
        question: 'Is trouble concentrating a sign of dementia?',
        answer: [
          'Not usually on its own. Many things affect focus, including poor sleep, stress, low mood, medications, and other health problems. Changes that are new, getting worse, or getting in the way of daily life are worth a closer look.',
        ],
      },
      { question: 'What can cause trouble concentrating?', answer: [otherCausesAnswer] },
      { question: 'What happens at the visit?', answer: [whatHappensAnswer] },
      visitCoverageFaq,
      emergencyFaq,
    ],
  },

  'brain-fog-evaluation': {
    title: 'Brain fog evaluation',
    eyebrow: 'Virtual visit',
    imageAlt: 'A tired woman resting her head on her hand at a kitchen table, with a mug and a glass of water',
    lede: "Feeling mentally cloudy, slow, or unable to think clearly is hard to describe and easy to dismiss. This visit helps work out what's behind it, and what to do next.",
    highlights: [
      '1:1 video visit with a clinician experienced in cognitive health',
      'A review of sleep, stress, mood, medications, and other health issues',
      'Insurance accepted, with coverage checked before you book',
    ],
    meta: {
      title: 'Brain fog evaluation by video visit | Local Doctor',
      description:
        'Talk through brain fog with a clinician by video visit from home. Review common causes and next steps. Insurance accepted, with coverage checked before you book.',
    },
    options: {
      ...visitOptions,
      description: 'A 1:1 visit with a clinician experienced in cognitive health. Family members and friends are welcome to join.',
    },
    steps: {
      eyebrow: 'What to expect',
      title: 'What to expect from a brain fog evaluation',
      items: [
        { title: 'Describe the fog', copy: 'Tell us what it feels like, when it is worst, and when it started.' },
        { title: 'Look for causes', copy: 'Review medications, sleep, stress, mood, and other health issues that can affect how clearly you think.' },
        { title: 'Get your plan', copy: 'Leave with guidance, a referral for further evaluation, or a plan to monitor.' },
        { title: 'Follow up', copy: 'Check in to see how things are going.' },
      ],
    },
    band: visitBand,
    fit: {
      eyebrow: 'Who it is for',
      title: 'Is a brain fog evaluation right for you?',
      copy: 'Brain fog is worth talking through when it lasts, keeps coming back, or gets in the way of daily life.',
      items: [
        'Your thinking feels slower or cloudier than it used to.',
        'You have trouble finding words or holding on to a thought.',
        "You're more tired or mentally drained than usual.",
        'Family or friends have noticed a change.',
        'You want to check whether a medication or health issue could be contributing.',
      ],
      note: nextStepNote,
    },
    careTeam: {
      title: 'Talk to a clinician about brain fog',
      copy: 'Meet a specialist who listens first, looks at the full picture, and explains what comes next.',
    },
    moreCare: ['Concentration difficulty', 'Cognitive evaluation', 'Memory evaluation', "Alzheimer's blood test", 'Brain MRI'],
    faqs: [
      {
        question: 'What is brain fog?',
        answer: [
          'Brain fog is a description, not a diagnosis. People use it for feeling mentally cloudy, slow, or unfocused. It can come from many causes, and finding the cause is the point of the visit.',
        ],
      },
      { question: 'What can cause brain fog?', answer: [otherCausesAnswer] },
      {
        question: "Is brain fog an early sign of Alzheimer's?",
        answer: [
          'Usually not on its own. Many common and treatable things can cause it. If your clinician sees signs that point to a memory or thinking disorder, they recommend further evaluation.',
        ],
      },
      { question: 'What happens at the visit?', answer: [whatHappensAnswer] },
      visitCoverageFaq,
      emergencyFaq,
    ],
  },

  'cognitive-evaluation': {
    title: 'Cognitive evaluation',
    eyebrow: 'Virtual visit',
    imageAlt: "An older person's hands drawing a clock face on a sheet of paper",
    lede: 'A cognitive evaluation looks at how your memory, attention, and thinking are working today. It starts with a conversation and a short cognitive screen, and ends with a clear plan.',
    highlights: [
      '1:1 video visit with a clinician experienced in cognitive health',
      'History, a cognitive screen, medication review, and a plan',
      'Insurance accepted, with coverage checked before you book',
    ],
    meta: {
      title: 'Cognitive evaluation by video visit | Local Doctor',
      description:
        'Have your memory and thinking evaluated by a clinician by video visit from home. A cognitive screen, medication review, and a plan. Insurance accepted, with coverage checked before you book.',
    },
    options: {
      ...visitOptions,
      description: 'A 1:1 visit with a clinician experienced in cognitive health. Family members and caregivers are welcome to join.',
    },
    steps: {
      eyebrow: 'What to expect',
      title: 'What to expect from a cognitive evaluation',
      items: [
        { title: 'Share your history', copy: 'Tell us what you have noticed, your health history, and the medications you take.' },
        { title: 'Complete a cognitive screen', copy: 'Your clinician asks questions and has you complete short tasks that look at memory, attention, and thinking.' },
        { title: 'Review what it shows', copy: 'Talk through the results in plain language, alongside your history and medications.' },
        { title: 'Get your plan', copy: 'Leave with guidance, further testing if it is needed, or a plan to monitor.' },
      ],
    },
    band: visitBand,
    fit: {
      eyebrow: 'Who it is for',
      title: 'Is a cognitive evaluation right for you?',
      copy: 'A screen is one tool. It helps show whether further evaluation makes sense.',
      items: [
        "You've noticed changes in your memory, attention, or thinking.",
        'Family or friends have mentioned changes.',
        "You're having trouble with tasks that used to be routine.",
        'You want to know whether further testing is worth doing.',
        'You want a clear next step, not just a worry.',
      ],
      note: nextStepNote,
    },
    careTeam: {
      title: 'Talk to a clinician about your thinking',
      copy: 'Meet a specialist who listens first, looks at the full picture, and explains what comes next.',
    },
    moreCare: ['Memory evaluation', "Alzheimer's evaluation", 'Dementia evaluation', "Alzheimer's blood test", 'Brain MRI'],
    faqs: [
      {
        question: 'Is a cognitive evaluation the same as a dementia test?',
        answer: [
          'No. A test or screen is one tool. An evaluation is a clinician reviewing your symptoms, history, medications, and any prior results to explain what they mean and what to do next.',
        ],
      },
      {
        question: 'What happens during the cognitive screen?',
        answer: [
          'Your clinician asks questions and has you complete short tasks that look at memory, attention, and thinking. It does not diagnose anything on its own.',
        ],
      },
      {
        question: 'Will this diagnose dementia?',
        answer: [
          "Not on its own. Your clinician reviews your history, completes a cognitive screen, and recommends next steps, which may include labs, a brain MRI, or a dedicated Alzheimer's or dementia evaluation.",
        ],
      },
      familyFaq,
      visitCoverageFaq,
    ],
  },

  'dementia-evaluation': {
    title: 'Dementia evaluation',
    eyebrow: 'Virtual visit',
    imageAlt: "A younger person's hand resting on an older person's hands, with a video call on a tablet behind them",
    lede: 'Whether you are worried about yourself or someone you love, an evaluation turns worry into a plan. A board-certified neurologist reviews symptoms and history by video and tells you, in plain language, what comes next.',
    highlights: [
      'Video visit with a board-certified neurologist',
      'Local testing only if it is ordered, at a local lab or imaging center',
      'Insurance accepted, with coverage checked before you book',
    ],
    meta: {
      title: 'Dementia evaluation with a neurologist by video | Local Doctor',
      description:
        'See a neurologist by video visit from home to talk through memory and thinking changes. Local testing only if it is ordered. Insurance accepted, with coverage checked before you book.',
      // /dementia-evaluation (a landing page) already owns this search.
      noindex: true,
    },
    options: {
      ...visitOptions,
      description: 'A video visit where a neurologist reviews symptoms, history, and medications. Family members and caregivers are welcome to join.',
    },
    steps: {
      eyebrow: 'What to expect',
      title: 'What to expect from a dementia evaluation',
      items: [
        {
          title: 'Book a visit',
          copy: 'Pick a time that works for you. We call beforehand to review your medical history and verify your insurance and eligibility.',
        },
        { title: 'Meet the neurologist by video', copy: 'Talk through your concerns, the timeline, your health history, and your medications.' },
        { title: 'Local testing, only if ordered', copy: 'If the neurologist orders tests, you complete them at a local lab or imaging center.' },
        { title: 'Follow-up visit', copy: 'Review the results together and agree on next steps.' },
      ],
    },
    band: visitBand,
    fit: {
      eyebrow: 'Who it is for',
      title: 'Is a dementia evaluation right for you?',
      copy: 'It helps to talk to a specialist early, whether you are worried about yourself or a loved one.',
      items: [
        'Memory, thinking, or behavior changes have been getting worse.',
        'Family or friends have noticed changes.',
        "You're helping a parent or spouse and want a clear explanation of what is going on.",
        'You want to know which tests, if any, make sense next.',
        "You want a specialist's opinion on what comes next.",
      ],
      note: "An evaluation is not a guaranteed diagnosis or treatment plan. Not sure? Book a visit and we'll help you find the right next step.",
    },
    careTeam: {
      title: 'Talk to a neurologist about memory changes',
      copy: 'Meet a specialist who listens first, looks at the full picture, and explains what comes next.',
    },
    moreCare: ["Alzheimer's evaluation", 'Memory evaluation', "Alzheimer's blood test", 'Brain MRI', 'Visit with a neurologist doctor'],
    faqs: [
      {
        question: 'Is this a dementia test?',
        answer: [
          'No. A test or screening is one tool. An evaluation is a clinician reviewing symptoms, history, medications, and any prior results to explain what they mean and what to do next.',
        ],
      },
      {
        question: 'Will this visit diagnose dementia?',
        answer: ['A diagnosis often depends on testing ordered afterward and reviewed with you at a follow-up visit.'],
      },
      {
        question: 'What tests might be ordered?',
        answer: [
          'That depends on your symptoms and history. They may include ',
          { slug: 'alzheimers-blood-test', text: 'blood work' },
          ', a ',
          { slug: 'brain-mri', text: 'brain MRI' },
          ', or ',
          { slug: 'alzheimers-genetic-testing', text: 'genetic testing' },
          ', done at a local lab or imaging center. Some people need several, and some need none.',
        ],
      },
      familyFaq,
      visitCoverageFaq,
    ],
  },

  'alzheimers-evaluation': {
    title: "Alzheimer's evaluation",
    eyebrow: 'Virtual visit',
    imageAlt: 'A young woman and an older woman looking at a laptop together at a kitchen table',
    lede: "An Alzheimer's evaluation looks at the full picture before deciding on any test or treatment. You leave with a plan: which tests may help, what treatment options may exist, and how to move forward.",
    highlights: [
      'Video visit with a board-certified neurologist',
      'A workup built around you: some people need several tests, some need none',
      'Insurance accepted, with coverage checked before you book',
    ],
    meta: {
      title: "Alzheimer's evaluation with a neurologist by video | Local Doctor",
      description:
        "Start an Alzheimer's evaluation with a video visit from home. Review symptoms and history, then learn which tests, if any, make sense next. Insurance accepted, with coverage checked before you book.",
      // /alzheimers-evaluation (a landing page) already owns this search.
      noindex: true,
    },
    options: {
      ...visitOptions,
      description:
        'A video visit where a neurologist reviews symptoms, history, and prior results, then explains which tests may help. Family members and caregivers are welcome to join.',
    },
    steps: {
      eyebrow: 'What to expect',
      title: "What an Alzheimer's evaluation involves",
      items: [
        {
          title: 'Book a visit',
          copy: 'Pick a time that works for you. We call beforehand to review your medical history and verify your insurance and eligibility.',
        },
        {
          title: 'Specialist video visit',
          copy: 'Review symptoms, timeline, daily function, family history, and any prior results. The neurologist may order labs, genetic testing, or imaging.',
        },
        { title: 'Local testing, if ordered', copy: 'Complete any tests at a local lab or imaging center.' },
        { title: 'Results and options', copy: 'After testing, a follow-up visit to review what the results mean and what options may exist.' },
      ],
    },
    band: visitBand,
    fit: {
      eyebrow: 'Who it is for',
      title: "Is an Alzheimer's evaluation right for you?",
      copy: 'Treatment questions come after the workup, not before. The evaluation shows where you stand and which options, if any, apply.',
      items: [
        "You've been told you may have mild cognitive impairment or early Alzheimer's.",
        'Memory or thinking changes are getting worse.',
        'You want to know which tests make sense, and which do not.',
        "You're considering an Alzheimer's treatment and want to know whether you may be a candidate.",
        'You want a plan you can share with your family.',
      ],
      note: "An evaluation does not promise eligibility for any medication. Not sure? Book a visit and we'll help you find the right next step.",
    },
    careTeam: {
      title: "Talk to a neurologist about Alzheimer's",
      copy: 'Meet a specialist who listens first, looks at the full picture, and explains what comes next.',
    },
    moreCare: ["Alzheimer's blood test", 'Brain MRI', "Alzheimer's genetic testing", 'Leqembi (lecanemab)', 'Kisunla (donanemab)'],
    faqs: [
      {
        question: 'What is included in the workup?',
        answer: [
          'It starts with your history and a cognitive assessment. Depending on what the neurologist finds, it may add ',
          { slug: 'alzheimers-blood-test', text: 'blood work' },
          ', ',
          { slug: 'brain-mri', text: 'brain imaging' },
          ', or ',
          { slug: 'alzheimers-genetic-testing', text: 'genetic testing' },
          '. Some people need several, and some need none.',
        ],
      },
      {
        question: "Will this tell me whether I have Alzheimer's?",
        answer: [
          "A diagnosis often depends on testing ordered afterward and reviewed with you at a follow-up visit. No single test can diagnose Alzheimer's or another dementia.",
        ],
      },
      {
        question: "Does Local Doctor treat Alzheimer's?",
        answer: [
          "Local Doctor focuses on evaluation, diagnosis, and treatment eligibility. If you may qualify for an Alzheimer's treatment such as ",
          { slug: 'leqembi', text: 'Leqembi' },
          ' or ',
          { slug: 'kisunla', text: 'Kisunla' },
          ', we walk through the specific risks with you honestly.',
        ],
      },
      familyFaq,
      visitCoverageFaq,
    ],
  },

  'neurologist-visit': {
    title: 'Visit with a neurologist doctor',
    eyebrow: 'Virtual visit',
    imageAlt: 'An older woman on a video call with a smiling doctor on her laptop',
    lede: 'See a board-certified neurologist by video from home, with no referral needed. Talk through memory or thinking changes and leave knowing what comes next.',
    highlights: [
      'Video visit with a board-certified neurologist',
      'No referral needed',
      'Insurance accepted, with coverage checked before you book',
    ],
    meta: {
      title: 'Video visit with a neurologist | Local Doctor',
      description:
        'See a board-certified neurologist by video visit from home. No referral needed. Insurance accepted, with coverage checked before you book.',
    },
    options: {
      ...visitOptions,
      description: 'A 1:1 video visit with a neurology clinician licensed in your state. Family members and caregivers are welcome to join.',
    },
    steps: {
      eyebrow: 'What to expect',
      title: 'What to expect from your visit',
      items: [
        {
          title: 'Book and get ready',
          copy: 'Pick a time. We call beforehand to review your medical history and verify your insurance and eligibility. Have your insurance information, medication list, recent test results, and questions handy.',
        },
        { title: 'Meet your neurologist', copy: 'Talk through what you have noticed, your history, and your medications.' },
        { title: 'Get your plan', copy: 'Leave with guidance, orders for any tests that make sense, or a plan to monitor.' },
        { title: 'Follow up', copy: 'Review any results together and agree on next steps.' },
      ],
    },
    band: visitBand,
    fit: {
      eyebrow: 'Who it is for',
      title: 'Is this visit right for you?',
      copy: 'Seeing a neurology specialist early can bring clarity, whether the cause turns out to be manageable or needs more evaluation.',
      items: [
        'You want a neurologist to look at memory or thinking changes.',
        'You would like a specialist opinion without waiting for a referral.',
        'You want to know whether tests such as an MRI or blood work make sense.',
        "You're helping a loved one and want to be part of the visit.",
        'You prefer to be seen from home.',
      ],
      note: nextStepNote,
    },
    careTeam: {
      title: "Talk to a neurologist about what you've noticed",
      copy: 'Meet a specialist who listens first, looks at the full picture, and explains what comes next.',
    },
    moreCare: ['Memory evaluation', 'Dementia evaluation', "Alzheimer's evaluation", "Alzheimer's blood test", 'Brain MRI'],
    faqs: [
      {
        question: 'Who will I see?',
        answer: [
          'A board-certified neurology specialist who is licensed in the state where you are located during the visit. Our specialists work interchangeably, and appointment matching depends on your location, availability, and other factors.',
        ],
      },
      { question: 'Do I need a referral?', answer: ['No. You can book directly.'] },
      {
        question: 'What should I have ready?',
        answer: ['Your insurance information, a list of your medications, any recent test results, and your questions.'],
      },
      familyFaq,
      visitCoverageFaq,
    ],
  },

  'alzheimers-blood-test': {
    title: "Alzheimer's blood test",
    eyebrow: 'Blood test',
    imageAlt: 'Two blood collection tubes with orange caps on a blue surface',
    lede: "The pTau217 blood test measures a protein linked to Alzheimer's changes in the brain. It is a standard blood draw, and a neurologist reviews your result with you by video.",
    highlights: [
      'A standard blood draw, with no spinal tap',
      'You can request it before a visit',
      'A board-certified neurologist reviews your result with you by video',
    ],
    meta: {
      title: "pTau217 Alzheimer's blood test: what it shows | Local Doctor",
      description:
        "Learn what the pTau217 blood test measures, what it can and cannot tell you, and how a neurologist reviews your result by video. Book to get started.",
      // /alzheimers-blood-test (a landing page) already owns this search.
      noindex: true,
    },
    options: {
      eyebrow: 'Test options',
      title: 'How the test works',
      copy: "A blood test alone does not diagnose Alzheimer's, so your result is reviewed with a neurologist.",
      name: 'pTau217 blood test',
      setting: 'Blood draw · local lab',
      description: 'A standard blood draw at a local lab. A board-certified neurologist reviews the result with you by video.',
      coverTitle: 'Insurance accepted',
      coverCopy: 'We verify coverage and confirm your cost before you book.',
      checks: ['Most insurance accepted', 'Specialist review of your result', 'No hidden fees', 'Reviewed by video'],
    },
    steps: {
      eyebrow: 'What to expect',
      title: 'How the blood test works',
      items: [
        { title: 'Request the test', copy: 'Book a time. You can request the test before a visit, and it does not require seeing the neurologist first.' },
        { title: 'Have your blood drawn', copy: 'A standard blood draw at a local lab. There is no spinal tap.' },
        { title: 'Get your result', copy: 'A board-certified neurologist reviews it with you by video.' },
        { title: 'Decide what comes next', copy: 'Your neurologist explains what the result means alongside your history, and whether further evaluation makes sense.' },
      ],
    },
    details: {
      eyebrow: 'At a glance',
      title: 'The pTau217 blood test, in brief',
      copy: 'What it measures, how it is done, and what it can and cannot tell you.',
      rows: [
        ['What it measures', "A protein linked to Alzheimer's changes in the brain"],
        ['Sample', 'A standard blood draw'],
        ['Who it is for', 'People with memory or thinking symptoms. These blood tests are not screening tests for people without symptoms.'],
        ['How it is used', "Read alongside your history, cognitive testing, and imaging. It does not diagnose Alzheimer's on its own."],
        ['Limits', 'Like any test, results can be falsely positive or falsely negative.'],
        ['Who reviews it', 'A board-certified neurologist, with you, by video'],
      ],
      disclaimer: testDisclaimer,
    },
    band: visitBand,
    fit: {
      eyebrow: 'Who it is for',
      title: 'Is the blood test right for you?',
      copy: 'It is most useful when you or a loved one already has memory or thinking symptoms.',
      items: [
        "You've noticed memory or thinking changes.",
        "You want to know whether Alzheimer's-related changes may be behind them.",
        'You prefer a simple blood draw to a spinal tap.',
        'You want a neurologist to explain the result in plain language.',
        "You're considering further evaluation or treatment and want more information first.",
      ],
      note: "A blood test alone does not diagnose Alzheimer's. Not sure? Book a visit and we'll help you find the right next step.",
    },
    careTeam: {
      title: 'Talk to a neurologist about your result',
      copy: 'Meet a specialist who explains what a result does and does not mean, and what comes next.',
    },
    moreCare: ["Alzheimer's evaluation", 'Brain MRI', "Alzheimer's genetic testing", 'Memory evaluation', 'Leqembi (lecanemab)'],
    faqs: [
      {
        question: 'What does the pTau217 blood test measure?',
        answer: ["A protein linked to Alzheimer's changes in the brain."],
      },
      {
        question: "Does it diagnose Alzheimer's?",
        answer: [
          "No. A blood test alone does not diagnose Alzheimer's, and no single test can. Doctors use these tests alongside medical history, cognitive testing, imaging, and other assessments.",
        ],
      },
      {
        question: 'Do I need to see the neurologist first?',
        answer: [
          'No. You can request the test before a visit, and it does not require seeing the neurologist first. A board-certified neurologist reviews the result with you by video.',
        ],
      },
      {
        question: 'Who is it for?',
        answer: ['People with memory or thinking symptoms. These blood tests are not screening tests for people without symptoms.'],
      },
      {
        question: 'What happens after my result?',
        answer: [
          'A board-certified neurologist reviews it with you by video, explains what it means, and tells you whether further evaluation, such as a ',
          { slug: 'brain-mri', text: 'brain MRI' },
          ', makes sense.',
        ],
      },
    ],
  },

  'alzheimers-genetic-testing': {
    title: "Alzheimer's genetic testing",
    eyebrow: 'Genetic test',
    imageAlt: 'Rows of laboratory sample tubes with colored caps in a rack',
    lede: "Genetic testing looks at your APOE gene, which is linked to Alzheimer's risk and, for some treatments, to safety. Your neurologist orders it when the result would help guide your plan.",
    highlights: [
      'A blood sample or cheek swab, depending on the lab',
      'Ordered only when the result would inform your plan',
      'Your neurologist explains what the result means for you',
    ],
    meta: {
      title: "Alzheimer's genetic testing (APOE) | Local Doctor",
      description:
        'Learn what APOE genetic testing can and cannot tell you, when it is used, and how a neurologist reviews the result with you by video. Book a visit to get started.',
    },
    options: {
      eyebrow: 'Test options',
      title: 'How the test works',
      copy: 'Your neurologist decides whether genetic testing would help, so it starts with a visit.',
      name: 'APOE genetic test',
      setting: 'Blood draw or cheek swab',
      description: 'The sample is collected by a healthcare provider, either as a blood draw or a cheek swab, depending on the lab. Your neurologist reviews the result with you.',
      coverTitle: 'Price after your visit',
      coverCopy: 'Cost depends on the lab and your coverage. We walk through it with you before you commit.',
      checks: ['Ordered by a specialist', 'Reviewed with you by video', 'Not a diagnosis on its own', 'No hidden fees'],
    },
    steps: {
      eyebrow: 'What to expect',
      title: 'How genetic testing works',
      items: [
        { title: 'Start with a visit', copy: 'Your neurologist reviews your history and decides whether genetic testing would inform your plan.' },
        { title: 'Give your sample', copy: 'A blood draw or a cheek swab, depending on the lab.' },
        { title: 'Review your result', copy: 'Your neurologist explains what the result means for you, by video.' },
        {
          title: 'Use it to guide your plan',
          copy: "The result can inform the safety discussion if you are considering an Alzheimer's treatment.",
        },
      ],
    },
    details: {
      eyebrow: 'At a glance',
      title: 'APOE genetic testing, in brief',
      copy: 'What it checks, when it is used, and what it cannot tell you.',
      rows: [
        ['What it checks', "Your APOE gene. Carrying the APOE e4 version raises risk, but it does not mean you will develop Alzheimer's."],
        ['Sample', 'A blood draw or a cheek swab, depending on the lab'],
        ['When it is used', 'Only when your neurologist thinks the result would inform your plan'],
        ['For treatment', "Helps show your risk of ARIA, a side effect of some Alzheimer's antibody treatments"],
        ['What it cannot do', "It cannot diagnose Alzheimer's or tell you whether you will develop it"],
        ['Who reviews it', 'Your neurologist, with you, by video'],
      ],
      disclaimer:
        "This is general information about this type of test, not a recommendation or a diagnosis. Routine genetic testing is not currently recommended for Alzheimer's, so your neurologist decides whether it fits your situation.",
    },
    band: visitBand,
    fit: {
      eyebrow: 'Who it is for',
      title: 'Is genetic testing right for you?',
      copy: 'It is not routine for everyone. It is most useful when the result could change a decision.',
      items: [
        "You're being evaluated for memory or thinking changes.",
        "You're considering an Alzheimer's antibody treatment and want to understand your risk of ARIA.",
        'You want to talk through what a result would and would not mean before deciding.',
        'You understand that a result shows risk and does not diagnose.',
        'You want a specialist to guide the decision.',
      ],
      note: "It is best decided after a conversation with a specialist. Not sure? Book a visit and we'll help you find the right next step.",
    },
    careTeam: {
      title: 'Talk to a neurologist about genetic testing',
      copy: 'Meet a specialist who explains what a result does and does not mean, and whether the test fits your situation.',
    },
    moreCare: ["Alzheimer's evaluation", "Alzheimer's blood test", 'Brain MRI', 'Leqembi (lecanemab)', 'Kisunla (donanemab)'],
    faqs: [
      {
        question: 'What is APOE?',
        answer: ["APOE is a gene with several versions. One version, APOE e4, is linked to a higher risk of Alzheimer's."],
      },
      {
        question: "Does it tell me whether I will get Alzheimer's?",
        answer: ["No. Carrying APOE e4 only indicates a greater risk. It does not mean you will develop Alzheimer's, and it does not mean you have it."],
      },
      {
        question: 'Why does it matter for treatment?',
        answer: [
          'Your APOE result helps show your risk of ARIA, which is temporary swelling or small bleeds in the brain that can happen with treatments such as ',
          { slug: 'leqembi', text: 'Leqembi' },
          ' and ',
          { slug: 'kisunla', text: 'Kisunla' },
          '. Your specialist reviews it as part of the safety screen.',
        ],
      },
      {
        question: 'Do I need to have it?',
        answer: [
          "Not usually. Health professionals do not currently recommend routine genetic testing for Alzheimer's. Your neurologist suggests it only when the result would inform your plan.",
        ],
      },
      {
        question: 'How is the sample collected?',
        answer: ['A healthcare provider collects it, either as a blood draw or a cheek swab, depending on the lab.'],
      },
    ],
  },

  'brain-mri': {
    title: 'Brain MRI',
    eyebrow: 'Imaging',
    imageAlt: 'Two clinicians holding up a sheet of brain MRI scans in front of a window',
    lede: 'A brain MRI takes detailed pictures of the brain without radiation. In a memory workup it is mainly used to rule out other causes, and your neurologist reviews it with you.',
    highlights: [
      'Detailed pictures of the brain, with no radiation',
      'Done at a local imaging center',
      'Reviewed with you by your neurologist',
    ],
    meta: {
      title: 'Brain MRI for memory and thinking changes | Local Doctor',
      description:
        'Learn what a brain MRI shows in a memory workup, what the appointment is like, and how a neurologist reviews it with you. Book a visit to get started.',
    },
    options: {
      eyebrow: 'Test options',
      title: 'How the scan works',
      copy: 'Your neurologist orders a brain MRI when it would help your evaluation, so it starts with a visit.',
      name: 'Brain MRI',
      setting: 'At a local imaging center',
      description: 'You lie still in the scanner while it takes pictures of your brain. Your neurologist reviews the images and explains them at your follow-up visit.',
      coverTitle: 'Price after your visit',
      coverCopy: 'Cost depends on the imaging center and your coverage. We walk through it with you before you commit.',
      checks: ['Ordered by a specialist', 'No radiation', 'Reviewed with you', 'No hidden fees'],
    },
    steps: {
      eyebrow: 'What to expect',
      title: 'How a brain MRI works',
      items: [
        { title: 'Start with a visit', copy: 'Your neurologist reviews your history and decides whether an MRI would help.' },
        { title: 'Complete your scan', copy: 'At a local imaging center. The center screens you for implants and other safety questions first.' },
        { title: 'Images are reviewed', copy: 'Your neurologist reviews the images alongside your history and other results.' },
        { title: 'Review the results together', copy: 'At a follow-up visit, your neurologist explains what the scan shows and what comes next.' },
      ],
    },
    details: {
      eyebrow: 'At a glance',
      title: 'A brain MRI, in brief',
      copy: 'What it shows, what the appointment is like, and what it cannot tell you.',
      rows: [
        ['Why it is done', "Mainly to rule out other conditions that can cause symptoms similar to Alzheimer's"],
        ['What it can show', 'Tumors, strokes, damage from a head injury, and fluid buildup'],
        ['Radiation', 'None. MRI uses a magnet and radio waves.'],
        ['The appointment', 'Often about 30 to 60 minutes with preparation. The scanner is loud, and you lie still in an enclosed space.'],
        ['Safety screening', 'The imaging center asks about pacemakers, defibrillators, metal clips, and other implants before your scan'],
        ['Who reviews it', 'Your neurologist, with you, at a follow-up visit'],
      ],
      disclaimer:
        "This is general information about this type of scan, not a recommendation or a diagnosis. Follow your imaging center's instructions for preparation and safety.",
    },
    band: visitBand,
    fit: {
      eyebrow: 'Who it is for',
      title: 'Is a brain MRI right for you?',
      copy: 'An MRI is one piece of a memory workup, and not everyone needs one.',
      items: [
        "You're being evaluated for memory or thinking changes.",
        'You want to rule out other causes of your symptoms.',
        "You're considering an Alzheimer's treatment, which uses imaging as part of its safety screen.",
        'You can lie still in an enclosed scanner, or can talk with the imaging center about options.',
        'You want a specialist to explain the images in plain language.',
      ],
      note: nextStepNote,
    },
    careTeam: {
      title: 'Talk to a neurologist about a brain MRI',
      copy: 'Meet a specialist who explains what a scan does and does not show, and whether it fits your situation.',
    },
    moreCare: ["Alzheimer's evaluation", "Alzheimer's blood test", "Alzheimer's genetic testing", 'Leqembi (lecanemab)', 'Kisunla (donanemab)'],
    faqs: [
      {
        question: 'What does a brain MRI show?',
        answer: [
          "In a memory workup it is mainly used to rule out other conditions that can cause symptoms similar to Alzheimer's, such as tumors, strokes, damage from a head injury, and fluid buildup.",
        ],
      },
      {
        question: "Can an MRI diagnose Alzheimer's or dementia?",
        answer: [
          "Not on its own. No single test can diagnose Alzheimer's or another dementia. Your neurologist reads the images alongside your history, cognitive testing, and other results.",
        ],
      },
      {
        question: 'What is the appointment like?',
        answer: [
          'You lie still on a table that slides into the scanner. It is loud, and the space is enclosed. Appointments often take about 30 to 60 minutes with preparation. Tell the imaging center if enclosed spaces worry you.',
        ],
      },
      {
        question: 'What if I have a pacemaker or an implant?',
        answer: [
          'Tell your neurologist and the imaging center. Some devices are not safe in an MRI, and others are, so the imaging center screens you first. An MRI limitation, or taking blood thinners, may also affect your eligibility for infusion treatment.',
        ],
      },
      {
        question: 'Who explains the results?',
        answer: ['Your neurologist reviews the images and explains them with you at a follow-up visit.'],
      },
    ],
  },
}
