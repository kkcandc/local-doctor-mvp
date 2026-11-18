'use client'

import { useState } from 'react'
import { shortDate } from '@/lib/dates'
import { NOTE_MAX_LENGTH } from '@/lib/privacy'
import type { OfflineEntry } from '@/lib/types'

function localToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function EntryForm({
  initial,
  needsEntryPassword,
  storageReady,
}: {
  initial: OfflineEntry[]
  needsEntryPassword: boolean
  storageReady: boolean
}) {
  const [entries, setEntries] = useState(initial)
  const [date, setDate] = useState(localToday)
  const [phoneLeads, setPhoneLeads] = useState('')
  const [bookedPatients, setBookedPatients] = useState('')
  const [note, setNote] = useState('')
  const [entryPassword, setEntryPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const existing = entries.find((e) => e.date === date)

  function load(e: OfflineEntry) {
    setDate(e.date)
    setPhoneLeads(String(e.phoneLeads))
    setBookedPatients(String(e.bookedPatients))
    setNote(e.note ?? '')
    setOk(null)
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const headers = () => ({
    'content-type': 'application/json',
    ...(needsEntryPassword ? { 'x-entry-password': entryPassword } : {}),
  })

  async function save(ev: React.FormEvent) {
    ev.preventDefault()
    setSaving(true)
    setError(null)
    setOk(null)
    try {
      const res = await fetch('/api/offline-leads', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ date, phoneLeads: Number(phoneLeads), bookedPatients: Number(bookedPatients), note }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(body.error ?? `Could not save (${res.status}).`)
        return
      }
      setEntries(body.entries)
      setOk(`Saved ${shortDate(date)}.`)
      setNote('')
    } catch {
      setError('Could not save: network error.')
    } finally {
      setSaving(false)
    }
  }

  async function remove(d: string) {
    if (!window.confirm(`Delete the numbers for ${shortDate(d)}?`)) return
    setError(null)
    setOk(null)
    const res = await fetch(`/api/offline-leads?date=${d}`, { method: 'DELETE', headers: headers() })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(body.error ?? `Could not delete (${res.status}).`)
      return
    }
    setEntries(body.entries)
    setOk(`Deleted ${shortDate(d)}.`)
  }

  const recent = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30)

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-title">Enter offline leads</span>
            <span className="brand-sub">Daily counts only</span>
          </div>
          <div className="topbar-actions">
            <a className="btn btn-ghost-dark" href="/#offline">
              Back to dashboard
            </a>
          </div>
        </div>
      </header>
      <div className="entry-page">
        <form className="section" onSubmit={save} style={{ marginTop: 0 }}>
          <h2 className="section-title" style={{ marginBottom: 6 }}>
            Numbers for one day
          </h2>
          <p className="section-desc" style={{ marginBottom: 16 }}>
            Enter how many phone leads came in and how many patients were booked. Saving the same date again replaces it.
          </p>
          {!storageReady && (
            <div className="form-error" role="alert">
              Storage is not connected, so entries cannot be saved yet. Connect a Vercel Blob store to this project.
            </div>
          )}
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          {ok && (
            <div className="form-ok" role="status">
              {ok}
            </div>
          )}
          <div className="field">
            <label htmlFor="date">Date</label>
            <input id="date" type="date" className="input" value={date} max={localToday()} required onChange={(e) => setDate(e.target.value)} />
            {existing && (
              <span className="field-help">
                Already entered: {existing.phoneLeads} phone leads, {existing.bookedPatients} booked.{' '}
                <button type="button" className="btn-danger-text" style={{ color: 'var(--harbor-600)' }} onClick={() => load(existing)}>
                  Load to edit
                </button>
              </span>
            )}
          </div>
          <div className="entry-grid">
            <div className="field">
              <label htmlFor="phoneLeads">Phone leads</label>
              <input id="phoneLeads" type="number" inputMode="numeric" min={0} max={10000} step={1} className="input" value={phoneLeads} required onChange={(e) => setPhoneLeads(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="bookedPatients">Booked patients</label>
              <input id="bookedPatients" type="number" inputMode="numeric" min={0} max={10000} step={1} className="input" value={bookedPatients} required onChange={(e) => setBookedPatients(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="note">Note (optional, no patient info)</label>
            <div className="field-warn" id="note-warning">
              No patient info: no names, phone numbers, emails, dates of birth, or health details. Keep it general, for
              example &quot;phones down after 3pm&quot; or &quot;holiday, clinic closed&quot;.
            </div>
            <textarea
              id="note"
              className="input"
              rows={2}
              maxLength={NOTE_MAX_LENGTH}
              aria-describedby="note-warning"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <span className="field-help">
              {note.length}/{NOTE_MAX_LENGTH}
            </span>
          </div>
          {needsEntryPassword && (
            <div className="field">
              <label htmlFor="entryPassword">Entry password</label>
              <input id="entryPassword" type="password" className="input" autoComplete="off" value={entryPassword} required onChange={(e) => setEntryPassword(e.target.value)} />
            </div>
          )}
          <button className="btn btn-primary" type="submit" disabled={saving || !storageReady}>
            {saving ? 'Saving...' : existing ? 'Update day' : 'Save day'}
          </button>
        </form>

        <section className="section">
          <h2 className="section-title" style={{ fontSize: 17 }}>
            Recent entries
          </h2>
          {recent.length === 0 ? (
            <div className="empty">Nothing entered yet.</div>
          ) : (
            <div className="table-wrap" style={{ marginTop: 12 }}>
              <table className="data" style={{ minWidth: 0 }}>
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th className="num" scope="col">Phone leads</th>
                    <th className="num" scope="col">Booked</th>
                    <th scope="col">Note</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((e) => (
                    <tr key={e.date}>
                      <td>{shortDate(e.date)}</td>
                      <td className="num">{e.phoneLeads}</td>
                      <td className="num">{e.bookedPatients}</td>
                      <td>{e.note ?? ''}</td>
                      <td>
                        <button type="button" className="btn-danger-text" style={{ color: 'var(--harbor-600)' }} onClick={() => load(e)}>
                          Edit
                        </button>
                        <button type="button" className="btn-danger-text" onClick={() => remove(e.date)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  )
}
