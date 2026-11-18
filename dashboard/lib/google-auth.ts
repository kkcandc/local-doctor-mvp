import 'server-only'
import { createSign } from 'node:crypto'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'

async function tokenRequest(body: URLSearchParams): Promise<string> {
  return (await tokenRequestFull(body)).accessToken
}

async function tokenRequestFull(body: URLSearchParams): Promise<{ accessToken: string; expiresIn: number }> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error?: string; error_description?: string }
  if (!res.ok || !json.access_token) {
    throw new Error(`OAuth token request failed (${res.status}): ${json.error_description || json.error || 'no access_token'}`)
  }
  return { accessToken: json.access_token, expiresIn: Number(json.expires_in) > 0 ? Number(json.expires_in) : 3600 }
}

/** OAuth refresh-token flow, used for the Google Ads API. */
export function accessTokenFromRefreshToken(clientId: string, clientSecret: string, refreshToken: string) {
  return tokenRequest(
    new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  )
}

const b64url = (input: string | Buffer) => Buffer.from(input).toString('base64url')

/** Service-account JWT bearer flow, used for the GA4 Data API. */
export function accessTokenFromServiceAccount(clientEmail: string, privateKey: string, scope: string) {
  const now = Math.floor(Date.now() / 1000)
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = b64url(JSON.stringify({ iss: clientEmail, scope, aud: TOKEN_URL, iat: now, exp: now + 3600 }))
  const signer = createSign('RSA-SHA256')
  signer.update(`${header}.${claims}`)
  const assertion = `${header}.${claims}.${b64url(signer.sign(privateKey))}`
  return tokenRequest(
    new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  )
}

const cache = new Map<string, { token: string; expiresAt: number }>()
const EXPIRY_MARGIN_MS = 5 * 60 * 1000

/** Refresh-token flow with an in-memory cache until shortly before expiry. */
export async function cachedAccessTokenFromRefreshToken(clientId: string, clientSecret: string, refreshToken: string, now = Date.now()) {
  const key = `${clientId}:${refreshToken.slice(-12)}`
  const hit = cache.get(key)
  if (hit && hit.expiresAt - EXPIRY_MARGIN_MS > now) return hit.token
  const { accessToken, expiresIn } = await tokenRequestFull(
    new URLSearchParams({ grant_type: 'refresh_token', client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken }),
  )
  cache.set(key, { token: accessToken, expiresAt: now + expiresIn * 1000 })
  return accessToken
}

export function clearAccessTokenCache() {
  cache.clear()
}
