/**
 * Stripe → app: when a client pays through a payment link, add the payment
 * to the gig and email Paige, so nobody has to remember "Mark fully paid".
 *
 * Setup (Stripe Dashboard → Developers → Webhooks → Add endpoint):
 *   URL:    https://<site>/api/stripe-webhook
 *   Event:  checkout.session.completed
 * Then put the endpoint's signing secret in Vercel as STRIPE_WEBHOOK_SECRET.
 * Also needs SUPABASE_SERVICE_ROLE_KEY (Supabase → Project Settings → API).
 */
import Stripe from 'stripe'
import { adminConfigured, adminRest } from './_lib/admin-db.js'

// Stripe signs the exact bytes it sent, so we read the raw stream. Don't touch
// req.body before this: on Vercel, reading it parses (and consumes) the stream.
export const config = { api: { bodyParser: false } }

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const OWNER_EMAIL = process.env.OWNER_EMAIL || 'paigestclair19@gmail.com'
const FROM = process.env.RESEND_FROM || 'Paige Camryn Music <onboarding@resend.dev>'

async function rawBody(req) {
  const chunks = []
  for await (const c of req) chunks.push(typeof c === 'string' ? Buffer.from(c) : c)
  return Buffer.concat(chunks)
}

const money = n => `$${Number(n || 0).toFixed(2)}`
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret || !adminConfigured()) return res.status(500).json({ error: 'Webhook not configured' })

  let event
  try {
    event = stripe.webhooks.constructEvent(await rawBody(req), req.headers['stripe-signature'], secret)
  } catch (err) {
    return res.status(400).json({ error: `Bad signature: ${err.message}` })
  }

  if (event.type !== 'checkout.session.completed') return res.status(200).json({ ignored: event.type })

  const session = event.data.object
  const gigId = session.metadata?.gig_id
  if (!gigId || session.payment_status !== 'paid') return res.status(200).json({ skipped: true })

  // Stripe can deliver the same event twice. Mark the payment as recorded on
  // Stripe's side so a retry never double-counts it.
  const piId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id
  if (piId) {
    const pi = await stripe.paymentIntents.retrieve(piId)
    if (pi.metadata?.recorded_in_app === 'true') return res.status(200).json({ duplicate: true })
  }

  try {
    const [gig] = await adminRest(`gigs?id=eq.${encodeURIComponent(gigId)}&select=id,title,client,fee,paid,invoice_status`)
    if (!gig) return res.status(200).json({ error: 'Gig not found' })

    // Credit what the client was asked for, not the card-fee surcharge.
    const amount = Number(session.metadata?.amount_original) || (session.amount_total || 0) / 100
    const paid = Number(gig.paid || 0) + amount
    const fullyPaid = paid >= Number(gig.fee || 0)
    await adminRest(`gigs?id=eq.${encodeURIComponent(gigId)}`, {
      method: 'PATCH',
      body: { paid, ...(fullyPaid ? { invoice_status: 'paid' } : {}) },
      prefer: 'return=minimal'
    })
    if (piId) await stripe.paymentIntents.update(piId, { metadata: { recorded_in_app: 'true' } })

    if (process.env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM,
          to: [OWNER_EMAIL],
          subject: `💳 Payment received: ${money(amount)} — ${gig.title}`,
          html: `<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:32px;color:#1a1714">
            <h2 style="font-weight:400;font-style:italic">Payment received</h2>
            <p><strong>${esc(gig.client || 'A client')}</strong> paid <strong>${money(amount)}</strong> for <strong>${esc(gig.title)}</strong>.</p>
            <p>Total paid: ${money(paid)} of ${money(gig.fee)}${fullyPaid ? ' — fully paid ✓' : ` — ${money(Number(gig.fee) - paid)} still owed`}.</p>
            <p style="color:#9a9189;font-size:13px">Already recorded in the app — no need to mark it paid.</p></div>`
        })
      }).catch(() => {})
    }

    return res.status(200).json({ recorded: amount, paid, fullyPaid })
  } catch (err) {
    // 500 makes Stripe retry later.
    return res.status(500).json({ error: err.message })
  }
}
