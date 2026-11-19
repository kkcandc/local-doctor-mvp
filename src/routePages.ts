import { lazyPage, type PageChunk } from './lazyPage'
import type { Route } from './routes'

// Pages that load in their own chunk: the Typeform embed and the long legal documents. The rest
// of the site is small enough to stay in the main bundle.
export const EvaluationPage = lazyPage('src/EvaluationPage.tsx', () => import('./EvaluationPage').then((m) => m.EvaluationPage))
export const PrivacyPage = lazyPage('src/legal/LegalPages.tsx', () => import('./legal/LegalPages').then((m) => m.PrivacyPage))
export const TermsPage = lazyPage('src/legal/LegalPages.tsx', () => import('./legal/LegalPages').then((m) => m.TermsPage))
export const PatientRightsPage = lazyPage('src/legal/LegalPages.tsx', () => import('./legal/LegalPages').then((m) => m.PatientRightsPage))

const routePages: Partial<Record<Route, PageChunk>> = {
  evaluation: EvaluationPage,
  privacy: PrivacyPage,
  terms: TermsPage,
  patientRights: PatientRightsPage,
}

export function lazyPageFor(route: Route): PageChunk | undefined {
  return routePages[route]
}

export function preloadAllPages(): Promise<unknown> {
  return Promise.all(Object.values(routePages).map((page) => page.preload()))
}
