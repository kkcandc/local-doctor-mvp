import { ADS_CLICK_PARAMS } from './analytics/googleAdsConfig'

declare global {
  interface Window {
    __ldEarlyClick?: (event: MouseEvent) => void
  }
}

/*
  Inline script for prerendered pages. A visitor can tap a CTA before the app has hydrated, and
  the prerendered href has no query string. Until the app takes over, a click on a /get-started
  or /evaluation link gets the same allow-listed ad params the app adds (keptAdsSearchParams),
  so gclid and utm_* still reach the scheduler and the evaluation form. It only changes the href
  at click time, so the HTML React hydrates is untouched.
*/
export function earlyClickScript(): string {
  const allowed = JSON.stringify(ADS_CLICK_PARAMS)
  return `(function(){var allowed=${allowed};function onClick(event){var target=event.target;var link=target&&target.closest?target.closest('a[href]'):null;if(!link)return;var href=link.getAttribute('href')||'';var path=href.split('#')[0];if(path!=='/get-started'&&path!=='/evaluation')return;var kept=new URLSearchParams();new URLSearchParams(location.search).forEach(function(value,key){if(allowed.indexOf(key)!==-1&&value.length<=200&&value.indexOf('@')===-1)kept.append(key,value)});var query=kept.toString();if(!query)return;var hash=href.indexOf('#')===-1?'':href.slice(href.indexOf('#'));link.setAttribute('href',path+'?'+query+hash)}window.__ldEarlyClick=onClick;document.addEventListener('click',onClick,true)})()`
}

// Called when React takes over the page. From then on the app builds these hrefs itself.
export function stopEarlyClicks() {
  if (!window.__ldEarlyClick) return
  document.removeEventListener('click', window.__ldEarlyClick, true)
  window.__ldEarlyClick = undefined
}
