export const EVENT_LABELS: Record<string, string> = {
  cta_click: 'CTA click',
  phone_tap: 'Phone tap',
  phone_click: 'Phone click (Ads mirror of phone tap)',
  engaged_visit: 'Engaged visit (45s or 50% scroll)',
  calendly_viewed: 'Booking calendar viewed',
  calendly_time_selected: 'Booking time selected',
  evaluation_started: 'Evaluation started',
  evaluation_submitted: 'Evaluation submitted',
  visit_booked: 'Visit booked',
  generate_lead: 'Lead (mirror of visit booked)',
}

/** Events shown by default on the on-page actions chart. */
export const KEY_EVENTS = ['cta_click', 'phone_tap', 'evaluation_started', 'evaluation_submitted', 'visit_booked'] as const

/** Events treated as conversions on the GA4 side. */
export const GA4_CONVERSION_EVENTS = ['evaluation_submitted', 'visit_booked', 'phone_tap'] as const
