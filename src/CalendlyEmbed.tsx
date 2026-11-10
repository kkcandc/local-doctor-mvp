import { useEffect, useRef, useState } from 'react'
import { CALENDLY_DEFAULT_HEIGHT_PX, calendlyEmbedHeightPx, calendlyEmbedUrl } from './calendlyUrl'

const calendlyScriptSrc = 'https://assets.calendly.com/assets/external/widget.js'

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (options: { url: string; parentElement: HTMLElement }) => void
    }
  }
}

function loadWidgetScript() {
  const script = document.createElement('script')
  script.src = calendlyScriptSrc
  script.async = true
  script.dataset.localDoctorCalendly = 'true'
  document.body.appendChild(script)
  return script
}

/*
  Calendly inline scheduler for /get-started. The markup matches Calendly's own embed snippet
  (a .calendly-inline-widget div with data-url, then widget.js). widget.js only scans the page
  once, when it first loads. This is a single-page app, so the div can mount after the script has
  already run, or before it has loaded. The effect covers both cases and never adds a second iframe.

  Height follows calendly.page_height from https://calendly.com. Loading messages of a few pixels
  are ignored (see calendlyEmbedHeightPx) so the calendar is not collapsed. The listener does not
  scroll the page, and it does not read invitee or booking details.

  data-auto-load is false so widget.js does not scan this div itself. That scan rewrites the
  element's style attribute and can put the fixed 700px height back after a resize message.
*/
export function CalendlyEmbed() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(CALENDLY_DEFAULT_HEIGHT_PX)
  const search = typeof window === 'undefined' ? '' : window.location.search
  const url = calendlyEmbedUrl(search)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    function onMessage(event: MessageEvent) {
      if (event.origin !== 'https://calendly.com') return
      const data = event.data
      if (!data || typeof data !== 'object') return
      if ((data as { event?: unknown }).event !== 'calendly.page_height') return
      const next = calendlyEmbedHeightPx((data as { payload?: { height?: unknown } }).payload?.height)
      if (next) setHeight(next)
    }

    window.addEventListener('message', onMessage)

    function mount() {
      if (container && !container.querySelector('iframe')) {
        window.Calendly?.initInlineWidget({ url, parentElement: container })
      }
    }

    let script: HTMLScriptElement | null = null
    if (window.Calendly) {
      mount()
    } else {
      script = document.querySelector<HTMLScriptElement>('script[data-local-doctor-calendly]') ?? loadWidgetScript()
      script.addEventListener('load', mount)
    }

    return () => {
      script?.removeEventListener('load', mount)
      window.removeEventListener('message', onMessage)
    }
  }, [url])

  return (
    <div
      ref={containerRef}
      className="calendly-inline-widget"
      data-url={url}
      data-auto-load="false"
      style={{ minWidth: 320, width: '100%', height }}
    />
  )
}
