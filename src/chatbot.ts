/*
  Site-wide chatbot (Jotform agent served from forms.mylocalinfusion.com).

  It used to be a static tag in index.html that loaded on every page. It now loads from here so
  it can stay off the booking and evaluation pages and wait on phones:

  - /get-started and /evaluation: never loaded. If the visitor reaches one of them in the app
    after the bot has loaded, it is hidden with CSS (index.css, html[data-chatbot-hidden]).
  - Phones (max-width 680px): loaded after the visitor scrolls past the hero or after 30 seconds,
    so the launcher does not cover the reassurance line under the hero buttons.
  - Everywhere else: loaded once the page has finished loading.
*/

export const CHATBOT_SRC = 'https://forms.mylocalinfusion.com/agent/embedjs/01a1b1d2aee870008666e6dab388dee90d6f/embed.js'
export const CHATBOT_HIDDEN_PATHS = ['/get-started', '/evaluation'] as const
export const CHATBOT_MOBILE_QUERY = '(max-width: 680px)'
export const CHATBOT_MOBILE_SCROLL_PX = 700
export const CHATBOT_MOBILE_TIMEOUT_MS = 30_000

let loaded = false
let waiting = false

export function isChatbotHiddenPath(pathname: string): boolean {
  const normalized = pathname.toLowerCase().replace(/\/+$/, '') || '/'
  return CHATBOT_HIDDEN_PATHS.some((path) => normalized === path || normalized.startsWith(`${path}/`))
}

function loadChatbot() {
  if (loaded || isChatbotHiddenPath(window.location.pathname)) return false
  loaded = true
  const script = document.createElement('script')
  script.async = true
  script.src = CHATBOT_SRC
  script.dataset.localDoctorChatbot = 'true'
  document.body.appendChild(script)
  return true
}

function whenPageIsLoaded(run: () => void) {
  if (document.readyState === 'complete') run()
  else window.addEventListener('load', run, { once: true })
}

function scheduleLoad() {
  if (loaded || waiting) return
  waiting = true
  const finish = () => {
    waiting = false
    loadChatbot()
  }

  if (!window.matchMedia(CHATBOT_MOBILE_QUERY).matches) {
    whenPageIsLoaded(finish)
    return
  }

  let timer = 0
  const onScroll = () => {
    if (window.scrollY < CHATBOT_MOBILE_SCROLL_PX) return
    cleanup()
    finish()
  }
  const cleanup = () => {
    window.clearTimeout(timer)
    window.removeEventListener('scroll', onScroll)
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  timer = window.setTimeout(() => {
    cleanup()
    finish()
  }, CHATBOT_MOBILE_TIMEOUT_MS)
}

// Called at start-up and on every in-app route change.
export function syncChatbot(pathname: string) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  const hidden = isChatbotHiddenPath(pathname)
  document.documentElement.dataset.chatbotHidden = hidden ? 'true' : 'false'
  if (!hidden) scheduleLoad()
}
