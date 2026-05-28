import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../supabase'

const EMPTY = {
  title: '', client: '', venue: '', date: '', time: '',
  fee: '', deposit: '', paid: '', setlist: '', notes: '',
  practice_date: '', invoice_status: 'draft'
}

export default function GigModal({ gig, userId, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (gig) {
      setForm({
        title: gig.title || '',
        client: gig.client || '',
        venue: gig.venue || '',
        date: gig.date || '',
        time: gig.time || '',
        fee: gig.fee ?? '',
        deposit: gig.deposit ?? '',
        paid: gig.paid ?? '',
        setlist: gig.setlist || '',
        notes: gig.notes || '',
        practice_date: gig.practice_date || '',
        invoice_status: gig.invoice_status || 'draft'
      })
    }
  }, [gig])

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function save() {
    setLoading(true)
    const payload = {
      title: form.title,
      client: form.client,
      venue: form.venue,
      date: form.date || null,
      time: form.time || null,
      fee: Number(form.fee || 0),
      deposit: Number(form.deposit || 0),
      paid: Number(form.paid || 0),
      setlist: form.setlist,
      notes: form.notes,
      practice_date: form.practice_date || null,
      invoice_status: Number(form.paid || 0) >= Number(form.fee || 0) && Number(form.fee || 0) > 0
        ? 'paid'
        : form.invoice_status || 'draft',
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
    onSaved()
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        <h2>{gig?.id ? 'Edit Gig' : 'Add a Gig'}</h2>

        <div className="form-grid">
          <div className="field span3">
            <label>Event Title</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Wedding reception, corporate party…" />
          </div>

          <div className="field span2">
            <label>Client</label>
            <input value={form.client} onChange={e => set('client', e.target.value)} placeholder="Client name" />
          </div>

          <div className="field">
            <label>Invoice Status</label>
            <select value={form.invoice_status} onChange={e => set('invoice_status', e.target.value)}>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div className="field span3">
            <label>Venue</label>
            <input value={form.venue} onChange={e => set('venue', e.target.value)} placeholder="Venue name and address" />
          </div>

          <div className="field">
            <label>Date</label>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>

          <div className="field">
            <label>Time</label>
            <input type="time" value={form.time} onChange={e => set('time', e.target.value)} />
          </div>

          <div className="field">
            <label>Practice Reminder</label>
            <input type="date" value={form.practice_date} onChange={e => set('practice_date', e.target.value)} />
          </div>

          <div className="field">
            <label>Fee ($)</label>
            <input type="number" min="0" value={form.fee} onChange={e => set('fee', e.target.value)} />
          </div>

          <div className="field">
            <label>Deposit ($)</label>
            <input type="number" min="0" value={form.deposit} onChange={e => set('deposit', e.target.value)} />
          </div>

          <div className="field">
            <label>Paid to Date ($)</label>
            <input type="number" min="0" value={form.paid} onChange={e => set('paid', e.target.value)} />
          </div>

          <div className="field span3">
            <label>Set List</label>
            <textarea value={form.setlist} onChange={e => set('setlist', e.target.value)} placeholder="Song 1, Song 2…" />
          </div>

          <div className="field span3">
            <label>Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Special requests, parking info, contact details…" />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={loading}>
            {loading ? 'Saving…' : gig?.id ? 'Save Changes' : 'Add Gig'}
          </button>
        </div>
      </div>
    </div>
  )
}
