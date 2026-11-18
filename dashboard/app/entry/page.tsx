import { EntryForm } from '@/components/EntryForm'
import { readOfflineLeads } from '@/lib/offline'
import { storageMode } from '@/lib/storage'

export const dynamic = 'force-dynamic'

export default async function EntryPage() {
  const leads = await readOfflineLeads()
  return (
    <EntryForm
      initial={leads.entries}
      needsEntryPassword={Boolean(process.env.OFFLINE_ENTRY_PASSWORD)}
      storageReady={storageMode() !== 'none'}
    />
  )
}
