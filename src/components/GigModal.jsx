import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../supabase'

const EMPTY = {
  title: '', client: '', client_email: '', venue: '', venue_address: '',
  date: '', time: '', fee: '', deposit: '', paid: '',
  setlist: '', notes: '', invoice_status: 'draft'
}

export default function GigModal({ gig, userId, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)

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
  }, [gig])

  function set(key, val) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  async function save() {
    setLoading(true)
    const payload = {
      title: form.title,
      client: form.client,
      client_email: form.client_email,
      venue: form.venue,
      venue_address: form.venue_address,
      date: form.date || null,
      time: form.time || null,
      fee: Number(form.fee || 0),
      deposit: Number(form.deposit || 0),
      paid: Number(form.paid || 0),
      setlist: form.setlist,
      notes: form.notes,
      practice_date: null,
      invoice_status: Number(form.paid || 0) >= Number(form.fee || 0) && Number(form.fee || 0) > 0
        ? 'paid' : form.invoice_status || 'draft',
      contract_status: gig?.contract_status || 'not sent'
    }

    let error
    if (gig?.id) {
      ;({ error } = await supabase.from('gigs').update(payload).eq('id', gig.id))
    } else {
      ;({ error } = await supabase.from('gigs').insert([{ ...payload, user_id: userId }]))
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
      } else {
        // Brand new gig - create calendar event after insert
        const { data: newGig } = await supabase.from('gigs').select('id').order('created_at', { ascending: false }).limit(1).single()
        if (newGig?.id) {
          const calRes = await fetch('/api/calendar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create', gig: { ...payload, id: newGig.id } })
          })
          const calData = await calRes.json()
          if (calData.eventId) {
            await supabase.from('gigs').update({ calendar_event_id: calData.eventId }).eq('id', newGig.id)
          }
        }
      }
    } catch (e) {
      console.error('Calendar sync failed:', e)
    }

    onSaved()
    onClose()
  }

  function stopProp(e) { e.stopPropagation() }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(26,23,20,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'white', borderRadius: 24, padding: 36, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(26,23,20,.16)', position: 'relative' }}
        onClick={stopProp}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 18, right: 18, background: 'var(--paper2)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <X size={18} />
        </button>

        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, fontWeight: 400, fontStyle: 'italic', marginBottom: 22 }}>
          {gig?.id ? 'Edit Gig' : 'Add a Gig'}
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>

          <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.08em' }}>Event Title</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Wedding reception, corporate party…" />
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
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.08em' }}>Date</label>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.08em' }}>Time</label>
            <input type="time" value={form.time} onChange={e => set('time', e.target.value)} />
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
