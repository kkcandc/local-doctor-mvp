import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import {
  createSessionToken,
  passwordMatches,
  safeNextPath,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  verifySessionToken,
} from '../lib/auth'
import { proxy } from '../proxy'

const env = { DASHBOARD_PASSWORD: 'correct horse', SESSION_SECRET: 's3cret' }

describe('session tokens', () => {
  it('accepts a fresh token and rejects a tampered one', async () => {
    const token = await createSessionToken(env)
    expect(await verifySessionToken(token, env)).toBe(true)
    const [v, exp, sig] = token.split('.')
    expect(await verifySessionToken(`${v}.${Number(exp) + 1000}.${sig}`, env)).toBe(false)
    expect(await verifySessionToken(`${v}.${exp}.${sig.slice(0, -2)}xx`, env)).toBe(false)
    expect(await verifySessionToken('garbage', env)).toBe(false)
    expect(await verifySessionToken(undefined, env)).toBe(false)
  })

  it('expires after the TTL', async () => {
    const now = Date.UTC(2026, 10, 12)
    const token = await createSessionToken(env, now)
    expect(await verifySessionToken(token, env, now + (SESSION_TTL_SECONDS - 60) * 1000)).toBe(true)
    expect(await verifySessionToken(token, env, now + (SESSION_TTL_SECONDS + 1) * 1000)).toBe(false)
  })

  it('invalidates sessions when the password changes', async () => {
    const token = await createSessionToken(env)
    expect(await verifySessionToken(token, { ...env, DASHBOARD_PASSWORD: 'new password' })).toBe(false)
  })

  it('rejects everything when no password is configured', async () => {
    expect(await passwordMatches('', {})).toBe(false)
    await expect(createSessionToken({})).rejects.toThrow()
  })

  it('checks the password', async () => {
    expect(await passwordMatches('correct horse', env)).toBe(true)
    expect(await passwordMatches('correct horse ', env)).toBe(false)
    expect(await passwordMatches('', env)).toBe(false)
  })

  it('only allows same-site relative redirects after login', () => {
    expect(safeNextPath('/entry')).toBe('/entry')
    expect(safeNextPath('//evil.example')).toBe('/')
    expect(safeNextPath('https://evil.example')).toBe('/')
    expect(safeNextPath('/\\evil.example')).toBe('/')
    expect(safeNextPath(null)).toBe('/')
  })
})

describe('proxy (auth middleware)', () => {
  const req = (path: string, cookie?: string) =>
    new NextRequest(`https://dash.example${path}`, cookie ? { headers: { cookie: `${SESSION_COOKIE}=${cookie}` } } : undefined)

  beforeEach(() => {
    vi.stubEnv('DASHBOARD_PASSWORD', env.DASHBOARD_PASSWORD)
    vi.stubEnv('SESSION_SECRET', env.SESSION_SECRET)
  })
  afterEach(() => vi.unstubAllEnvs())

  it('lets pages through without a session, and still sets noindex', async () => {
    for (const path of ['/', '/entry']) {
      const res = await proxy(req(path))
      expect(res.headers.get('x-middleware-next')).toBe('1')
      expect(res.headers.get('x-robots-tag')).toContain('noindex')
    }
  })

  it('returns 401 JSON for Refresh now and logout without a session', async () => {
    for (const path of ['/api/refresh', '/api/logout']) {
      const res = await proxy(req(path))
      expect(res.status).toBe(401)
      expect(await res.json()).toEqual({ error: 'Not signed in' })
    }
  })

  it('lets the offline-leads API through the proxy (writes are checked in the route)', async () => {
    const res = await proxy(req('/api/offline-leads'))
    expect(res.headers.get('x-middleware-next')).toBe('1')
  })

  it('does not block a page when the cookie is forged; only session APIs care', async () => {
    const page = await proxy(req('/', 'v1.9999999999.forged'))
    expect(page.headers.get('x-middleware-next')).toBe('1')
    const api = await proxy(req('/api/refresh', 'v1.9999999999.forged'))
    expect(api.status).toBe(401)
  })

  it('lets a valid session through to Refresh now', async () => {
    const token = await createSessionToken(env)
    const page = await proxy(req('/', token))
    expect(page.headers.get('x-middleware-next')).toBe('1')
    expect(page.headers.get('x-robots-tag')).toContain('noindex')
    const api = await proxy(req('/api/refresh', token))
    expect(api.headers.get('x-middleware-next')).toBe('1')
  })

  it('leaves login, robots and the cron route reachable (cron checks CRON_SECRET itself)', async () => {
    for (const path of ['/login', '/api/login', '/robots.txt', '/api/cron/refresh']) {
      const res = await proxy(req(path))
      expect(res.headers.get('x-middleware-next')).toBe('1')
    }
  })

  it('keeps pages public when DASHBOARD_PASSWORD is missing, and blocks Refresh now', async () => {
    vi.stubEnv('DASHBOARD_PASSWORD', '')
    const token = await createSessionToken(env)
    const page = await proxy(req('/', token))
    expect(page.headers.get('x-middleware-next')).toBe('1')
    expect((await proxy(req('/api/refresh', token))).status).toBe(503)
  })
})
