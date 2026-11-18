import { afterEach, describe, expect, it, vi } from 'vitest'
import { ga4Credentials } from '../lib/env'
import { cachedAccessTokenFromRefreshToken, clearAccessTokenCache } from '../lib/google-auth'

const base = { GA4_PROPERTY_ID: '562274971' } as unknown as NodeJS.ProcessEnv
const oauth = { GA4_OAUTH_CLIENT_ID: 'id', GA4_OAUTH_CLIENT_SECRET: 'sec', GA4_OAUTH_REFRESH_TOKEN: 'refresh-token-value' }

describe('ga4Credentials', () => {
  it('reports nothing set', () => {
    const r = ga4Credentials(base)
    expect(r.creds).toBeNull()
    expect(r.missing.join(' ')).toContain('GA4_SERVICE_ACCOUNT_JSON')
  })
  it('accepts the three OAuth vars', () => {
    const r = ga4Credentials({ ...base, ...oauth } as NodeJS.ProcessEnv)
    expect(r.creds?.kind).toBe('oauth')
  })
  it('needs all three OAuth vars', () => {
    const r = ga4Credentials({ ...base, GA4_OAUTH_CLIENT_ID: 'id' } as NodeJS.ProcessEnv)
    expect(r.creds).toBeNull()
  })
  it('still accepts a service account', () => {
    const json = JSON.stringify({ client_email: 'a@b.iam.gserviceaccount.com', private_key: 'k' })
    const r = ga4Credentials({ ...base, GA4_SERVICE_ACCOUNT_JSON: json } as NodeJS.ProcessEnv)
    expect(r.creds?.kind).toBe('service_account')
  })
})

describe('cachedAccessTokenFromRefreshToken', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    clearAccessTokenCache()
  })
  it('posts a refresh_token grant and caches until near expiry', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ access_token: 'tok', expires_in: 3600 }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const t0 = 1_000_000
    expect(await cachedAccessTokenFromRefreshToken('id', 'sec', 'refresh-token-value', t0)).toBe('tok')
    expect(await cachedAccessTokenFromRefreshToken('id', 'sec', 'refresh-token-value', t0 + 60_000)).toBe('tok')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const body = String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body)
    expect(body).toContain('grant_type=refresh_token')
    await cachedAccessTokenFromRefreshToken('id', 'sec', 'refresh-token-value', t0 + 3_400_000)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
