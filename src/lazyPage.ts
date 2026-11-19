import { createElement, useEffect, useState, type ComponentType, type FunctionComponent } from 'react'

export type PageChunk = {
  preload: () => Promise<void>
  // Source path as it appears in the Vite manifest, so the prerender can link the chunk and its CSS.
  source: string
}

export type LazyPage<P extends object> = FunctionComponent<P> & PageChunk

/*
  A route component in its own chunk. Once preload() has resolved it renders directly. The
  prerender and main.tsx both preload the route before rendering, so the first client render
  matches the prerendered HTML. An in-app navigation that gets here first renders nothing until
  the chunk arrives.

  This does not use React.lazy and Suspense on purpose: a Suspense boundary in the prerender
  lets React move a large page into a hidden element that only a script reveals, so visitors
  and crawlers without JavaScript would get an empty page.
*/
export function lazyPage<P extends object>(source: string, load: () => Promise<ComponentType<P>>): LazyPage<P> {
  let loaded: ComponentType<P> | undefined
  let pending: Promise<void> | undefined
  const preload = () => {
    pending ??= load().then((component) => {
      loaded = component
    })
    return pending
  }
  function Page(props: P) {
    const [Component, setComponent] = useState(() => loaded)
    useEffect(() => {
      if (Component) return
      let current = true
      void preload().then(() => {
        if (current) setComponent(() => loaded)
      })
      return () => {
        current = false
      }
    }, [Component])
    return Component ? createElement(Component, props) : null
  }
  return Object.assign(Page, { preload, source })
}
