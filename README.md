# Local Doctor MVP

Production-ready rebuild of the Claude Design export for the Local Infusion / AI Doctors Alzheimer's pilot.

## Live Site

- Production: https://local-doctor-mvp.vercel.app
- Local: http://127.0.0.1:5175
- Vercel project: `kenny-klines-projects/local-doctor-mvp`

## GitHub Workflow and Deployment Policy

- `main` is the durable source of truth for production code.
- Contributors (including Eric) work on feature/fix branches and open PRs into `main`.
- Vercel should build a **preview** deployment for each pushed branch/PR.
- Only Kenny / Chief of Staff merges to `main` should deploy production.
- Do not run manual or direct Vercel production deploys outside the GitHub `main` flow.

### Vercel Ignored Build Step

`vercel.json` sets `"ignoreCommand": "exit 1"` so Git-connected builds **do not skip** (exit `1` = continue the build). Preview branches should get a READY preview.

If a branch/PR deploy is still `CANCELED` with `errorLink = Ignored Build Step`, a Project Settings Ignored Build Step override is still winning in the Vercel UI and needs a human to clear it. Do not merge a PR just to force a production build.

## Source Material

- Claude export: `../local-doctor-mvp-export/Local Doctor MVP Website Files/`
- Temporary domain direction: `trylocaldoctor.com`
- Production scheduler on `/get-started`: Calendly inline embed, `https://calendly.com/local-doctor/virtualvisit` (`src/CalendlyEmbed.tsx`). The evaluation form is the existing Typeform (id `KwfqI59c`, `localdoctor.typeform.com/evaluation`), embedded on our own `/evaluation` page with `@typeform/embed-react` (`src/EvaluationPage.tsx`).

## What It Includes

- Patient-facing home page with intent-path routing
- Services page with a searchable, filterable grid of visits, tests, and treatments (see Services Page below)
- An individual page for Memory evaluation, Leqembi, and Kisunla, one shared layout (see Service Pages below)
- Treatment page for Leqembi/Kisunla, with hedged drug-effect language
- How-it-works page mapped to the 13-step patient journey
- Provider referral page
- Get-started page with an embedded Calendly scheduler, a "what to expect" and "what to have handy" column, a call or text line, and four FAQs
- FAQ, resources, and pilot plan pages
- Prerendered HTML for every public route (see Prerendered HTML below), with the SPA shell as the fallback for any other path

## Page Feature Flags

Every page has a visibility flag in `src/featureFlags.ts`. A disabled page is removed from the header, footer, and in-page links, and a direct visit redirects to `/`. Meet the Team (`about`) is currently off. Contact (`contact`) is on but intentionally not linked from the footer.

- Change a default in `src/featureFlags.ts` and open a PR.
- Or override per Vercel environment with `VITE_PAGE_<KEY>=true|false` (for example `VITE_PAGE_ABOUT=true` on Preview only). Env vars are read at build time, so redeploy after changing one.
- `home` cannot be disabled; it is the redirect target.
- Hiding is not security: a disabled page's code is still in the JS bundle.

## Intent Landing Pages

Nine search-intent pages live in `src/landing/`: `/dementia-evaluation`, `/alzheimers-evaluation`, `/memory-evaluation`, `/alzheimers-doctor-maryland`, `/memory-specialist-maryland`, `/alzheimers-second-opinion`, `/dementia-test-online`, `/memory-doctor-near-me`, and `/alzheimers-blood-test`.

- Copy is in `landingContent.ts`. Titles and descriptions are in `landingMeta.ts`. Claims must come from existing site or compliance copy: no credentials, wait times, prices, outcome rates, or diagnosis/eligibility/medication promises, and no links to the LIV practice domain.
- `npm run build` prerenders each of these to `dist/<slug>/index.html` with the full page, its title, description, canonical, and Open Graph tags (see Prerendered HTML below). Vercel serves these files before the SPA rewrite. The same build writes `dist/sitemap.xml` (`src/siteMap.ts`) for `/`, `/get-started`, the intent pages, and the other public routes. `vercel.json` keeps `/sitemap.xml` and `/robots.txt` out of the SPA rewrite and serves the sitemap as `application/xml`. `public/robots.txt` points at `https://trylocaldoctor.com/sitemap.xml`.
- Evaluation pages (`/dementia-evaluation`, `/alzheimers-evaluation`, `/memory-evaluation`) use the label **Start your evaluation** and send every button (hero, steps, mid-page, closing, sticky, and the two paths on `/memory-evaluation`) to `/evaluation`. `/alzheimers-blood-test` uses **Request the blood test** for those same primary buttons and also sends them to `/evaluation`. It adds a secondary text link, **See open visit times**, to `/get-started`. The other five intent pages use **See open visit times** and go to `/get-started`. Allow-listed params (`gclid`, `gbraid`, `wbraid`, `utm_*`) are kept on both; email, phone and other params are dropped. The header button uses each evaluation-form page's primary label (**Start your evaluation**, or **Request the blood test** on `/alzheimers-blood-test`) and says **Get started** everywhere else (`headerGetStartedLabel` in `src/App.tsx`). On the five booking pages that header no longer matches the page's own **See open visit times** buttons (`seeVisitTimesLabel`, which the `/evaluation` booking link also uses). The Treatments hero button says **Get started**. The homepage hero label (**Book a Neurologist today**) and the homepage sticky **Get Started** are unchanged. The hero reassurance line and facts panel use these claims only: board-certified neurologist, Maryland video visits, insurance accepted, and no referral needed. They do not promise a visit in days or a next-day appointment. That restriction applies to the intent pages only. The homepage, `/how-it-works` and `/get-started` carry approved speed copy, and `tests/landing-pages.spec.ts` no longer guards against it. The only phone link is the clinic number. `/dementia-test-online` stays informational: it says no online test is offered.
- Tracking on every intent page, `/get-started` and `/evaluation`: see Google Ads conversion tracking below. All events come from `src/analytics/tracking.ts`. SPA navigation keeps `gclid` / `utm_*` in the URL into `/get-started` and `/evaluation`. The Calendly embed receives the utm params, and the click id is written to Calendly's `salesforce_uuid` field (`src/calendlyUrl.ts`). The Typeform embed receives them as hidden fields.
- PostHog `eligibility_check_started` keeps `source_path` (the landing page) and adds `cta_location` (`hero`, `mid_page`, `closing`, `patient_path`, `caregiver_path`, `visit_times`). Nothing typed by the visitor is sent.
- `/dementia-test-online` is educational. It says no online screening tool is offered and sends people to the evaluation intake. It has no quiz and no score.
- **Changing where a landing page sends visitors:** set its funnel in `src/landing/destinations.ts` (`evaluationForm` is `{ kind: 'evaluation' }`, the on-site `/evaluation` page; `evaluation` is shared by four other pages and `onlineScreening` by `/dementia-test-online`). An `{ kind: 'external', href }` destination is still supported (https Typeform or trylocaldoctor.com only), but an external click cannot report a completion back to Google.
- Flag: `landingPages` in `src/featureFlags.ts` (`VITE_PAGE_LANDINGPAGES`).
- Tests: `tests/landing-pages.spec.ts` (desktop and mobile). `SCREENSHOT_DIR=... npx playwright test tests/landing-pages.spec.ts -g capture` saves screenshots.

## Services Page

`/services` (`src/services/`) lists every visit, test, and treatment as a card, with a search box and Visits / Treatments / Tests filters. Its header and footer links sit between How it works and Treatments.

- The list, prices, photos, and hidden search keywords are in `src/services/servicesData.ts`. Photos are in `public/assets/services/`; the Leqembi card uses `public/assets/hero-leqembi-iv.webp`.
- Prices and "with or without insurance" are the wording from the approved design. Like every other claim they need clinical and legal review before paid traffic.
- A card for a service that has its own page (a `slug` in `servicesData.ts`) opens that page and says **Learn more**; it logs no click, because it is not a booking. Every other card still says **Book now**, opens `/get-started`, and logs `cta_click` with location `service_card` (the closing buttons use `services_closing`, and the no-results button `services_empty`).
- Search and filter state is local to the page and starts empty, so the prerendered HTML and the hydrated page match.
- Flag: `services` in `src/featureFlags.ts` (`VITE_PAGE_SERVICES`). Tests: `tests/services-page.spec.ts`.

## Service Pages

Each service has its own page at `/services/<slug>`: `/services/memory-evaluation`, `/services/leqembi`, and `/services/kisunla` so far. They read like a consumer product page: a hero with the service photo, price, and a **Book now** button, then the visit or treatment options, what to expect, who it is for, FAQ, and a sticky **Book now** bar on phones. Every booking button goes to `/get-started` (the scheduler).

- **One layout, content as data.** `src/services/ServicePage.tsx` is the only layout. Each page's words are one entry in `src/services/servicePages.ts`; its name, price, and hero image come from its card in `servicesData.ts`, so the Services card and the page cannot show different pictures or prices. Treatment pages (Leqembi, Kisunla) add a drug-facts table and a safety section by filling in `details` and `safety`; the visit page leaves them out.
- **Adding the next service:** add its slug to `servicePageSlugs`, add its entry to `servicePages`, set `slug` on its card in `servicesData.ts`, and add its name to other pages' `moreCare` lists if wanted. Routing (`src/routes.ts`), head tags (`src/pageHead.ts`), the sitemap, and prerendering pick it up from the slug list. The tests loop over the same list.
- **Shared wording:** `availabilityLine` ("Appointments tomorrow"), `priceNote`, `regionNote` (Maryland), and `bookLabel` are exported from `servicePages.ts` and used on every page. Change them there.
- **Drug facts come from /treatments.** Route, MRI schedule, stopping rule, and ARIA rates are written exactly as in the Treatments comparison table, and `tests/service-pages.spec.ts` compares the two so they cannot drift. The pages say treatment can stop once amyloid is minimal on PET, give no slowing percentage (only "a real, moderate slowing"), and keep the "24/7 triage line" from the design (confirm that service is staffed before paid traffic).
- **Left out on purpose:** the mockups' sample patient reviews, "Clinician name" portrait cards, and empty "What to expect" photo slots. Nothing invented ships. Add real reviews, clinician names and photos, or step photos by extending the content type and layout when they are approved.
- **Kisunla image:** `public/assets/services/kisunla.webp` is a stand-in (the patient-and-caregiver photo). The only drug image on the site is the Leqembi bag, whose label reads LECANEMAB, so it is not reused. To use a donanemab image, replace that file and set `fit: 'contain'` on the Kisunla card if it is a cut-out on a plain background.
- **Tracking:** booking buttons log `cta_click` with `service_hero`, `service_options`, `service_band`, `service_help`, `service_care_team`, or `service_more_care` (a More care card for a service with no page yet), and the phone bar uses `sticky_mobile`. Links keep `gclid` and `utm_*`. Opening another service page is not a booking and logs nothing.
- **Sticky bar:** it anchors on the whole hero, not the Book now button. On a phone the button starts below the first screen, and the bar's observer only reacts when its anchor changes visibility, so a jump that skips the button would never show it.
- **Visit length:** the Leqembi and Kisunla intake visit says "30-60 min", while How it works and the intent pages say "about 1 hour". Align them when the real length is confirmed.
- **Not the intent page:** `/memory-evaluation` (an ad landing page that sends to `/evaluation`) is separate from `/services/memory-evaluation` (this page, which sends to `/get-started`). Each has its own title and canonical.
- Flag: the `services` flag also turns these pages off (a hidden service page is skipped by the prerender and redirects home). Tests: `tests/service-pages.spec.ts`.

## Prerendered HTML

`npm run build` renders every public route to static HTML at build time, so the first response already has the page text, H1, title, description, and canonical. Google's ads crawler and any visitor without JavaScript see the full page. The app then hydrates that HTML, so the Typeform embed, the `/evaluation` flow, and all tracking work as before.

- Steps: `vite build` (client, with a manifest), `vite build --ssr src/entry-server.tsx` (to `dist-server/`), then `node scripts/prerender.mjs`, which writes `dist/<path>/index.html` per route and keeps the empty shell as `dist/app-shell.html`.
- Routes: every enabled page in `src/routes.ts` (`prerenderLocations`), each blog post, and each intent landing page. A page that is off in `src/featureFlags.ts` (Meet the Team today) is not prerendered and still redirects to `/`.
- Head tags for each route come from `pageHead()` in `src/pageHead.ts`, which `usePageMeta` in `App.tsx` also uses after in-app navigation. Titles and descriptions live in `src/pageMeta.ts` and `src/landing/landingMeta.ts`.
- `vercel.json` rewrites any path without a prerendered file to `/app-shell.html`, which renders in the browser as before.
- Hydration rules: the first render in the browser must match the HTML. Anything that depends on the visitor's URL or screen (query params, `matchMedia`) uses the hooks in `src/hydration.ts`, which return the build-time value during hydration and the real one right after. Do not read `window` while rendering.
- A CTA tapped before the app hydrates still carries `gclid` / `utm_*` to `/get-started` and `/evaluation` (`src/earlyClicks.ts`).
- Code splitting: the Typeform page (`src/EvaluationPage.tsx`), the legal documents (`src/legal/LegalPages.tsx`), and `posthog-js` load in their own chunks (`src/routePages.ts`, `src/analytics/posthog.ts`). The prerendered HTML links a route's chunk and CSS so it loads in parallel.
- Tests: `npm run test:prerender` builds, serves `dist` the way Vercel does (`scripts/serve-dist.mjs`), and runs the whole suite plus `tests-prerender/` against it. `npm run test:e2e` still runs against the dev server.

## Prototype Boundaries

- Claims need clinical/legal review before paid traffic.
- Booking uses a Calendly inline embed on `/get-started`. Confirm that Calendly will sign a BAA, what it stores, and who owns follow-up before paid traffic.
- The site does not diagnose, prescribe, or guarantee eligibility or treatment.

## Google Ads conversion tracking

Vite SPA, so the browser env prefix is `VITE_` (not `NEXT_PUBLIC_`). The tag is injected into `index.html` at build time, and every prerendered page and the SPA fallback shell are built from that file. `src/main.tsx` also installs the tag if a build did not, using the same script-element pattern as the Calendly embed.

| Env var | Purpose |
| --- | --- |
| `VITE_GOOGLE_ADS_ID` | Google tag id. Production builds default to `AW-18413556843` when this is unset. Set to `off` to omit the tag. A value has to be present at **build** time. |
| `VITE_GOOGLE_ADS_LEAD_LABEL` | Optional override for the visit-booked label. Defaults to `KA47CJbG9LAdEOuoosxE`. Set to `off` to disable. |
| `VITE_GOOGLE_ADS_PHONE_LABEL` | Optional override for the phone-tap label. Defaults to `gJr-CJnG9LAdEOuoosxE`. Set to `off` to disable. |

All other labels live in one map, `ADS_CONVERSIONS` in `src/analytics/tracking.ts`. A label that is empty, malformed or starts with `PLACEHOLDER` skips the Ads call and still sends the GA4 event.

| Event | GA4 event | Ads conversion (`AW-18413556843/...`) | Fires |
| --- | --- | --- | --- |
| `visit_booked` | `visit_booked` and `generate_lead` | `KA47CJbG9LAdEOuoosxE`, 300 USD | Calendly `calendly.event_scheduled` only. Never from Typeform. |
| `phone_tap` | `phone_tap` and `phone_click` (every tap) | `gJr-CJnG9LAdEOuoosxE` | Click on the clinic `tel:` link, any page. |
| `cta_click` | `cta_click` (every click) | `A54CCNK03bUdEOuoosxE` | Booking or evaluation button click. Params: `page_path`, `cta_location`, `cta_label` (the real button text), `cta_destination`. |
| `calendly_viewed` | `calendly_viewed` | none (GA4 only) | Calendly `calendly.event_type_viewed`. |
| `calendly_time_selected` | `calendly_time_selected` | `CqZ_CKDm17UdEOuoosxE` | Calendly `calendly.date_and_time_selected`. |
| `evaluation_started` | `evaluation_started` | `r0XvCNW03bUdEOuoosxE` | Typeform `onStarted`, or the first `onQuestionChanged`. |
| `evaluation_submitted` | `evaluation_submitted` | `vOMaCO613bUdEOuoosxE`, 100 USD | Typeform `onSubmit`. Does not fire the booking label. |
| `engaged_visit` | `engaged_visit` | `DTk2CPG13bUdEOuoosxE` | Once per session, after 45 seconds visible and 50 percent scroll. |

Each Ads conversion is sent at most once per page session. GA4 `visit_booked`, `generate_lead` and the evaluation, Calendly and engaged events are deduped the same way; `cta_click` and `phone_click` report every action. Only these params are ever sent: `page_path`, `cta_location`, `cta_label`, `cta_destination`, `booking_source`, `form_name`, `send_to`, and `value`/`currency` where configured. No enhanced conversions, no user-provided data, and no consent mode. The Calendly and Typeform callbacks never read the invitee, the answers or a response id. Calendly messages are only accepted from `https://calendly.com`.

Notes:

- **Tag:** `gtag/js?id=AW-18413556843` and `gtag('config', 'AW-18413556843')` in the built `index.html` (`vite.config.ts`). When GA4 is enabled, that same snippet adds its `gtag('config', ...)` and still loads `gtag.js` once.
- **Page views:** the tag's first `config` hit sends a page location that keeps Google click ids and `utm_*` and drops every other query param, including anything with `@`. Later in-app navigations send `page_view` with `page_path` only.
- The bare Ads named events (`cta_click`, `phone_click`, `generate_lead` sent without a label) were dropped. Ads now only gets labeled conversions.

Tests: `tests/tracking.spec.ts` (planner, labels, dedupe, no answer data), `tests/conversion-flow.spec.ts` (browser flow), `tests/google-ads.spec.ts`.

## Google Analytics 4

GA4 rides on the same gtag snippet as Google Ads. Production builds default to measurement id `G-PR7CJ8TK79` when `VITE_GA_MEASUREMENT_ID` is unset. Code is in `src/analytics/googleAnalytics.ts` (install, sanitized page location, and in-app page views) and `src/analytics/googleAnalyticsConfig.ts` (id resolution). The shared HTML snippet and the `page_location` sanitizer live with the Ads code so the two tags cannot drift.

| Env var | Purpose |
| --- | --- |
| `VITE_GA_MEASUREMENT_ID` | GA4 measurement id. Production builds default to `G-PR7CJ8TK79` when this is unset. Set to `off`, `false`, or `0` to omit GA4. A value has to be present at **build** time. |

What it sends (no names, emails, phone numbers, dates of birth, diagnoses, free-text answers, or Typeform response ids):

- **First hit:** `gtag('config', 'G-PR7CJ8TK79', { page_location })` in the built `index.html`. `page_location` uses the Ads sanitizer: Google click ids (`gclid`, `gbraid`, `wbraid`, and the other ad params) and `utm_*` stay; every other query param is dropped, including anything with `@`.
- **In-app navigations:** `page_view` with `send_to` set to the measurement id and `page_path` only, same rules as the Ads SPA page view. The first load does not send a second page view.
- **Events:** GA4 receives the event names in the Google Ads table above (`visit_booked`, `generate_lead`, `phone_tap`, `phone_click`, `cta_click`, `calendly_*`, `evaluation_*`, `engaged_visit`) with `send_to` set to the measurement id. Mark `visit_booked` / `generate_lead`, `phone_tap` and `evaluation_submitted` as key events in GA4. Do not also import those GA4 key events into Ads as conversions, to avoid double counting.
- **`/get-started` and `/evaluation`:** a path-only page view is allowed. This code does not send `form_start` or `form_submit` and does not read field values. The scheduler and the evaluation form are third-party iframes.

Enhanced measurement is configured in the GA4 property, not in this repo. gtag.js has no config flag that turns those events off. In Admin → Data streams → the web stream → Enhanced measurement:

- Turn **Form interactions** off so GA4 does not collect `form_start` / `form_submit`.
- Under Page views → advanced settings, turn **Page changes based on browser history events** off. The site sends its own route `page_view`. Leaving the history listener on double-counts those routes and can send the raw URL, including query params the sanitizer removed.

`VITE_GA_MEASUREMENT_ID` is inlined at build time. Set it on Vercel for Production and Preview only when the id should differ from the default, then redeploy. This repo does not change Vercel env.

Tests: `tests/google-analytics.spec.ts`.

## PostHog analytics

Browser analytics via `posthog-js`, set up with the PostHog wizard. Code is in `src/analytics/posthog.ts` (init and events). It is separate from the Google Ads and GA4 tags above.

| Env var | Purpose |
| --- | --- |
| `VITE_POSTHOG_KEY` | PostHog project token (public). Without it PostHog does not start, so local dev and CI send nothing. |
| `VITE_POSTHOG_HOST` | PostHog ingestion host for the project's region. |

Both are inlined at **build** time, so set them on Vercel for Production and Preview and redeploy after a change. Keep real values in an untracked `.env` (see `.env.example`).

What it does:

- Captures pageviews (including in-app navigation), autocapture, unhandled errors, and session replay, as configured by the wizard defaults and the PostHog project settings. It runs the same on every route, including `/get-started` and `/evaluation`.
- `capture_pageview` is pinned to `'history_change'`: a pageview on first load and on every path change. Query-only and hash-only changes do not send one.
- The Calendly scheduler on `/get-started`, the evaluation form on `/evaluation`, and the site-wide chatbot are separate cross-origin iframes, so PostHog cannot read what visitors type into them.
- Uses memory-only persistence: no cookies or localStorage, so every page load is a new anonymous visitor. There is no `identify()` call.
- Sends one custom event, `eligibility_check_started`, with `source_path` and the button's `cta_location` (never anything the visitor typed) when a visitor clicks a call-to-action button (`trackCtaClick` in `src/App.tsx`). The Calendly booking and phone-click events stay in the Google Ads code only. PostHog autocapture records `tel:` link clicks.

Tests: `tests/posthog.spec.ts`. The Playwright dev server points PostHog at `/__posthog` on itself (`playwright.config.ts`), so test runs never reach a real project. The browser tests mask `navigator.webdriver` and the headless client hints because posthog-js ignores bots.

## Chatbot

A hosted AI chat agent (served from `forms.mylocalinfusion.com`) is added by `src/chatbot.ts`, not by `index.html`. It never loads on `/get-started` or `/evaluation` (and `html[data-chatbot-hidden]` hides it if it was already loaded before an in-app navigation there). On desktop it loads after window load. On phones (max width 680px) it waits for a 700px scroll or 30 seconds so it does not cover the hero reassurance line. To change the agent, replace the embed URL in `src/chatbot.ts`. Appearance and greeting are set on the agent itself.

Tests: `tests/chatbot-embed.spec.ts`. `playwright.config.ts` blocks the chatbot host in the test browser, so test runs never reach the live agent.

## Commands

```bash
npm install
npm run dev
npm run build
npm run lint
```
