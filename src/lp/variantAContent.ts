import { landingPages, type LandingPageContent, type LandingSection } from '../landing/landingContent'

/*
  /lp/a: the live /dementia-evaluation page with the booking-first fix. Every button goes
  straight to the scheduler on /get-started instead of the evaluation form, and the copy that
  described the form now describes picking a visit time. Everything else is the live page.
*/

const base = landingPages['dementia-evaluation']

const bookingLabel = 'See open visit times'

function bookingFirst(section: LandingSection): LandingSection {
  if (section.kind === 'steps') {
    return {
      ...section,
      title: 'From picking a time to a clear next step.',
      steps: [
        { title: 'Pick a visit time', copy: 'Choose a day and time that works for you, or call us and we will help you book.' },
        { title: 'Intake call', copy: 'We call to review your medical history and verify your insurance and eligibility before the visit.' },
        ...section.steps.slice(2),
      ],
    }
  }
  if (section.kind === 'checklist') {
    return { ...section, eyebrow: 'Before the intake call', note: 'Missing something? That is fine. Book a time and the team will follow up on anything else the specialist needs.' }
  }
  if (section.kind === 'midCta') {
    return { ...section, title: 'Book a dementia evaluation.', copy: 'Pick a time for a video visit. We call before the visit to verify insurance.' }
  }
  return section
}

export const variantAContent: LandingPageContent = {
  ...base,
  funnel: 'evaluation',
  ctaLabel: bookingLabel,
  facts: { ...base.facts, items: ['Maryland video visits', 'Board-certified neurologist', 'Insurance accepted', 'No referral needed'] },
  sections: base.sections.map(bookingFirst),
  faqs: base.faqs.map(([question, answer]) => {
    if (question === 'Is this a dementia test?') {
      return [question, 'No. A test or screening is one tool. An evaluation is a clinician reviewing your symptoms, history, medications, and any prior results, then recommending what to do next. Booking a visit is not a diagnosis.']
    }
    if (question === 'Do I need a referral from my doctor?') {
      return [question, 'No referral is needed. Pick a time or call our team, and we review eligibility and insurance with you before the visit.']
    }
    return [question, answer]
  }),
  closing: { title: 'Ready to book a dementia evaluation?', copy: 'Pick a time for a video visit or call our team. We review eligibility and insurance with you first.' },
}
