import posthog from 'posthog-js'
import { dropIntakeEvents, isIntakePath } from './posthogConfig'

const projectToken = import.meta.env.VITE_POSTHOG_KEY
const apiHost = import.meta.env.VITE_POSTHOG_HOST

// Replay is held back while the visitor is on the intake page and resumed when they leave.
let recordingHeldBack = false

export function isPostHogConfigured(): boolean {
  return Boolean(projectToken && apiHost)
}

export function installPostHog() {
  if (typeof window === 'undefined' || !projectToken || !apiHost || posthog.__loaded) return
  recordingHeldBack = isIntakePath(window.location.pathname)
  posthog.init(projectToken, {
    api_host: apiHost,
    defaults: '2026-08-30',
    persistence: 'memory',
    // The flags request is not covered by before_send and carries the landing URL
    // ($initial_current_url), which can be /get-started. The site uses no flags or surveys.
    advanced_disable_flags: true,
    disable_session_recording: recordingHeldBack,
    before_send: (event) => dropIntakeEvents(event, window.location.href),
    logs: {
      serviceName: 'local-doctor-web',
      environment: import.meta.env.MODE,
      beforeSend: (record) => (isIntakePath(window.location.pathname) ? null : record),
    },
    capture_exceptions: {
      capture_unhandled_errors: true,
      capture_unhandled_rejections: true,
      capture_console_errors: false,
    },
  })
}

export function notePostHogNavigation(pathname: string) {
  if (!posthog.__loaded) return
  if (isIntakePath(pathname)) {
    if (recordingHeldBack) return
    recordingHeldBack = true
    posthog.stopSessionRecording()
  } else if (recordingHeldBack) {
    recordingHeldBack = false
    posthog.startSessionRecording()
  }
}

// Called when a visitor clicks through to the eligibility page. The path is where they came from.
export function noteEligibilityStarted(sourcePath: string) {
  if (!posthog.__loaded || isIntakePath(sourcePath)) return
  posthog.capture('eligibility_check_started', { source_path: sourcePath })
  posthog.logger.info('eligibility journey opened', {
    flow_stage: 'started',
    source_path: sourcePath,
  })
}
