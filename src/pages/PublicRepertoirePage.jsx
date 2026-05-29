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
      name: form.name, email: form.email, phone: form.phone,
      event_type: form.event_type, event_date: form.event_date || null,
      venue: form.venue,
      notes: (form.notes ? form.notes + '\n\n' : '') + (songList ? 'Requested songs:\n' + songList : ''),
      stage: 'enquired'
    }])
    setSubmitting(false)
    if (error) { alert(error.message); return }
    setSubmitted(true)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#fdfaf7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#9a9189', fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontStyle: 'italic' }}>Loading repertoire…</p>
    </div>
  )

  if (submitted) return (
    <div style={{ minHeight: '100vh', background: '#fdfaf7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🎵</div>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 400, fontStyle: 'italic', marginBottom: 12, color: '#1a1714' }}>Thank you!</h1>
        <p style={{ color: '#9a9189', marginBottom: 8, fontSize: 15 }}>Your enquiry has been received.</p>
        <p style={{ color: '#9a9189', fontSize: 14 }}>Paige will be in touch shortly to discuss your event.</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#fdfaf7', fontFamily: 'Jost, system-ui, sans-serif' }}>

      {/* Hero */}
      <div style={{ background: '#f2ebe3', borderBottom: '1px solid #ede5dc', padding: '64px 20px 48px', textAlign: 'center' }}>
        <p style={{ color: '#c9a097', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.2em', marginBottom: 16, fontWeight: 500 }}>Repertoire</p>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', color: '#1a1714', fontSize: 48, fontWeight: 400, fontStyle: 'italic', marginBottom: 10 }}>Paige Camryn Music</h1>
        <p style={{ color: '#9a9189', fontSize: 15, maxWidth: 440, margin: '0 auto 24px', lineHeight: 1.6 }}>Luxury Event Harpist · Browse my repertoire and select songs for your special event</p>
        <div style={{ width: 40, height: 1, background: '#c9a097', margin: '0 auto' }} />
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 20px' }}>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 36, justifyContent: 'center' }}>
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              style={{
                padding: '8px 20px', borderRadius: 20, cursor: 'pointer', fontSize: 12,
                fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase',
                fontFamily: 'Jost, sans-serif', transition: 'all .15s',
                background: activeCategory === c ? '#c9a097' : 'white',
                color: activeCategory === c ? 'white' : '#9a9189',
                border: `1px solid ${activeCategory === c ? '#c9a097' : '#ede5dc'}`,
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Selected count */}
        {selected.length > 0 && (
          <div style={{ background: '#f5e6e2', border: '1px solid #e8c8c0', borderRadius: 12, padding: '12px 18px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ color: '#b07870', fontWeight: 500, fontSize: 14 }}>🎵 {selected.length} song{selected.length !== 1 ? 's' : ''} selected</p>
            <button onClick={() => setSelected([])} style={{ background: 'white', border: '1px solid #e8c8c0', color: '#b07870', borderRadius: 8, padding: '4px 12px', cursor: 'pointer', fontSize: 12, fontFamily: 'Jost, sans-serif' }}>Clear</button>
          </div>
        )}

        {/* Song list */}
        {Object.entries(grouped).map(([category, songs]) => (
          <div key={category} style={{ marginBottom: 36 }}>
            {activeCategory === 'All' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif', color: '#1a1714', fontSize: 22, fontWeight: 400, fontStyle: 'italic', whiteSpace: 'nowrap' }}>{category}</h2>
                <div style={{ flex: 1, height: 1, background: '#ede5dc' }} />
              </div>
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
                      background: isSelected ? '#f5e6e2' : 'white',
                      border: `1px solid ${isSelected ? '#c9a097' : '#ede5dc'}`,
                      borderRadius: 12, padding: '14px 18px', cursor: 'pointer',
                      transition: 'all .15s', boxShadow: '0 2px 8px rgba(26,23,20,.04)'
                    }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: 6,
                      border: `1.5px solid ${isSelected ? '#c9a097' : '#ede5dc'}`,
                      background: isSelected ? '#c9a097' : 'white', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all .15s'
                    }}>
                      {isSelected && <span style={{ color: 'white', fontSize: 12, lineHeight: 1 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: '#1a1714', fontWeight: 500, fontSize: 15 }}>{s.title}</p>
                      {s.composer && <p style={{ color: '#9a9189', fontSize: 13, marginTop: 2 }}>{s.composer}</p>}
                      {s.notes && <p style={{ color: '#b0a89e', fontSize: 12, marginTop: 2, fontStyle: 'italic' }}>{s.notes}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {repertoire.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9a9189' }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontStyle: 'italic' }}>Repertoire coming soon</p>
          </div>
        )}

        {/* Enquiry form */}
        <div style={{ background: 'white', borderRadius: 20, padding: 40, marginTop: 16, border: '1px solid #ede5dc', boxShadow: '0 2px 20px rgba(26,23,20,.06)' }}>
          <p style={{ color: '#c9a097', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.2em', marginBottom: 10, fontWeight: 500 }}>Get in Touch</p>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 400, fontStyle: 'italic', marginBottom: 8, color: '#1a1714' }}>Enquire Now</h2>
          <p style={{ color: '#9a9189', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>Fill in your details and Paige will be in touch to discuss your event.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { label: 'Full Name *', key: 'name', placeholder: 'Your name', type: 'text' },
              { label: 'Email *', key: 'email', placeholder: 'your@email.com', type: 'email' },
              { label: 'Phone', key: 'phone', placeholder: 'Your phone number', type: 'text' },
              { label: 'Event Type', key: 'event_type', placeholder: 'Wedding, corporate, private party…', type: 'text' },
              { label: 'Event Date', key: 'event_date', placeholder: '', type: 'date' },
              { label: 'Venue', key: 'venue', placeholder: 'Venue name or location', type: 'text' },
            ].map(f => (
              <div key={f.key} style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: 10, fontWeight: 500, color: '#9a9189', marginBottom: 6, letterSpacing: '.1em', textTransform: 'uppercase', fontFamily: 'Jost, sans-serif' }}>{f.label}</label>
                <input
                  type={f.type} value={form[f.key]} placeholder={f.placeholder}
                  onChange={e => setField(f.key, e.target.value)}
                  style={{ padding: '10px 13px', border: '1px solid #ede5dc', borderRadius: 8, fontSize: 14, fontFamily: 'Jost, sans-serif', background: '#fdfaf7', color: '#1a1714', outline: 'none' }}
                />
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: 10, fontWeight: 500, color: '#9a9189', marginBottom: 6, letterSpacing: '.1em', textTransform: 'uppercase', fontFamily: 'Jost, sans-serif' }}>Additional Notes</label>
              <textarea
                value={form.notes} placeholder="Any special requests or questions…"
                onChange={e => setField('notes', e.target.value)}
                style={{ padding: '10px 13px', border: '1px solid #ede5dc', borderRadius: 8, fontSize: 14, fontFamily: 'Jost, sans-serif', background: '#fdfaf7', color: '#1a1714', minHeight: 100, resize: 'vertical', outline: 'none' }}
              />
            </div>
          </div>

          {selected.length > 0 && (
            <div style={{ background: '#f5e6e2', borderRadius: 10, padding: '14px 18px', margin: '20px 0', border: '1px solid #e8c8c0' }}>
              <p style={{ color: '#b07870', fontWeight: 500, fontSize: 13, marginBottom: 8 }}>🎵 Selected songs ({selected.length}):</p>
              {repertoire.filter(s => selected.includes(s.id)).map(s => (
                <p key={s.id} style={{ color: '#9a9189', fontSize: 13, marginTop: 3 }}>· {s.title}{s.composer ? ` — ${s.composer}` : ''}</p>
              ))}
            </div>
          )}

          <button
            onClick={submit} disabled={submitting}
            style={{
              width: '100%', marginTop: 24, padding: '15px',
              background: '#c9a097', color: 'white', border: 'none',
              borderRadius: 10, fontSize: 13, fontWeight: 500,
              letterSpacing: '.1em', textTransform: 'uppercase',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontFamily: 'Jost, sans-serif', opacity: submitting ? .7 : 1
            }}
          >
            {submitting ? 'Sending…' : '✉ Send Enquiry'}
          </button>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 48, paddingTop: 32, borderTop: '1px solid #ede5dc' }}>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 16, color: '#9a9189' }}>Paige Camryn Music · Luxury Event Harpist</p>
        </div>
      </div>
    </div>
  )
}
