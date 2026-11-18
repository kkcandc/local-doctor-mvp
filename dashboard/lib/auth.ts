/*
  Shared-password session. The cookie value is "v1.<expiresAtSeconds>.<signature>",
  where the signature is HMAC-SHA256 over "v1.<expiresAtSeconds>". The key mixes
  SESSION_SECRET (optional) with DASHBOARD_PASSWORD, so changing the password
  signs everyone out. Web Crypto only, so this runs in the proxy and in routes.
*/

export const SESSION_COOKIE = 'ldd_session'
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30

const encoder = new TextEncoder()

export interface AuthEnv {
  DASHBOARD_PASSWORD?: string
  SESSION_SECRET?: string
}

function authEnv(env?: AuthEnv): AuthEnv {
  return env ?? { DASHBOARD_PASSWORD: process.env.DASHBOARD_PASSWORD, SESSION_SECRET: process.env.SESSION_SECRET }
}

export function isAuthConfigured(env?: AuthEnv): boolean {
  return Boolean(authEnv(env).DASHBOARD_PASSWORD)
}

function toBase64Url(bytes: ArrayBuffer): string {
  let bin = ''
  for (const b of new Uint8Array(bytes)) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function hmac(keyMaterial: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(keyMaterial),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return toBase64Url(await crypto.subtle.sign('HMAC', key, encoder.encode(message)))
}

function keyMaterial(env: AuthEnv): string {
  return `ldd-session|${env.SESSION_SECRET ?? ''}|${env.DASHBOARD_PASSWORD ?? ''}`
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** Compares HMACs of both values so the check does not leak the password length or prefix. */
export async function passwordMatches(candidate: string, env?: AuthEnv): Promise<boolean> {
  const e = authEnv(env)
  if (!e.DASHBOARD_PASSWORD) return false
  const [a, b] = await Promise.all([
    hmac(keyMaterial(e), `pw|${candidate}`),
    hmac(keyMaterial(e), `pw|${e.DASHBOARD_PASSWORD}`),
  ])
  return timingSafeEqual(a, b)
}

export async function createSessionToken(env?: AuthEnv, nowMs = Date.now()): Promise<string> {
  const e = authEnv(env)
  if (!e.DASHBOARD_PASSWORD) throw new Error('DASHBOARD_PASSWORD is not set')
  const payload = `v1.${Math.floor(nowMs / 1000) + SESSION_TTL_SECONDS}`
  return `${payload}.${await hmac(keyMaterial(e), payload)}`
}

export async function verifySessionToken(token: string | undefined, env?: AuthEnv, nowMs = Date.now()): Promise<boolean> {
  const e = authEnv(env)
  if (!token || !e.DASHBOARD_PASSWORD) return false
  const parts = token.split('.')
  if (parts.length !== 3 || parts[0] !== 'v1') return false
  const exp = Number(parts[1])
  if (!Number.isFinite(exp) || exp * 1000 <= nowMs) return false
  const expected = await hmac(keyMaterial(e), `${parts[0]}.${parts[1]}`)
  return timingSafeEqual(parts[2], expected)
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  }
}

/** Only same-site relative paths are allowed as a post-login redirect. */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/'
  return next
}
