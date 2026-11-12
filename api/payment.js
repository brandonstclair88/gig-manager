import Stripe from 'stripe'
import { requireOwner } from './_lib/auth.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  if (!(await requireOwner(req, res))) return

  const { amount, gigId, gigTitle, client, description, passFeeToCient } = req.body

  const publicOrigin = String(req.headers.origin || '').replace('://app.', '://')

  try {
    // Calculate amount in cents
    let amountInCents = Math.round(Number(amount) * 100)

    // If passing fee to client, add 2.9% + 30 cents
    if (passFeeToCient) {
      amountInCents = Math.round((amountInCents + 30) / (1 - 0.029))
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: description || gigTitle,
              description: `Payment for ${gigTitle} — Paige Camryn Music`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // Clients land on the public site, not the dashboard host. (The old
      // ?gig= parameter is read as a contract-signing link and showed an error.)
      success_url: `${publicOrigin}/?payment=success`,
      cancel_url: `${publicOrigin}/?payment=cancelled`,
      customer_email: req.body.client_email || undefined,
      metadata: {
        gig_id: gigId,
        amount_original: amount,
        pass_fee: passFeeToCient ? 'true' : 'false'
      }
    })

    return res.status(200).json({ url: session.url })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
