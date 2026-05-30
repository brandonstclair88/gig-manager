import React, { useState, useMemo } from 'react'
import { Plus, X, Edit2, ChevronRight, Music, FileText } from 'lucide-react'
import { supabase } from '../supabase'
import { currency, fmtDate } from '../utils'

const STAGES = ['enquired', 'quoted', 'deposit received', 'confirmed', 'completed', 'lost']

const STAGE_COLORS = {
  'enquired':         { bg: '#e8f4fd', color: '#1a6896' },
  'quoted':           { bg: '#fef3cd', color: '#856404' },
  'deposit received': { bg: '#e2ede6', color: '#2d6a4f' },
  'confirmed':        { bg: '#e2ede6', color: '#2d6a4f' },
  'completed':        { bg: '#e8e0d4', color: '#7a746e' },
  'lost':             { bg: '#fde8e8', color: '#a33030' },
}

const EMPTY = { name: '', email: '', phone: '', event_type: '', event_date: '', venue: '', budget: '', notes: '', stage: 'enquired', quoted_amount: '' }

function InquiryModal({ inquiry, userId, onClose, onSaved }) {
  const [form, setForm] = useState(inquiry || EMPTY)
  const [loading, setLoading] = useState(false)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function save() {
    if (!form.name.trim()) { alert('Please enter a name.'); return }
    setLoading(true)
    const payload = {
      name: form.name, email: form.email, phone: form.phone,
      event_type: form.event_type, event_date: form.event_date || null,
      venue: form.venue, budget: Number(form.budget || 0),
      notes: form.notes, stage: form.stage,
      quoted_amount: Number(form.quoted_amount || 0)
    }
    let error
    if (inquiry?.id) {
      ;({ error } = await supabase.from('inquiries').update(payload).eq('id', inquiry.id))
    } else {
      ;({ error } = await supabase.from('inquiries').insert([{ ...payload, user_id: userId }]))
    }
    setLoading(false)
    if (error) { alert(error.message); return }
    onSaved(); onClose()
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        <h2>{inquiry?.id ? 'Edit Inquiry' : 'Add Inquiry'}</h2>
        <div className="form-grid">
          <div className="field span2">
            <label>Name</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Client name" />
          </div>
          <div className="field">
            <label>Stage</label>
            <select value={form.stage} onChange={e => set('stage', e.target.value)}>
              {STAGES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div className="field">
            <label>Phone</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>
          <div className="field">
            <label>Event Type</label>
            <input value={form.event_type} onChange={e => set('event_type', e.target.value)} placeholder="Wedding, corporate…" />
          </div>
          <div className="field">
            <label>Event Date</label>
            <input type="date" value={form.event_date} onChange={e => set('event_date', e.target.value)} />
          </div>
          <div className="field">
            <label>Venue</label>
            <input value={form.venue} onChange={e => set('venue', e.target.value)} />
          </div>
          <div className="field">
            <label>Budget ($)</label>
            <input type="number" value={form.budget} onChange={e => set('budget', e.target.value)} />
          </div>
          <div className="field">
            <label>Quoted Amount ($)</label>
            <input type="number" value={form.quoted_amount} onChange={e => set('quoted_amount', e.target.value)} />
          </div>
          <div className="field span3">
            <label>Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Song requests, special requirements…" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}

function QuoteModal({ inquiry, onClose }) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [quoteAmount, setQuoteAmount] = useState(inquiry.quoted_amount || inquiry.budget || '')
  const [message, setMessage] = useState(`Dear ${inquiry.name},\n\nThank you for your interest in Paige Camryn Music for your upcoming ${inquiry.event_type || 'event'}${inquiry.event_date ? ` on ${fmtDate(inquiry.event_date)}` : ''}.\n\nI'd be delighted to perform for you! Based on your requirements, here is my quote:\n\nPerformance Fee: $${quoteAmount}\n\nThis includes live amplified harp music and a custom song list tailored to your event.\n\nPlease don't hesitate to reach out with any questions. I look forward to making your event truly special!\n\nWarm regards,\nPaige Camryn\nPaige Camryn Music\nhello@paigecamryn.com`)

  async function sendQuote() {
    if (!inquiry.email) { alert('No email address for this inquiry.'); return }
    setSending(true)

    // Update quoted amount in DB
    await supabase.from('inquiries').update({
      quoted_amount: Number(quoteAmount),
      stage: 'quoted'
    }).eq('id', inquiry.id)

    // Send email
    const res = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'quote',
        data: {
          name: inquiry.name,
          email: inquiry.email,
          event_type: inquiry.event_type,
          event_date: inquiry.event_date,
          venue: inquiry.venue,
          quoted_amount: quoteAmount,
          message
        }
      })
    })

    setSending(false)
    if (res.ok) { setSent(true) }
    else { alert('Failed to send quote. Please check the email address.') }
  }

  if (sent) return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
        <h2>Quote Sent!</h2>
        <p className="muted" style={{ marginBottom: 24 }}>Your quote has been sent to {inquiry.email} and the inquiry has been updated to "Quoted".</p>
        <button className="btn btn-primary" onClick={onClose} style={{ width: '100%', justifyContent: 'center' }}>Done</button>
      </div>
    </div>
  )

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        <h2>Send Quote</h2>
        <p className="muted" style={{ marginBottom: 20 }}>Sending to: <strong>{inquiry.email || 'No email on file'}</strong></p>

        <div className="field" style={{ marginBottom: 16 }}>
          <label>Quote Amount ($)</label>
          <input
            type="number"
            value={quoteAmount}
            onChange={e => {
              setQuoteAmount(e.target.value)
              setMessage(m => m.replace(/Performance Fee: \$[\d.]+/, `Performance Fee: $${e.target.value}`))
            }}
          />
        </div>

        <div className="field" style={{ marginBottom: 20 }}>
          <label>Email Message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            style={{ minHeight: 280, fontSize: 13 }}
          />
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={sendQuote} disabled={sending || !inquiry.email}>
            {sending ? 'Sending…' : '✉ Send Quote'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function InquiriesPage({ inquiries, userId, onRefresh }) {
  const [showModal, setShowModal] = useState(false)
  const [editingInquiry, setEditingInquiry] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [showQuote, setShowQuote] = useState(false)
  const [converting, setConverting] = useState(false)

  const selectedInquiry = inquiries.find(i => i.id === selectedId)

  async function updateStage(id, stage) {
    const { error } = await supabase.from('inquiries').update({ stage }).eq('id', id)
    if (error) { alert(error.message); return }
    onRefresh()
  }

  async function deleteInquiry(id) {
    if (!confirm('Delete this inquiry?')) return
    const { error } = await supabase.from('inquiries').delete().eq('id', id)
    if (error) { alert(error.message); return }
    setSelectedId(null); onRefresh()
  }

  async function convertToGig(inquiry) {
    if (!confirm(`Convert "${inquiry.name}'s" inquiry into a gig?`)) return
    setConverting(true)
    const { error } = await supabase.from('gigs').insert([{
      user_id: userId,
      title: inquiry.event_type || inquiry.name,
      client: inquiry.name,
      client_email: inquiry.email,
      venue: inquiry.venue,
      date: inquiry.event_date || null,
      fee: Number(inquiry.quoted_amount || inquiry.budget || 0),
      deposit: 0,
      paid: 0,
      notes: inquiry.notes,
      invoice_status: 'draft',
      contract_status: 'not sent'
    }])
    if (error) { alert(error.message); setConverting(false); return }

    // Mark inquiry as confirmed
    await supabase.from('inquiries').update({ stage: 'confirmed' }).eq('id', inquiry.id)
    setConverting(false)
    onRefresh()
    alert(`✅ Gig created for ${inquiry.name}! Find it in the Gigs page.`)
  }

  const byStage = useMemo(() => {
    return STAGES.reduce((acc, s) => {
      acc[s] = inquiries.filter(i => i.stage === s)
      return acc
    }, {})
  }, [inquiries])

  const activeStages = STAGES.filter(s => s !== 'lost' && s !== 'completed')

  return (
    <div>
      <div className="page-header">
        <h1>Inquiries</h1>
        <button className="btn btn-primary" onClick={() => { setEditingInquiry(null); setShowModal(true) }}>
          <Plus size={16} /> Add Inquiry
        </button>
      </div>

      <div className="stats" style={{ marginBottom: 28 }}>
        {activeStages.map(s => (
          <div key={s} className="stat-card">
            <div className="label">{s.charAt(0).toUpperCase() + s.slice(1)}</div>
            <div className="value" style={{ fontSize: 32 }}>{byStage[s]?.length || 0}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedInquiry ? '1fr 1.4fr' : '1fr', gap: 16, alignItems: 'start' }}>
        <div>
          {inquiries.length === 0 && (
            <div className="card empty">
              <p>No inquiries yet. They'll appear here when clients fill out your public repertoire form, or add them manually.</p>
            </div>
          )}

          {STAGES.filter(s => byStage[s]?.length > 0).map(stage => (
            <div key={stage} style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ink3)', marginBottom: 8, fontWeight: 500 }}>
                {stage} ({byStage[stage].length})
              </h3>
              <div style={{ display: 'grid', gap: 8 }}>
                {byStage[stage].map(inq => (
                  <button
                    key={inq.id}
                    onClick={() => setSelectedId(inq.id === selectedId ? null : inq.id)}
                    style={{
                      display: 'block', textAlign: 'left', width: '100%',
                      background: inq.id === selectedId ? 'var(--blush)' : 'var(--paper)',
                      color: inq.id === selectedId ? 'white' : 'var(--ink)',
                      border: `1px solid ${inq.id === selectedId ? 'var(--blush)' : 'var(--paper3)'}`,
                      borderRadius: 'var(--radius)', padding: '14px 16px',
                      cursor: 'pointer', transition: 'all .15s', boxShadow: 'var(--shadow)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <strong style={{ fontSize: 15 }}>{inq.name}</strong>
                      <span style={{ ...STAGE_COLORS[inq.stage], padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, flexShrink: 0 }}>
                        {inq.stage}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, opacity: .75, marginTop: 4 }}>{inq.event_type}{inq.event_date ? ` · ${fmtDate(inq.event_date)}` : ''}</p>
                    <p style={{ fontSize: 13, opacity: .6, marginTop: 2 }}>{inq.venue}</p>
                    {inq.quoted_amount > 0 && (
                      <p style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>{currency(inq.quoted_amount)} quoted</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {selectedInquiry && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, fontStyle: 'italic' }}>{selectedInquiry.name}</h2>
                <p className="muted" style={{ marginTop: 4 }}>{selectedInquiry.event_type}{selectedInquiry.event_date ? ` · ${fmtDate(selectedInquiry.event_date)}` : ''}</p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => { setEditingInquiry(selectedInquiry); setShowModal(true) }}>
                  <Edit2 size={14} /> Edit
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => deleteInquiry(selectedInquiry.id)}>
                  <X size={14} /> Delete
                </button>
              </div>
            </div>

            <div className="mini-grid" style={{ marginBottom: 16 }}>
              {selectedInquiry.email && (
                <div className="mini-cell">
                  <div className="mini-label">Email</div>
                  <div className="mini-val" style={{ fontSize: 13 }}>{selectedInquiry.email}</div>
                </div>
              )}
              {selectedInquiry.phone && (
                <div className="mini-cell">
                  <div className="mini-label">Phone</div>
                  <div className="mini-val" style={{ fontSize: 13 }}>{selectedInquiry.phone}</div>
                </div>
              )}
              {selectedInquiry.venue && (
                <div className="mini-cell">
                  <div className="mini-label">Venue</div>
                  <div className="mini-val" style={{ fontSize: 13 }}>{selectedInquiry.venue}</div>
                </div>
              )}
              {selectedInquiry.quoted_amount > 0 && (
                <div className="mini-cell">
                  <div className="mini-label">Quoted</div>
                  <div className="mini-val">{currency(selectedInquiry.quoted_amount)}</div>
                </div>
              )}
            </div>

            {selectedInquiry.notes && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Notes</p>
                <p style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.7, color: 'var(--ink2)' }}>{selectedInquiry.notes}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="actions-row" style={{ marginBottom: 20 }}>
              <button className="btn btn-gold btn-sm" onClick={() => setShowQuote(true)}>
                <FileText size={14} /> Send Quote
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => convertToGig(selectedInquiry)}
                disabled={converting}
              >
                <Music size={14} /> {converting ? 'Converting…' : 'Convert to Gig'}
              </button>
            </div>

            <hr className="divider" />

            {/* Move through pipeline */}
            <div>
              <p style={{ fontWeight: 500, fontSize: 12, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ink3)' }}>Move to stage</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {STAGES.filter(s => s !== selectedInquiry.stage).map(s => (
                  <button
                    key={s}
                    className="btn btn-ghost btn-sm"
                    onClick={() => updateStage(selectedInquiry.id, s)}
                    style={{ ...STAGE_COLORS[s] }}
                  >
                    <ChevronRight size={13} /> {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <InquiryModal
          inquiry={editingInquiry}
          userId={userId}
          onClose={() => setShowModal(false)}
          onSaved={onRefresh}
        />
      )}

      {showQuote && selectedInquiry && (
        <QuoteModal
          inquiry={selectedInquiry}
          onClose={() => { setShowQuote(false); onRefresh() }}
        />
      )}
    </div>
  )
}
