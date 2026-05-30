export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { action, gig } = req.body

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN

  // Get access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  })

  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) {
    return res.status(500).json({ error: 'Failed to get access token', details: tokenData })
  }

  const accessToken = tokenData.access_token
  const calendarId = 'primary'

  // Build event object
  function buildEvent(gig) {
    const startDate = gig.date || new Date().toISOString().slice(0, 10)
    const startTime = gig.time || '09:00'
    const [hours, minutes] = startTime.split(':')
    const startDateTime = `${startDate}T${startTime}:00`
    
    // End time 2 hours after start
    const endHour = String(Math.min(23, parseInt(hours) + 2)).padStart(2, '0')
    const endDateTime = `${startDate}T${endHour}:${minutes}:00`

    return {
      summary: `🎵 ${gig.title}${gig.client ? ` — ${gig.client}` : ''}`,
      location: gig.venue_address || gig.venue || '',
      description: [
        gig.client ? `Client: ${gig.client}` : '',
        gig.venue ? `Venue: ${gig.venue}` : '',
        gig.fee ? `Fee: $${Number(gig.fee).toFixed(2)}` : '',
        gig.notes ? `Notes: ${gig.notes}` : '',
      ].filter(Boolean).join('\n'),
      start: { dateTime: startDateTime, timeZone: 'America/Los_Angeles' },
      end: { dateTime: endDateTime, timeZone: 'America/Los_Angeles' },
      colorId: '11', // Tomato red
    }
  }

  try {
    if (action === 'create') {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(buildEvent(gig))
        }
      )
      const data = await response.json()
      return res.status(200).json({ success: true, eventId: data.id })

    } else if (action === 'update') {
      if (!gig.calendar_event_id) return res.status(400).json({ error: 'No calendar event ID' })
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${gig.calendar_event_id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(buildEvent(gig))
        }
      )
      const data = await response.json()
      return res.status(200).json({ success: true, eventId: data.id })

    } else if (action === 'delete') {
      if (!gig.calendar_event_id) return res.status(400).json({ error: 'No calendar event ID' })
      await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${gig.calendar_event_id}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      )
      return res.status(200).json({ success: true })
    }

    return res.status(400).json({ error: 'Unknown action' })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
