'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { shortDate } from '@/lib/dates'
import type { StorageMode } from '@/lib/storage'
import type { OfflineEntry, Snapshot, SourceStatus } from '@/lib/types'
import { AdsSection } from './sections/AdsSection'
import { CampaignsSection } from './sections/CampaignsSection'
import { ConversionsSection } from './sections/ConversionsSection'
import { KeywordsSection } from './sections/KeywordsSection'
import { LandingPagesSection } from './sections/LandingPagesSection'
import { OfflineSection } from './sections/OfflineSection'
import { OnPageSection } from './sections/OnPageSection'
import { OverviewSection } from './sections/OverviewSection'
import { RollupSection } from './sections/RollupSection'
import { SearchTermsSection } from './sections/SearchTermsSection'
import { DataProvider, type DashboardData } from './ui'

const NAV = [
  ['overview', 'Overview'],
  ['campaigns', 'Campaigns'],
  ['ads', 'Ads'],
  ['keywords', 'Keywords'],
  ['search-terms', 'Search terms'],
  ['landing-pages', 'Landing pages'],
  ['on-page', 'On-page actions'],
  ['conversions', 'Conversions'],
  ['rollup', 'Spend roll-up'],
  ['offline', 'Offline leads'],
] as const

const STATE_LABEL: Record<SourceStatus['state'], string> = {
  ok: 'Connected',
  not_configured: 'Not connected yet',
  error: 'Error on last refresh',
}

function relativeTime(iso: string): string {
  const mins = Math.round((Date.now() - Date.parse(iso)) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 48) return `${hours} h ago`
  return `${Math.round(hours / 24)} days ago`
}

function StatusPill({ name, status }: { name: string; status: SourceStatus }) {
  return (
    <span className="status-pill" title={status.message}>
      <span className={`dot dot-${status.state}`} aria-hidden />
      <b>{name}:</b> {STATE_LABEL[status.state]}
      {status.message && status.state !== 'ok' && <span className="msg">{status.message}</span>}
      {status.state === 'ok' && status.message && <span className="msg">(partial, hover for details)</span>}
    </span>
  )
}

export function Dashboard({
  snapshot,
  exampleReason,
  storage,
  offline,
  offlineIsExample = false,
}: {
  snapshot: Snapshot
  exampleReason?: string
  storage: StorageMode
  offline: OfflineEntry[]
  offlineIsExample?: boolean
}) {
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null)
  const [refreshTone, setRefreshTone] = useState<'info' | 'ok' | 'warn'>('info')

  const data = useMemo<DashboardData>(
    () => ({
      snapshot,
      offline,
      offlineIsExample,
      currency: snapshot.ads?.currency ?? 'USD',
      anchor: snapshot.range.end,
      minDate: snapshot.range.start,
    }),
    [snapshot, offline, offlineIsExample],
  )

  async function refresh() {
    setRefreshing(true)
    setRefreshTone('info')
    setRefreshMsg('Pulling fresh data, this can take a minute...')
    try {
      const res = await fetch('/api/refresh', { method: 'POST' })
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (res.status === 401) {
        router.push('/login')
        return
      }
      if (res.status === 429) {
        setRefreshTone('warn')
        setRefreshMsg(body.error || 'Refreshed recently, try again in a few minutes.')
        return
      }
      if (!res.ok || body.ok === false) {
        setRefreshTone('warn')
        setRefreshMsg(body.error ?? `Refresh failed (${res.status}).`)
        return
      }
      setRefreshTone('ok')
      setRefreshMsg('Updated.')
      router.refresh()
    } catch {
      setRefreshTone('warn')
      setRefreshMsg('Refresh failed: network error.')
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <DataProvider value={data}>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-title">Local Doctor marketing</span>
            <span className="brand-sub">
              Data through {shortDate(snapshot.range.end)}, {snapshot.range.end.slice(0, 4)}
              {!snapshot.isExample && <> (updated {relativeTime(snapshot.generatedAt)})</>}
            </span>
          </div>
          <div className="topbar-actions">
            {refreshMsg && (
              <span className={`refresh-msg is-${refreshTone}`} role="status">
                {refreshMsg}
              </span>
            )}
            <button className="btn btn-yellow" type="button" onClick={refresh} disabled={refreshing || storage === 'none'}>
              {refreshing ? 'Refreshing...' : 'Refresh now'}
            </button>
            <a className="btn btn-ghost-dark" href="/entry">
              Enter leads
            </a>
            <form method="post" action="/api/logout">
              <button className="btn btn-ghost-dark" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="wrap">
        {snapshot.isExample && (
          <div className="banner banner-example" role="note">
            <span className="banner-tag">Example data</span>
            <span>
              <strong>These numbers are made up</strong> so the layout can be reviewed. Campaign names start with
              [Example]. {exampleReason}
            </span>
          </div>
        )}
        <div className="status-strip" aria-label="Data sources">
          <StatusPill name="Google Ads" status={snapshot.sources.ads} />
          <StatusPill name="GA4" status={snapshot.sources.ga4} />
          {storage === 'none' && (
            <StatusPill name="Storage" status={{ state: 'not_configured', message: 'Connect a Vercel Blob store' }} />
          )}
          {storage === 'local' && (
            <span className="status-pill">
              <span className="dot dot-not_configured" aria-hidden />
              <b>Storage:</b> Local files (dev only, no Blob token)
            </span>
          )}
        </div>
      </div>

      <nav className="section-nav" aria-label="Sections">
        <div className="section-nav-inner">
          {NAV.map(([id, label]) => (
            <a key={id} href={`#${id}`}>
              {label}
            </a>
          ))}
        </div>
      </nav>

      <main className="wrap">
        <OverviewSection />
        <CampaignsSection />
        <AdsSection />
        <KeywordsSection />
        <SearchTermsSection />
        <LandingPagesSection />
        <OnPageSection />
        <ConversionsSection />
        <RollupSection />
        <OfflineSection />
        <p className="footer-note">
          Aggregate counts only. No patient or visitor-level data is stored or shown here.
        </p>
      </main>
    </DataProvider>
  )
}
