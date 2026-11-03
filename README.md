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
- Production intake form: Typeform live embed `01M64J1XGXT19BH7GGWPKJ243K`

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

- **Tag:** `gtag/js?id=AW-18413556843` and `gtag('config', 'AW-18413556843')` in the built `index.html` (`vite.config.ts`).
- **Lead:** `generate_lead` with `page_path` only, from the Typeform embed on `/get-started` (`data-tf-on-submit="localDoctorOnTypeformSubmit"` plus a `form-submit` message from `*.typeform.com`). When `VITE_GOOGLE_ADS_LEAD_LABEL` is set, the same action also sends the conversion above. Fired in `src/analytics/googleAds.ts`.
- **Phone:** `phone_click` with `page_path` only, for clicks on `tel:` links to (240) 376-5730. When `VITE_GOOGLE_ADS_PHONE_LABEL` is set, the same click also sends the conversion above. (844) 509-1404 is recognized if a `tel:` link for it is added later; it is not on the site. The 1-800 numbers on the patient-rights page are not tracked.
- **Page views:** the tag's first `config` hit sends a page location that keeps Google click ids (`gclid`, `gbraid`, `wbraid`, and the other ad params) and drops every other query param, including anything with `@`. Later in-app navigations send `page_view` with `page_path` only.

"Check eligibility" and other buttons that open `/get-started` do not submit a lead, so they are not conversion events. There is no separate book/schedule widget.

Set both label variables on Vercel for Production and Preview. Vite inlines them at build time, so a new deployment is required after a change. Google still receives `generate_lead` and `phone_click` alongside the labeled conversion. Keep one primary conversion per action in Ads so the named event and the label are not both counted.

## Commands

```bash
npm install
npm run dev
npm run build
npm run lint
```
