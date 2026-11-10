/*
  Head tags for the two conversion pages. Plain data with no React imports: vite.config.ts
  reads this at build time to write a static HTML shell for each, and App.tsx uses the same
  values once the app is running.
*/

export type PageShellMeta = { title: string; description: string; noindex?: boolean }

export const startMeta: PageShellMeta = {
  title: 'Book a video visit with a neurologist | Local Doctor',
  description:
    'Pick an open time for a video visit with a board-certified neurologist licensed in Maryland. Insurance accepted. No referral needed.',
}

// The evaluation page is a form for people who already chose to start. It is not a search landing page.
export const evaluationMeta: PageShellMeta = {
  title: 'Start your evaluation | Local Doctor',
  description:
    'Answer a few questions to start an evaluation with a board-certified neurologist licensed in Maryland. Insurance accepted. No referral needed.',
  noindex: true,
}

export const pageShells = {
  'get-started': startMeta,
  evaluation: evaluationMeta,
} as const
