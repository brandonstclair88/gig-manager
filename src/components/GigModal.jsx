import React, { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../supabase'
import { validateGigMoney, currency } from '../utils'

const EMPTY = {
  title: '', client: '', client_email: '', venue: '', venue_address: '',
  date: '', time: '', duration_hours: '2', fee: '', deposit: '', paid: '',
  setlist: '', notes: '', invoice_status: 'draft'
}

export default function GigModal({ gig, userId, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState([])
  const dialogRef = useRef(null)
  const firstFieldRef = useRef(null)

  useEffect(() => {
    if (gig) {
      setForm({
        title: gig.title || '',
        client: gig.client || '',
        client_email: gig.client_email || '',
        venue: gig.venue || '',
        venue_address: gig.venue_address || '',
        date: gig.date || '',
        time: gig.time || '',
        duration_hours: gig.duration_hours ?? '2',
        fee: gig.fee ?? '',
        deposit: gig.deposit ?? '',
        paid: gig.paid ?? '',
        setlist: gig.setlist || '',
        notes: gig.notes || '',
        invoice_status: gig.invoice_status || 'draft'
      })
    } else {
      setForm(EMPTY)
    }
    setErrors([])
  }, [gig])

  // Esc closes the dialog, and focus starts inside it rather than on the page
  // behind — both were missing, which made the modal a keyboard dead end.
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') { e.stopPropagation(); onClose() }
    }
    document.addEventListener('keydown', onKeyDown)
    firstFieldRef.current?.focus()
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
    }
  }, [onClose])

  function set(key, val) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  /** Blocking problems only. Warnings are handled separately via confirm(). */
  function validate() {
    const issues = []
    if (!form.title.trim()) issues.push({ level: 'error', message: 'Event title is required.' })
    if (!form.date) issues.push({ level: 'error', message: 'Date is required.' })
    if (form.client_email && !/^\S+@\S+\.\S+$/.test(form.client_email.trim())) {
      issues.push({ level: 'error', message: 'Client email doesn\'t look like a valid address.' })
    }
    return [...issues, ...validateGigMoney(form)]
  }

  async function save() {
    const issues = validate()
    const blocking = issues.filter(i => i.level === 'error')
    setErrors(issues)
    if (blocking.length) {
      // The error summary sits at the top of a scrollable dialog. On a long
      // form the Save button is well below it, so without this the click
      // appears to do nothing at all.
      dialogRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const warnings = issues.filter(i => i.level === 'warn')
    if (warnings.length && !confirm(warnings.map(w => w.message).join('\n\n') + '\n\nSave anyway?')) return

    setLoading(true)
    const fee = Number(form.fee || 0)
    const paid = Number(form.paid || 0)

    // Derive the invoice status from the numbers, but only in the directions
    // that are unambiguous: fully paid → paid, and a gig previously marked
    // paid that no longer is → back to sent. Otherwise respect the dropdown.
    let invoice_status = form.invoice_status || 'draft'
    if (fee > 0 && paid >= fee) invoice_status = 'paid'
    else if (invoice_status === 'paid') invoice_status = 'sent'

    const payload = {
      title: form.title.trim(),
      client: form.client.trim(),
      client_email: form.client_email.trim(),
      venue: form.venue.trim(),
      venue_address: form.venue_address.trim(),
      duration_hours: Number(form.duration_hours || 2),
      date: form.date || null,
      time: form.time || null,
      fee,
      deposit: Number(form.deposit || 0),
      paid,
      setlist: form.setlist,
      notes: form.notes,
      invoice_status,
      contract_status: gig?.contract_status || 'not sent'
    }

    let error, savedId = gig?.id
    if (gig?.id) {
      ;({ error } = await supabase.from('gigs').update(payload).eq('id', gig.id))
    } else {
      // Ask the insert to return the new row instead of re-querying for
      // "the most recent gig" afterwards, which could pick up someone
      // else's row or a concurrent insert.
      const res = await supabase.from('gigs').insert([{ ...payload, user_id: userId }]).select('id').single()
      error = res.error
      savedId = res.data?.id
    }

    setLoading(false)
    if (error) { alert(error.message); return }

    // Sync with Google Calendar
    try {
      if (gig?.id && gig?.calendar_event_id) {
        // Update existing calendar event
        await fetch('/api/calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'update', 
            gig: { ...payload, id: gig.id, calendar_event_id: gig.calendar_event_id } 
          })
        })
      } else if (gig?.id) {
        // Gig exists but no calendar event yet - create one
        const calRes = await fetch('/api/calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create', gig: { ...payload, id: gig.id } })
        })
        const calData = await calRes.json()
        if (calData.eventId) {
          await supabase.from('gigs').update({ calendar_event_id: calData.eventId }).eq('id', gig.id)
        }
      } else if (savedId) {
        // Brand new gig - create calendar event for the row we just inserted
        const calRes = await fetch('/api/calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create', gig: { ...payload, id: savedId } })
        })
        const calData = await calRes.json()
        if (calData.eventId) {
          await supabase.from('gigs').update({ calendar_event_id: calData.eventId }).eq('id', savedId)
        }
      }
    } catch (e) {
      console.error('Calendar sync failed:', e)
    }

    onSaved()
    onClose()
  }

  function stopProp(e) { e.stopPropagation() }

  const blocking = errors.filter(e => e.level === 'error')
  const feeNum = Number(form.fee || 0)
  const paidNum = Number(form.paid || 0)
  const balancePreview = feeNum - paidNum

  return (
    <div
      className="modal-backdrop"
      style={{ position: 'fixed', inset: 0, background: 'rgba(26,23,20,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={gig?.id ? 'Edit gig' : 'Add a gig'}
        className="modal"
        style={{ background: 'white', borderRadius: 24, padding: 36, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(26,23,20,.16)', position: 'relative' }}
        onClick={stopProp}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{ position: 'absolute', top: 18, right: 18, background: 'var(--paper2)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <X size={18} />
        </button>

        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, fontWeight: 400, fontStyle: 'italic', marginBottom: 22 }}>
          {gig?.id ? 'Edit Gig' : 'Add a Gig'}
        </h2>

        {blocking.length > 0 && (
          <div className="alert alert-danger" style={{ marginBottom: 18 }} role="alert">
            {blocking.map((e, i) => <p key={i} className="alert-sub">{e.message}</p>)}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>

          <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.08em' }}>Event Title *</label>
            <input ref={firstFieldRef} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Wedding reception, corporate party…" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.08em' }}>Client</label>
            <input value={form.client} onChange={e => set('client', e.target.value)} placeholder="Client name" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.08em' }}>Client Email</label>
            <input type="email" value={form.client_email} onChange={e => set('client_email', e.target.value)} placeholder="client@email.com" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.08em' }}>Invoice Status</label>
            <select value={form.invoice_status} onChange={e => set('invoice_status', e.target.value)}>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.08em' }}>Venue Name</label>
            <input value={form.venue} onChange={e => set('venue', e.target.value)} placeholder="Venue name" />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.08em' }}>Venue Address</label>
            <input value={form.venue_address} onChange={e => set('venue_address', e.target.value)} placeholder="123 Main St, City, CA 90210" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.08em' }}>Date *</label>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.08em' }}>Time</label>
            <input type="time" value={form.time} onChange={e => set('time', e.target.value)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.08em' }}>Duration (hours)</label>
            <input type="number" min="0.5" max="8" step="0.5" value={form.duration_hours} onChange={e => set('duration_hours', e.target.value)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.08em' }}>Fee ($)</label>
            <input type="number" min="0" value={form.fee} onChange={e => set('fee', e.target.value)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.08em' }}>Deposit ($)</label>
            <input type="number" min="0" value={form.deposit} onChange={e => set('deposit', e.target.value)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.08em' }}>Paid to Date ($)</label>
            <input type="number" min="0" value={form.paid} onChange={e => set('paid', e.target.value)} />
          </div>

          {/* Spell out the relationship between these three fields — treating
              the deposit as a separate amount is what inflated the totals. */}
          <div style={{ gridColumn: '1 / -1', marginTop: -6 }}>
            <p style={{ fontSize: 12, color: 'var(--ink3)' }}>
              Paid to date includes the deposit.
              {feeNum > 0 && (
                <>
                  {' '}Balance:{' '}
                  <strong style={{ color: balancePreview < 0 ? 'var(--red)' : 'var(--ink2)' }}>
                    {currency(Math.abs(balancePreview))}
                    {balancePreview < 0 ? ' overpaid' : balancePreview === 0 ? ' — paid in full' : ' still owed'}
                  </strong>
                </>
              )}
            </p>
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.08em' }}>Set List</label>
            <textarea value={form.setlist} onChange={e => set('setlist', e.target.value)} placeholder="Song 1, Song 2…" />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.08em' }}>Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Special requests, parking info, contact details…" />
          </div>

        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--paper3)' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={loading}>
            {loading ? 'Saving…' : gig?.id ? 'Save Changes' : 'Add Gig'}
          </button>
        </div>
      </div>
    </div>
  )
}
