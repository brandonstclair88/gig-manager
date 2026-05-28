// ── Currency ──────────────────────────────────────────────
export function currency(n) {
  return Number(n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

// ── Date ──────────────────────────────────────────────────
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

// ── Invoice status badge ───────────────────────────────────
export function invoiceBadge(status) {
  const map = {
    paid: 'badge-green',
    sent: 'badge-gold',
    draft: 'badge-grey',
    overdue: 'badge-red'
  }
  return map[status] || 'badge-grey'
}

// ── Contract text ─────────────────────────────────────────
export function contractText(g) {
  return `PERFORMANCE AGREEMENT

This agreement is entered into between:

CLIENT:    ${g.client || '[Client Name]'}
PERFORMER: [Your Name]

EVENT:  ${g.title || '[Event Title]'}
VENUE:  ${g.venue || '[Venue]'}
DATE:   ${fmtDate(g.date)}
TIME:   ${fmtTime(g.time) || '[Time]'}

──────────────────────────────────────────
FINANCIAL TERMS
──────────────────────────────────────────
Performance Fee:   ${currency(g.fee)}
Deposit Due:       ${currency(g.deposit)}
Balance Due:       ${currency(Math.max(Number(g.fee || 0) - Number(g.deposit || 0), 0))}

──────────────────────────────────────────
TERMS
──────────────────────────────────────────
1. The Performer agrees to provide live musical performance services for the duration of the event.
2. The deposit is non-refundable and is due upon signing.
3. The balance is due on the day of the performance prior to the start time.
4. Cancellations within 14 days of the event forfeit the full fee.

──────────────────────────────────────────
SIGNATURES
──────────────────────────────────────────
Client Signature:     ________________________________  Date: __________

Performer Signature:  ________________________________  Date: __________
`
}

// ── PDF Invoice (using jsPDF) ─────────────────────────────
export async function downloadPDFInvoice(gig) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()

  const balance = Math.max(Number(gig.fee || 0) - Number(gig.paid || 0), 0)
  const invoiceNum = `INV-${String(gig.id || '').slice(0, 6).toUpperCase() || Date.now()}`

  // Header bar
  doc.setFillColor(15, 13, 11)
  doc.rect(0, 0, 210, 40, 'F')

  doc.setTextColor(240, 192, 96)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('GIG MANAGER', 14, 18)

  doc.setTextColor(200, 190, 180)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('INVOICE', 14, 28)
  doc.text(invoiceNum, 14, 35)

  doc.setTextColor(200, 190, 180)
  doc.setFontSize(9)
  doc.text(`Date: ${fmtDate(new Date().toISOString().slice(0, 10))}`, 196, 20, { align: 'right' })

  doc.setTextColor(15, 13, 11)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('BILL TO', 14, 54)
  doc.setFont('helvetica', 'normal')
  doc.text(gig.client || '—', 14, 61)

  doc.setFont('helvetica', 'bold')
  doc.text('EVENT DETAILS', 110, 54)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Event: ${gig.title || '—'}`, 110, 61)
  doc.text(`Venue: ${gig.venue || '—'}`, 110, 67)
  doc.text(`Date:  ${fmtDate(gig.date)}`, 110, 73)
  doc.text(`Time:  ${fmtTime(gig.time) || '—'}`, 110, 79)

  doc.setDrawColor(220, 210, 200)
  doc.line(14, 88, 196, 88)

  doc.setFillColor(242, 237, 228)
  doc.rect(14, 92, 182, 10, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('DESCRIPTION', 18, 99)
  doc.text('AMOUNT', 188, 99, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  let y = 116
  doc.text('Performance Fee', 18, y)
  doc.text(currency(gig.fee), 188, y, { align: 'right' })

  y += 10
  doc.text('Deposit Received', 18, y)
  doc.text(`-${currency(gig.deposit)}`, 188, y, { align: 'right' })

  y += 10
  doc.text('Paid to Date', 18, y)
  doc.text(`-${currency(gig.paid)}`, 188, y, { align: 'right' })

  doc.line(14, y + 8, 196, y + 8)

  y += 18
  doc.setFillColor(15, 13, 11)
  doc.rect(110, y - 7, 86, 14, 'F')
  doc.setTextColor(240, 192, 96)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('BALANCE DUE', 116, y + 1)
  doc.text(currency(balance), 188, y + 1, { align: 'right' })

  doc.setTextColor(15, 13, 11)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Thank you for your business. Payment is due on the day of the performance.', 14, y + 24)

  if (gig.notes) {
    doc.setFontSize(8)
    doc.setTextColor(120, 116, 110)
    doc.text(`Notes: ${gig.notes}`, 14, y + 32)
  }

  doc.save(`${gig.title || 'invoice'}-invoice.pdf`)
}

// ── CSV Export ────────────────────────────────────────────
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
