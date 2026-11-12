/**
 * Daily ping that keeps the free-tier Supabase project from pausing.
 *
 * Supabase pauses free projects after a week without database activity, so
 * this does a real (tiny) read rather than a health check. Scheduled by the
 * "crons" entry in vercel.json — unlike a GitHub Actions schedule, a Vercel
 * cron is not switched off when the repo goes a while without commits.
 */
export default async function handler(req, res) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return res.status(500).json({ ok: false, error: 'Supabase env vars missing' })
  try {
    const r = await fetch(`${url}/rest/v1/repertoire?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }
    })
    return res.status(r.ok ? 200 : 502).json({ ok: r.ok, status: r.status, at: new Date().toISOString() })
  } catch (err) {
    return res.status(502).json({ ok: false, error: err.message })
  }
}
