export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { type, data } = req.body
  const apiKey = process.env.RESEND_API_KEY

  let subject, html

  if (type === 'inquiry') {
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
        to: ['paigestclair19@gmail.com'],
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
