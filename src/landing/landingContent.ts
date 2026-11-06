import type { LandingFunnel } from './destinations'
import type { LandingSlug } from './landingMeta'

/*
  Copy for the intent landing pages. Every claim here has to be backed by
  existing site copy or the compliance pages: no credentials, wait times,
  prices, outcome rates, or promises of diagnosis, eligibility, or medication.
  Keep screening, evaluation, and diagnosis as separate ideas.
*/

export type LandingCard = { title: string; copy: string; label?: string }
export type LandingStep = { title: string; copy: string }
export type LandingColumn = { title: string; items: string[]; ctaLocation?: string; ctaContext?: string }
export type LandingFaq = [question: string, answer: string]

export type LandingSection =
  | { kind: 'cards'; id?: string; eyebrow: string; title: string; intro?: string; items: LandingCard[]; columns?: 2 | 3 | 4 }
  | { kind: 'steps'; id?: string; eyebrow: string; title: string; intro?: string; steps: LandingStep[] }
  | { kind: 'checklist'; id?: string; eyebrow: string; title: string; intro?: string; items: string[]; note?: string }
  | { kind: 'split'; id?: string; eyebrow: string; title: string; intro?: string; columns: [LandingColumn, LandingColumn] }
  | { kind: 'callout'; id?: string; tone: 'note' | 'urgent'; title: string; copy: string }
  | { kind: 'providers'; id?: string; eyebrow: string; title: string; copy: string }
  | { kind: 'midCta'; title: string; copy: string }

export type LandingPageContent = {
  slug: LandingSlug
  funnel: LandingFunnel
  eyebrow: string
  h1: string
  lede: string
  ctaLabel: string
  reassurance: string
  ctaContext: string
  heroSecondary?: { label: string; href: `#${string}` }
  facts: { title: string; items: string[] }
  sections: LandingSection[]
  faqTitle: string
  faqs: LandingFaq[]
  closing: { title: string; copy: string }
  related: LandingSlug[]
}

export const relatedLabels: Record<LandingSlug, { title: string; copy: string }> = {
  'dementia-evaluation': { title: 'Dementia evaluation', copy: 'A virtual specialist visit to review concerns and next-step testing.' },
  'alzheimers-evaluation': { title: "Alzheimer's evaluation", copy: 'What an early Alzheimer\'s workup can include, and how it starts.' },
  'memory-evaluation': { title: 'Memory evaluation from home', copy: 'Paths for the person noticing changes and for worried family.' },
  'alzheimers-doctor-maryland': { title: 'Doctors serving Maryland', copy: 'Who you meet, how licensing works, and what stays local.' },
  'memory-specialist-maryland': { title: 'Memory specialist near you', copy: 'What happens by video and what happens at sites near you.' },
  'alzheimers-second-opinion': { title: 'Second opinion', copy: 'A records-based review of an existing diagnosis or workup.' },
  'dementia-test-online': { title: 'Online dementia tests', copy: 'Screening, evaluation, and diagnosis, explained plainly.' },
  'memory-doctor-near-me': {
    title: 'Memory doctor near you',
    copy: 'A Maryland doctor can see you by video from home, so the visit does not require a drive.',
  },
}

const heroReassurance =
  'Next-day virtual visits with a board-certified neurologist. Insurance accepted. No referral needed.'

// Kenny-confirmed trust points for the hero facts panel on every intent page.
const trustFacts = [
  'Next-day virtual visits',
  'Board-certified neurologist',
  'Insurance accepted',
  'No referral needed',
]

const emergencyCallout: LandingSection = {
  kind: 'callout',
  tone: 'urgent',
  title: 'Sudden changes are an emergency.',
  copy: 'Sudden confusion, trouble speaking, facial drooping, or weakness on one side can be signs of a stroke or another emergency. Call 911. Do not wait for a form, a callback, or a virtual visit.',
}

const prepareChecklist = [
  'Insurance information',
  'A current medication list',
  'Recent test results or visit notes, if you have them',
  'The questions you and your family want to ask',
]

export const landingPages: Record<LandingSlug, LandingPageContent> = {
  'dementia-evaluation': {
    slug: 'dementia-evaluation',
    funnel: 'evaluation',
    ctaLabel: 'Book Your Evaluation',
    reassurance: heroReassurance,
    eyebrow: 'Dementia evaluation by telehealth',
    h1: 'A dementia evaluation with a specialist, by video, from home.',
    lede: 'If you or someone close to you is having changes in memory, thinking, or daily function, the next step is a clinician who looks at the whole picture. Local Doctor offers virtual visits with a neurology specialist for people in Maryland, who reviews your concerns and history and recommends what testing, if any, should come next.',
    ctaContext: 'This opens a short request form. Our team then calls to review eligibility and insurance before any visit is booked.',
    facts: {
      title: 'How this evaluation works',
      items: [...trustFacts],
    },
    sections: [
      {
        kind: 'cards',
        eyebrow: 'What the evaluation looks at',
        title: 'More than a memory score.',
        intro: 'A dementia evaluation is a clinician working through the full story with you. The specialist uses what you share to decide what, if anything, should be tested next.',
        columns: 4,
        items: [
          { title: 'Your concerns and timeline', copy: 'What changed, when it started, how it has progressed, and what family members have noticed at home.' },
          { title: 'Health history and medications', copy: 'Other conditions, past tests, and the medications you take, since several things besides dementia can affect thinking.' },
          { title: 'Daily life', copy: 'How the changes show up in everyday activities, from conversations and appointments to bills and household tasks.' },
          { title: 'What to test next', copy: 'Whether labs, imaging, or other tests are worth ordering. If they are, you complete them at local sites.' },
        ],
      },
      {
        kind: 'steps',
        eyebrow: 'How it works',
        title: 'From a short form to a clear next step.',
        steps: [
          { title: 'Send a request', copy: 'Fill out the short form, or call us. Either way, a team member follows up with you by phone.' },
          { title: 'Eligibility call', copy: 'We go over current concerns, daily activities, medical history, medications, and insurance, and confirm whether a specialist visit fits your needs.' },
          { title: 'Video visit with a specialist', copy: 'Plan for about an hour. You and a loved one share concerns and history, and the specialist explains their clinical summary and recommended plan.' },
          { title: 'Local testing, only if ordered', copy: 'If the plan includes new tests, you schedule them with a local lab (Quest or LabCorp) or imaging center.' },
          { title: 'Follow-up visit', copy: 'The specialist reviews results with you and your family and talks through the options that fit your situation.' },
        ],
      },
      {
        kind: 'callout',
        tone: 'note',
        title: 'An evaluation is not a guaranteed diagnosis or treatment plan.',
        copy: 'Some evaluations end with a clear answer. Others point to more testing, a different kind of care, or a referral elsewhere. If Local Doctor is not the right fit, the team will tell you why and suggest resources that may still help.',
      },
      {
        kind: 'checklist',
        eyebrow: 'Before the eligibility call',
        title: 'What to have handy.',
        items: prepareChecklist,
        note: 'Missing something? That is fine. Start the request and the team will follow up on anything else the specialist needs.',
      },
      { kind: 'midCta', title: 'Request a dementia evaluation.', copy: 'Nothing is booked until you have talked with our team and confirmed the visit.' },
    ],
    faqTitle: 'Dementia evaluation questions.',
    faqs: [
      ['Is this a dementia test?', 'No. A test or screening is one tool. An evaluation is a clinician reviewing your symptoms, history, medications, and any prior results, then recommending what to do next. The request form behind Get Started is not a test and does not score memory.'],
      ['Do I need to live in Maryland?', 'You need to be located in Maryland during the visit, because the clinician must be licensed in the state where the patient is. Virtual visits are not available in other states at this time.'],
      ['Is there an office I go to?', 'No. Local Doctor is a virtual practice and visits happen by video. If labs or imaging are ordered, those are done in person at a local lab or imaging center.'],
      ['Do I need a referral from my doctor?', 'No referral is needed. Start with the short form or call our team, and we review eligibility and insurance with you before a visit is booked.'],
      ['Will I get a prescription?', 'Not from this website. If a medication is ever appropriate, that decision is made by the evaluating clinician after the evaluation and follows the law of the state where you are located.'],
      ['Who do I contact in a medical emergency?', 'Call 911 immediately. Local Doctor provides specialist evaluation and does not replace emergency care.'],
    ],
    closing: { title: 'Ready to request a dementia evaluation?', copy: 'Start with the short form or call our team. We review eligibility and insurance with you first.' },
    related: ['alzheimers-evaluation', 'memory-evaluation', 'alzheimers-second-opinion'],
  },

  'alzheimers-evaluation': {
    slug: 'alzheimers-evaluation',
    funnel: 'evaluation',
    ctaLabel: 'Book Your Evaluation',
    reassurance: heroReassurance,
    eyebrow: "Alzheimer's evaluation online",
    h1: "An Alzheimer's evaluation that starts with a virtual specialist visit.",
    lede: "Worried that memory changes could be early Alzheimer's disease? A neurology specialist can review what you are noticing, your history, and any past results by video, then explain which tests would help answer the question. Visits are for people located in Maryland.",
    ctaContext: "This takes you to our intake form. It is a request for a specialist review, not an Alzheimer's test.",
    facts: {
      title: 'What to expect',
      items: [...trustFacts],
    },
    sections: [
      {
        kind: 'cards',
        eyebrow: "What an Alzheimer's workup can include",
        title: 'Your specialist decides which tests make sense.',
        intro: 'Every workup is different. Some people need several of these, and some need none. The point is to order what will actually help answer your question.',
        columns: 2,
        items: [
          { title: 'History and cognitive assessment', copy: 'A detailed conversation during the video visit about symptoms, timeline, daily function, and family history.' },
          { title: 'Blood work', copy: 'Labs at a local Quest or LabCorp location, when your specialist orders them.' },
          { title: 'Brain imaging', copy: 'An MRI or other imaging at a local imaging center, and a review of any prior imaging you already have.' },
          { title: 'Biomarker or genetic testing', copy: 'Tests such as amyloid biomarkers or APOE, discussed only when the clinician thinks the result would inform the plan.' },
        ],
      },
      {
        kind: 'callout',
        tone: 'note',
        title: 'Treatment questions come after the workup, not before.',
        copy: "Newer FDA-approved therapies for early Alzheimer's are not right for everyone and carry real risks. Whether any treatment is appropriate is a clinical decision made with your specialist after evaluation and testing. This page does not promise eligibility for any medication.",
      },
      {
        kind: 'steps',
        eyebrow: 'How it works',
        title: "The path through an Alzheimer's evaluation.",
        steps: [
          { title: 'Request a review', copy: 'Send the short form or call us, and a team member follows up by phone.' },
          { title: 'Eligibility call', copy: 'We confirm insurance and whether your needs fit a visit with our neurology team.' },
          { title: 'Specialist video visit', copy: 'About an hour. The specialist shares a clinical summary and a plan, which may include orders for labs, genetic testing, or imaging.' },
          { title: 'Results and options', copy: 'After local testing, a follow-up visit covers what the results show and the paths that fit you, including referrals to other care.' },
        ],
      },
      {
        kind: 'checklist',
        eyebrow: 'Records that help',
        title: 'If you have past results, gather them.',
        items: [
          'Earlier memory or cognitive test results',
          'Brain MRI, CT, or PET reports',
          'Recent bloodwork',
          'Notes from a neurologist or primary care visit',
          'A current medication list',
        ],
        note: 'You do not need all of these to start. Bring what you have to the eligibility call.',
      },
      { kind: 'midCta', title: "Start an Alzheimer's evaluation request.", copy: 'A team member will call to review eligibility and insurance before scheduling.' },
    ],
    faqTitle: "Alzheimer's evaluation questions.",
    faqs: [
      ["Can a video visit tell me whether I have Alzheimer's?", 'The video visit is where the evaluation starts. A diagnosis often depends on testing ordered afterward and reviewed with you at a follow-up visit. Nothing on this website or in the request form makes a diagnosis.'],
      ["What if I already have a diagnosis of mild cognitive impairment or Alzheimer's?", 'Tell us during the eligibility call. Prior diagnoses and records help the specialist focus the visit. If you mainly want a fresh look at an existing diagnosis, our second opinion page explains that path.'],
      ["Does Local Doctor treat Alzheimer's?", 'Local Doctor focuses on evaluation, diagnosis, and treatment eligibility. If a treatment is appropriate and you choose to proceed, the team coordinates it with a local site. If other care fits better, the team helps with referrals.'],
      ['How much will this cost?', 'Coverage depends on your plan. The team reviews your insurance during the eligibility call, before anything is booked. Costs for labs and imaging depend on the sites you use and your coverage.'],
      ['Can a family member join?', 'Yes. We prefer that a loved one joins the first visit with the patient when possible.'],
    ],
    closing: { title: "Questions about Alzheimer's? Start with a specialist.", copy: 'Request a virtual evaluation, or call our team to talk it through first.' },
    related: ['dementia-evaluation', 'alzheimers-second-opinion', 'alzheimers-doctor-maryland'],
  },

  'memory-evaluation': {
    slug: 'memory-evaluation',
    funnel: 'evaluation',
    ctaLabel: 'Book Your Evaluation',
    reassurance: heroReassurance,
    eyebrow: 'Memory evaluation from home',
    h1: 'A memory evaluation from home, for you or someone you love.',
    lede: 'Concerned about memory changes in yourself or a family member? Start with a virtual evaluation by a neurology specialist. You stay home for the visit, a loved one can join, and any testing is arranged at local sites only if it is needed.',
    ctaContext: 'This opens a short request form you can fill out for yourself or on behalf of a loved one. It is not a memory test.',
    facts: {
      title: 'Built for families',
      items: [...trustFacts],
    },
    sections: [
      {
        kind: 'split',
        eyebrow: 'Two ways in',
        title: 'Start from wherever you are.',
        columns: [
          {
            title: 'If you are the one noticing changes',
            items: [
              'Start the request yourself, whenever you are ready',
              'Tell us what you have noticed and roughly when it started',
              'Bring a family member or friend to the video visit if you can',
            ],
            ctaLocation: 'patient_path',
            ctaContext: 'Request an evaluation for yourself.',
          },
          {
            title: 'If you are worried about a loved one',
            items: [
              'You can start the request and talk with our team on their behalf',
              'The person being evaluated attends the video visit with you',
              'What you see at home helps the specialist understand the full picture',
            ],
            ctaLocation: 'caregiver_path',
            ctaContext: 'Request an evaluation for a family member.',
          },
        ],
      },
      {
        kind: 'cards',
        eyebrow: 'Common reasons people ask',
        title: 'You do not need to be certain something is wrong.',
        intro: 'These are examples, not a checklist. A change that worries you or your family is reason enough to ask a specialist.',
        columns: 4,
        items: [
          { title: 'Repeating or forgetting', copy: 'Asking the same questions, or losing track of recent conversations and plans.' },
          { title: 'Familiar tasks feel harder', copy: 'Trouble with bills, recipes, appointments, or routines that used to be easy.' },
          { title: 'Getting turned around', copy: 'Confusion about time or place, or getting lost somewhere familiar.' },
          { title: 'Changes others notice', copy: 'Shifts in mood, judgment, or personality that family or friends point out.' },
        ],
      },
      {
        kind: 'callout',
        tone: 'note',
        title: 'Memory changes have many possible causes.',
        copy: 'Sleep, mood, stress, medications, hearing, and other medical conditions can all affect memory. Part of an evaluation is looking at causes like these, not only dementia. A screening score or a form alone cannot sort that out.',
      },
      {
        kind: 'steps',
        eyebrow: 'How it works',
        title: 'What happens after you reach out.',
        steps: [
          { title: 'A short request or a call', copy: 'You tell us how to reach you, and a team member follows up by phone.' },
          { title: 'Eligibility call', copy: 'We talk through memory concerns, daily activities, history, medications, and insurance.' },
          { title: 'Video visit', copy: 'About an hour with a neurology specialist, with a loved one if possible. You leave with a summary and a plan.' },
          { title: 'Next steps', copy: 'Local testing if ordered, then a follow-up visit to go over results and options together.' },
        ],
      },
      {
        kind: 'checklist',
        eyebrow: 'What we do and do not do',
        title: 'Local Doctor is a medical evaluation service.',
        items: [
          'We do: specialist evaluation, testing recommendations, and a clear plan for next steps',
          'We do not: memory-care placement, residential care, or day programs',
          'We do not: ongoing daily caregiving or medication management, though we can suggest partner services when appropriate',
          'We do not: emergency care. Call 911 for sudden changes',
        ],
      },
    ],
    faqTitle: 'Memory evaluation questions.',
    faqs: [
      ['Do I need a diagnosis before asking for an evaluation?', 'No. Many people reach out with concerns and no diagnosis. If there is already a diagnosis, share it during the eligibility call.'],
      ['How long is the video visit?', 'Plan for about an hour. Use a device with video and audio, in a place with a strong Wi-Fi or data connection.'],
      ['Can I call on behalf of my spouse or parent?', 'Yes. We welcome family members who want to be part of the process, and we prefer that one joins the first visit with the patient.'],
      ['Is the Get Started form a memory test?', 'No. It is a request for our team to contact you about an evaluation. It does not test or score memory.'],
      ['Can you help with memory care placement or daily caregiving?', 'That is not what Local Doctor does. Our focus is evaluation and treatment eligibility. If caregiving support is what you need, the team can suggest partner services where appropriate.'],
    ],
    closing: { title: 'Take the first step toward answers about memory.', copy: 'Start a request for yourself or someone you love, or call our team.' },
    related: ['dementia-evaluation', 'memory-specialist-maryland', 'dementia-test-online'],
  },

  'alzheimers-doctor-maryland': {
    slug: 'alzheimers-doctor-maryland',
    funnel: 'evaluation',
    ctaLabel: "See an Alzheimer's Doctor",
    reassurance: heroReassurance,
    eyebrow: 'Serving Maryland by telehealth',
    h1: "Alzheimer's and dementia doctors serving Maryland, by video.",
    lede: "Local Doctor connects people in Maryland with a neurology clinician for virtual visits about memory, dementia, and Alzheimer's concerns. There is no office to drive to. You meet by video, and labs or imaging, if they are ordered, happen at local sites near you.",
    ctaContext: 'This opens a short request form. A team member calls to confirm eligibility and insurance before a visit is scheduled.',
    heroSecondary: { label: 'How virtual visits work', href: '#how-virtual-visits-work' },
    facts: {
      title: 'Serving Maryland, virtually',
      items: [...trustFacts],
    },
    sections: [
      {
        kind: 'cards',
        id: 'how-virtual-visits-work',
        eyebrow: 'How virtual visits work',
        title: 'What "serving Maryland" means here.',
        columns: 4,
        items: [
          { title: 'Virtual, not a local office', copy: 'Local Doctor does not run walk-in clinics in Maryland cities. Specialist visits happen by live video.' },
          { title: 'Licensed where you are', copy: 'The clinician must be licensed in the state where you are during the visit, so you need to be in Maryland for it.' },
          { title: 'Testing close to home', copy: 'If labs or imaging are ordered, you schedule them at a local lab such as Quest or LabCorp, or a local imaging center.' },
          { title: 'Alongside your doctors', copy: 'Our specialists do not replace your primary care doctor or other providers, and work with them as needed.' },
        ],
      },
      {
        kind: 'providers',
        eyebrow: 'Who you will meet',
        title: 'A board-certified neurologist licensed in Maryland.',
        copy: 'The clinicians who may see patients are listed by name, specialty, and state license on our Contact page, together with the company that operates Local Doctor.',
      },
      {
        kind: 'split',
        eyebrow: 'Is this the right fit?',
        title: 'Who this pathway is built for.',
        columns: [
          {
            title: 'Often a good fit',
            items: [
              'Memory or thinking changes that need a specialist look',
              "A diagnosis of mild cognitive impairment, dementia, or Alzheimer's you want reviewed",
              'Questions about whether further testing or treatment options apply',
            ],
          },
          {
            title: 'Other care may fit better',
            items: [
              'Sudden or emergency symptoms: call 911',
              'Day-to-day caregiving or medication management as the main need',
              'Moderate or severe dementia as the primary concern',
            ],
          },
        ],
      },
      {
        kind: 'steps',
        eyebrow: 'Getting started',
        title: 'Four steps, mostly from home.',
        steps: [
          { title: 'Request or call', copy: 'Send the short form or call us. A team member follows up by phone.' },
          { title: 'Eligibility call', copy: 'We verify insurance and whether your needs qualify for a visit with our neurology team.' },
          { title: 'Video visit', copy: 'About an hour with the specialist. A loved one is welcome to join.' },
          { title: 'Local testing and follow-up', copy: 'Any ordered tests happen at local sites, then a follow-up visit covers results and options.' },
        ],
      },
    ],
    faqTitle: 'Questions about seeing a doctor through Local Doctor.',
    faqs: [
      ['Is Local Doctor a clinic I can visit in person?', 'No. Local Doctor is a virtual practice. Visits are by video. Only labs, imaging, and any treatment that is appropriate happen in person, at local sites.'],
      ['Which parts of Maryland do you serve?', 'Virtual visits are available when the patient is located in Maryland at the time of the visit. Lab and imaging appointments, if needed, are scheduled at sites near you.'],
      ['How soon can I be seen?', 'Timing depends on eligibility, insurance, and scheduling on both sides. The team will go over real appointment options with you during the eligibility call.'],
      ['Do you take my insurance?', 'The team verifies your insurance during the eligibility call and walks through your coverage before you commit to anything.'],
      ['Will this replace my neurologist or primary care doctor?', 'No. Think of our team as an extension of your current doctors. Your existing provider relationships stay in place.'],
    ],
    closing: { title: 'Talk with a specialist serving Maryland.', copy: 'Start a request online or call our team. We confirm eligibility and insurance with you first.' },
    related: ['memory-specialist-maryland', 'memory-doctor-near-me', 'alzheimers-evaluation', 'alzheimers-second-opinion'],
  },

  'memory-specialist-maryland': {
    slug: 'memory-specialist-maryland',
    funnel: 'evaluation',
    ctaLabel: 'Talk to a Memory Specialist',
    reassurance: heroReassurance,
    eyebrow: 'Memory specialist in Maryland',
    h1: 'A memory specialist near you in Maryland, without the drive.',
    lede: 'Searching for a memory specialist near you? Local Doctor offers virtual appointments with a neurology specialist for memory and dementia concerns, wherever you are in Maryland. The visit comes to you by video. Only testing, if it is ordered, happens in person at labs and imaging centers near you.',
    ctaContext: 'This opens a short request form so our team can call you. You can also call us directly.',
    facts: {
      title: 'Near you, honestly',
      items: [...trustFacts],
    },
    sections: [
      {
        kind: 'split',
        eyebrow: 'Online and nearby',
        title: 'What happens by video, and what happens near you.',
        columns: [
          {
            title: 'By phone or video',
            items: [
              'The eligibility call with our team',
              'Your visit with the neurology specialist, about an hour',
              'Your follow-up visit to review results and options',
            ],
          },
          {
            title: 'In person, near you',
            items: [
              'Blood work at a local Quest or LabCorp location, if ordered',
              'MRI or other imaging at a local imaging center, if ordered',
              'Treatment at a local site, only if it is appropriate and you choose it',
            ],
          },
        ],
      },
      {
        kind: 'cards',
        eyebrow: 'Getting ready for a video visit',
        title: 'A few things make the visit go smoothly.',
        columns: 4,
        items: [
          { title: 'A device with video and audio', copy: 'A phone, tablet, or computer with a working camera and microphone.' },
          { title: 'A strong connection', copy: 'Reliable Wi-Fi or data service so the video stays clear.' },
          { title: 'A private, quiet room', copy: 'Somewhere you can talk openly without being overheard.' },
          { title: 'Someone you trust', copy: 'A family member or care partner, if you would like one to join.' },
        ],
      },
      {
        kind: 'callout',
        tone: 'note',
        title: 'Looking for memory care housing or a day program?',
        copy: 'Local Doctor is a medical evaluation service, not a memory-care community, assisted living facility, or adult day program. If day-to-day care is what your family needs, the team can suggest other resources when appropriate.',
      },
      {
        kind: 'steps',
        eyebrow: 'How to start',
        title: 'Booking a virtual memory visit.',
        steps: [
          { title: 'Send a request or call', copy: 'A team member follows up by phone.' },
          { title: 'Eligibility call', copy: 'We review concerns, history, medications, and insurance, and confirm whether a visit fits.' },
          { title: 'Schedule your video visit', copy: 'You pick a day and time, then get a confirmation and reminders with the link to join.' },
        ],
      },
      { kind: 'midCta', title: 'Book a virtual visit with a memory specialist.', copy: 'Start with the request form. Our team will call to set up the visit if it is a fit.' },
    ],
    faqTitle: 'Memory specialist questions.',
    faqs: [
      ['Is there a Local Doctor office near me?', 'No. Local Doctor is a virtual practice. Your specialist visit happens by video from home, and only ordered tests take place in person at sites near you.'],
      ['What kind of specialist will I see?', 'A board-certified neurologist licensed in Maryland. The clinicians who may see patients are listed on our Contact page.'],
      ['Do I have to travel for tests?', 'Only if tests are ordered. Labs and imaging are scheduled at local sites, such as a Quest or LabCorp location or an imaging center near you.'],
      ['Can I call instead of filling out the form?', 'Yes. Call or text our team at the number on this page and we will take it from there.'],
      ['Do you accept insurance?', 'The team verifies your insurance during the eligibility call, before anything is booked, so you know where you stand.'],
    ],
    closing: { title: 'See a memory specialist without leaving home.', copy: 'Request a virtual visit, or call our team with questions first.' },
    related: ['memory-doctor-near-me', 'alzheimers-doctor-maryland', 'memory-evaluation', 'dementia-evaluation'],
  },

  'alzheimers-second-opinion': {
    slug: 'alzheimers-second-opinion',
    funnel: 'evaluation',
    ctaLabel: 'Request a Second Opinion',
    reassurance: heroReassurance,
    eyebrow: 'Second opinion',
    h1: "A second opinion on an Alzheimer's or dementia diagnosis.",
    lede: 'Already have a diagnosis, or a workup that left you with more questions than answers? A neurology specialist can review your records and history by video, explain what the findings show, and recommend next steps. Visits are for people located in Maryland.',
    ctaContext: 'This opens a short request form. On the eligibility call, the team will ask which records you have.',
    heroSecondary: { label: 'See the records checklist', href: '#records' },
    facts: {
      title: 'A focused review',
      items: [...trustFacts],
    },
    sections: [
      {
        kind: 'cards',
        eyebrow: 'Why people ask',
        title: 'Common reasons for a second opinion.',
        intro: 'Wanting another look is reasonable. It is not a judgment on the clinicians you have already seen.',
        columns: 4,
        items: [
          { title: 'Little explanation', copy: 'The diagnosis came without much detail on what it means or what to do next.' },
          { title: 'Unclear or partial testing', copy: 'Some tests were not done, or the results did not seem to settle the question.' },
          { title: 'Symptoms have changed', copy: 'Things have shifted since the first evaluation and you want a fresh look.' },
          { title: 'Questions about options', copy: 'You want to know whether newer testing or treatment options apply to you.' },
        ],
      },
      {
        kind: 'checklist',
        id: 'records',
        eyebrow: 'Records checklist',
        title: 'What to gather before the eligibility call.',
        intro: 'You do not need everything on this list. Bring what you have; the intake team follows up on anything the specialist still needs.',
        items: [
          'The diagnosis, who made it, and visit notes if you have them',
          'Memory or cognitive test results',
          'Brain MRI, CT, or PET reports',
          'Recent bloodwork',
          'Any biomarker or genetic test results',
          'A current medication list and insurance information',
        ],
        note: 'Please do not email records or health details. The team will explain how to share them after you get in touch.',
      },
      {
        kind: 'steps',
        eyebrow: 'How it works',
        title: 'How a second opinion review runs.',
        steps: [
          { title: 'Request a second opinion', copy: 'Send the short form or call us. A team member follows up by phone.' },
          { title: 'Eligibility call', copy: 'We review the diagnosis so far, the records you have, medications, and insurance.' },
          { title: 'Specialist review visit', copy: 'About an hour by video. The specialist goes through your history and records with you and a loved one.' },
          { title: 'Added testing, only if useful', copy: 'If the specialist recommends new labs or imaging, you complete them locally, then review results at a follow-up.' },
        ],
      },
      {
        kind: 'callout',
        tone: 'note',
        title: 'A second opinion does not promise a different answer.',
        copy: 'The goal is an accurate, well-explained answer. The review may confirm an earlier diagnosis, refine it, or recommend more testing. Our specialists work alongside your existing doctors as needed.',
      },
    ],
    faqTitle: 'Second opinion questions.',
    faqs: [
      ['Will a second opinion change my diagnosis?', 'It might confirm it, refine it, or recommend more testing first. We cannot promise a different result, and the aim is an accurate one.'],
      ['Do I need all my records before I start?', 'No. Start the request and bring what you have to the eligibility call. The team follows up on anything missing.'],
      ['Do I have to stop seeing my current neurologist?', 'No. Our specialists do not replace your existing providers and will work with them as needed.'],
      ['Can a family member set this up?', 'Yes. A spouse, adult child, or other loved one can start the request and join the visits with the patient.'],
      ['Do I need a referral?', 'No referral is needed. Start with the short form or call our team, and we review eligibility and insurance with you before a visit is booked.'],
    ],
    closing: { title: 'Request a second opinion review.', copy: 'Start with the short form or call our team. Have your records nearby for the eligibility call.' },
    related: ['alzheimers-evaluation', 'alzheimers-doctor-maryland', 'dementia-evaluation'],
  },

  'dementia-test-online': {
    slug: 'dementia-test-online',
    funnel: 'onlineScreening',
    ctaLabel: 'Talk to a Memory Doctor',
    reassurance: heroReassurance,
    eyebrow: 'Online dementia tests',
    h1: 'Online dementia tests: what they can tell you, and what comes next.',
    lede: 'Local Doctor does not offer an online dementia test or screening quiz, and no website can diagnose dementia. This page explains how screening, evaluation, and diagnosis differ, and how to request a virtual evaluation with a clinician if you are in Maryland.',
    ctaContext: 'This opens our intake form to request a clinician evaluation. It is not a test, it does not score memory, and it does not give a result.',
    heroSecondary: { label: 'Screening vs. evaluation vs. diagnosis', href: '#three-steps' },
    facts: {
      title: 'There is no quiz on this page',
      items: [...trustFacts, 'Local Doctor does not currently offer an online screening tool'],
    },
    sections: [
      {
        kind: 'cards',
        id: 'three-steps',
        eyebrow: 'Three different things',
        title: 'Screening, evaluation, and diagnosis are not the same.',
        intro: 'Search results often use "dementia test" for all three. Knowing the difference helps you decide what you actually need.',
        columns: 3,
        items: [
          { label: 'Screening', title: 'Flags a possible concern', copy: 'Short questions or brief tasks. A screen can suggest that a closer look is worthwhile, but it cannot tell you whether you have dementia. Sleep, stress, mood, hearing, vision, and language can all affect the result.' },
          { label: 'Evaluation', title: 'A clinician looks closely', copy: 'A clinician reviews symptoms, history, medications, daily function, and past results, and decides whether tests such as bloodwork or imaging are needed. This is what Local Doctor offers, by video.' },
          { label: 'Diagnosis', title: "A clinician's conclusion", copy: 'Reached by a clinician after an appropriate evaluation and any testing it calls for. A diagnosis does not come from a website, a quiz score, or an intake form.' },
        ],
      },
      {
        kind: 'split',
        eyebrow: 'Online quizzes',
        title: 'What an online quiz can and cannot do.',
        columns: [
          {
            title: 'It can',
            items: [
              'Help you put your concerns into words',
              'Prompt a conversation with family or a doctor',
            ],
          },
          {
            title: 'It cannot',
            items: [
              "Tell you whether you have dementia or Alzheimer's",
              'Rule out a problem because the score looks normal',
              'Find other causes of memory change, like medications, sleep, or mood',
              'Replace an evaluation by a clinician',
            ],
          },
        ],
      },
      {
        kind: 'cards',
        eyebrow: 'Worth raising with a clinician',
        title: 'Examples people often bring to an evaluation.',
        intro: 'This is not a self-test. If changes like these worry you or your family, a clinician is the right person to talk to.',
        columns: 4,
        items: [
          { title: 'Memory that disrupts daily life', copy: 'Forgetting recent events, appointments, or conversations more than before.' },
          { title: 'Words and conversations', copy: 'Trouble finding words or following along in a conversation.' },
          { title: 'Misplacing things', copy: 'Putting items in unusual places and being unable to retrace steps.' },
          { title: 'What others notice', copy: 'Changes that family, friends, or coworkers have pointed out.' },
        ],
      },
      emergencyCallout,
      {
        kind: 'steps',
        eyebrow: "If you want a clinician's view",
        title: 'How to request an evaluation instead.',
        steps: [
          { title: 'Send a request', copy: 'The intake form asks how to reach you. It is not a test and does not produce a score.' },
          { title: 'Eligibility call', copy: 'A team member calls to talk through your concerns, history, medications, and insurance.' },
          { title: 'Video evaluation', copy: 'About an hour with a neurology specialist, with a loved one if you like.' },
          { title: 'Testing only if ordered', copy: 'Any labs or imaging happen locally, followed by a visit to review results.' },
        ],
      },
    ],
    faqTitle: 'Online dementia test questions.',
    faqs: [
      ['Can I take a dementia screening on this site?', 'No. Local Doctor does not currently offer an online screening tool. The Get Started form is a request for a clinician evaluation.'],
      ['Is the Get Started form a dementia test?', 'No. It is a request for our team to contact you about an evaluation. It does not score memory, and it does not give a result or a diagnosis.'],
      ['Should I take a free online test first?', 'You do not need one to request an evaluation. If you have already taken one, you can mention it during the eligibility call. Whatever the score, a clinician is the right person to interpret it.'],
      ['Does an evaluation mean I will be diagnosed with dementia?', 'No. An evaluation may point to a different cause, recommend more testing, or find that no further workup is needed.'],
      ['What if I am not in Maryland?', 'Virtual visits are available only when the patient is located in Maryland during the visit.'],
    ],
    closing: { title: 'Want a clinician to look at your concerns?', copy: 'Request a virtual evaluation. Our team calls to review eligibility and insurance first. No test, score, or diagnosis happens on this website.' },
    related: ['memory-evaluation', 'dementia-evaluation', 'alzheimers-evaluation'],
  },

  'memory-doctor-near-me': {
    slug: 'memory-doctor-near-me',
    funnel: 'evaluation',
    ctaLabel: 'See a Memory Doctor',
    reassurance: heroReassurance,
    eyebrow: 'Near you, without the drive',
    h1: 'A memory doctor near you, by video from home.',
    lede: 'Searching for a memory doctor, dementia doctor, Alzheimer\'s doctor, or neurologist for memory near you? A clinician licensed in Maryland can see you by video from home, so the visit does not require a drive.',
    ctaContext: 'This opens a short request form. A team member calls to confirm eligibility and insurance before a visit is scheduled. It is not a memory test.',
    heroSecondary: { label: 'What near you means here', href: '#what-near-you-means' },
    facts: {
      title: 'Near you, from home',
      items: [...trustFacts],
    },
    sections: [
      {
        kind: 'cards',
        id: 'what-near-you-means',
        eyebrow: 'Why people search near me',
        title: 'Convenient means the visit comes to you.',
        intro: 'Near me is about not having to travel for the appointment. For this visit, you stay home. You need to be located in Maryland during the video visit, because the clinician must be licensed in the state where the patient is.',
        columns: 2,
        items: [
          { title: 'Memory doctor near me', copy: 'A neurology clinician reviews memory changes with you by video. You do not drive to an office for that visit.' },
          { title: 'Dementia doctor near me', copy: 'The same virtual visit covers dementia concerns, your history, and what testing, if any, should come next.' },
          { title: "Alzheimer's doctor near me", copy: "Questions about Alzheimer's start with a specialist visit by video. Further testing is ordered only when the clinician thinks it will help." },
          { title: 'Neurologist for memory near me', copy: 'You meet a neurology clinician licensed in Maryland. Local Doctor does not run a walk-in clinic in your city.' },
        ],
      },
      {
        kind: 'split',
        eyebrow: 'Video and local',
        title: 'What happens at home, and what happens near you.',
        columns: [
          {
            title: 'From home, by video',
            items: [
              'The eligibility call with our team',
              'Your visit with the neurology specialist, about an hour',
              'Your follow-up visit to review results and options',
            ],
          },
          {
            title: 'In person, near you',
            items: [
              'Blood work at a local Quest or LabCorp location, if ordered',
              'MRI or other imaging at a local imaging center, if ordered',
              'Treatment at a local site, only if it is appropriate and you choose it',
            ],
          },
        ],
      },
      {
        kind: 'callout',
        tone: 'note',
        title: 'This is a medical visit, not a clinic you can walk into.',
        copy: 'Local Doctor does not have a local office, and it is not a memory-care community or day program. The doctor sees you online from home. If day-to-day care is what your family needs, the team can suggest other resources when appropriate.',
      },
      {
        kind: 'steps',
        eyebrow: 'How to start',
        title: 'See a memory doctor without leaving home.',
        steps: [
          { title: 'Send a request or call', copy: 'Use the short form or call the number on this page. A team member follows up by phone.' },
          { title: 'Eligibility call', copy: 'We review concerns, history, medications, and insurance, and confirm whether a visit fits.' },
          { title: 'Video visit from home', copy: 'About an hour with a neurology specialist. A family member or care partner is welcome to join.' },
          { title: 'Local testing only if ordered', copy: 'If the plan includes labs or imaging, you schedule those at sites near you, then review results at a follow-up.' },
        ],
      },
      { kind: 'midCta', title: 'See a memory doctor from home.', copy: 'Nothing is booked until you have talked with our team and confirmed the visit.' },
    ],
    faqTitle: 'Memory doctor near you questions.',
    faqs: [
      ['Is there a memory doctor office near me?', 'No. Local Doctor is a virtual practice. Your specialist visit happens by video from home. Only ordered tests take place in person, at labs or imaging centers near you.'],
      ['Do I have to be in Maryland?', 'Yes. You need to be located in Maryland during the visit, because the clinician must be licensed in the state where the patient is. Virtual visits are not available in other states at this time.'],
      ['Will I have to drive at all?', 'Not for the visit with the specialist. If labs or imaging are ordered, those appointments are at local sites, such as a Quest or LabCorp location or an imaging center near you.'],
      ['What kind of doctor will I see?', 'A board-certified neurologist licensed in Maryland. The clinicians who may see patients are listed on our Contact page.'],
      ['Do I need a referral?', 'No referral is needed. Start with the short form or call our team, and we review eligibility and insurance with you before a visit is booked.'],
      ['Can a family member join?', 'Yes. A spouse, adult child, or other loved one can start the request and join the video visit with the patient.'],
    ],
    closing: { title: 'See a memory doctor without leaving home.', copy: 'Start a request online or call our team. We confirm eligibility and insurance with you first.' },
    related: ['memory-specialist-maryland', 'alzheimers-doctor-maryland', 'memory-evaluation'],
  },
}
