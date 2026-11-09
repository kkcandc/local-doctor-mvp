import { useEffect, useRef } from 'react'

const calendlyUrl = 'https://calendly.com/local-doctor/virtualvisit?hide_event_type_details=1&primary_color=2970d6'
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
*/
export function CalendlyEmbed() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    function mount() {
      if (container && !container.querySelector('iframe')) {
        window.Calendly?.initInlineWidget({ url: calendlyUrl, parentElement: container })
      }
    }

    if (window.Calendly) {
      mount()
      return
    }

    const script = document.querySelector<HTMLScriptElement>('script[data-local-doctor-calendly]') ?? loadWidgetScript()
    script.addEventListener('load', mount)
    return () => script.removeEventListener('load', mount)
  }, [])

  return (
    <div
      ref={containerRef}
      className="calendly-inline-widget ph-no-capture"
      data-url={calendlyUrl}
      style={{ minWidth: 320, height: 700 }}
    />
  )
}
