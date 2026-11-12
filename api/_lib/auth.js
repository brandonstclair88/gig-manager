/**
 * Server-side check that a request comes from the signed-in owner.
 *
 * The dashboard sends its Supabase access token as a Bearer header; we ask
 * Supabase who it belongs to. Without this, anyone who found these endpoints
 * could send email from Paige's domain, edit her Google Calendar, or create
 * Stripe checkout sessions.
 *
 * Lives under api/_lib so Vercel does not expose it as a route.
 */
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
const OWNER_USER_ID = process.env.OWNER_USER_ID || process.env.VITE_OWNER_USER_ID

export async function requireOwner(req, res) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    res.status(401).json({ error: 'Not signed in' })
    return null
  }
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` }
    })
    if (!r.ok) { res.status(401).json({ error: 'Not signed in' }); return null }
    const user = await r.json()
    if (OWNER_USER_ID && user.id !== OWNER_USER_ID) {
      res.status(403).json({ error: 'Forbidden' })
      return null
    }
    return user
  } catch {
    res.status(503).json({ error: 'Auth check failed' })
    return null
  }
}
