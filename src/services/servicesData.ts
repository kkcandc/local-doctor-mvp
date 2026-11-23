/*
  The services listed on /services. Plain data with no React imports, so the page and the tests
  read the same list. Cards appear in the order of this array.

  Prices are the wording from the approved design, shown as written. Like all claims on the site
  they need clinical and legal review before paid traffic (see README, Prototype Boundaries).
*/

export type ServiceType = 'Visit' | 'Treatment' | 'Test'

export type Service = {
  name: string
  type: ServiceType
  price: string
  image: string
  // 'contain' for the IV bag, a cut-out on a plain background. 'cover' for photographs.
  fit: 'cover' | 'contain'
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
    type: 'Visit',
    price: 'from $0',
    image: '/assets/services/memory.jpg',
    fit: 'cover',
    keywords: 'forgetful memory loss video',
  },
  {
    name: 'Leqembi (lecanemab)',
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
    name: 'Kisunla',
    type: 'Treatment',
    price: 'Price after visit',
    image: ivBag,
    fit: 'contain',
    keywords: 'donanemab amyloid infusion anti-amyloid drug',
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
