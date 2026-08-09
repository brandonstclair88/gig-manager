import { useCallback, useEffect, useState } from 'react'

/**
 * Minimal hash router.
 *
 * The app previously kept the current page in component state, so every screen
 * lived at "/" — Back did nothing, a refresh dumped you on the Dashboard, and
 * a gig could not be linked to. Hash routing gives us real URLs without a
 * server-side rewrite rule (important on Vercel static hosting) and without a
 * new dependency.
 *
 * Shape:  #/gigs           → { page: 'gigs', id: null }
 *         #/gigs/abc-123   → { page: 'gigs', id: 'abc-123' }
 */

const DEFAULT_PAGE = 'dashboard'

export function parseHash(hash = window.location.hash) {
  const raw = String(hash || '').replace(/^#\/?/, '')
  if (!raw) return { page: DEFAULT_PAGE, id: null }
  const [page, id] = raw.split('/').map(decodeURIComponent)
  return { page: page || DEFAULT_PAGE, id: id || null }
}

export function buildHash(page, id) {
  return id
    ? `#/${encodeURIComponent(page)}/${encodeURIComponent(id)}`
    : `#/${encodeURIComponent(page)}`
}

/**
 * @param validPages routes that are allowed; anything else normalises to the dashboard
 * @param enabled    set false on public pages (?site=true, ?gig=…) so the router
 *                   leaves their URLs alone. Without this the normalisation below
 *                   appends "#/dashboard" to every public link — including the
 *                   contract signing URL that gets sent to clients.
 */
export function useHashRoute(validPages, enabled = true) {
  const [route, setRoute] = useState(() => parseHash())

  useEffect(() => {
    if (!enabled) return
    const onChange = () => setRoute(parseHash())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [enabled])

  // An unknown or empty hash normalises to the dashboard, replacing the entry
  // so Back doesn't bounce the user through a URL that was never valid.
  useEffect(() => {
    if (!enabled) return
    if (!window.location.hash || (validPages && !validPages.includes(route.page))) {
      window.history.replaceState(null, '', buildHash(DEFAULT_PAGE))
      setRoute({ page: DEFAULT_PAGE, id: null })
    }
  }, [route.page, validPages, enabled])

  /** Push a new entry — use for navigation the user should be able to undo. */
  const navigate = useCallback((page, id) => {
    const next = buildHash(page, id)
    if (window.location.hash !== next) window.location.hash = next
    else setRoute(parseHash(next))
  }, [])

  /** Replace the current entry — use for selection changes within a page. */
  const replace = useCallback((page, id) => {
    const next = buildHash(page, id)
    if (window.location.hash !== next) {
      window.history.replaceState(null, '', next)
      setRoute(parseHash(next))
    }
  }, [])

  return { route, navigate, replace }
}
