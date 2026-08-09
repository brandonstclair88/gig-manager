/**
 * Which of the three surfaces this page load is.
 *
 *   public  paigecamryn.com/                → marketing site
 *   sign    paigecamryn.com/sign/:gigId     → client contract signing
 *   admin   app.paigecamryn.com/  or  /admin → the dashboard
 *
 * Resolved once at module load: the answer cannot change without a navigation,
 * and keeping it constant means no hook ordering depends on it.
 *
 * Previously all three lived on one host and were told apart by query string
 * (?site=true, ?gig=…). That put the private dashboard at the root of the
 * domain, so anyone typing paigecamryn.com would land on a login form, and it
 * made the client-facing contract link look like a tracking parameter.
 */

const ADMIN_HOST_PREFIX = 'app.'
const SIGN_PATH = '/sign/'
const ADMIN_PATH = '/admin'

function resolve(loc = window.location) {
  const host = loc.hostname.toLowerCase()
  const path = loc.pathname
  const params = new URLSearchParams(loc.search)

  // Legacy query-string entry points. Nothing should generate these any more,
  // but a bookmark or an already-sent email might still use them.
  const legacyGig = params.get('gig')
  if (legacyGig) return { kind: 'sign', gigId: legacyGig, legacy: true }
  if (params.has('site')) return { kind: 'public', legacy: true }

  if (path.startsWith(SIGN_PATH)) {
    const gigId = decodeURIComponent(path.slice(SIGN_PATH.length).split('/')[0] || '')
    return { kind: 'sign', gigId: gigId || null, legacy: false }
  }

  // An explicit /admin path works on any host, which is what makes preview
  // deployments and localhost usable before the app subdomain exists.
  if (path === ADMIN_PATH || path.startsWith(ADMIN_PATH + '/')) {
    return { kind: 'admin', legacy: false }
  }

  if (host.startsWith(ADMIN_HOST_PREFIX)) return { kind: 'admin', legacy: false }

  return { kind: 'public', legacy: false }
}

export const surface = resolve()

export const IS_ADMIN = surface.kind === 'admin'
export const IS_SIGN = surface.kind === 'sign'
export const IS_PUBLIC = surface.kind === 'public'

/** Base path the admin app is mounted under, so hash links stay correct. */
export const ADMIN_BASE = window.location.pathname.startsWith(ADMIN_PATH) ? ADMIN_PATH : '/'

/** Public site URL — the root of whichever host is serving the marketing site. */
export function publicSiteUrl() {
  const host = window.location.hostname.toLowerCase()
  if (host.startsWith(ADMIN_HOST_PREFIX)) {
    return `${window.location.protocol}//${host.slice(ADMIN_HOST_PREFIX.length)}`
  }
  return window.location.origin
}

/** Client-facing signing link. Always on the public host, never on app.* */
export function signingUrl(gigId) {
  return `${publicSiteUrl()}/sign/${encodeURIComponent(gigId)}`
}

/**
 * Rewrite a legacy ?site= / ?gig= URL to its modern equivalent without
 * reloading, so the address bar matches what is actually being shown.
 */
export function normaliseLegacyUrl() {
  if (!surface.legacy) return
  const next = surface.kind === 'sign' ? `/sign/${encodeURIComponent(surface.gigId)}` : '/'
  window.history.replaceState(null, '', next)
}
