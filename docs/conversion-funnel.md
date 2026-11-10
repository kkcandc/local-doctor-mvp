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
| Click CTA (booking or evaluation) | GA4 and Google Ads | `cta_click`, Ads label A54CCNK03bUdEOuoosxE | Params: `page_path`, `cta_location`, `cta_label` (real button text), `cta_destination` (`/evaluation` or `/get-started`). GA4 every click, Ads once per page session. |
| Click CTA (call) | GA4 and Google Ads | `phone_tap` and `phone_click`, Ads label gJr-CJnG9LAdEOuoosxE | Fires on clicks of the clinic number. |
| Micro steps | GA4 and Google Ads | `calendly_viewed` (GA4 only), `calendly_time_selected` (CqZ_CKDm17UdEOuoosxE), `evaluation_started` (r0XvCNW03bUdEOuoosxE), `engaged_visit` (DTk2CPG13bUdEOuoosxE) | Calendly and Typeform embed callbacks, plus 45 seconds and 50 percent scroll. Event names only. |
| Form completed | GA4 and Google Ads | `evaluation_submitted`, Ads label vOMaCO613bUdEOuoosxE, 100 USD | Typeform `onSubmit` on the on-site /evaluation page. No answers, response id or contact details are read. |
| Booking completed | GA4 and Google Ads | `visit_booked` and `generate_lead`, Ads label KA47CJbG9LAdEOuoosxE, 300 USD | Calendly `calendly.event_scheduled` only, once per page session. The Typeform submit never fires this label. Whether the visit was attended is not measured. |
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
| `header` | Header button (desktop and the mobile menu): Start your evaluation on the evaluation pages, See open visit times elsewhere |
| `evaluation_secondary` | See open visit times link under the form on /evaluation |
| `get_started_hero` | Book now jump link in the /get-started hero (desktop only) |

The /get-started Book now jump link logs a `cta_click` with destination `/get-started`.

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
| Calendly embed | /get-started | The visitor's name, contact details and chosen time go to Calendly. Calendly's script and iframe load from calendly.com and assets.calendly.com. The embed URL passes utm_* through. gclid, gbraid, and wbraid are stored in salesforce_uuid (gclid:<value>, joined with \| if more than one is present) because Calendly records that field and does not record gclid. No form answers are added to the URL. | Calendly account settings (BAA, data retention, notification and integration settings) need review. No CSP blocks these hosts today. |
| Evaluation Typeform | Embedded on /evaluation (`@typeform/embed-react`, form KwfqI59c) | Form answers go to Typeform. The allow-listed ad params are passed as hidden fields. The site only receives the started and submitted callbacks and never reads answers. | Same as above. |
| Chatbot (Jotform agent from forms.mylocalinfusion.com) | Every page except /get-started and /evaluation (delayed on phones) | Whatever a visitor types into the chat | Hidden on both intake pages. Needs review elsewhere. |

Still not done, pending that review: no enhanced conversions or user-provided
data, no consent mode, no remarketing, audience or new ad tags. In the Google tag
settings, automatic detection of user-provided data should stay off.

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
   to noon ET. The homepage ("in days", "as early as this week", "fast, credible
   answer"), /how-it-works ("get seen within days") and the booking-page copy now
   carry speed claims on purpose. The site no longer names the Wednesday clinic
   day anywhere. The Playwright guard against
   them was removed. The landing pages (hero reassurance, facts, and the
   Alzheimer's doctor meta description) and the FAQ still avoid them. The landing
   reassurance line does not say when the phone is answered. Keep the Calendly availability in
   line with what the copy promises.
3. Typeform setup (Eric). Add hidden fields gclid, gbraid, wbraid, utm_source,
   utm_medium, utm_campaign, utm_term and utm_content to the evaluation form so
   the values passed by /evaluation are stored. Change the ending screen's "Book
   a visit now!" redirect from PatientPop to https://trylocaldoctor.com/get-started.
4. Booked and attended visits. These live in the scheduling and clinical
   systems, not the website. Counting them needs a secure server-side export or
   offline conversion import, with no patient identifiers or appointment details
   sent to Google unless legal review and a BAA allow it.
5. Reporting. Any dashboard built on this must use aggregate counts only and must
   not be public. No patient-level data belongs in it.
