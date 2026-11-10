import { useMemo } from 'react'
import type { MouseEvent } from 'react'
import { Widget } from '@typeform/embed-react'
import '@typeform/embed/build/css/widget.css'
import { ArrowRight, Phone } from 'lucide-react'
import { publicPhone } from './compliancePages'
import { EVALUATION_FORM_ID } from './evaluationForm'
import { pathWithAdsParams, typeformHiddenFields } from './analytics/googleAdsConfig'
import { trackEvaluationStarted, trackEvaluationSubmitted } from './analytics/tracking'

const phoneHref = `tel:+1${publicPhone.replace(/\D/g, '')}`

/*
  /evaluation embeds the evaluation Typeform so its start and submit can be measured.

  The click ids and utm params go in as Typeform hidden fields (typeformHiddenFields). Typeform
  only stores a hidden field that is defined on the form, so the form needs fields named gclid,
  gbraid, wbraid, utm_source, utm_medium, utm_campaign, utm_term and utm_content.

  The callbacks below take no arguments on purpose. Typeform passes a form id and a response id,
  and nothing from the form (answers, names, emails, phones, response ids) is read, logged, or
  sent to Google or GA4. Only the event name is sent (src/analytics/tracking.ts). PostHog runs
  on this page the same as every other route. The form is a cross-origin iframe, so PostHog
  cannot read what a visitor types into it.

  Some forms do not report a start when they have no welcome screen. onQuestionChanged covers
  that: the first question change counts as started, and the tracker sends each event once.
*/
function onStarted() {
  trackEvaluationStarted()
}

function onQuestionChanged() {
  trackEvaluationStarted()
}

function onSubmit() {
  trackEvaluationSubmitted()
}

export function EvaluationPage({ onBookVisit }: { onBookVisit: () => void }) {
  const search = typeof window === 'undefined' ? '' : window.location.search
  const hidden = useMemo(() => typeformHiddenFields(search), [search])
  const bookingHref = pathWithAdsParams('/get-started', search)

  function openBooking(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
    event.preventDefault()
    onBookVisit()
  }

  return (
    <div className="evaluation-page">
      <div className="page-hero-band">
        <section className="evaluation-hero">
          <p className="eyebrow">Evaluation</p>
          <h1>Start your evaluation</h1>
          <p className="evaluation-trust">Board-certified neurologist. Insurance accepted. No referral needed.</p>
        </section>
      </div>

      <section className="section white evaluation-form-section" aria-label="Evaluation form">
        <div className="evaluation-form-frame">
          <Widget
            id={EVALUATION_FORM_ID}
            hidden={hidden}
            inlineOnMobile
            autoFocus={false}
            onStarted={onStarted}
            onQuestionChanged={onQuestionChanged}
            onSubmit={onSubmit}
            className="evaluation-form-widget"
          />
        </div>
        <div className="evaluation-alt">
          <p>
            Prefer to book directly?{' '}
            <a className="evaluation-book-link" href={bookingHref} data-cta-location="evaluation_secondary" onClick={openBooking}>
              See open visit times <ArrowRight size={16} aria-hidden="true" />
            </a>
          </p>
          <p>
            <a className="evaluation-phone" href={phoneHref}>
              <Phone size={16} aria-hidden="true" /> Call or text {publicPhone}
            </a>
          </p>
          <p className="evaluation-safety">The evaluation form is not a diagnosis. If this is a medical emergency, call 911.</p>
        </div>
      </section>
    </div>
  )
}
