# Local Doctor marketing dashboard

A small, password-protected Next.js app that shows how marketing is doing for
Local Doctor (trylocaldoctor.com): Google Ads, GA4 and offline lead counts in one
place. It lives in `dashboard/` and deploys as its own Vercel project. It does not
touch the marketing site in the repo root.

It is meant for Kenny, Eric and a few team members to check daily, on a laptop
or a phone. It stays on its default Vercel project URL (`<project>.vercel.app`);
no custom domain is needed.

## What it shows

Every section has its own date range (7, 30 or 90 days, or custom) and a day /
week / month grouping toggle.

1. **Overview**: spend, impressions, clicks, CTR, avg CPC, primary conversions,
   cost per primary conversion, calls from ads, secondary conversion counts,
   separate spend / clicks / primary-conversion charts (no shared axis), and a
   funnel: impressions, clicks, landing page sessions,
   on-page actions, evaluation started, evaluation submitted or booked, calls.
2. **Campaigns**: status, bid strategy (for example Maximize clicks with a max
   CPC cap), daily budget, spend, clicks, conversions, calls.
3. **Ads (listings)**: each ad's headlines and descriptions, a preview, and the
   sitelinks, call asset, callouts and structured snippets. Metrics are per
   link. A removed link stays listed, labeled Removed, when it had impressions
   in the range.
4. **Keywords**: text, match type, ad group, status, bid or cap (Maximize clicks
   leads with the campaign max CPC cap), impressions,
   clicks, CPC, spend, conversions, impression share.
5. **Search terms**: actual search terms with match source, filterable and
   sortable, as a range total or per day / week / month.
6. **Landing pages**: GA4 sessions, engaged sessions and key events next to the
   Ads landing page report (clicks, spend, conversions).
7. **On-page actions**: GA4 events (`cta_click`, `phone_tap`,
   `evaluation_started`, `evaluation_submitted`, `visit_booked` and others) with
   counts and rate per session.
8. **Conversions**: primary (biddable) and secondary Ads conversion actions with
   counts, % of clicks and cost per action, plus GA4 conversion events as % of
   sessions.
9. **Spend roll-up**: account, campaign, ad group and keyword spend in an
   expandable tree.
10. **Offline leads**: daily phone lead and booked patient counts entered by the
    clinic team, next to ad clicks, calls from ads and site phone taps.

GA4 sections have a "Paid search / All traffic" switch. If GA4 is not connected
those sections say "GA4 not connected yet" and the Ads sections keep working (and
the other way round).

## Privacy rules (hard)

- Aggregate numbers only. No PHI, names, emails, phone numbers of patients, form
  answers, Typeform responses, IP addresses, gclids or any user-level data.
- The Typeform responses API is never called.
- GA4 is queried for event names and counts only, from an allow-list
  (`lib/privacy.ts`). Event parameters are never pulled.
- Every URL is stored as a path; query strings and fragments (where gclid and
  utm values live) are stripped before storage.
- The offline entry form accepts a date, two whole numbers and an optional short
  note labeled "no patient info". The server rejects notes that look like an
  email address, a phone or ID number, or a date.
- Search terms are stored; they are aggregate Google data.
- The call asset's phone number is the clinic's business line.

## How it works

```
Vercel Cron (06:00 UTC daily) ──┐
"Refresh now" button ───────────┴─> refresh job (lib/refresh.ts)
                                        │  Google Ads API (GAQL over REST searchStream)
                                        │  GA4 Data API (runReport, service account)
                                        v
                         Vercel Blob (private): dashboard/snapshot.json
                                        │
          Dashboard page (server) reads snapshot + offline leads
                                        v
           Client computes any range / grouping from daily rows
```

- **Refresh job** (`lib/refresh.ts`): pulls `SNAPSHOT_LOOKBACK_DAYS` (default
  400) days through yesterday in the Ads account time zone, normalizes
  everything to one row per day per entity, and writes one JSON document. If one
  source fails, the last good data for that source is kept and the error is shown
  in the status strip. Optional queries (assets, search terms and so on) degrade
  to a "partial" warning instead of failing the whole pull.
- **Cron**: `vercel.json` schedules `GET /api/cron/refresh` at `0 6 * * *`
  (06:00 UTC, which is 07:00 in Madrid in winter and 08:00 in summer). Vercel
  sends `Authorization: Bearer $CRON_SECRET`; the route refuses anything else.
  On the Hobby plan Vercel may run it any time within that hour.
- **Refresh now**: `POST /api/refresh`, needs a signed-in session, and is limited
  to once every 10 minutes (shared with the cron run). A conditional write on a
  small state file stops two refreshes from running at once.
- **Aggregation** (`lib/aggregate.ts`, `lib/dates.ts`, `lib/views.ts`): pure
  functions that filter daily rows to a range and bucket them by day, ISO week
  (Monday start) or month. Impression share is recomputed for any range from
  `impressions / eligibleImpressions`.

### Why Vercel Blob (and not Upstash or KV)

The data is one JSON document written once a day and read on each page view, plus
a tiny offline-leads document edited a few times a day by one person. That is a
file, not a database workload:

- Blob stores the whole snapshot as one private object, so there is no per-key
  size limit to work around (Redis values are capped around 1 MB on common
  plans, and a year of search terms can exceed that).
- ETag conditional writes (`ifMatch`) give safe read-modify-write for the
  offline leads and the refresh lock without a second service.
- It is a first-party Vercel store: one click to connect, one env var
  (`BLOB_READ_WRITE_TOKEN`), no Marketplace account.

If the dashboard ever needs per-user writes or high write rates, Upstash Redis via
the Marketplace would be the next step.

### Files in the Blob store

| Path | What |
| --- | --- |
| `dashboard/snapshot.json` | Normalized snapshot. Schema: `schema/snapshot.schema.json` |
| `dashboard/offline-leads.json` | `{ schemaVersion: 1, entries: [{ date, phoneLeads, bookedPatients, note?, updatedAt }] }` |
| `dashboard/refresh-state.json` | Last refresh start and finish time, for rate limiting |

## Snapshot schema and example data

- JSON Schema: [`schema/snapshot.schema.json`](schema/snapshot.schema.json)
  (TypeScript mirror: `lib/types.ts`). A test validates the fixture against it.
- Example data: [`fixtures/example-snapshot.json`](fixtures/example-snapshot.json)
  is **made-up EXAMPLE data**, generated by `npm run fixture` with a seeded random
  generator. Campaign names start with `[Example]` and `isExample` is `true`.
- The dashboard shows the example data, with a yellow **Example data** banner,
  whenever no real snapshot with data exists yet (no credentials, no storage, or
  no refresh has run), or when `USE_EXAMPLE_DATA=1`. In that mode the offline
  section also shows example counts until real numbers are entered.

## Access

- One shared password (`DASHBOARD_PASSWORD`) gates every page and API route via
  `proxy.ts` (Next.js 16's name for middleware).
- Signing in sets an httpOnly, `SameSite=Lax`, `Secure` (in production) cookie
  signed with HMAC-SHA256. It lasts 30 days. Changing `DASHBOARD_PASSWORD`
  signs everyone out.
- If `DASHBOARD_PASSWORD` is not set, the app fails closed: everything stays
  locked.
- `OFFLINE_ENTRY_PASSWORD` (optional) adds a second password just for saving
  offline numbers, if you want only Eric to be able to edit them.
- Every response has `X-Robots-Tag: noindex, nofollow`, pages have a robots meta
  tag, and `/robots.txt` disallows everything.

## Environment variables

| Variable | Required | What it is |
| --- | --- | --- |
| `DASHBOARD_PASSWORD` | Yes | Shared password for the dashboard. |
| `SESSION_SECRET` | Recommended | Long random string mixed into the cookie signature. |
| `OFFLINE_ENTRY_PASSWORD` | No | Extra password required to save offline lead numbers. |
| `CRON_SECRET` | Yes on Vercel | Long random string. Vercel Cron sends it as a bearer token. |
| `BLOB_READ_WRITE_TOKEN` | Yes on Vercel | Added automatically when a Blob store is connected. |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | For Ads | Developer token from the manager account's API Center. |
| `GOOGLE_ADS_CLIENT_ID` | For Ads | OAuth client ID (Google Cloud, type Desktop or Web). |
| `GOOGLE_ADS_CLIENT_SECRET` | For Ads | OAuth client secret. |
| `GOOGLE_ADS_REFRESH_TOKEN` | For Ads | Refresh token for a Google user with access to the accounts, scope `https://www.googleapis.com/auth/adwords`. |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | For Ads | Manager account, digits only: `1098010850`. |
| `GOOGLE_ADS_CUSTOMER_ID` | For Ads | Advertiser account, digits only: `9082580886`. |
| `GOOGLE_ADS_API_VERSION` | No | Defaults to `v26`. Bump when Google sunsets it. |
| `GA4_PROPERTY_ID` | For GA4 | `562274971`. |
| `GA4_SERVICE_ACCOUNT_JSON` | For GA4 | Service account key JSON (one line), or the same JSON base64-encoded. |
| `SNAPSHOT_LOOKBACK_DAYS` | No | Days of history per refresh, 7 to 730. Default 400. |
| `DASHBOARD_TIMEZONE` | No | Fallback time zone for "yesterday". Default `America/New_York`. |
| `USE_EXAMPLE_DATA` | No | `1` forces the example data. |

All values live in env vars only. Nothing secret is committed. See
[`.env.example`](.env.example).

## Setup

### 1. Create the Vercel project

1. In Vercel, **Add New > Project**, import this GitHub repo.
2. Set **Root Directory** to `dashboard`. Framework preset: Next.js (detected).
   Leave build and install commands as default.
3. Deploy. Without env vars it shows the login page and stays locked until
   `DASHBOARD_PASSWORD` is set.
4. The dashboard is then reachable at the project's default
   `<project>.vercel.app` URL.

Two Vercel projects, two ignore rules. They do not share one:

- **Marketing site** (repo root `vercel.json`): `ignoreCommand` is `exit 1`.
  Vercel treats exit 1 as "do not skip", so that project builds on every push.
  Leave this as it is.
- **Dashboard** (`dashboard/vercel.json`): `scripts/vercel-ignore.sh` exits 0
  (skip) only when `dashboard/` did not change, and exits 1 (build) when it
  did. The pathspec is `:/dashboard`, which is from the repo root, so the check
  is the same whether Vercel runs the command from the repo root or from the
  `dashboard/` root directory. A git error (for example no parent commit) also
  exits 1, so the build proceeds. Manual redeploys from the Vercel UI still
  build. If the project has an Ignored Build Step typed into the Vercel UI, that
  overrides this file: leave the UI on its default so this command is the one
  that runs.

A push that only changes the marketing site rebuilds the marketing site and
skips the dashboard. A push that changes `dashboard/` builds the dashboard.

If Vercel Deployment Protection (Vercel Authentication) is on for production, the
team needs Vercel accounts on top of the dashboard password. Turning it on only
for previews is a reasonable middle ground; cron runs against production.

### 2. Connect storage

In the project, **Storage > Create > Blob**, create a store (private access is
used by the code), and connect it to the project for Production and Preview.
This adds `BLOB_READ_WRITE_TOKEN`.

### 3. Add env vars

Add the variables from the table above in **Settings > Environment Variables**
(Production, and Preview if you want previews to pull real data), then redeploy.

Generate random secrets with `openssl rand -base64 32`.

### 4. Google Ads API access

1. **Developer token**: in the manager account (109-801-0850), **Tools > API
   Center**. Test access only works with test accounts; apply for Basic access to
   read the real account.
2. **OAuth client**: in Google Cloud, enable the Google Ads API, then create an
   OAuth client ID.
3. **Refresh token**: sign in as a Google user who can see account
   908-258-0886 through the manager account, with scope
   `https://www.googleapis.com/auth/adwords`, for example with the OAuth 2.0
   Playground (use your own client ID and secret in its settings) or Google's
   `generate_user_credentials` example script. Put the refresh token in
   `GOOGLE_ADS_REFRESH_TOKEN`.
4. Set `GOOGLE_ADS_LOGIN_CUSTOMER_ID=1098010850` and
   `GOOGLE_ADS_CUSTOMER_ID=9082580886`.

### 5. GA4 service account

1. In Google Cloud, enable the **Google Analytics Data API**.
2. **IAM & Admin > Service Accounts > Create**. No project roles are needed.
3. On the service account, **Keys > Add key > JSON**. Paste the whole file into
   `GA4_SERVICE_ACCOUNT_JSON` (one line, or base64 of the file).
4. In GA4, **Admin > Property > Property access management** for property
   **562274971**, add the service account's email (`...@...iam.gserviceaccount.com`)
   with the **Viewer** role.
5. Set `GA4_PROPERTY_ID=562274971`.

### 6. First pull and cron

- Sign in and press **Refresh now**, or wait for the daily cron at 06:00 UTC.
- Check **Settings > Cron Jobs** in Vercel to see the schedule and run history.
  Crons only run on the production deployment.
- The status strip under the header shows each source as Connected, Not connected
  yet, or Error with the message from Google.

## Local development

```bash
cd dashboard
npm install
cp .env.example .env.local   # set DASHBOARD_PASSWORD at least
npm run dev                  # http://localhost:3000
```

Without `BLOB_READ_WRITE_TOKEN`, local dev reads and writes JSON files in
`dashboard/.data/` (gitignored). Without Google credentials it shows the example
data.

Other scripts:

| Command | What |
| --- | --- |
| `npm run build` | Production build |
| `npm test` | Vitest: date ranges and grouping, aggregation and roll-up, auth tokens and the proxy, privacy guards, schema validation |
| `npm run typecheck` | TypeScript |
| `npm run fixture` | Regenerate the example fixture |
| `npm run check-copy` | Fails on em or en dashes in any dashboard file |

## Code map

| Path | What |
| --- | --- |
| `proxy.ts` | Password gate for every page and API route |
| `lib/auth.ts` | Signed session cookie and password check |
| `lib/google-ads.ts` | GAQL queries and normalization |
| `lib/ga4.ts` | GA4 Data API reports |
| `lib/refresh.ts` | Refresh job, rate limit, snapshot write |
| `lib/storage.ts` | Vercel Blob (or local files in dev) |
| `lib/snapshot.ts` | Loads the stored snapshot or the example |
| `lib/offline.ts` | Offline leads validation and storage |
| `lib/aggregate.ts`, `lib/dates.ts`, `lib/views.ts` | Range, grouping and roll-up math |
| `app/api/*` | Login, logout, refresh, cron, offline leads |
| `components/` | Dashboard UI and sections |
