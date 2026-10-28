import { expect, test, type Locator, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { termsReplacements } from '../src/legal/documentLinks'

const artifactsDir = '/opt/cursor/artifacts'

function compact(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function expectedBody(markdown: string) {
  const blocks = markdown
    .replace(/^#[^\n]*\r?\n+/, '')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0)
    .map((block) => {
      const replacement = termsReplacements.find((item) => item.source === block)
      return replacement ? `${replacement.prefix}${replacement.label}` : block
    })
  return compact(blocks.join('\n'))
}

function readLegal(name: string) {
  return fs.readFileSync(path.join(process.cwd(), 'src/legal', name), 'utf8')
}

async function legalColumn(page: Page) {
  return page.locator('footer div').filter({ has: page.locator('strong', { hasText: /^Legal$/ }) })
}

async function expectLegalLinks(column: Locator) {
  const links = await column.locator('a').evaluateAll((anchors) =>
    anchors.map((anchor) => ({
      text: anchor.textContent?.trim() ?? '',
      href: anchor.getAttribute('href'),
    })),
  )
  expect(links).toEqual([
    { text: 'Privacy Policy', href: '/privacy' },
    { text: 'Terms of Use', href: '/terms' },
    { text: 'Patient Rights & Notices', href: '/patient-rights' },
    { text: 'Contact', href: '/contact' },
  ])
  await expect(column).not.toContainText('Telehealth Consent')
}

test.beforeAll(() => {
  fs.mkdirSync(artifactsDir, { recursive: true })
})

test('footer legal links omit telehealth consent', async ({ page }) => {
  await page.goto('/')
  const legal = await legalColumn(page)
  await expectLegalLinks(legal)
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).not.toContainText('Telehealth')
  await expect(page.locator('footer')).toContainText('(844) 509-1404')
  await expect(page.locator('footer')).toContainText('Box 104')
  await expect(page.locator('footer a[href="mailto:hello@trylocaldoctor.com"]')).toHaveText('Email the team')
  await legal.scrollIntoViewIfNeeded()
  await page.screenshot({ path: path.join(artifactsDir, 'legal_footer_links.png') })
})

test('privacy, terms, and patient rights render Eric’s copy', async ({ page }) => {
  const cases = [
    {
      path: '/privacy',
      file: 'privacy-policy.md',
      title: 'Privacy Policy',
      screenshot: 'legal_privacy_top.png',
    },
    {
      path: '/terms',
      file: 'terms-of-use.md',
      title: 'Local Doctor — Terms of Use',
      screenshot: 'legal_terms_top.png',
    },
    {
      path: '/patient-rights',
      file: 'patient-rights-notices.md',
      title: 'Patient Rights, Notices, and Notice of Privacy Practice',
      screenshot: 'legal_patient_rights_top.png',
    },
  ]

  for (const item of cases) {
    await page.goto(item.path)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(item.title)
    await expect(page.locator('.identity-block')).toContainText('Local Infusion Inc. (doing business as Local Doctor), a Delaware corporation')
    await expect(page.locator('.identity-block')).toContainText('LIV Specialty Care CT, P.C.')
    await expect(page.locator('.identity-block')).toContainText('4900 Centennial Blvd, Suite 300, Box 104, Nashville, TN 37209')
    await expect(page.locator('.identity-block')).toContainText('(844) 509-1404')
    await expect(page.locator('.identity-block')).toContainText('hello@trylocaldoctor.com')
    await expect(page.locator('.identity-block')).toContainText('Maryland')
    const body = page.locator('.legal-doc .article-body')
    await expect(compact(await body.innerText())).toBe(expectedBody(readLegal(item.file)))
    await expectLegalLinks(await legalColumn(page))
    await page.screenshot({ path: path.join(artifactsDir, item.screenshot) })
  }
})

test('terms keep Eric’s identity sentences and wired policy links', async ({ page }) => {
  await page.goto('/terms')
  const body = page.locator('.legal-doc .article-body')
  await expect(body).toContainText('Local Infusion, Inc., a Delaware corporation doing business as Local Doctor')
  await expect(body).toContainText('LIV Specialty Care CT, P.C.')
  await expect(body).toContainText('4900 Centennial Blvd, Ste 300, Box 104')
  await expect(body).toContainText('laws of the State of Delaware')
  await expect(body).not.toContainText('laws of Tennessee')
  await expect(body).toContainText('Effective Date: October 2026')
  const privacy = body.getByRole('link', { name: 'https://trylocaldoctor.com/privacy' })
  await expect(privacy).toHaveAttribute('href', '/privacy')
  const notice = body.getByRole('link', { name: 'https://trylocaldoctor.com/patient-rights#notice-of-privacy-practices' })
  await expect(notice).toHaveAttribute('href', '/patient-rights#notice-of-privacy-practices')
  const rights = body.getByRole('link', { name: 'https://trylocaldoctor.com/patient-rights', exact: true })
  await expect(rights).toHaveAttribute('href', '/patient-rights')
})

test('privacy keeps source wording, including known source typos', async ({ page }) => {
  await page.goto('/privacy')
  const body = page.locator('.legal-doc .article-body')
  await expect(body).toContainText('Last Updated: October 2026')
  await expect(body).toContainText('share information about you progress')
  await expect(body).toContainText('athello@trylocaldoctor.com')
  await expect(body).toContainText('Access/Accuracy.To the extent')
  await expect(body).not.toContainText('Analytics, advertising pixels')
  await expect(body).not.toContainText('Anthropic')
  const html = await body.innerHTML()
  expect(html).not.toContain('mailto:athello@trylocaldoctor.com')
  expect(html).toContain('mailto:hello@trylocaldoctor.com')
  await expect(body.getByRole('link', { name: 'HIPAA Notice of Privacy Practices' })).toHaveAttribute(
    'href',
    '/patient-rights#notice-of-privacy-practices',
  )
})

test('patient rights includes the notice, nondiscrimination, and good faith estimate', async ({ page }) => {
  await page.goto('/patient-rights#notice-of-privacy-practices')
  const body = page.locator('.legal-doc .article-body')
  await expect(page.locator('#notice-of-privacy-practices')).toHaveText('Notice of Privacy Practices')
  await expect(body).toContainText('This notice describes how medical information about you may be used and disclosed and how you can get access to this information. Please review it carefully.')
  await expect(body).toContainText('42 CFR Part 2')
  await expect(body).toContainText('[PUBLICATION REQUIREMENT: Add the required translated availability notices and make them accessible across the nine operating states before publishing.]')
  await expect(body).toContainText('Good Faith Estimate')
  await expect(body).toContainText('cms.gov/nosurprises')
  await expect(body.getByRole('link', { name: 'contact page' }).first()).toHaveAttribute('href', '/contact')
  await page.locator('#notice-of-privacy-practices').scrollIntoViewIfNeeded()
  await page.screenshot({ path: path.join(artifactsDir, 'legal_patient_rights_npp.png') })
})

test('old privacy notice anchor resolves on the patient rights page', async ({ page }) => {
  await page.goto('/privacy#notice')
  await expect(page).toHaveURL(/\/patient-rights#notice-of-privacy-practices$/)
  await expect(page.locator('#notice-of-privacy-practices')).toBeVisible()
})

test('telehealth consent stays reachable and out of primary navigation', async ({ page }) => {
  await page.goto('/telehealth-consent')
  await expect(page.getByRole('heading', { level: 1, name: 'Telehealth Consent' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Notice of Privacy Practices' })).toHaveAttribute(
    'href',
    '/patient-rights#notice-of-privacy-practices',
  )
  await expectLegalLinks(await legalColumn(page))
  await page.screenshot({ path: path.join(artifactsDir, 'legal_telehealth_consent_still_live.png') })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'Open menu' }).click()
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).not.toContainText('Telehealth')
})

test('contact policies point at the new legal set', async ({ page }) => {
  await page.goto('/contact')
  const policies = page.locator('#providers')
  await expect(policies.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy')
  await expect(policies.getByRole('link', { name: 'Terms of Use' })).toHaveAttribute('href', '/terms')
  await expect(policies.getByRole('link', { name: 'Patient Rights & Notices' })).toHaveAttribute('href', '/patient-rights')
  await expect(policies).not.toContainText('Telehealth Consent')
})
