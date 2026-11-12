import 'server-only'
import { createSign } from 'node:crypto'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'

async function tokenRequest(body: URLSearchParams): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => ({}))) as { access_token?: string; error?: string; error_description?: string }
  if (!res.ok || !json.access_token) {
    throw new Error(`OAuth token request failed (${res.status}): ${json.error_description || json.error || 'no access_token'}`)
  }
  return json.access_token
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
