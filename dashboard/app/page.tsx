import { cookies } from 'next/headers'
import { Dashboard } from '@/components/Dashboard'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth'
import { readOfflineLeads } from '@/lib/offline'
import { exampleOfflineEntries, loadSnapshot } from '@/lib/snapshot'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const [loaded, offline, cookieStore] = await Promise.all([loadSnapshot(), readOfflineLeads(), cookies()])
  const signedIn = await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value)
  const offlineIsExample = loaded.snapshot.isExample && offline.entries.length === 0
  return (
    <Dashboard
      snapshot={loaded.snapshot}
      exampleReason={loaded.exampleReason}
      storage={loaded.storage}
      offline={offlineIsExample ? exampleOfflineEntries(loaded.snapshot) : offline.entries}
      offlineIsExample={offlineIsExample}
      signedIn={signedIn}
    />
  )
}
