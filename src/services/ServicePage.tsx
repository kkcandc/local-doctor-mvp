import { useState } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, ExternalLink, FlaskConical, ShieldAlert, Syringe, Video } from 'lucide-react'
import { pathWithAdsParams } from '../analytics/googleAdsConfig'
import { publicPhone } from '../compliancePages'
import { useLocationSearch } from '../hydration'
import { intakePath } from '../landing/destinations'
import { StickyCta } from '../StickyCta'
import { serviceByName, serviceBySlug, type ServiceType } from './servicesData'
import { availabilityLine, bookLabel, priceNote, regionNote, servicePages, type RichText, type ServicePageSlug } from './servicePages'
import './servicePage.css'

/*
  One layout for every individual service (/services/<slug>). The words come from servicePages.ts,
  the name, price, and hero image from the matching card in servicesData.ts, so a card and its page
  can never show different pictures or prices.

  Every booking button goes to /get-started (the scheduler), keeps gclid and utm_* in the link, and
  logs cta_click with its own location: service_hero, service_options, service_band, service_help,
  service_care_team, service_more_care, and sticky_mobile for the phone bar.
*/

const phoneHref = `tel:+1${publicPhone.replace(/\D/g, '')}`

type Tone = 'ivory' | 'sunken' | 'deep'

type ServicePageProps = {
  slug: ServicePageSlug
  // Records the click and moves to /get-started (App.tsx navigate), scrolling to the section whose
  // id is hash when there is one (the page's bookingHash).
  onStart: (ctaLocation: string, ctaLabel: string, hash?: string) => void
  // Opens another page on this site, such as /services or a sibling service page.
  onOpenPath: (path: string) => void
}

const typeIcons: Record<ServiceType, typeof Video> = { Visit: Video, Test: FlaskConical, Treatment: Syringe }

function isPlainClick(event: MouseEvent) {
  return !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
}

// The hero is light blue. The sections after it alternate ivory and light blue, and the dark band
// resets the pattern, so two neighbors never share a background whichever sections a page has.
function assignTones(keys: string[]): Record<string, Tone> {
  const tones: Record<string, Tone> = {}
  let previous: Tone = 'sunken'
  for (const key of keys) {
    const tone: Tone = key === 'band' ? 'deep' : previous === 'ivory' ? 'sunken' : 'ivory'
    tones[key] = tone
    previous = tone === 'deep' ? 'sunken' : tone
  }
  return tones
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function ServicePage({ slug, onStart, onOpenPath }: ServicePageProps) {
  const content = servicePages[slug]
  const service = serviceBySlug(slug)
  const search = useLocationSearch()
  const [openFaq, setOpenFaq] = useState(0)

  // Some pages send their booking buttons straight to a section of /get-started (the calendar).
  const bookingHash = servicePages[slug].bookingHash
  const bookingHref = `${pathWithAdsParams(intakePath, search)}${bookingHash ? `#${bookingHash}` : ''}`
  const tones = assignTones([
    'options',
    'steps',
    ...(content.details ? ['details'] : []),
    'band',
    'fit',
    ...(content.safety ? ['safety'] : []),
    'help',
    'careTeam',
    'more',
    'faq',
  ])

  function startLink(location: string, label: string) {
    return {
      href: bookingHref,
      'data-cta-location': location,
      onClick: (event: MouseEvent) => {
        if (!isPlainClick(event)) return
        event.preventDefault()
        onStart(location, label, bookingHash)
      },
    }
  }

  function pageLink(path: string) {
    return {
      href: pathWithAdsParams(path, search),
      onClick: (event: MouseEvent) => {
        if (!isPlainClick(event)) return
        event.preventDefault()
        onOpenPath(path)
      },
    }
  }

  function richText(parts: RichText): ReactNode[] {
    return parts.map((part, index) =>
      typeof part === 'string' ? (
        part
      ) : (
        <a key={`${part.slug}-${index}`} {...pageLink(`/services/${part.slug}`)}>
          {part.text}
        </a>
      ),
    )
  }

  const { options, details, safety } = content
  const moreCare = content.moreCare.flatMap((name) => serviceByName(name) ?? [])

  return (
    <div className="service-page" data-service={slug}>
      <section className="sp-hero">
        <a className="sp-back" {...pageLink('/services')}>
          <ArrowLeft size={18} aria-hidden="true" /> All services
        </a>
        <div className="sp-hero-grid">
          <div className="sp-media" data-fit={service.fit} style={service.frame ? { background: service.frame } : undefined}>
            <img src={service.image} alt={content.imageAlt} width={1000} height={800} fetchPriority="high" decoding="async" />
          </div>
          <div className="sp-hero-copy">
            <p className="eyebrow">{content.eyebrow}</p>
            <h1>{content.title}</h1>
            {content.generic && <p className="sp-generic">{content.generic}</p>}
            <p className="sp-lede">{content.lede}</p>
            <ul className="sp-points">
              {content.highlights.map((point) => (
                <li key={point}>
                  <CheckCircle2 size={22} aria-hidden="true" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <div className="sp-hero-actions">
              <a className="primary" {...startLink('service_hero', bookLabel)}>
                {bookLabel} <ArrowRight size={20} aria-hidden="true" />
              </a>
              {content.heroSecondaryLabel && (
                <a className="text-link" href="#options">
                  {content.heroSecondaryLabel}
                </a>
              )}
            </div>
            <p className="sp-price">
              <strong>{capitalize(service.price)}</strong> <span>{priceNote}</span>
            </p>
            <p className="sp-availability">
              <CheckCircle2 size={18} aria-hidden="true" /> {availabilityLine}
            </p>
            <p className="sp-region">{regionNote}</p>
          </div>
        </div>
      </section>

      <section className={`section sp-${tones.options}`} id="options">
        <div className="sp-column">
          <div className="section-intro">
            <p className="eyebrow">{options.eyebrow}</p>
            <h2>{options.title}</h2>
            <p>{options.copy}</p>
          </div>
          <div className="sp-option">
            <div className="sp-option-main">
              <span className="sp-icon" aria-hidden="true">
                <Video size={26} />
              </span>
              <div>
                <h3>{options.name}</h3>
                <p className="sp-setting">{options.setting}</p>
                <p>{options.description}</p>
              </div>
            </div>
            <div className="sp-option-side">
              <p className="sp-cover">{options.coverTitle}</p>
              <p>{options.coverCopy}</p>
              <a className="primary sp-options-cta" {...startLink('service_options', bookLabel)}>
                {bookLabel} <ArrowRight size={20} aria-hidden="true" />
              </a>
            </div>
          </div>
          <ul className="sp-trust">
            {options.checks.map((check) => (
              <li key={check}>
                <CheckCircle2 size={20} aria-hidden="true" />
                {check}
              </li>
            ))}
          </ul>
          {options.honest && (
            <div className="honest-card sp-honest">
              <ShieldAlert size={24} aria-hidden="true" />
              <div>
                <h2>{options.honest.title}</h2>
                <p>{options.honest.copy}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className={`section sp-${tones.steps}`}>
        <div className="sp-column">
          <div className="section-intro">
            <p className="eyebrow">{content.steps.eyebrow}</p>
            <h2>{content.steps.title}</h2>
          </div>
          <ol className="sp-steps">
            {content.steps.items.map((item, index) => (
              <li key={item.title}>
                <span className="sp-step-number" aria-hidden="true">
                  {index + 1}
                </span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {details && (
        <section className={`section sp-${tones.details}`}>
          <div className="sp-column">
            <div className="section-intro">
              <p className="eyebrow">{details.eyebrow}</p>
              <h2>{details.title}</h2>
              <p>{details.copy}</p>
            </div>
            <dl className="sp-facts">
              {details.rows.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <p className="disclaimer">{details.disclaimer}</p>
            <div className="sp-links">
              <a
                className="text-link"
                href={details.safetyLink.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${details.safetyLink.label} (opens in a new tab)`}
              >
                {details.safetyLink.label} <ExternalLink size={16} aria-hidden="true" />
              </a>
              <a className="text-link" {...pageLink(`/services/${details.compare.slug}`)}>
                {details.compare.label} <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>
      )}

      <section className="section sp-deep sp-band">
        <div className="sp-band-inner">
          <h2>{content.band.title}</h2>
          <div>
            <p>{content.band.copy}</p>
            <a className="accent" {...startLink('service_band', 'Book a visit')}>
              Book a visit
            </a>
          </div>
        </div>
      </section>

      <section className={`section sp-${tones.fit}`}>
        <div className="sp-split">
          <div className="section-intro">
            <p className="eyebrow">{content.fit.eyebrow}</p>
            <h2>{content.fit.title}</h2>
            <p>{content.fit.copy}</p>
          </div>
          <div>
            <ul className="sp-fit-card">
              {content.fit.items.map((item) => (
                <li key={item}>
                  <CheckCircle2 size={22} aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="sp-note">{content.fit.note}</p>
          </div>
        </div>
      </section>

      {safety && (
        <section className={`section sp-${tones.safety}`}>
          <div className="sp-column">
            <div className="section-intro">
              <p className="eyebrow">{safety.eyebrow}</p>
              <h2>{safety.title}</h2>
              <p>{safety.copy}</p>
            </div>
            <h3 className="sp-subhead">{safety.screenTitle}</h3>
            <p className="sp-subcopy">{safety.screenCopy}</p>
            <ul className="sp-screen">
              {safety.screen.map((item) => (
                <li key={item}>
                  <ShieldAlert size={20} aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <h3 className="sp-subhead">{safety.watchTitle}</h3>
            <ul className="sp-pills">
              {safety.watch.map((symptom) => (
                <li key={symptom}>{symptom}</li>
              ))}
            </ul>
            <p className="sp-note">{safety.note}</p>
          </div>
        </section>
      )}

      <section className={`section sp-${tones.help}`}>
        <div className="sp-help">
          <h2>Not sure this care is right for you?</h2>
          <p>
            Share what&apos;s been going on and we&apos;ll help you understand the right next step. When you&apos;re ready, we&apos;ll coordinate
            everything and make sure you have clear follow-up on your results.
          </p>
          <div className="sp-actions">
            <a className="primary" {...startLink('service_help', 'Get started')}>
              Get started <ArrowRight size={20} aria-hidden="true" />
            </a>
            <a className="secondary" href={phoneHref}>
              Call {publicPhone}
            </a>
          </div>
        </div>
      </section>

      <section className={`section sp-care-team sp-${tones.careTeam}`}>
        <div className="sp-center">
          <p className="eyebrow">Your care team</p>
          <h2>{content.careTeam.title}</h2>
          <p>{content.careTeam.copy}</p>
          <a className="primary" {...startLink('service_care_team', 'Get started')}>
            Get started <ArrowRight size={20} aria-hidden="true" />
          </a>
        </div>
      </section>

      <section className={`section sp-more sp-${tones.more}`}>
        <div className="sp-wide">
          <div className="sp-more-head">
            <h2>More care</h2>
            <a className="text-link" {...pageLink('/services')}>
              Explore all <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
          <ul className="sp-more-row">
            {moreCare.map((other) => {
              const Icon = typeIcons[other.type]
              // A card opens the service's own page once it has one, and the booking page until then.
              const link = other.slug ? pageLink(`/services/${other.slug}`) : startLink('service_more_care', bookLabel)
              return (
                <li key={other.name}>
                  <a className="sp-more-card" {...link}>
                    <span className="sp-icon sp-icon-small" data-type={other.type} aria-hidden="true">
                      <Icon size={24} />
                    </span>
                    <span className="sp-more-type">{other.type}</span>
                    <span className="sp-more-name">{other.name}</span>
                    <span className="sp-more-action">
                      {other.slug ? 'Learn more' : bookLabel} <ArrowRight size={16} aria-hidden="true" />
                    </span>
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      <section className={`section sp-faq sp-${tones.faq}`}>
        <div className="sp-column">
          <div className="section-intro">
            <p className="eyebrow">FAQ</p>
            <h2>Frequently asked questions</h2>
          </div>
          <div className="faq-accordion">
            {content.faqs.map((faq, index) => {
              const open = openFaq === index
              const id = `${slug}-faq-${index}`
              return (
                <article className={open ? 'open' : ''} key={faq.question}>
                  <button type="button" onClick={() => setOpenFaq(open ? -1 : index)} aria-expanded={open} aria-controls={id}>
                    <span>{faq.question}</span>
                    <ChevronDown size={18} aria-hidden="true" />
                  </button>
                  {open && <p id={id}>{richText(faq.answer)}</p>}
                </article>
              )
            })}
          </div>
          <p className="sp-note">
            More questions? <a {...pageLink('/faq')}>Browse the full FAQ</a>
          </p>
        </div>
      </section>

      <StickyCta
        label={bookLabel}
        href={bookingHref}
        // The whole hero, not its button: on a phone the button starts below the first screen, and the
        // bar's observer only reacts when its anchor changes visibility, so a jump that skips over the
        // button (such as the "How to get started" link) would never show the bar. The hero is on
        // screen at load, so any scroll past it is seen. The Book now button is inside the hero.
        anchorSelector={`.service-page[data-service="${slug}"] .sp-hero`}
        stopSelectors={['.sp-options-cta', '.sp-band', '.sp-help', '.sp-care-team', '.footer']}
        onClick={(event) => {
          if (!isPlainClick(event)) return
          event.preventDefault()
          onStart('sticky_mobile', bookLabel, bookingHash)
        }}
      />
    </div>
  )
}
