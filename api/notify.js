export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { type, data } = req.body
  const apiKey = process.env.RESEND_API_KEY

  let subject, html, to

  if (type === 'inquiry') {
    to = ['paigestclair19@gmail.com']
    subject = `New Enquiry from ${data.name}`
    html = `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a1714;">
        <h1 style="font-size: 28px; font-weight: 400; font-style: italic; color: #c9a097; margin-bottom: 8px;">New Enquiry</h1>
        <p style="color: #9a9189; font-size: 13px; margin-bottom: 32px; letter-spacing: .08em; text-transform: uppercase;">Paige Camryn Music</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 10px 0; border-bottom: 1px solid #ede5dc; color: #9a9189; font-size: 13px; width: 140px;">Name</td><td style="padding: 10px 0; border-bottom: 1px solid #ede5dc; font-size: 14px;">${data.name}</td></tr>
          <tr><td style="padding: 10px 0; border-bottom: 1px solid #ede5dc; color: #9a9189; font-size: 13px;">Email</td><td style="padding: 10px 0; border-bottom: 1px solid #ede5dc; font-size: 14px;">${data.email || '—'}</td></tr>
          <tr><td style="padding: 10px 0; border-bottom: 1px solid #ede5dc; color: #9a9189; font-size: 13px;">Phone</td><td style="padding: 10px 0; border-bottom: 1px solid #ede5dc; font-size: 14px;">${data.phone || '—'}</td></tr>
          <tr><td style="padding: 10px 0; border-bottom: 1px solid #ede5dc; color: #9a9189; font-size: 13px;">Event Type</td><td style="padding: 10px 0; border-bottom: 1px solid #ede5dc; font-size: 14px;">${data.event_type || '—'}</td></tr>
          <tr><td style="padding: 10px 0; border-bottom: 1px solid #ede5dc; color: #9a9189; font-size: 13px;">Event Date</td><td style="padding: 10px 0; border-bottom: 1px solid #ede5dc; font-size: 14px;">${data.event_date || '—'}</td></tr>
          <tr><td style="padding: 10px 0; border-bottom: 1px solid #ede5dc; color: #9a9189; font-size: 13px;">Venue</td><td style="padding: 10px 0; border-bottom: 1px solid #ede5dc; font-size: 14px;">${data.venue || '—'}</td></tr>
          <tr><td style="padding: 10px 0; color: #9a9189; font-size: 13px; vertical-align: top;">Notes</td><td style="padding: 10px 0; font-size: 14px; white-space: pre-wrap;">${data.notes || '—'}</td></tr>
        </table>
        <div style="margin-top: 32px; padding: 20px; background: #f5e6e2; border-radius: 10px; border: 1px solid #e8c8c0;">
          <p style="color: #b07870; font-size: 13px; margin: 0;">Log in to your app to view and manage this enquiry.</p>
        </div>
      </div>
    `
  } else if (type === 'signed') {
    to = ['paigestclair19@gmail.com']
    subject = `Contract Signed — ${data.title}`
    html = `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a1714;">
        <h1 style="font-size: 28px; font-weight: 400; font-style: italic; color: #c9a097; margin-bottom: 8px;">Contract Signed ✍️</h1>
        <p style="color: #9a9189; font-size: 13px; margin-bottom: 32px; letter-spacing: .08em; text-transform: uppercase;">Paige Camryn Music</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 10px 0; border-bottom: 1px solid #ede5dc; color: #9a9189; font-size: 13px; width: 140px;">Event</td><td style="padding: 10px 0; border-bottom: 1px solid #ede5dc; font-size: 14px;">${data.title}</td></tr>
          <tr><td style="padding: 10px 0; border-bottom: 1px solid #ede5dc; color: #9a9189; font-size: 13px;">Signed By</td><td style="padding: 10px 0; border-bottom: 1px solid #ede5dc; font-size: 14px;">${data.signed_by}</td></tr>
          <tr><td style="padding: 10px 0; border-bottom: 1px solid #ede5dc; color: #9a9189; font-size: 13px;">Client</td><td style="padding: 10px 0; border-bottom: 1px solid #ede5dc; font-size: 14px;">${data.client || '—'}</td></tr>
          <tr><td style="padding: 10px 0; border-bottom: 1px solid #ede5dc; color: #9a9189; font-size: 13px;">Date</td><td style="padding: 10px 0; border-bottom: 1px solid #ede5dc; font-size: 14px;">${data.date || '—'}</td></tr>
          <tr><td style="padding: 10px 0; color: #9a9189; font-size: 13px;">Venue</td><td style="padding: 10px 0; font-size: 14px;">${data.venue || '—'}</td></tr>
        </table>
        <div style="margin-top: 32px; padding: 20px; background: #e2ede6; border-radius: 10px; border: 1px solid #c3dbc9;">
          <p style="color: #5a7a65; font-size: 13px; margin: 0;">The contract has been signed and saved. Log in to your app to view the details.</p>
        </div>
      </div>
    `
  } else if (type === 'contract') {
    if (!data.client_email) return res.status(400).json({ error: 'No client email' })
    to = [data.client_email]
    subject = `Your Performance Agreement — ${data.title}`
    const signingLink = `${data.origin}?gig=${data.id}`
    html = `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a1714;">
        <h1 style="font-size: 28px; font-weight: 400; font-style: italic; color: #c9a097; margin-bottom: 8px;">Performance Agreement</h1>
        <p style="color: #9a9189; font-size: 13px; margin-bottom: 32px; letter-spacing: .08em; text-transform: uppercase;">Paige Camryn Music · Luxury Event Harpist</p>

        <p style="font-size: 15px; line-height: 1.7; margin-bottom: 24px;">Dear ${data.client || 'there'},</p>
        <p style="font-size: 15px; line-height: 1.7; margin-bottom: 24px;">Thank you for booking Paige Camryn Music for your upcoming event. Please review and sign your performance agreement using the button below.</p>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
          <tr><td style="padding: 10px 0; border-bottom: 1px solid #ede5dc; color: #9a9189; font-size: 13px; width: 140px;">Event</td><td style="padding: 10px 0; border-bottom: 1px solid #ede5dc; font-size: 14px;">${data.title}</td></tr>
          <tr><td style="padding: 10px 0; border-bottom: 1px solid #ede5dc; color: #9a9189; font-size: 13px;">Date</td><td style="padding: 10px 0; border-bottom: 1px solid #ede5dc; font-size: 14px;">${data.date || '—'}</td></tr>
          <tr><td style="padding: 10px 0; border-bottom: 1px solid #ede5dc; color: #9a9189; font-size: 13px;">Venue</td><td style="padding: 10px 0; border-bottom: 1px solid #ede5dc; font-size: 14px;">${data.venue || '—'}</td></tr>
          <tr><td style="padding: 10px 0; color: #9a9189; font-size: 13px;">Fee</td><td style="padding: 10px 0; font-size: 14px;">$${Number(data.fee || 0).toFixed(2)}</td></tr>
        </table>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${signingLink}" style="display: inline-block; padding: 16px 40px; background: #c9a097; color: white; text-decoration: none; border-radius: 10px; font-size: 13px; font-weight: 500; letter-spacing: .1em; text-transform: uppercase; font-family: Arial, sans-serif;">Review & Sign Contract</a>
        </div>

        <p style="font-size: 13px; color: #9a9189; line-height: 1.7;">If the button doesn't work, copy and paste this link into your browser:<br/>
          <a href="${signingLink}" style="color: #c9a097;">${signingLink}</a>
        </p>

        <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #ede5dc; text-align: center;">
          <p style="font-style: italic; font-size: 15px; color: #9a9189;">Paige Camryn Music</p>
          <p style="font-size: 12px; color: #b0a89e;">hello@paigecamryn.com</p>
        </div>
      </div>
    `
  } else if (type === 'quote') {
    to = [data.email]
    subject = `Your Quote from Paige Camryn Music`
    html = `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a1714;">
        <h1 style="font-size: 28px; font-weight: 400; font-style: italic; color: #c9a097; margin-bottom: 8px;">Your Quote</h1>
        <p style="color: #9a9189; font-size: 13px; margin-bottom: 32px; letter-spacing: .08em; text-transform: uppercase;">Paige Camryn Music · Luxury Event Harpist</p>
        <div style="white-space: pre-wrap; font-size: 15px; line-height: 1.8; color: #3d3733; margin-bottom: 32px;">${data.message}</div>
        <div style="margin-top: 32px; padding: 24px; background: #f5e6e2; border-radius: 10px; border: 1px solid #e8c8c0; text-align: center;">
          <p style="font-family: Georgia, serif; font-size: 13px; color: #9a9189; margin-bottom: 8px; text-transform: uppercase; letter-spacing: .1em;">Quoted Amount</p>
          <p style="font-family: Georgia, serif; font-size: 36px; color: #c9a097; font-weight: 400; margin: 0;">$${Number(data.quoted_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #ede5dc; text-align: center;">
          <p style="font-style: italic; font-size: 15px; color: #9a9189;">Paige Camryn Music</p>
          <p style="font-size: 12px; color: #b0a89e;">hello@paigecamryn.com</p>
        </div>
      </div>
    `
  } else {
    return res.status(400).json({ error: 'Unknown notification type' })
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Paige Camryn Music <onboarding@resend.dev>',
        to,
        subject,
        html
      })
    })

    const result = await response.json()
    if (!response.ok) return res.status(500).json({ error: result })
    return res.status(200).json({ success: true })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
