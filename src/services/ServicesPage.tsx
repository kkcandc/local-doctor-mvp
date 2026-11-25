import { useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { ArrowRight, Search, X } from 'lucide-react'
import { pathWithAdsParams } from '../analytics/googleAdsConfig'
import { publicPhone } from '../compliancePages'
import { useLocationSearch } from '../hydration'
import { intakePath } from '../landing/destinations'
import { countByType, filterServices, serviceTypePlurals, serviceTypes, type Service, type ServiceType } from './servicesData'
import './services.css'

const phoneHref = `tel:+1${publicPhone.replace(/\D/g, '')}`

// How many cards load their photo right away. The rest wait until they scroll near the screen.
const eagerCards = 3

type ServicesPageProps = {
  // Records the click and moves to /get-started (App.tsx navigate).
  onStart: (ctaLocation: string, ctaLabel: string) => void
  // Opens a service's own page, /services/<slug> (App.tsx navigate).
  onOpenPath: (path: string) => void
}

type CardLink = { href: string; 'data-cta-location'?: string; onClick: (event: MouseEvent) => void }

function isPlainClick(event: MouseEvent) {
  return !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
}

function countLabel(count: number, type: ServiceType | null, query: string) {
  const text = query.trim()
  return `${count} ${count === 1 ? 'service' : 'services'}${type ? ` · ${serviceTypePlurals[type]}` : ''}${text ? ` matching “${text}”` : ''}`
}

export function ServicesPage({ onStart, onOpenPath }: ServicesPageProps) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<ServiceType | null>(null)
  const searchInput = useRef<HTMLInputElement>(null)
  const search = useLocationSearch()

  const results = filterServices(query, type)
  const filtered = type !== null || query.trim() !== ''
  // A card opens its service's own page, which has the booking button (slug in servicesData.ts). A
  // service without a page would open the booking page itself.
  const bookingHref = pathWithAdsParams(intakePath, search)

  function clearAll() {
    setQuery('')
    setType(null)
  }

  function pageLink(path: string): CardLink {
    return {
      href: pathWithAdsParams(path, search),
      onClick: (event: MouseEvent) => {
        if (!isPlainClick(event)) return
        event.preventDefault()
        onOpenPath(path)
      },
    }
  }

  function startLink(location: string, label: string): CardLink {
    return {
      href: bookingHref,
      'data-cta-location': location,
      onClick: (event: MouseEvent) => {
        if (!isPlainClick(event)) return
        event.preventDefault()
        onStart(location, label)
      },
    }
  }

  return (
    <>
      <section className="services-hero">
        <div className="services-hero-inner">
          <p className="eyebrow">Services</p>
          <h1>Find the care you need</h1>
          <p className="services-lede">Evaluations, tests, and treatments for memory and brain health, coordinated by one specialist team.</p>
          <div className="services-search" role="search">
            <Search size={22} aria-hidden="true" />
            <input
              ref={searchInput}
              className="input"
              type="text"
              name="services-search"
              value={query}
              placeholder="Search services, like “memory” or “MRI”"
              aria-label="Search services"
              autoComplete="off"
              onChange={(event) => setQuery(event.target.value)}
            />
            {query && (
              <button
                className="services-search-clear"
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setQuery('')
                  searchInput.current?.focus()
                }}
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>
          <div className="services-chips" role="group" aria-label="Filter by type">
            {serviceTypes.map((option) => (
              <button
                className="services-chip"
                key={option}
                type="button"
                aria-pressed={type === option}
                onClick={() => setType(type === option ? null : option)}
              >
                {serviceTypePlurals[option]} <span>{countByType(option)}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="services-results">
        <div className="services-results-bar">
          <p className="services-count" aria-live="polite">{countLabel(results.length, type, query)}</p>
          {filtered && (
            <button className="text-link" type="button" onClick={clearAll}>Clear all</button>
          )}
        </div>
        {results.length > 0 ? (
          <ul className="services-grid">
            {results.map((service, index) => (
              <li key={service.name}>
                <ServiceCard
                  service={service}
                  eager={index < eagerCards}
                  link={service.slug ? pageLink(`/services/${service.slug}`) : startLink('service_card', 'Book now')}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="services-empty">
            <h2>No services match that search</h2>
            <p>Try a different word, or tell us what&apos;s going on and we&apos;ll point you to the right place.</p>
            <div className="services-actions">
              <button className="primary" type="button" onClick={clearAll}>Show all services</button>
              <a className="secondary" {...startLink('services_empty', 'Book now')}>Book now</a>
            </div>
          </div>
        )}
      </section>

      <section className="services-cta">
        <h2>Not sure where to start?</h2>
        <p>A short eligibility check points you to the right visit, test, or treatment. We verify your insurance in parallel, so there are no surprises.</p>
        <div className="services-actions">
          <a className="primary" {...startLink('services_closing', 'Book now')}>Book now <ArrowRight size={20} aria-hidden="true" /></a>
          <a className="secondary" href={phoneHref}>Call {publicPhone}</a>
        </div>
      </section>
    </>
  )
}

function ServiceCard({ service, eager, link }: { service: Service; eager: boolean; link: CardLink }) {
  return (
    <a className="services-card" {...link}>
      <div className="services-card-media" data-fit={service.fit} style={service.frame ? { background: service.frame } : undefined}>
        {/* The name sits right below, so the photo adds nothing for a screen reader. The frame fixes the shape, so the 4:3 size here only reserves space. */}
        <img src={service.image} alt="" width={720} height={540} loading={eager ? 'eager' : 'lazy'} decoding="async" />
        <span className="services-card-type">{service.type}</span>
      </div>
      <div className="services-card-body">
        <h2>{service.name}</h2>
        <p className="services-card-price">
          <strong>{service.price}</strong>
          <span>with or without insurance</span>
        </p>
        <span className="primary services-card-action">Book now</span>
      </div>
    </a>
  )
}
