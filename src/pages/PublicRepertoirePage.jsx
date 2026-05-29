import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../supabase'

const CATEGORIES = ['Classical', 'Wedding', 'Pop', 'Jazz', 'Celtic', 'Christmas', 'Film & TV', 'Other']

export default function PublicRepertoirePage() {
  const [repertoire, setRepertoire] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState([])
  const [activeCategory, setActiveCategory] = useState('All')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', event_type: '', event_date: '', venue: '', notes: '' })

  useEffect(() => {
    supabase.from('repertoire').select('*').order('category').order('title')
      .then(({ data }) => { setRepertoire(data || []); setLoading(false) })
  }, [])

  const categories = useMemo(() => {
    const used = [...new Set(repertoire.map(s => s.category).filter(Boolean))]
    return ['All', ...CATEGORIES.filter(c => used.includes(c))]
  }, [repertoire])

  const filtered = useMemo(() => {
    return activeCategory === 'All' ? repertoire : repertoire.filter(s => s.category === activeCategory)
  }, [repertoire, activeCategory])

  const grouped = useMemo(() => {
    if (activeCategory !== 'All') return { [activeCategory]: filtered }
    return filtered.reduce((acc, s) => {
      const cat = s.category || 'Other'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(s)
      return acc
    }, {})
  }, [filtered, activeCategory])

  function toggleSong(id) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function submit() {
    if (!form.name.trim() || !form.email.trim()) { alert('Please enter your name and email.'); return }
    setSubmitting(true)

    const selectedSongs = repertoire.filter(s => selected.includes(s.id))
    const songList = selectedSongs.map(s => `${s.title}${s.composer ? ` (${s.composer})` : ''}`).join('\n')

    const { error } = await supabase.from('inquiries').insert([{
      user_id: (await supabase.from('repertoire').select('user_id').limit(1).single()).data?.user_id,
      name: form.name,
      email: form.email,
      phone: form.phone,
      event_type: form.event_type,
      event_date: form.event_date || null,
      venue: form.venue,
      notes: (form.notes ? form.notes + '\n\n' : '') + (songList ? 'Requested songs:\n' + songList : ''),
      stage: 'enquired'
    }])

    setSubmitting(false)
    if (error) { alert(error.message); return }
    setSubmitted(true)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f0d0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#f0c060', fontFamily: 'Playfair Display, serif', fontSize: 22 }}>Loading repertoire…</p>
    </div>
  )

  if (submitted) return (
    <div style={{ minHeight: '100vh', background: '#0f0d0b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#faf8f4', borderRadius: 24, padding: 48, maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎵</div>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, marginBottom: 12 }}>Thank you!</h1>
        <p style={{ color: '#7a746e', marginBottom: 8 }}>Your enquiry has been received.</p>
        <p style={{ color: '#7a746e', fontSize: 14 }}>Paige will be in touch shortly to discuss your event.</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0f0d0b' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0f0d0b, #2a1f0e)', padding: '60px 20px 40px', textAlign: 'center' }}>
        <p style={{ color: '#c9973a', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.16em', marginBottom: 12 }}>Repertoire</p>
        <h1 style={{ fontFamily: 'Playfair Display, serif', color: '#faf8f4', fontSize: 42, marginBottom: 12 }}>Paige Camryn Music</h1>
        <p style={{ color: '#a09890', fontSize: 16, maxWidth: 480, margin: '0 auto 24px' }}>Luxury Event Harpist · Browse my repertoire and select songs for your event</p>
        <div style={{ width: 60, height: 2, background: '#c9973a', margin: '0 auto' }} />
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28, justifyContent: 'center' }}>
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              style={{
                padding: '8px 18px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: activeCategory === c ? '#c9973a' : 'rgba(255,255,255,.08)',
                color: activeCategory === c ? 'white' : '#a09890',
                transition: 'all .15s'
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Selected count */}
        {selected.length > 0 && (
          <div style={{ background: '#c9973a', borderRadius: 12, padding: '12px 18px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ color: 'white', fontWeight: 600 }}>🎵 {selected.length} song{selected.length !== 1 ? 's' : ''} selected</p>
            <button onClick={() => setSelected([])} style={{ background: 'rgba(255,255,255,.2)', border: 'none', color: 'white', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 13 }}>Clear</button>
          </div>
        )}

        {/* Song list */}
        {Object.entries(grouped).map(([category, songs]) => (
          <div key={category} style={{ marginBottom: 32 }}>
            {activeCategory === 'All' && (
              <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#f0c060', fontSize: 20, marginBottom: 12 }}>{category}</h2>
            )}
            <div style={{ display: 'grid', gap: 8 }}>
              {songs.map(s => {
                const isSelected = selected.includes(s.id)
                return (
                  <div
                    key={s.id}
                    onClick={() => toggleSong(s.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      background: isSelected ? 'rgba(201,151,58,.15)' : 'rgba(255,255,255,.04)',
                      border: `1px solid ${isSelected ? '#c9973a' : 'rgba(255,255,255,.08)'}`,
                      borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
                      transition: 'all .15s'
                    }}
                  >
                    <div style={{
                      width: 22, height: 22, borderRadius: 6, border: `2px solid ${isSelected ? '#c9973a' : '#555'}`,
                      background: isSelected ? '#c9973a' : 'transparent', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {isSelected && <span style={{ color: 'white', fontSize: 13 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: '#faf8f4', fontWeight: 600, fontSize: 15 }}>{s.title}</p>
                      {s.composer && <p style={{ color: '#a09890', fontSize: 13, marginTop: 2 }}>{s.composer}</p>}
                      {s.notes && <p style={{ color: '#7a746e', fontSize: 12, marginTop: 2 }}>{s.notes}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Enquiry form */}
        <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 20, padding: 32, marginTop: 20, border: '1px solid rgba(255,255,255,.1)' }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#faf8f4', fontSize: 26, marginBottom: 8 }}>Enquire Now</h2>
          <p style={{ color: '#a09890', fontSize: 14, marginBottom: 24 }}>Fill in your details and Paige will be in touch to discuss your event.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="field">
              <label style={{ color: '#a09890' }}>Full Name *</label>
              <input value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Your name" style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', color: '#faf8f4' }} />
            </div>
            <div className="field">
              <label style={{ color: '#a09890' }}>Email *</label>
              <input type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="your@email.com" style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', color: '#faf8f4' }} />
            </div>
            <div className="field">
              <label style={{ color: '#a09890' }}>Phone</label>
              <input value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="Your phone number" style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', color: '#faf8f4' }} />
            </div>
            <div className="field">
              <label style={{ color: '#a09890' }}>Event Type</label>
              <input value={form.event_type} onChange={e => setField('event_type', e.target.value)} placeholder="Wedding, corporate, private party…" style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', color: '#faf8f4' }} />
            </div>
            <div className="field">
              <label style={{ color: '#a09890' }}>Event Date</label>
              <input type="date" value={form.event_date} onChange={e => setField('event_date', e.target.value)} style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', color: '#faf8f4' }} />
            </div>
            <div className="field">
              <label style={{ color: '#a09890' }}>Venue</label>
              <input value={form.venue} onChange={e => setField('venue', e.target.value)} placeholder="Venue name or location" style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', color: '#faf8f4' }} />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label style={{ color: '#a09890' }}>Additional Notes</label>
              <textarea value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder="Any special requests or questions…" style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', color: '#faf8f4' }} />
            </div>
          </div>

          {selected.length > 0 && (
            <div style={{ background: 'rgba(201,151,58,.1)', borderRadius: 10, padding: '12px 16px', margin: '16px 0', border: '1px solid rgba(201,151,58,.3)' }}>
              <p style={{ color: '#f0c060', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>🎵 Selected songs ({selected.length}):</p>
              {repertoire.filter(s => selected.includes(s.id)).map(s => (
                <p key={s.id} style={{ color: '#a09890', fontSize: 13 }}>• {s.title}{s.composer ? ` — ${s.composer}` : ''}</p>
              ))}
            </div>
          )}

          <button
            onClick={submit}
            disabled={submitting}
            style={{ width: '100%', marginTop: 20, padding: '16px', background: '#c9973a', color: 'white', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}
          >
            {submitting ? 'Sending…' : '✉️ Send Enquiry'}
          </button>
        </div>
      </div>
    </div>
  )
}
