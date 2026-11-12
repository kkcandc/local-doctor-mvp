/** Copy for a manual refresh that is still inside the cooldown window. */
export function refreshCooldownMessage(elapsedMs: number, cooldownMs: number): { error: string; retryAfterSeconds: number } {
  const remainingMs = Math.max(0, cooldownMs - Math.max(0, elapsedMs))
  const retryAfterSeconds = Math.max(1, Math.ceil(remainingMs / 1000))
  const refreshedMinutesAgo = Math.floor(Math.max(0, elapsedMs) / 60_000)
  const retryInMinutes = Math.max(1, Math.ceil(remainingMs / 60_000))
  const ago = refreshedMinutesAgo < 1 ? 'just now' : `${refreshedMinutesAgo} min ago`
  return {
    error: `Refreshed ${ago}, try again in ${retryInMinutes} min.`,
    retryAfterSeconds,
  }
}
