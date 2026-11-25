import { useEffect } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import { CalendarDays, CheckCircle2, Phone } from 'lucide-react'
import { pathWithAdsParams } from '../analytics/googleAdsConfig'
import { CalendlyEmbed } from '../CalendlyEmbed'
import { clinicPhoneForLanding } from '../clinicPhones'
import { useLocationSearch } from '../hydration'
import { LandingPage, type CtaTarget } from '../landing/LandingPage'
import { rememberLpVariant, type LpVariant } from './lpVariants'
import { variantAContent } from './variantAContent'
import './lp.css'

/*
  Landing page test variants (see lpVariants.ts). They share a minimal header and footer with no
  site navigation, so each page has one job. The Evaluation campaigns run in Maryland and
  Virginia on the same URLs, so the copy names both states and uses the shared site phone, like
  the live pages. Copy rules: no speed claims,
  no prices or "free", no online diagnosis, no drug names, no provider photos or new provider facts.
*/

type LpPageProps = {
  variant: LpVariant
  onStart: (target: CtaTarget, ctaLocation: string, ctaLabel: string) => void
  onTrackCta: (ctaLocation: string, ctaLabel: string) => void
  onOpenPath: (path: string) => void
}

const phone = clinicPhoneForLanding()
const intakePath = '/get-started'
const insurancePlans = ['Medicare', 'Medicaid', 'Aetna', 'CareFirst', 'Cigna', 'Kaiser', 'United']
const credential = 'Board-certified neurologist, licensed in Maryland and Virginia'
const sharedH1 = 'A memory evaluation with a neurologist, by video'

function isPlainClick(event: MouseEvent) {
  return !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
}

function LpHeader() {
  return (
    <header className="lp-header">
      <img className="lp-logo" src="/assets/brand/local-doctor-logo.svg" alt="Local Doctor" width={1337} height={270} />
      <a className="lp-header-phone" href={phone.href}>
        <Phone size={18} aria-hidden="true" /> <span><span className="lp-wide-only">Call </span>{phone.display}</span>
      </a>
    </header>
  )
}

function LpFooter() {
  return (
    <footer className="lp-footer">
      <p>Local Doctor is a virtual practice. Video visits are for patients located in Maryland or Virginia during the visit.</p>
      <p>Booking a visit is not a diagnosis. If this is a medical emergency, call 911.</p>
      <nav aria-label="Legal">
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms of Use</a>
        <a href="/patient-rights">Patient Rights &amp; Notices</a>
      </nav>
      <p suppressHydrationWarning>© {new Date().getFullYear()} Local Doctor. Phone: {phone.display}</p>
    </footer>
  )
}

function BookLink({
  location,
  label,
  className,
  onStart,
  children,
}: {
  location: string
  label: string
  className: string
  onStart: LpPageProps['onStart']
  children?: ReactNode
}) {
  const search = useLocationSearch()
  return (
    <a
      className={className}
      href={pathWithAdsParams(intakePath, search)}
      data-cta-location={location}
      onClick={(event) => {
        if (!isPlainClick(event)) return
        event.preventDefault()
        onStart('start', location, label)
      }}
    >
      {children ?? label}
    </a>
  )
}

function CheckList({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={className}>
      {items.map((item) => (
        <li key={item}>
          <CheckCircle2 size={22} aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

// B: calendar first (Isaac Health style).
function VariantB() {
  return (
    <div className="lp-b" data-lp-variant="b">
      <section className="lp-b-hero">
        <p className="lp-eyebrow">Maryland and Virginia video visits</p>
        <h1>{sharedH1}</h1>
        <p className="lp-b-credential">
          {credential}. Insurance accepted. No referral needed.
        </p>
      </section>

      <section className="lp-b-booking" id="book" aria-labelledby="lp-b-book-title">
        <h2 id="lp-b-book-title">Pick a time for your video visit (about 1 hour)</h2>
        <CalendlyEmbed />
        <p className="lp-b-after">After you book, we call you to review your medical history and verify your insurance before the visit.</p>
        <p className="lp-b-call">
          Prefer to talk first? <a href={phone.href}>Call or text {phone.display}</a>
        </p>
      </section>

      <section className="lp-b-trust" aria-labelledby="lp-b-trust-title">
        <h2 id="lp-b-trust-title">What to know</h2>
        <CheckList
          className="lp-b-points"
          items={[
            `${credential}.`,
            `Insurance accepted, including ${insurancePlans.join(', ')}. We confirm your coverage before the visit.`,
            'No referral needed. Visits happen by video from home, and a loved one is welcome to join.',
            'If labs are ordered, you go to a local Quest or LabCorp, and a follow-up visit goes over results.',
            'We work alongside your existing doctors. We do not replace them.',
          ]}
        />
      </section>
    </div>
  )
}

// C: simple, large text, call first (Sunday Health style).
function VariantC({ onStart }: Pick<LpPageProps, 'onStart'>) {
  const bookLabel = 'Book a video visit'
  const actions = (location: string) => (
    <div className="lp-c-actions">
      <a className="lp-c-call" href={phone.href} data-cta-location={`${location}_call`}>
        <Phone size={28} aria-hidden="true" /> Call {phone.display}
      </a>
      <BookLink className="lp-c-book" location={location} label={bookLabel} onStart={onStart}>
        <CalendarDays size={26} aria-hidden="true" /> {bookLabel}
      </BookLink>
    </div>
  )

  return (
    <div className="lp-c" data-lp-variant="c">
      <section className="lp-c-hero">
        <h1>{sharedH1}</h1>
        <p className="lp-c-lead">Talk with our team first. We explain how the visit works and check your insurance.</p>
        {actions('hero')}
        <p className="lp-c-credential">
          <CheckCircle2 size={26} aria-hidden="true" /> {credential}
        </p>
      </section>

      <section className="lp-c-steps" aria-labelledby="lp-c-steps-title">
        <h2 id="lp-c-steps-title">How it works</h2>
        <ol>
          <li>
            <b aria-hidden="true">1</b>
            <p><strong>Call us or pick a time.</strong> Whatever is easier for you.</p>
          </li>
          <li>
            <b aria-hidden="true">2</b>
            <p><strong>We call you.</strong> We go over your health history and check your insurance.</p>
          </li>
          <li>
            <b aria-hidden="true">3</b>
            <p><strong>Meet the neurologist by video, from home.</strong> About 1 hour. A family member can join.</p>
          </li>
        </ol>
      </section>

      <section className="lp-c-insurance" aria-labelledby="lp-c-insurance-title">
        <h2 id="lp-c-insurance-title">Insurance accepted</h2>
        <ul className="lp-c-plans">
          {insurancePlans.map((plan) => (
            <li key={plan}>{plan}</li>
          ))}
        </ul>
        <p>Don&apos;t see your plan? We may still accept it. We confirm your coverage when we speak with you. No referral needed.</p>
      </section>

      <section className="lp-c-closing" aria-labelledby="lp-c-closing-title">
        <h2 id="lp-c-closing-title">Questions about memory changes?</h2>
        <p>Call us with your questions, or book a video visit.</p>
        {actions('closing')}
      </section>
    </div>
  )
}

export function LpPage({ variant, onStart, onTrackCta, onOpenPath }: LpPageProps) {
  useEffect(() => {
    rememberLpVariant(variant)
  }, [variant])

  return (
    <div className={`lp-page lp-page-${variant}`} data-lp-root={variant}>
      <LpHeader />
      {variant === 'a' && (
        <LandingPage
          slug="dementia-evaluation"
          content={variantAContent}
          showRelated={false}
          onStart={onStart}
          onTrackCta={onTrackCta}
          onOpenPath={onOpenPath}
        />
      )}
      {variant === 'b' && <VariantB />}
      {variant === 'c' && <VariantC onStart={onStart} />}
      <LpFooter />
    </div>
  )
}
