# Conversion funnel: event spec, tracker audit, and open dependencies

This document describes what the website measures today, how those signals map
to the funnel report (See Ad, Landing page, Click CTA, Conversion through form,
Form completed, split by segment), and what is still missing before anyone can
report booked or attended visits.

It is a description of the current setup, not a compliance determination. Every
item in the tracker audit below needs review by whoever owns HIPAA and privacy
compliance for Local Doctor before the funnel is expanded.

## Funnel stages and where each number comes from

| Funnel stage | Source today | Event or metric | Notes |
| --- | --- | --- | --- |
| See Ad | Google Ads | Impressions | Reported by Ads. The website sends nothing for this stage. |
| Landing page | GA4 (G-PR7CJ8TK79) | `page_view` | Sent on first load and on every in-app navigation. `page_location` keeps only the Google click ids (gclid, gbraid, wbraid, dclid, gclsrc, gad_*) and utm_* query params. |
| Click CTA (form) | GA4 and Google Ads | `cta_click` | Params: `page_path`, `cta_location`, `cta_label`. One copy to GA4 and one to the Ads tag per click. Never a conversion. |
| Click CTA (call) | Google Ads only | `phone_click` plus the phone conversion (label gJr-CJnG9LAdEOuoosxE) | Fires on clicks of the clinic number. Not delivered to GA4 today (see audit). |
| Conversion through booking | Google Ads only | `generate_lead` plus the lead conversion (label KA47CJbG9LAdEOuoosxE) | Fires once per Calendly booking on /get-started, when Calendly posts `calendly.event_scheduled` (4 second dedupe). Only the event name is read. Not delivered to GA4 today (see audit). |
| Form completed | Not available for the evaluation form | None | The three evaluation pages send visitors to the external form at localdoctor.typeform.com/evaluation. The site cannot see that submit. See dependencies. |
| Booking completed | Google Ads only | The same `generate_lead` conversion as above | The Calendly booking is the only completion signal the site can see. Whether the visit was attended is not measured. |
| Attended visit | Not measured | None | Needs secure, server-side data. See dependencies. |

### cta_location values

| Value | Where |
| --- | --- |
| `hero` | Primary button in the page hero |
| `steps` | Button under a "How it works" steps section on landing pages |
| `mid_page` | Mid-page CTA band on landing pages |
| `patient_path`, `caregiver_path` | The two column CTAs on /memory-evaluation |
| `closing` | Closing CTA panel |
| `sticky_mobile` | Phone-only sticky bar (homepage and landing pages) |
| `header` | Get Started button in the site header (desktop and the mobile menu) |

The /get-started page sends no `cta_click` events. Its "Fill out the form" links
only scroll to the form on the same page.

### Segments

Segments are derived at reporting time from the landing `page_path`. The site
does not send a separate intent or audience parameter, and it never sends form
answers, the visitor's concern, or who the form is for.

| Segment | Landing paths |
| --- | --- |
| Evaluation | /dementia-evaluation, /alzheimers-evaluation, /memory-evaluation |
| Find a doctor | /alzheimers-doctor-maryland, /memory-specialist-maryland, /memory-doctor-near-me |
| Second opinion | /alzheimers-second-opinion |
| Testing | /dementia-test-online |
| Brand and organic | / and any other path |

Paths such as /dementia-evaluation describe a health topic. Whether pairing that
path with Google identifiers is acceptable is one of the open review items
below.

## Tracker audit (current state, needs compliance review)

| Tracker | Where it runs | What it receives | Review flag |
| --- | --- | --- | --- |
| Google tag (Ads AW-18413556843 and GA4 G-PR7CJ8TK79) | Every page, including /get-started | Page URL with the allow-listed ad params, page title, Google cookies and IP address by default, plus the events above | Google's standard terms are not a BAA. Health-topic URLs and the intake page are on the same tag as ads attribution. Needs review before any new event is added on /get-started. |
| Google Ads lead conversion | /get-started, on a Calendly booking | Event name and conversion label only. No invitee or appointment details. | Conversion on a clinical booking page. Needs review. |
| Google Ads phone conversion | Any page, on clinic number click | Event name, conversion label, page path | Needs review. |
| PostHog | Every page | Pageviews, `eligibility_check_started`, errors, and session replay outside /get-started. Events on /get-started are dropped before sending and replay pauses there. | Replay on health-topic landing pages needs review. |
| Calendly embed | /get-started | The visitor's name, contact details and chosen time go to Calendly. Calendly's script and iframe load from calendly.com and assets.calendly.com. No Google click ids or utm_* params are passed in. | Calendly account settings (BAA, data retention, notification and integration settings) need review. No CSP blocks these hosts today. |
| Evaluation Typeform | External, linked from the three evaluation pages | Form answers go to Typeform | Same as above. The site cannot see or measure its submit. |
| Chatbot (Jotform agent from forms.mylocalinfusion.com) | Every page, including /get-started | Whatever a visitor types into the chat | Runs on the intake page. Needs review. |

Changes deliberately not made in this pass, pending that review:

- `generate_lead` and `phone_click` are sent without `send_to`, so they reach
  Google Ads only and never GA4. Delivering them to GA4 is a small code change,
  but it adds intake-page data to a second Google product, so it waits for review.
- Calendly also posts `calendly.event_type_viewed`, `calendly.date_and_time_selected`
  and `calendly.profile_page_viewed`. They are not wired to any tracker, for the
  same reason. Only `calendly.event_scheduled` is used.
- No remarketing, audience, or new ad tags were added anywhere.

## Booking flow: intended versus current

Intended sequence (Woody): Get Started, book a neurologist appointment, an
intake call to review medical history before the visit, then the neurologist
visit by video.

Current sequence: Get Started, book a neurologist appointment in the Calendly
embed on /get-started (or call or text), the team calls to review medical
history and verify insurance and eligibility, then the visit happens by video.

The Calendly embed (`src/CalendlyEmbed.tsx`) is always on. The earlier
off-by-default `VITE_BOOKING_URL` slot is no longer used by /get-started.
`resolveBookingUrl` is still in `src/landing/destinations.ts` and still tested,
but nothing renders it. The Typeform intake form and the Eligibility section were
removed from /get-started.

## Open dependencies

1. Scheduler. Calendly is live on /get-started. Whether Calendly will sign a BAA
   is still open, and the site loads its script and iframe from calendly.com
   without any other review gate.
2. Provider availability. The provider currently sees patients Wednesday 8am
   to noon ET. The homepage ("in days", "fast, credible answer"), /how-it-works
   ("same-week appointment", "every Wednesday") and the booking-page copy now carry
   speed and availability claims on purpose, and the Playwright guard against
   them was removed. The landing pages (hero reassurance, facts, and the
   Alzheimer's doctor meta description) and the FAQ still avoid them. Phone copy
   says the phone is answered on weekdays. Keep the Calendly availability in
   line with what the copy promises.
3. Evaluation form completion signal. If a "Form completed" count is wanted for
   the evaluation pages, Eric would need to set up a completion signal in
   Typeform (for example a thank-you redirect to a trylocaldoctor.com page that
   carries no form answers). That needs review before it is built.
4. Booked and attended visits. These live in the scheduling and clinical
   systems, not the website. Counting them needs a secure server-side export or
   offline conversion import, with no patient identifiers or appointment details
   sent to Google unless legal review and a BAA allow it.
5. Reporting. Any dashboard built on this must use aggregate counts only and must
   not be public. No patient-level data belongs in it.
