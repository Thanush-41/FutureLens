'use client'

// Public share route: re-uses the existing results page.
// The ResultsPage component itself reads the route via useParams,
// so it works whether mounted at /results/[id] or /r/[id].
// It also auto-detects /r/ to switch Back behavior to home and hide owner-only controls.

import ResultsPage from '../../results/[id]/page'

export default ResultsPage
