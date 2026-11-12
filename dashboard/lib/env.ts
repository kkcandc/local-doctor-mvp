/* Server-only env access. Values never reach the client bundle. */

export interface AdsCredentials {
  developerToken: string
  clientId: string
  clientSecret: string
  refreshToken: string
  loginCustomerId?: string
  customerId: string
  apiVersion: string
}

export interface Ga4Credentials {
  propertyId: string
  clientEmail: string
  privateKey: string
}

const ADS_VARS = [
  'GOOGLE_ADS_DEVELOPER_TOKEN',
  'GOOGLE_ADS_CLIENT_ID',
  'GOOGLE_ADS_CLIENT_SECRET',
  'GOOGLE_ADS_REFRESH_TOKEN',
  'GOOGLE_ADS_CUSTOMER_ID',
] as const

const digits = (v: string | undefined) => (v ?? '').replace(/\D/g, '')

export function adsCredentials(env: NodeJS.ProcessEnv = process.env): { creds: AdsCredentials | null; missing: string[] } {
  const missing = ADS_VARS.filter((k) => !env[k]?.trim())
  if (missing.length) return { creds: null, missing: [...missing] }
  return {
    missing: [],
    creds: {
      developerToken: env.GOOGLE_ADS_DEVELOPER_TOKEN!.trim(),
      clientId: env.GOOGLE_ADS_CLIENT_ID!.trim(),
      clientSecret: env.GOOGLE_ADS_CLIENT_SECRET!.trim(),
      refreshToken: env.GOOGLE_ADS_REFRESH_TOKEN!.trim(),
      loginCustomerId: digits(env.GOOGLE_ADS_LOGIN_CUSTOMER_ID) || undefined,
      customerId: digits(env.GOOGLE_ADS_CUSTOMER_ID),
      apiVersion: env.GOOGLE_ADS_API_VERSION?.trim() || 'v26',
    },
  }
}

export function ga4Credentials(env: NodeJS.ProcessEnv = process.env): { creds: Ga4Credentials | null; missing: string[]; error?: string } {
  const missing = ['GA4_PROPERTY_ID', 'GA4_SERVICE_ACCOUNT_JSON'].filter((k) => !env[k]?.trim())
  if (missing.length) return { creds: null, missing }
  let raw = env.GA4_SERVICE_ACCOUNT_JSON!.trim()
  // Accept base64 too, since some dashboards mangle multi-line JSON.
  if (!raw.startsWith('{')) {
    try {
      raw = Buffer.from(raw, 'base64').toString('utf8')
    } catch {
      /* fall through to the JSON parse error */
    }
  }
  try {
    const parsed = JSON.parse(raw) as { client_email?: string; private_key?: string }
    if (!parsed.client_email || !parsed.private_key) {
      return { creds: null, missing: [], error: 'GA4_SERVICE_ACCOUNT_JSON is missing client_email or private_key' }
    }
    return {
      missing: [],
      creds: {
        propertyId: digits(env.GA4_PROPERTY_ID),
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key.replace(/\\n/g, '\n'),
      },
    }
  } catch {
    return { creds: null, missing: [], error: 'GA4_SERVICE_ACCOUNT_JSON is not valid JSON (or base64 JSON)' }
  }
}

/** Days of history pulled on each refresh. */
export function lookbackDays(env: NodeJS.ProcessEnv = process.env): number {
  const n = Number(env.SNAPSHOT_LOOKBACK_DAYS)
  return Number.isFinite(n) && n >= 7 && n <= 730 ? Math.floor(n) : 400
}

export function storageConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.BLOB_READ_WRITE_TOKEN)
}

/** Without Blob, local dev falls back to files in dashboard/.data. Never on Vercel. */
export function localStorageAllowed(env: NodeJS.ProcessEnv = process.env): boolean {
  return !env.VERCEL
}
