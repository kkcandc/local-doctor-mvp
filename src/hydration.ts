import { useSyncExternalStore } from 'react'

const subscribeNever = () => () => {}

// False on the server and while React hydrates prerendered HTML, true afterwards. Anything that
// renders differently in a browser (query params, viewport) has to wait for true, or the first
// client render would not match the HTML and React would throw it away.
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribeNever, () => true, () => false)
}

// window.location.search once hydrated, '' before. The prerendered HTML is built without the
// visitor's gclid and utm_* params, so links pick them up right after hydration.
export function useLocationSearch(): string {
  return useHydrated() ? window.location.search : ''
}

export function useMediaQuery(query: string): boolean | null {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query)
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => null,
  )
}
