/**
 * Weekly backup: emails Paige a copy of every table (JSON) plus a gigs CSV.
 * The free Supabase plan keeps no backups, so this is her safety net for
 * client records and tax history.
 *
 * Runs from the "crons" entry in vercel.json. Needs these Vercel env vars:
 *   CRON_SECRET                – any long random string; Vercel sends it with
 *                                cron calls so strangers can't trigger emails
 *   SUPABASE_SERVICE_ROLE_KEY  – Supabase → Project Settings → API
 *   RESEND_API_KEY             – already set
 */
import { adminConfigured, adminRest } from './_lib/admin-db.js'

const TABLES = ['gigs', 'clients', 'inquiries', 'repertoire', 'testimonials']
const OWNER_EMAIL = process.env.OWNER_EMAIL || 'paigestclair19@gmail.com'
const FROM = process.env.RESEND_FROM || 'Paige Camryn Music <onboarding@resend.dev>'

function toCSV(rows) {
  if (!rows.length) return ''
  const cols = [...new Set(rows.flatMap(r => Object.keys(r)))]
  const cell = v => {
    if (v == null) return ''
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [cols.join(','), ...rows.map(r => cols.map(c => cell(r[c])).join(','))].join('\n')
}

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) return res.status(401).end()
  if (!adminConfigured() || !process.env.RESEND_API_KEY) return res.status(500).json({ error: 'Not configured' })

  const date = new Date().toISOString().slice(0, 10)
  const data = {}
  for (const t of TABLES) data[t] = await adminRest(`${t}?select=*`)

  const b64 = s => Buffer.from(s, 'utf8').toString('base64')
  const attachments = [
    { filename: `paige-camryn-backup-${date}.json`, content: b64(JSON.stringify(data, null, 2)) },
    { filename: `gigs-${date}.csv`, content: b64(toCSV(data.gigs)) },
  ]
  const counts = TABLES.map(t => `${t}: ${data[t].length}`).join(' · ')

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM,
      to: [OWNER_EMAIL],
      subject: `🗂 Weekly backup — ${date}`,
      html: `<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:32px;color:#1a1714">
        <h2 style="font-weight:400;font-style:italic">Weekly backup</h2>
        <p>Attached is a full copy of your Gig Manager data. Keep these somewhere safe — no action needed.</p>
        <p style="color:#9a9189;font-size:13px">${counts}</p></div>`,
      attachments
    })
  })
  if (!r.ok) return res.status(502).json({ error: await r.text() })
  return res.status(200).json({ ok: true, counts })
}
