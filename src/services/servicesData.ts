/*
  The services listed on /services. Plain data with no React imports, so the page and the tests
  read the same list. Cards appear in the order of this array.

  Prices are the wording from the approved design, shown as written. Like all claims on the site
  they need clinical and legal review before paid traffic (see README, Prototype Boundaries).
*/

import type { ServicePageSlug } from './servicePages'

export type ServiceType = 'Visit' | 'Treatment' | 'Test'

export type Service = {
  name: string
  // Set once the service has its own page at /services/<slug> (content in servicePages.ts). The
  // card then opens that page, and the page's hero shows the same image as the card.
  slug?: ServicePageSlug
  type: ServiceType
  price: string
  image: string
  // 'contain' for the IV bag, a cut-out on a plain background. 'cover' for photographs.
  fit: 'cover' | 'contain'
  // The backdrop color of a 'contain' image, so the bars beside the picture do not show an edge.
  // The card and the page both use it. Without one, the stylesheet's pale blue (the Leqembi bag's
  // backdrop) applies.
  frame?: string
  // Extra words the search matches besides the name and type. Never shown on the page.
  keywords: string
}

export const serviceTypes: ServiceType[] = ['Visit', 'Treatment', 'Test']

export const serviceTypePlurals: Record<ServiceType, string> = {
  Visit: 'Visits',
  Treatment: 'Treatments',
  Test: 'Tests',
}

const ivBag = '/assets/hero-leqembi-iv.webp'

export const services: Service[] = [
  {
    name: 'Memory evaluation',
    slug: 'memory-evaluation',
    type: 'Visit',
    price: 'from $0',
    image: '/assets/services/memory.jpg',
    fit: 'cover',
    keywords: 'forgetful memory loss video',
  },
  {
    name: 'Leqembi (lecanemab)',
    slug: 'leqembi',
    type: 'Treatment',
    price: 'Price after visit',
    image: ivBag,
    fit: 'contain',
    keywords: 'amyloid infusion anti-amyloid drug',
  },
  {
    name: "Alzheimer's blood test",
    type: 'Test',
    price: 'from $25',
    image: '/assets/services/blood-test.jpg',
    fit: 'cover',
    keywords: 'amyloid biomarker lab draw blood tube',
  },
  {
    name: 'Concentration difficulty',
    type: 'Visit',
    price: 'from $0',
    image: '/assets/services/concentration.jpg',
    fit: 'cover',
    keywords: 'focus attention adhd',
  },
  {
    name: 'Dementia evaluation',
    type: 'Visit',
    price: 'from $0',
    image: '/assets/services/dementia.jpg',
    fit: 'cover',
    keywords: 'memory cognitive decline',
  },
  {
    name: 'Visit with a neurologist doctor',
    type: 'Visit',
    price: 'from $0',
    image: '/assets/services/neurologist.jpg',
    fit: 'cover',
    keywords: 'neurology specialist consult',
  },
  {
    name: 'Brain fog evaluation',
    type: 'Visit',
    price: 'from $0',
    image: '/assets/services/brain-fog.jpg',
    fit: 'cover',
    keywords: 'fog fatigue thinking',
  },
  {
    name: "Alzheimer's genetic testing",
    type: 'Test',
    price: 'Price after visit',
    image: '/assets/services/genetic-test.jpg',
    fit: 'cover',
    keywords: 'apoe gene dna',
  },
  {
    name: 'Cognitive evaluation',
    type: 'Visit',
    price: 'from $0',
    image: '/assets/services/cognitive.jpg',
    fit: 'cover',
    keywords: 'thinking reasoning screen',
  },
  {
    name: 'Kisunla (donanemab)',
    slug: 'kisunla',
    type: 'Treatment',
    price: 'Price after visit',
    // The donanemab IV bag (its backdrop is a uniform #b8d8f2, darker than the Leqembi bag's).
    image: '/assets/services/kisunla.webp',
    fit: 'contain',
    frame: '#b8d8f2',
    keywords: 'amyloid infusion anti-amyloid drug',
  },
  {
    name: "Alzheimer's evaluation",
    type: 'Visit',
    price: 'from $0',
    image: '/assets/services/alzheimers.jpg',
    fit: 'cover',
    keywords: 'diagnosis dementia memory',
  },
  {
    name: 'Brain MRI',
    type: 'Test',
    price: 'Price after visit',
    image: '/assets/services/mri.jpg',
    fit: 'cover',
    keywords: 'scan imaging magnetic resonance radiology',
  },
]

export function serviceBySlug(slug: ServicePageSlug): Service {
  const service = services.find((entry) => entry.slug === slug)
  if (!service) throw new Error(`No service has the page slug "${slug}"`)
  return service
}

export function serviceByName(name: string): Service | undefined {
  return services.find((entry) => entry.name === name)
}

export function countByType(type: ServiceType): number {
  return services.filter((service) => service.type === type).length
}

// A service matches when every active control accepts it: the type chip (if one is on) and the
// search text (if any), which is looked for in the name, the type, and the hidden keywords.
export function filterServices(query: string, type: ServiceType | null): Service[] {
  const needle = query.trim().toLowerCase()
  return services.filter((service) => {
    if (type && service.type !== type) return false
    if (!needle) return true
    const haystack = `${service.name} ${service.type} ${serviceTypePlurals[service.type]} ${service.keywords}`
    return haystack.toLowerCase().includes(needle)
  })
}
