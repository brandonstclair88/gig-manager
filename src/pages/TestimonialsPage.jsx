import React, { useState, useEffect } from 'react'
import { Check, X, Star } from 'lucide-react'
import { supabase } from '../supabase'
import { fmtDate } from '../utils'

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setTestimonials(data || [])
    setLoading(false)
  }

  async function approve(id) {
    await supabase.from('testimonials').update({ approved: true }).eq('id', id)
    load()
  }

  async function reject(id) {
    if (!confirm('Delete this testimonial?')) return
    await supabase.from('testimonials').delete().eq('id', id)
    load()
  }

  const filtered = testimonials.filter(t =>
    filter === 'all' ? true :
    filter === 'pending' ? !t.approved :
    t.approved
  )

  const pending = testimonials.filter(t => !t.approved).length
  const approved = testimonials.filter(t => t.approved).length

  return (
    <div>
      <div className="page-header">
        <h1>Testimonials</h1>
      </div>

      <div className="stats" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="label">Pending Review</div>
          <div className="value" style={{ color: pending > 0 ? 'var(--rose)' : 'var(--ink)' }}>{pending}</div>
        </div>
        <div className="stat-card">
          <div className="label">Approved</div>
          <div className="value" style={{ color: 'var(--green)' }}>{approved}</div>
        </div>
        <div className="stat-card">
          <div className="label">Total</div>
          <div className="value">{testimonials.length}</div>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 20 }}>
        {['pending', 'approved', 'all'].map(f => (
          <button key={f} className={`tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'pending' && pending > 0 && (
              <span style={{ background: 'var(--rose)', color: 'white', borderRadius: 20, fontSize: 10, padding: '1px 6px', marginLeft: 6 }}>{pending}</span>
            )}
          </button>
        ))}
      </div>

      {loading && <p className="muted">Loading…</p>}

      {!loading && filtered.length === 0 && (
        <div className="card empty">
          <p>{filter === 'pending' ? 'No testimonials awaiting review.' : 'No testimonials yet.'}</p>
        </div>
      )}

      <div style={{ display: 'grid', gap: 14 }}>
        {filtered.map(t => (
          <div key={t.id} className="card" style={{ borderLeft: `4px solid ${t.approved ? 'var(--green)' : 'var(--blush)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <strong style={{ fontSize: 16 }}>{t.name}</strong>
                  {t.event_type && <span className="badge badge-grey">{t.event_type}</span>}
                  {t.approved && <span className="badge badge-green">✓ Approved</span>}
                </div>
                <div style={{ display: 'flex', gap: 2, marginBottom: 10 }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill="var(--blush)" color="var(--blush)" />
                  ))}
                </div>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--ink2)', fontStyle: 'italic' }}>"{t.message}"</p>
                <p className="muted" style={{ marginTop: 8 }}>{fmtDate(t.created_at?.slice(0, 10))}</p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {!t.approved && (
                  <button className="btn btn-gold btn-sm" onClick={() => approve(t.id)}>
                    <Check size={14} /> Approve
                  </button>
                )}
                <button className="btn btn-danger btn-sm" onClick={() => reject(t.id)}>
                  <X size={14} /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
