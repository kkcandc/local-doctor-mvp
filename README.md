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
- Production intake form: Typeform live embed `01M0ZD7ZA356YBE7W9E0GTFJ4T`

## What It Includes

- Patient-facing home page with intent-path routing
- Treatment page for Leqembi/Kisunla, with hedged drug-effect language
- How-it-works page mapped to the 13-step patient journey
- Provider referral page
- Get-started page with embedded Typeform intake form and call scheduler
- FAQ, resources, and pilot plan pages
- Vercel SPA rewrites for direct route loading

## Prototype Boundaries

- Claims need clinical/legal review before paid traffic.
- Intake uses Eric's Typeform live embed; confirm the receiving workflow, privacy language, and follow-up ownership before paid traffic.
- The site does not diagnose, prescribe, or guarantee eligibility or treatment.

## Commands

```bash
npm install
npm run dev
npm run build
npm run lint
```
