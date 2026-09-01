# Local Doctor Launch Next Steps - 2026-08-25

## Domain status

Vercel project: `kenny-klines-projects/local-doctor-mvp`

Attached domains:
- `trylocaldoctor.com`
- `www.trylocaldoctor.com`

Current issue:
- `www.trylocaldoctor.com` is valid in Vercel.
- `trylocaldoctor.com` is attached but has one conflicting Namecheap A record.

DNS cleanup needed in Namecheap:
- Keep `A @ 76.76.21.21`
- Remove `A @ 162.255.119.134`
- Keep `CNAME www cname.vercel-dns.com`

After cleanup:
- Run `vercel domains verify trylocaldoctor.com`
- Test `https://trylocaldoctor.com` and `https://www.trylocaldoctor.com`

## Pilot keyword seed list

Use these as a starting keyword set for the Alzheimer's pilot. Until Google/LegitScript certification is confirmed, avoid bidding directly on prescription drug names.

### Highest-intent evaluation / second opinion

- alzheimer's second opinion
- dementia second opinion
- memory diagnosis second opinion
- alzheimer's specialist near me
- dementia specialist near me
- memory loss specialist
- memory clinic near me
- memory loss doctor near me
- mild cognitive impairment doctor
- early alzheimer's evaluation
- alzheimer's evaluation online
- virtual alzheimer's specialist
- virtual memory specialist

### Treatment-readiness without drug-name bidding

- alzheimer's treatment eligibility
- early alzheimer's treatment options
- mild alzheimer's treatment options
- disease modifying alzheimer's treatment
- amyloid testing for alzheimer's
- alzheimer's treatment second opinion
- memory specialist treatment review
- cognitive impairment treatment options

### Symptom-stage / lower intent

- mild memory change
- memory loss getting worse
- early dementia symptoms
- early alzheimer's symptoms
- age related memory problems
- memory changes in parent
- memory issues in spouse
- lost a step mentally
- cognitive decline symptoms
- when to see a doctor for memory loss

### Caregiver / support searches

- help for parent with memory loss
- spouse memory problems doctor
- loved one early dementia
- dementia evaluation for parent
- alzheimer's evaluation for loved one
- memory loss appointment for parent

### Market modifiers

Append the first launch city/state once target states are confirmed:
- `[keyword] [city]`
- `[keyword] near [city]`
- `[keyword] [state]`
- `virtual [keyword] [state]`

### Hold for certification / research only

Do not use as paid keywords until Google healthcare / restricted drug-term approval is confirmed:
- Leqembi
- lecanemab
- Kisunla
- donanemab
- Leqembi near me
- Kisunla near me
- get Leqembi
- get Kisunla

Use Leqembi and Kisunla brand sites for messaging research, landing-page education, and SEO/resource planning.

### Negative keyword starter set

- coupon
- discount
- manufacturer
- clinical trial
- study
- side effects
- dosage
- pharmacy
- prescription
- jobs
- career
- training
- definition
- free

## A/B testing recommendation

For the first 10-patient pilot, do not overbuild a formal sitewide experimentation stack. Traffic will likely be too low for statistically clean landing-page A/B tests.

Recommended approach:
1. Use Google Ads Experiments for campaign-level tests once campaigns are live.
2. Use separate landing URLs for intent cohorts:
   - `/get-started`
   - `/alzheimers-second-opinion-[market]`
   - `/memory-specialist-[market]`
3. Install Microsoft Clarity for session replay and heatmaps, subject to privacy/HIPAA review.
4. Use GrowthBook later only if they want true feature-flagged onsite experiments across multiple markets.

Initial test hypotheses:
- "Alzheimer's second opinion" vs. "memory specialist review"
- "Check eligibility" vs. "Start secure intake"
- patient-first copy vs. caregiver-supported copy
- short landing page vs. education-first landing page

Privacy guardrail:
- No remarketing based on sensitive health conditions.
- No PHI in URLs, UTM values, analytics events, or A/B test payloads.
- Review any session replay tool with compliance before enabling on the live intake page.

## Google Ads account recommendation after live API check

Live account checked on 2026-08-26.

Existing Local Infusion account:
- Customer ID: `709-866-0950`
- Status: enabled
- Type: non-manager customer account
- Parent manager visible in API: `KK Studio` (`109-801-0850`)
- Billing setup: approved
- Auto-tagging: enabled
- Enabled campaigns: 53
- Active ad destination domains: `mylocalinfusion.com` and `carolinaneurologyspartanburg.com`
- Current conversion tracking owner: `customers/7098660950`
- Current conversion actions include calls from ads, email clicks, submit referral button clicks, local actions, and smart campaign call/contact actions.
- Ad policy check: existing ads are approved or in normal review, with health-related policy topics such as `HEALTH_IN_PERSONALIZED_ADS`.

Recommendation:
- Create a separate Google Ads child account for Local Doctor under the same manager/billing/admin ecosystem.
- Certify `trylocaldoctor.com` at that child-account/domain level if LegitScript/Google healthcare certification is pursued.
- Keep Local Doctor conversion taxonomy separate from Local Infusion's current calls/referral/local-action conversions.
- Preserve the existing Local Infusion account from avoidable telemedicine/prescription-drug policy risk.

Fallback if speed matters:
- Run a small conservative pilot inside the existing account only if Woody approves, using separate campaigns, separate conversion goals, no drug-name keywords, no prescription/prescribing copy, no remarketing, and `trylocaldoctor.com` as the destination.
