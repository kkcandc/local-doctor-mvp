import { useEffect, useState } from 'react'
import type { MouseEvent } from 'react'
import { ArrowRight } from 'lucide-react'
import './stickyCta.css'

/*
  Phone-only bottom bar with one primary action. It appears once the page's own
  primary CTA (anchorSelector) has scrolled out of view, and hides again while
  any stopSelectors element is on screen, so it never sits on top of a closing
  CTA, the intake form, or the footer. CSS hides it above 680px.

  It leaves room on the right for the site chatbot launcher, which sits in the
  bottom right corner.
*/
export function StickyCta({
  label,
  href,
  onClick,
  anchorSelector,
  stopSelectors,
  ctaLocation = 'sticky_mobile',
  describedBy,
}: {
  label: string
  href: string
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
  anchorSelector: string
  stopSelectors: string[]
  ctaLocation?: string
  describedBy?: string
}) {
  const [anchorOut, setAnchorOut] = useState(false)
  const [stopsInView, setStopsInView] = useState(0)
  const stopKey = stopSelectors.join(',')

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const anchor = document.querySelector(anchorSelector)
    if (!anchor) return

    const anchorObserver = new IntersectionObserver(([entry]) => {
      // Only count the anchor as passed once it is above the viewport, not below it.
      setAnchorOut(!entry.isIntersecting && entry.boundingClientRect.top < 0)
    })
    anchorObserver.observe(anchor)

    const visible = new Set<Element>()
    const stopObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target)
        else visible.delete(entry.target)
      }
      setStopsInView(visible.size)
    })
    if (stopKey) document.querySelectorAll(stopKey).forEach((element) => stopObserver.observe(element))

    return () => {
      anchorObserver.disconnect()
      stopObserver.disconnect()
    }
  }, [anchorSelector, stopKey])

  if (!anchorOut || stopsInView > 0) return null

  return (
    <div className="sticky-cta" data-sticky-cta>
      <a className="primary" href={href} data-cta-location={onClick ? ctaLocation : undefined} aria-describedby={describedBy} onClick={onClick}>
        {label} <ArrowRight size={20} aria-hidden="true" />
      </a>
    </div>
  )
}
