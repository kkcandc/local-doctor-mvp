/*
  Title and description per page. Plain data with no React imports: the build prerenders each
  route with these tags in the HTML, and App.tsx uses the same values once the app is running.
*/

export type PageShellMeta = { title: string; description: string; noindex?: boolean }

export const defaultMeta = {
  title: "Local Doctor | Alzheimer's Treatment Eligibility Review",
  description:
    "Local Doctor is a virtual Alzheimer's specialty clinic for treatment eligibility review, records, testing, insurance questions, and local follow-through for people who may qualify.",
  ogTitle: "Connect with Alzheimer's specialists and advanced treatment today",
}

export const startMeta: PageShellMeta = {
  title: 'Book a video visit with a neurologist | Local Doctor',
  description:
    'Pick an open time for a video visit with a board-certified neurologist licensed in Maryland. Insurance accepted. No referral needed.',
}

// The evaluation page is a form for people who already chose to start. It is not a search landing page.
export const evaluationMeta: PageShellMeta = {
  title: 'Start your evaluation | Local Doctor',
  description:
    'Answer a few questions to start an evaluation with a board-certified neurologist licensed in Maryland. Insurance accepted. No referral needed.',
  noindex: true,
}

export const blogMeta: PageShellMeta = {
  title: 'Blog | Local Doctor',
  description:
    'Alzheimer’s articles originally published by Local Infusion and republished by Local Doctor with attribution and a link to each source.',
}

export const routeMeta: Partial<Record<string, PageShellMeta>> = {
  start: startMeta,
  evaluation: evaluationMeta,
  blog: blogMeta,
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
