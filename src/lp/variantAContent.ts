import { landingPages, type LandingPageContent } from '../landing/landingContent'

/*
  /lp/a: the control. It is the live /dementia-evaluation copy as merged in PR 67 and PR 69
  (buttons go straight to the scheduler on /get-started, no evaluation form, no speed or cost
  claims), unchanged. Only the page frame differs: the shared minimal test header and footer.
  It reads the live content, so later copy edits to /dementia-evaluation reach the control too.
*/

const base = landingPages['dementia-evaluation']

export const variantAContent: LandingPageContent = base
