import { isAuthConfigured, safeNextPath } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const ERRORS: Record<string, string> = {
  invalid: 'That password is not right. Try again.',
  locked: 'Sign-in for Refresh now is unavailable because DASHBOARD_PASSWORD is not set on the server.',
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams
  const next = safeNextPath(params.next)
  const locked = !isAuthConfigured()
  const error = locked ? ERRORS.locked : params.error ? ERRORS[params.error] : undefined

  return (
    <div className="center-page">
      <form className="card" method="post" action="/api/login">
        <h1>Local Doctor marketing</h1>
        <p>The dashboard is public. Sign in only if you need to refresh the data.</p>
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <input type="hidden" name="next" value={next} />
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            className="input"
            autoComplete="current-password"
            required
            autoFocus
            disabled={locked}
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={locked} style={{ width: '100%', justifyContent: 'center' }}>
          Sign in
        </button>
      </form>
    </div>
  )
}
