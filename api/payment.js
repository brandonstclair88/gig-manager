import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { amount, gigId, gigTitle, client, description, passFeeToCient } = req.body

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
      success_url: `${req.headers.origin}?payment=success&gig=${gigId}`,
      cancel_url: `${req.headers.origin}?payment=cancelled&gig=${gigId}`,
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
