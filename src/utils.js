export function currency(n) {
  return Number(n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function fmtDate(d) {
  if (!d) return '—'
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function fmtTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hr = parseInt(h)
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`
}

export function invoiceBadge(status) {
  const map = {
    paid: 'badge-green',
    sent: 'badge-gold',
    draft: 'badge-grey',
    overdue: 'badge-red'
  }
  return map[status] || 'badge-grey'
}

export function contractText(g) {
  const balance = Math.max(Number(g.fee || 0) - Number(g.deposit || 0), 0)
  const depositDueDate = g.date ? (() => {
    const d = new Date(g.date + 'T00:00:00')
    d.setDate(d.getDate() - 14)
    const today = new Date()
    today.setHours(0,0,0,0)
    if (d <= today) return 'immediately upon signing'
    return fmtDate(d.toISOString().slice(0, 10))
  })() : '[14 days before event]'

  return `PERFORMANCE AGREEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PAIGE CAMRYN MUSIC
Thousand Oaks, CA
hello@paigecamryn.com
paigecamryn.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This Performance Agreement ("Agreement") is entered into between:

PERFORMER: Paige St. Clair, performing as Paige Camryn Music
           Thousand Oaks, CA | hello@paigecamryn.com

CLIENT:    ${g.client || '[Client Name]'}
           ${g.client_email ? g.client_email : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EVENT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Event:    ${g.title || '[Event Title]'}
Venue:    ${g.venue || '[Venue]'}
Date:     ${fmtDate(g.date)}
Time:     ${fmtTime(g.time) || '[Time]'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINANCIAL TERMS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Performance Fee:   ${currency(g.fee)}
Deposit (Non-Refundable): ${currency(g.deposit)}
Balance Due:             ${currency(balance)}

PAYMENT SCHEDULE:
  · Deposit of ${currency(g.deposit)} is due upon signing this Agreement
    and no later than ${depositDueDate}
  · Remaining balance of ${currency(balance)} is due in cash or
    electronic payment on the day of the performance,
    prior to the start of Performer's set

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SERVICES & EQUIPMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Performer agrees to provide live harp performance services for
the duration of the event as outlined above. Services include:

  · Live amplified harp performance
  · Professional sound equipment (amplifier & speakers)
  · A custom song list tailored to the Client's event
  · One pre-event consultation to finalize song selections
  · For performances exceeding two (2) hours, Performer requires
    one 10-minute break per additional hour

Client agrees to provide:
  · A safe performance area (min. 6ft x 6ft)
  · Access to a standard electrical outlet within 25 feet
  · Adequate parking or load-in access for equipment

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CANCELLATION POLICY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cancellation by Client:
  · More than 30 days before event: Deposit is forfeited
  · 15–30 days before event: 50% of total fee is due
  · Fewer than 14 days before event: 100% of total fee is due

Cancellation by Performer:
  · In the unlikely event Performer must cancel, Client will
    receive a full refund of all payments made. Performer will
    make reasonable efforts to find a qualified substitute.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORCE MAJEURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Neither party shall be held liable for failure to perform due to
circumstances beyond their reasonable control, including but not
limited to natural disasters, severe weather, government-mandated
restrictions, illness, or other acts of God. In such cases, both
parties agree to make reasonable efforts to reschedule.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GENERAL TERMS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. This Agreement constitutes the entire agreement between the
   parties and supersedes all prior negotiations or understandings.

2. Any modifications to this Agreement must be made in writing
   and agreed upon by both parties.

3. Performer reserves the right to record or photograph the
   performance for promotional purposes unless otherwise agreed.

4. Client shall not hold Performer liable for any injury, loss,
   or damage arising from the performance unless caused by
   Performer's gross negligence.

5. This Agreement shall be governed by the laws of the State
   of California.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SIGNATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

By signing below, both parties agree to the terms of this
Performance Agreement.

CLIENT

Name:      ${g.client || '________________________________'}
Signature: ________________________________
Date:      __________


PERFORMER

Name:      Paige St. Clair
Signature: ________________________________
Date:      __________


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Paige Camryn Music · hello@paigecamryn.com · paigecamryn.com
`
}

export async function downloadPDFInvoice(gig) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()

  const balance = Math.max(Number(gig.fee || 0) - Number(gig.paid || 0), 0)
  const invoiceNum = `INV-${String(gig.id || '').slice(0, 6).toUpperCase() || Date.now()}`

  // Header bar - warm cream
  doc.setFillColor(242, 235, 227)
  doc.rect(0, 0, 210, 44, 'F')

  // Brand name in rose
  doc.setTextColor(176, 120, 112)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('PAIGE CAMRYN MUSIC', 14, 16)

  // Subtitle
  doc.setTextColor(154, 145, 137)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('LUXURY EVENT HARPIST', 14, 23)
  doc.text('INVOICE', 14, 31)
  doc.text(invoiceNum, 14, 37)

  // Date right aligned
  doc.text(`Date: ${fmtDate(new Date().toISOString().slice(0, 10))}`, 196, 20, { align: 'right' })

  // Thin rose divider line
  doc.setDrawColor(201, 160, 151)
  doc.setLineWidth(0.5)
  doc.line(0, 44, 210, 44)

  // Reset text color
  doc.setTextColor(26, 23, 20)

  // Bill to
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(154, 145, 137)
  doc.text('BILL TO', 14, 56)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(26, 23, 20)
  doc.setFontSize(10)
  doc.text(gig.client || '—', 14, 63)

  // Event details
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(154, 145, 137)
  doc.text('EVENT DETAILS', 110, 56)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(26, 23, 20)
  doc.setFontSize(9)
  doc.text(`Event: ${gig.title || '—'}`, 110, 63)
  doc.text(`Venue: ${gig.venue || '—'}`, 110, 69)
  doc.text(`Date:  ${fmtDate(gig.date)}`, 110, 75)
  doc.text(`Time:  ${fmtTime(gig.time) || '—'}`, 110, 81)

  // Divider
  doc.setDrawColor(237, 229, 220)
  doc.setLineWidth(0.3)
  doc.line(14, 90, 196, 90)

  // Table header - blush background
  doc.setFillColor(245, 230, 226)
  doc.rect(14, 94, 182, 10, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(154, 145, 137)
  doc.text('DESCRIPTION', 18, 101)
  doc.text('AMOUNT', 188, 101, { align: 'right' })

  // Line items
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(26, 23, 20)
  doc.setFontSize(10)
  let y = 118
  doc.text('Performance Fee', 18, y)
  doc.text(currency(gig.fee), 188, y, { align: 'right' })

  y += 10
  doc.setTextColor(154, 145, 137)
  doc.text('Deposit Received', 18, y)
  doc.text(`-${currency(gig.deposit)}`, 188, y, { align: 'right' })

  y += 10
  doc.text('Paid to Date', 18, y)
  doc.text(`-${currency(gig.paid)}`, 188, y, { align: 'right' })

  // Divider before total
  doc.setDrawColor(237, 229, 220)
  doc.line(14, y + 8, 196, y + 8)

  // Balance due box - rose
  y += 18
  doc.setFillColor(201, 160, 151)
  doc.rect(110, y - 7, 86, 14, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('BALANCE DUE', 116, y + 1)
  doc.text(currency(balance), 188, y + 1, { align: 'right' })

  // Thank you note
  doc.setTextColor(154, 145, 137)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Thank you for choosing Paige Camryn Music. Payment is due on the day of the performance.', 14, y + 24)

  if (gig.notes) {
    doc.setFontSize(8)
    doc.setTextColor(154, 145, 137)
    doc.text(`Notes: ${gig.notes}`, 14, y + 32)
  }

  // Footer line
  doc.setDrawColor(237, 229, 220)
  doc.line(14, 272, 196, 272)
  doc.setTextColor(201, 160, 151)
  doc.setFontSize(8)
  doc.text('Paige Camryn Music · Luxury Event Harpist · paigecamryn.com', 105, 278, { align: 'center' })

  doc.save(`${gig.title || 'invoice'}-invoice.pdf`)
}


export function exportCSV(gigs) {
  const headers = ['Title', 'Client', 'Venue', 'Date', 'Time', 'Fee', 'Deposit', 'Paid', 'Balance', 'Invoice Status', 'Notes']
  const rows = gigs.map(g => [
    g.title, g.client, g.venue, g.date, g.time,
    g.fee, g.deposit, g.paid,
    Math.max(Number(g.fee || 0) - Number(g.paid || 0), 0),
    g.invoice_status, g.notes
  ].map(v => `"${String(v || '').replace(/"/g, '""')}"`))
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `gig-manager-export-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
