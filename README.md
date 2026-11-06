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
- Production intake form: Typeform live embed `01M6Q39ZHJB5XWV15ABEYGFGS1`

## What It Includes

- Patient-facing home page with intent-path routing
- Treatment page for Leqembi/Kisunla, with hedged drug-effect language
- How-it-works page mapped to the 13-step patient journey
- Provider referral page
- Get-started page with embedded Typeform intake form and call scheduler
- FAQ, resources, and pilot plan pages
- Vercel SPA rewrites for direct route loading

## Page Feature Flags

Every page has a visibility flag in `src/featureFlags.ts`. A disabled page is removed from the header, footer, and in-page links, and a direct visit redirects to `/`. Meet the Team (`about`) is currently off. Contact (`contact`) is on but intentionally not linked from the footer.

- Change a default in `src/featureFlags.ts` and open a PR.
- Or override per Vercel environment with `VITE_PAGE_<KEY>=true|false` (for example `VITE_PAGE_ABOUT=true` on Preview only). Env vars are read at build time, so redeploy after changing one.
- `home` cannot be disabled; it is the redirect target.
- Hiding is not security: a disabled page's code is still in the JS bundle.

## Intent Landing Pages

Seven search-intent pages live in `src/landing/`: `/dementia-evaluation`, `/alzheimers-evaluation`, `/memory-evaluation`, `/alzheimers-doctor-maryland`, `/memory-specialist-maryland`, `/alzheimers-second-opinion`, and `/dementia-test-online`.

- Copy is in `landingContent.ts`. Titles and descriptions are in `landingMeta.ts`. Claims must come from existing site or compliance copy: no credentials, wait times, prices, outcome rates, or diagnosis/eligibility/medication promises, and no links to the LIV practice domain.
- `npm run build` also writes `dist/<slug>/index.html` with that page's title, description, canonical, and Open Graph tags (`vite.config.ts`). The app bundle is the same; Vercel serves these files before the SPA rewrite.
- Every primary button is **Get Started** and goes to `/get-started`. The only phone link is the clinic number, which the Ads phone conversion already tracks.
- PostHog `eligibility_check_started` keeps `source_path` (the landing page) and adds `cta_location` (`hero`, `mid_page`, `closing`, `patient_path`, `caregiver_path`). Nothing typed by the visitor is sent.
- `/dementia-test-online` is educational. It says no online screening tool is offered and sends people to the evaluation intake. It has no quiz and no score.
- **When Eric's evaluation or screening Typeform is ready:** set the funnel in `src/landing/destinations.ts` (`evaluation` or `onlineScreening`) to `{ kind: 'external', href: 'https://...' }`. Only https Typeform or trylocaldoctor.com URLs are accepted. An external form does not fire the Typeform lead conversion that the `/get-started` embed does. Before pointing `onlineScreening` at a screener, revise the `/dementia-test-online` copy that says no screening is offered.
- Flag: `landingPages` in `src/featureFlags.ts` (`VITE_PAGE_LANDINGPAGES`).
- Tests: `tests/landing-pages.spec.ts` (desktop and mobile). `SCREENSHOT_DIR=... npx playwright test tests/landing-pages.spec.ts -g capture` saves screenshots.

## Prototype Boundaries

- Claims need clinical/legal review before paid traffic.
- Intake uses Eric's Typeform live embed; confirm the receiving workflow, privacy language, and follow-up ownership before paid traffic.
- The site does not diagnose, prescribe, or guarantee eligibility or treatment.

## Google Ads conversion tracking

Vite SPA, so the browser env prefix is `VITE_` (not `NEXT_PUBLIC_`). The tag is injected into `index.html` at build time, and the Vercel rewrite serves that shell for every route. `src/main.tsx` also installs the tag if a build did not, using the same script-element pattern as the Typeform embed.

| Env var | Purpose |
| --- | --- |
| `VITE_GOOGLE_ADS_ID` | Google tag id. Production builds default to `AW-18413556843` when this is unset. Set to `off` to omit the tag. A value has to be present at **build** time. |
| `VITE_GOOGLE_ADS_LEAD_LABEL` | `KA47CJbG9LAdEOuoosxE`. Account 908-258-0886, conversion “Local Doctor - Lead Typeform”. A Typeform submit sends `gtag('event', 'conversion', { send_to: 'AW-18413556843/KA47CJbG9LAdEOuoosxE' })`. |
| `VITE_GOOGLE_ADS_PHONE_LABEL` | `gJr-CJnG9LAdEOuoosxE`. Account 908-258-0886, conversion “Local Doctor - Phone click”. A clinic phone click sends `gtag('event', 'conversion', { send_to: 'AW-18413556843/gJr-CJnG9LAdEOuoosxE' })`. |

Event snippets (no names, emails, phone numbers, dates of birth, diagnoses, free-text answers, or Typeform response ids):

- **Tag:** `gtag/js?id=AW-18413556843` and `gtag('config', 'AW-18413556843')` in the built `index.html` (`vite.config.ts`). When GA4 is enabled, that same snippet adds its `gtag('config', …)` and still loads `gtag.js` once. See Google Analytics 4 below.
- **Lead:** `generate_lead` with `page_path` only, from the Typeform embed on `/get-started` (`data-tf-on-submit="localDoctorOnTypeformSubmit"` plus a `form-submit` message from `*.typeform.com`). When `VITE_GOOGLE_ADS_LEAD_LABEL` is set, the same action also sends the conversion above. Fired in `src/analytics/googleAds.ts`.
- **Phone:** `phone_click` with `page_path` only, for clicks on `tel:` links to (240) 376-5730. When `VITE_GOOGLE_ADS_PHONE_LABEL` is set, the same click also sends the conversion above. (844) 509-1404 is recognized if a `tel:` link for it is added later; it is not on the site. The 1-800 numbers on the patient-rights page are not tracked.
- **Page views:** the tag's first `config` hit sends a page location that keeps Google click ids (`gclid`, `gbraid`, `wbraid`, and the other ad params) and drops every other query param, including anything with `@`. Later in-app navigations send `page_view` with `page_path` only.

"Get Started" and other buttons that open `/get-started` do not submit a lead, so they are not conversion events. There is no separate book/schedule widget.

Set both label variables on Vercel for Production and Preview. Vite inlines them at build time, so a new deployment is required after a change. Google still receives `generate_lead` and `phone_click` alongside the labeled conversion. Keep one primary conversion per action in Ads so the named event and the label are not both counted.

## Google Analytics 4

GA4 rides on the same gtag snippet as Google Ads. Production builds default to measurement id `G-PR7CJ8TK79` when `VITE_GA_MEASUREMENT_ID` is unset. Code is in `src/analytics/googleAnalytics.ts` (install, sanitized page location, and in-app page views) and `src/analytics/googleAnalyticsConfig.ts` (id resolution). The shared HTML snippet and the `page_location` sanitizer live with the Ads code so the two tags cannot drift.

| Env var | Purpose |
| --- | --- |
| `VITE_GA_MEASUREMENT_ID` | GA4 measurement id. Production builds default to `G-PR7CJ8TK79` when this is unset. Set to `off`, `false`, or `0` to omit GA4. A value has to be present at **build** time. |

What it sends (no names, emails, phone numbers, dates of birth, diagnoses, free-text answers, or Typeform response ids):

- **First hit:** `gtag('config', 'G-PR7CJ8TK79', { page_location })` in the built `index.html`. `page_location` uses the Ads sanitizer: Google click ids (`gclid`, `gbraid`, `wbraid`, and the other ad params) and `utm_*` stay; every other query param is dropped, including anything with `@`.
- **In-app navigations:** `page_view` with `send_to` set to the measurement id and `page_path` only, same rules as the Ads SPA page view. The first load does not send a second page view.
- **Not copied from Ads:** Typeform lead and clinic phone conversions stay `gtag` calls in `src/analytics/googleAds.ts` with their Ads `send_to` labels. GA4 does not get a `generate_lead`, `phone_click`, or `conversion` event.
- **`/get-started`:** a path-only page view is allowed. This code does not send `form_start` or `form_submit` and does not read field values. The intake form is a Typeform iframe, and the React pages do not render a `<form>`.

Enhanced measurement is configured in the GA4 property, not in this repo. gtag.js has no config flag that turns those events off. In Admin → Data streams → the web stream → Enhanced measurement:

- Turn **Form interactions** off so GA4 does not collect `form_start` / `form_submit`.
- Under Page views → advanced settings, turn **Page changes based on browser history events** off. The site sends its own route `page_view`. Leaving the history listener on double-counts those routes and can send the raw URL, including query params the sanitizer removed.

`VITE_GA_MEASUREMENT_ID` is inlined at build time. Set it on Vercel for Production and Preview only when the id should differ from the default, then redeploy. This repo does not change Vercel env.

Tests: `tests/google-analytics.spec.ts`.

## PostHog analytics

Browser analytics via `posthog-js`, set up with the PostHog wizard and then tightened for a healthcare site. Code is in `src/analytics/posthog.ts` (init and events) and `src/analytics/posthogConfig.ts` (the `/get-started` filter). It is separate from the Google Ads and GA4 tags above.

| Env var | Purpose |
| --- | --- |
| `VITE_POSTHOG_KEY` | PostHog project token (public). Without it PostHog does not start, so local dev and CI send nothing. |
| `VITE_POSTHOG_HOST` | PostHog ingestion host for the project's region. |

Both are inlined at **build** time, so set them on Vercel for Production and Preview and redeploy after a change. Keep real values in an untracked `.env` (see `.env.example`).

What it does:

- Captures pageviews (including in-app navigation), autocapture, unhandled errors, and session replay, as configured by the wizard defaults and the PostHog project settings.
- **Sends nothing from `/get-started`**, the only page where visitors enter health details (the Typeform embed). `before_send` drops every event whose URL is that page (pageviews, autocapture, errors, replay snapshots, logs), and replay is paused while the visitor is there and resumed when they leave. Properties that remember the page (session entry URL, previous pageview, landing URL, referrer) are removed from later events.
- Uses memory-only persistence: no cookies or localStorage, so every page load is a new anonymous visitor. There is no `identify()` call.
- Turns off the feature-flags request (`advanced_disable_flags`). That request is not covered by `before_send` and carries the landing URL, which can be `/get-started`. Feature flags, surveys, and web experiments are therefore unavailable until that is solved another way.
- Sends one custom event, `eligibility_check_started` with `source_path`, when a visitor clicks through to `/get-started`. The Typeform submit and phone-click events stay in the Google Ads code only. PostHog autocapture records `tel:` link clicks.

Tests: `tests/posthog.spec.ts`. The Playwright dev server points PostHog at `/__posthog` on itself (`playwright.config.ts`), so test runs never reach a real project. The browser tests mask `navigator.webdriver` and the headless client hints because posthog-js ignores bots.

## Commands

```bash
npm install
npm run dev
npm run build
npm run lint
```
