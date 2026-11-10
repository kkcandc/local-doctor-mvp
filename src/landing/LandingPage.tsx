import { useState } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import { ArrowRight, CheckCircle2, ChevronDown, Info, Phone, ShieldAlert } from 'lucide-react'
import { publicPhone } from '../compliancePages'
import { isPageEnabled } from '../featureFlags'
import { hrefWithAdsParams, pathWithAdsParams } from '../analytics/googleAdsConfig'
import { StickyCta } from '../StickyCta'
import { evaluationPath, intakePath, landingDestinations, resolveDestination, type CtaDestination } from './destinations'
import { landingPages, relatedLabels, type LandingColumn, type LandingFaq as FaqItem, type LandingSection } from './landingContent'
import type { LandingSlug } from './landingMeta'
import './landing.css'

const phoneHref = `tel:+1${publicPhone.replace(/\D/g, '')}`

function intakeHref() {
  if (typeof window === 'undefined') return intakePath
  return pathWithAdsParams(intakePath, window.location.search)
}

function destinationHref(destination: CtaDestination) {
  const search = typeof window === 'undefined' ? '' : window.location.search
  if (destination.kind === 'evaluation') return pathWithAdsParams(evaluationPath, search)
  if (destination.kind === 'external') return hrefWithAdsParams(destination.href, search)
  return intakeHref()
}

function internalTarget(destination: CtaDestination): CtaTarget {
  return destination.kind === 'evaluation' ? 'evaluation' : 'start'
}

type Tone = 'white' | 'ivory'

export type CtaTarget = 'start' | 'evaluation'

type LandingPageProps = {
  slug: LandingSlug
  // Internal CTAs: record the click and move to /get-started or /evaluation.
  onStart: (target: CtaTarget, ctaLocation: string, ctaLabel: string) => void
  // External CTAs: record the click only. The browser follows the link itself, so the
  // app must not push a /get-started history entry first.
  onTrackCta: (ctaLocation: string, ctaLabel: string) => void
  onOpenPath: (path: string) => void
}

function isPlainClick(event: MouseEvent) {
  return !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
}

function GetStartedLink({
  destination,
  location,
  label,
  onStart,
  onTrackCta,
  variant = 'primary',
  describedBy,
}: {
  destination: CtaDestination
  location: string
  label: string
  onStart: (target: CtaTarget, ctaLocation: string, ctaLabel: string) => void
  onTrackCta: (ctaLocation: string, ctaLabel: string) => void
  variant?: 'primary' | 'accent' | 'text'
  describedBy?: string
}) {
  const external = destination.kind === 'external'
  return (
    <a
      className={variant === 'text' ? 'text-link landing-secondary-link' : variant}
      href={destinationHref(destination)}
      data-cta-location={location}
      aria-describedby={describedBy}
      onClick={(event) => {
        if (external) {
          onTrackCta(location, label)
          return
        }
        if (!isPlainClick(event)) return
        event.preventDefault()
        onStart(internalTarget(destination), location, label)
      }}
    >
      {label} <ArrowRight size={variant === 'text' ? 16 : 20} aria-hidden="true" />
    </a>
  )
}

function InternalLink({
  path,
  className,
  onOpenPath,
  children,
}: {
  path: string
  className?: string
  onOpenPath: (path: string) => void
  children: ReactNode
}) {
  return (
    <a
      className={className}
      href={path}
      onClick={(event) => {
        if (!isPlainClick(event)) return
        event.preventDefault()
        onOpenPath(path)
      }}
    >
      {children}
    </a>
  )
}

function PhoneLink() {
  return (
    <a className="secondary landing-phone" href={phoneHref}>
      <Phone size={18} aria-hidden="true" /> Call {publicPhone}
    </a>
  )
}

function CheckItems({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={className}>
      {items.map((item) => (
        <li key={item}>
          <CheckCircle2 size={20} aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

// Hero is ivory, so content sections alternate starting from white. Mid-page CTAs sit outside the rhythm.
function sectionTones(sections: LandingSection[]): { tones: Tone[]; next: Tone } {
  let current: Tone = 'white'
  const tones = sections.map((section) => {
    if (section.kind === 'midCta') return current
    const tone = current
    current = current === 'white' ? 'ivory' : 'white'
    return tone
  })
  return { tones, next: current }
}

export function LandingPage({ slug, onStart, onTrackCta, onOpenPath }: LandingPageProps) {
  const page = landingPages[slug]
  const destination = resolveDestination(landingDestinations[page.funnel])
  const { tones, next: faqTone } = sectionTones(page.sections)
  const cta = (location: string, variant?: 'primary' | 'accent', describedBy?: string) => (
    <GetStartedLink
      destination={destination}
      location={location}
      label={page.ctaLabel}
      onStart={onStart}
      onTrackCta={onTrackCta}
      variant={variant}
      describedBy={describedBy}
    />
  )

  function renderColumn(column: LandingColumn) {
    return (
      <article className="landing-column" key={column.title}>
        <h3>{column.title}</h3>
        <CheckItems items={column.items} />
        {column.ctaLocation && (
          <div className="landing-column-cta">
            {column.ctaContext && <p>{column.ctaContext}</p>}
            {cta(column.ctaLocation)}
          </div>
        )}
      </article>
    )
  }

  function renderSection(section: LandingSection, index: number) {
    const tone = tones[index]
    const key = `${section.kind}-${index}`

    if (section.kind === 'midCta') {
      const midId = `${slug}-mid-${index}`
      return (
        <section className="landing-mid-cta" key={key}>
          <div>
            <h2 id={`${midId}-title`}>{section.title}</h2>
            <p id={`${midId}-copy`}>{section.copy}</p>
          </div>
          {cta('mid_page', 'accent', `${midId}-title ${midId}-copy`)}
        </section>
      )
    }

    if (section.kind === 'callout') {
      const Icon = section.tone === 'urgent' ? ShieldAlert : Info
      return (
        <section className={`section ${tone} compact-section`} key={key} id={section.id}>
          <div className={`landing-callout ${section.tone}`}>
            <Icon size={24} aria-hidden="true" />
            <div>
              <h2>{section.title}</h2>
              <p>{section.copy}</p>
            </div>
          </div>
        </section>
      )
    }

    const headingId = `${slug}-section-${index}`
    return (
      <section className={`section ${tone} compact-section landing-section`} key={key} id={section.id}>
        <div className="section-intro">
          <p className="eyebrow">{section.eyebrow}</p>
          <h2 id={headingId}>{section.title}</h2>
          {'intro' in section && section.intro && <p>{section.intro}</p>}
        </div>

        {section.kind === 'cards' && (
          <div className={`landing-cards cols-${section.columns ?? 3}`}>
            {section.items.map((card) => (
              <article key={card.title}>
                {card.label && <span className="landing-card-label">{card.label}</span>}
                <h3>{card.title}</h3>
                <p>{card.copy}</p>
              </article>
            ))}
          </div>
        )}

        {section.kind === 'steps' && (
          <>
            <ol className="landing-steps">
              {section.steps.map((step, stepIndex) => (
                <li key={step.title}>
                  <b aria-hidden="true">{stepIndex + 1}</b>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.copy}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="landing-section-cta">{cta('steps', undefined, headingId)}</div>
          </>
        )}

        {section.kind === 'checklist' && (
          <>
            <CheckItems items={section.items} className="landing-checklist" />
            {section.note && <p className="landing-note">{section.note}</p>}
          </>
        )}

        {section.kind === 'split' && <div className="landing-split">{section.columns.map(renderColumn)}</div>}

        {section.kind === 'providers' && (
          <div className="landing-providers">
            <p>{section.copy}</p>
            {isPageEnabled('contact') && (
              <InternalLink className="secondary" path="/contact" onOpenPath={onOpenPath}>See licensed providers</InternalLink>
            )}
          </div>
        )}
      </section>
    )
  }

  return (
    <div className="landing-page" data-landing={slug}>
      <div className="page-hero-band">
        <section className="landing-hero">
          <div>
            <p className="eyebrow">{page.eyebrow}</p>
            <h1>{page.h1}</h1>
            <p className="landing-subhead">{page.subhead}</p>
            <p className="landing-lede">{page.lede}</p>
            {page.heroNote && <p className="landing-hero-note">{page.heroNote}</p>}
            <div className="landing-hero-actions">
              <div className="landing-hero-buttons">
                {cta('hero', undefined, `${slug}-reassurance`)}
                <PhoneLink />
              </div>
              <p className="landing-reassurance" id={`${slug}-reassurance`}>
                {page.reassurance}
              </p>
              {page.secondaryLink && (
                <GetStartedLink
                  destination={{ kind: 'intake' }}
                  location={page.secondaryLink.location}
                  label={page.secondaryLink.label}
                  onStart={onStart}
                  onTrackCta={onTrackCta}
                  variant="text"
                />
              )}
            </div>
            {page.heroSecondary && (
              <a className="text-link landing-jump" href={page.heroSecondary.href}>
                {page.heroSecondary.label} <ArrowRight size={16} aria-hidden="true" />
              </a>
            )}
          </div>
          <aside className="landing-facts" aria-label={page.facts.title}>
            <strong>{page.facts.title}</strong>
            <CheckItems items={page.facts.items} />
          </aside>
        </section>
      </div>

      {page.sections.map(renderSection)}

      <LandingFaqSection title={page.faqTitle} faqs={page.faqs} tone={faqTone} />

      <section className="conversion-panel landing-closing">
        <div>
          <h2 id={`${slug}-closing-title`}>{page.closing.title}</h2>
          <p id={`${slug}-closing-copy`}>{page.closing.copy}</p>
          <p className="landing-safety">
            {destination.kind === 'evaluation'
              ? 'The evaluation form is not a test or a diagnosis. If this is a medical emergency, call 911.'
              : 'Booking a visit is not a diagnosis. If this is a medical emergency, call 911.'}
          </p>
        </div>
        <div className="conversion-actions">
          {cta('closing', undefined, `${slug}-closing-title ${slug}-closing-copy`)}
          <PhoneLink />
        </div>
      </section>

      <section className="section white compact-section landing-related" aria-labelledby={`${slug}-related`}>
        <h2 id={`${slug}-related`}>Related pages</h2>
        <div>
          {page.related.map((related) => (
            <InternalLink key={related} path={`/${related}`} className="landing-related-card" onOpenPath={onOpenPath}>
              <strong>{relatedLabels[related].title}</strong>
              <span>{relatedLabels[related].copy}</span>
            </InternalLink>
          ))}
          {isPageEnabled('how') && (
            <InternalLink path="/how-it-works" className="landing-related-card" onOpenPath={onOpenPath}>
              <strong>How it works</strong>
              <span>The full path from first call to follow-up visit.</span>
            </InternalLink>
          )}
        </div>
      </section>

      <StickyCta
        label={page.ctaLabel}
        href={destinationHref(destination)}
        describedBy={`${slug}-reassurance`}
        anchorSelector={`.landing-page[data-landing="${slug}"] .landing-hero-actions`}
        stopSelectors={['.landing-mid-cta', '.landing-section-cta', '.landing-column-cta', '.landing-closing', '.footer']}
        onClick={(event) => {
          if (destination.kind === 'external') {
            onTrackCta('sticky_mobile', page.ctaLabel)
            return
          }
          if (!isPlainClick(event)) return
          event.preventDefault()
          onStart(internalTarget(destination), 'sticky_mobile', page.ctaLabel)
        }}
      />
    </div>
  )
}

function LandingFaqSection({ title, faqs, tone }: { title: string; faqs: FaqItem[]; tone: Tone }) {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section className={`section ${tone} compact-section landing-faq`}>
      <div className="section-intro">
        <p className="eyebrow">FAQ</p>
        <h2>{title}</h2>
      </div>
      <div className="faq-accordion">
        {faqs.map(([question, answer], index) => {
          const isOpen = openIndex === index
          return (
            <article className={isOpen ? 'open' : ''} key={question}>
              <button type="button" onClick={() => setOpenIndex(isOpen ? -1 : index)} aria-expanded={isOpen}>
                <span>{question}</span>
                <ChevronDown size={18} aria-hidden="true" />
              </button>
              {isOpen && <p>{answer}</p>}
            </article>
          )
        })}
      </div>
    </section>
  )
}
