// The test variant letters. No DOM or platform code, so middleware.ts can import it.
export const lpVariants = ['a', 'b', 'c'] as const

export type LpVariant = (typeof lpVariants)[number]

export function isLpVariant(value: string): value is LpVariant {
  return (lpVariants as readonly string[]).includes(value)
}
