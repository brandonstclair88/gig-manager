import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../supabase'

const CATEGORIES = ['Classical', 'Wedding', 'Pop', 'Rock', 'Jazz', 'Celtic', 'Christmas', 'Hymns', 'Film & TV', 'Other']

function Nav({ page, setPage }) {
  return (
    <nav style={{ background: '#f2ebe3', borderBottom: '1px solid #ede5dc', padding: '0 5%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
      <div style={{ padding: '20px 0' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 400, fontStyle: 'italic', color: '#1a1714' }}>Paige Camryn Music</h1>
        <p style={{ fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: '#9a9189', marginTop: 2 }}>Luxury Event Harpist</p>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {['events', 'weddings', 'repertoire', 'contact'].map(p => (
          <button key={p} onClick={() => setPage(p)} style={{
            padding: '8px 18px', border: 'none', background: 'transparent',
            fontFamily: 'Jost, sans-serif', fontSize: 12, fontWeight: 500,
            letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer',
            color: page === p ? '#c9a097' : '#9a9189',
            borderBottom: page === p ? '2px solid #c9a097' : '2px solid transparent',
            transition: 'all .15s'
          }}>{p}</button>
        ))}
      </div>
    </nav>
  )
}

function Footer() {
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px', borderTop: '1px solid #ede5dc', marginTop: 60 }}>
      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 16, color: '#9a9189', marginBottom: 8 }}>Paige Camryn Music</p>
      <p style={{ fontSize: 11, color: '#b0a89e', letterSpacing: '.08em' }}>hello@paigecamryn.com</p>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 16 }}>
        {[
          { label: 'Instagram', url: 'https://www.instagram.com/paigetheharpist/' },
          { label: 'YouTube', url: 'https://www.youtube.com/channel/UCX_zOd0pkl_Iu2gl8G5ecdw' },
          { label: 'Facebook', url: 'https://www.facebook.com/profile.php?id=61551663203147' },
        ].map(s => (
          <a key={s.label} href={s.url} target="_blank" rel="noreferrer"
            style={{ fontSize: 11, color: '#c9a097', letterSpacing: '.08em', textTransform: 'uppercase', textDecoration: 'none' }}>
            {s.label}
          </a>
        ))}
      </div>
    </div>
  )
}

function Hero({ title, subtitle }) {
  return (
    <div style={{ background: '#f2ebe3', padding: '72px 20px 56px', textAlign: 'center', borderBottom: '1px solid #ede5dc' }}>
      <p style={{ color: '#c9a097', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.2em', marginBottom: 14, fontWeight: 500 }}>Paige Camryn Music</p>
      <h2 style={{ fontFamily: 'Cormorant Garamond, serif', color: '#1a1714', fontSize: 48, fontWeight: 400, fontStyle: 'italic', marginBottom: 12 }}>{title}</h2>
      <p style={{ color: '#9a9189', fontSize: 15, maxWidth: 480, margin: '0 auto' }}>{subtitle}</p>
      <div style={{ width: 40, height: 1, background: '#c9a097', margin: '24px auto 0' }} />
    </div>
  )
}

function EventsPage({ setPage }) {
  return (
    <div>
      <Hero title="Events" subtitle="Live harp music for every occasion" />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '60px 20px' }}>

        <p style={{ fontSize: 15, lineHeight: 1.9, color: '#3d3733', marginBottom: 12 }}>
          Paige Camryn has had the opportunity to perform for a wide variety of public and private events including memorial services, bridal showers, baby showers, private dinners, fundraisers, holiday events, birthday parties, art galleries, galas, churches, country clubs, hospice homes and hospitals.
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.9, color: '#3d3733', marginBottom: 48 }}>
          Unique performances include a centennial house celebration, a twilight open house, a horse show, and a VIP reception. Each performance includes amplification and a custom song list.
        </p>

        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <p style={{ color: '#c9a097', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.2em', marginBottom: 20, fontWeight: 500 }}>Event Rates</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 48 }}>
          {[
            { duration: 'One Hour', price: '$375' },
            { duration: 'Two Hours', price: '$590' },
            { duration: 'Three Hours', price: '$850' },
          ].map(r => (
            <div key={r.duration} style={{ background: 'white', border: '1px solid #ede5dc', borderRadius: 16, padding: '32px 24px', textAlign: 'center', boxShadow: '0 2px 16px rgba(26,23,20,.05)' }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 400, color: '#c9a097', marginBottom: 8 }}>{r.price}</p>
              <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.12em', color: '#9a9189', fontWeight: 500 }}>{r.duration}</p>
            </div>
          ))}
        </div>

        <div style={{ background: '#f5e6e2', borderRadius: 12, padding: '20px 24px', marginBottom: 48, border: '1px solid #e8c8c0' }}>
          <p style={{ fontSize: 14, color: '#b07870', lineHeight: 1.7 }}>
            🌿 Travel within Ventura County is complimentary. Events in Santa Barbara County, Los Angeles County & beyond will incur an additional travel fee.
          </p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button onClick={() => setPage('contact')} style={{
            padding: '14px 40px', background: '#c9a097', color: 'white', border: 'none',
            borderRadius: 10, fontSize: 12, fontWeight: 500, letterSpacing: '.12em',
            textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'Jost, sans-serif'
          }}>Secure Your Date</button>
        </div>
      </div>
    </div>
  )
}

function WeddingsPage({ setPage }) {
  const packages = [
    {
      name: 'Signature Ceremony',
      price: 'Starting at $500',
      duration: 'One Hour',
      description: 'The signature ceremony includes pre-ceremony and ceremony music (processional, bridal walk, recessional) for one hour of live amplified harp music.',
      details: [
        'Includes one meeting with Paige six weeks prior to finalize song selections & confirm wedding day details',
        'Paige is happy to learn two requested songs outside of her repertoire for your wedding day',
      ]
    },
    {
      name: 'C & C Serenade',
      price: 'Starting at $850',
      duration: 'Two Hours',
      description: 'The C & C Serenade package includes pre-ceremony, ceremony and cocktail hour for a total of two hours of live amplified harp music.',
      details: [
        'Includes one meeting upon booking to discuss your vision for the perfect wedding day',
        'Paige will collaborate with you to create your custom atmospheric playlist',
        'Will learn up to five requested songs outside of her repertoire',
        'One additional check-in six weeks prior to finalize song selections & wedding day details',
      ]
    },
    {
      name: 'Evening Étude',
      price: 'Starting at $1,100',
      duration: 'Three Hours',
      description: 'The Evening Étude package includes pre-ceremony, ceremony, cocktail hour, and reception for a total of three hours of live amplified harp music.',
      details: [
        'Playlists tailored by the couple and Paige over the course of your engagement',
        'Paige available upon booking by phone or email for song recommendations',
        'Will learn up to 10 requested songs outside of her repertoire',
        'One meeting six weeks prior to finalize song selections & wedding day details',
        'Includes a recorded playlist of your wedding day songs delivered within two weeks',
      ]
    },
  ]

  return (
    <div>
      <Hero title="Weddings" subtitle="Creating an unforgettable atmosphere for your most special day" />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '60px 20px' }}>
        <div style={{ display: 'grid', gap: 24, marginBottom: 48 }}>
          {packages.map((pkg, i) => (
            <div key={pkg.name} style={{ background: 'white', border: '1px solid #ede5dc', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 20px rgba(26,23,20,.06)' }}>
              <div style={{ background: i === 1 ? '#f5e6e2' : '#f2ebe3', padding: '28px 32px', borderBottom: '1px solid #ede5dc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.16em', color: '#9a9189', marginBottom: 6, fontWeight: 500 }}>{pkg.duration}</p>
                  <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 400, fontStyle: 'italic', color: '#1a1714' }}>{pkg.name}</h3>
                </div>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, color: '#c9a097', fontWeight: 400 }}>{pkg.price}</p>
              </div>
              <div style={{ padding: '28px 32px' }}>
                <p style={{ fontSize: 14, lineHeight: 1.8, color: '#3d3733', marginBottom: 16 }}>{pkg.description}</p>
                <ul style={{ listStyle: 'none', display: 'grid', gap: 8 }}>
                  {pkg.details.map((d, j) => (
                    <li key={j} style={{ fontSize: 13, color: '#7a746e', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ color: '#c9a097', flexShrink: 0, marginTop: 2 }}>·</span>
                      {d}
                    </li>
                  ))}
                </ul>
                <button onClick={() => setPage('contact')} style={{
                  marginTop: 20, padding: '10px 24px', background: '#c9a097', color: 'white',
                  border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 500,
                  letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer',
                  fontFamily: 'Jost, sans-serif'
                }}>Secure Your Date</button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', padding: '32px', background: '#f2ebe3', borderRadius: 16, border: '1px solid #ede5dc' }}>
          <p style={{ fontSize: 14, color: '#7a746e', lineHeight: 1.7 }}>
            For weddings outside of Southern California & custom packages please email{' '}
            <a href="mailto:hello@paigecamryn.com" style={{ color: '#c9a097', textDecoration: 'none' }}>hello@paigecamryn.com</a>
          </p>
        </div>
      </div>
    </div>
  )
}

function RepertoirePage({ setPage, setPreselectedSongs }) {
  const [repertoire, setRepertoire] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState([])
  const [activeCategory, setActiveCategory] = useState('All')

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

  function goToContact() {
    setPreselectedSongs(repertoire.filter(s => selected.includes(s.id)))
    setPage('contact')
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 20, color: '#9a9189' }}>Loading repertoire…</p>
    </div>
  )

  return (
    <div>
      <Hero title="Repertoire" subtitle="Browse my song list and select your favourites for your event" />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 20px' }}>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32, justifyContent: 'center' }}>
          {categories.map(c => (
            <button key={c} onClick={() => setActiveCategory(c)} style={{
              padding: '8px 20px', borderRadius: 20, cursor: 'pointer', fontSize: 12,
              fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase',
              fontFamily: 'Jost, sans-serif', transition: 'all .15s',
              background: activeCategory === c ? '#c9a097' : 'white',
              color: activeCategory === c ? 'white' : '#9a9189',
              border: `1px solid ${activeCategory === c ? '#c9a097' : '#ede5dc'}`,
            }}>{c}</button>
          ))}
        </div>

        {/* Selected banner */}
        {selected.length > 0 && (
          <div style={{ background: '#f5e6e2', border: '1px solid #e8c8c0', borderRadius: 12, padding: '14px 20px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <p style={{ color: '#b07870', fontWeight: 500, fontSize: 14 }}>🎵 {selected.length} song{selected.length !== 1 ? 's' : ''} selected</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setSelected([])} style={{ background: 'white', border: '1px solid #e8c8c0', color: '#b07870', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontFamily: 'Jost, sans-serif' }}>Clear</button>
              <button onClick={goToContact} style={{ background: '#c9a097', border: 'none', color: 'white', borderRadius: 8, padding: '6px 16px', cursor: 'pointer', fontSize: 12, fontFamily: 'Jost, sans-serif', fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase' }}>Enquire Now →</button>
            </div>
          </div>
        )}

        {/* Songs */}
        {Object.entries(grouped).map(([category, songs]) => (
          <div key={category} style={{ marginBottom: 36 }}>
            {activeCategory === 'All' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', color: '#1a1714', fontSize: 22, fontWeight: 400, fontStyle: 'italic', whiteSpace: 'nowrap' }}>{category}</h3>
                <div style={{ flex: 1, height: 1, background: '#ede5dc' }} />
              </div>
            )}
            <div style={{ display: 'grid', gap: 8 }}>
              {songs.map(s => {
                const isSelected = selected.includes(s.id)
                return (
                  <div key={s.id} onClick={() => toggleSong(s.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    background: isSelected ? '#f5e6e2' : 'white',
                    border: `1px solid ${isSelected ? '#c9a097' : '#ede5dc'}`,
                    borderRadius: 12, padding: '14px 18px', cursor: 'pointer',
                    transition: 'all .15s', boxShadow: '0 1px 8px rgba(26,23,20,.04)'
                  }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: 5,
                      border: `1.5px solid ${isSelected ? '#c9a097' : '#ede5dc'}`,
                      background: isSelected ? '#c9a097' : 'white', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s'
                    }}>
                      {isSelected && <span style={{ color: 'white', fontSize: 11 }}>✓</span>}
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
          <div style={{ textAlign: 'center', padding: 60 }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 20, color: '#9a9189' }}>Repertoire coming soon</p>
          </div>
        )}

        {/* Enquire button at bottom */}
        <div style={{ textAlign: 'center', marginTop: 40, paddingTop: 32, borderTop: '1px solid #ede5dc' }}>
          <p style={{ color: '#9a9189', fontSize: 14, marginBottom: 16 }}>Ready to book? Head to the contact page to send your enquiry.</p>
          <button onClick={goToContact} style={{
            padding: '14px 40px', background: '#c9a097', color: 'white', border: 'none',
            borderRadius: 10, fontSize: 12, fontWeight: 500, letterSpacing: '.12em',
            textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'Jost, sans-serif'
          }}>
            {selected.length > 0 ? `Enquire with ${selected.length} song${selected.length !== 1 ? 's' : ''} →` : 'Enquire Now'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ContactPage({ preselectedSongs, setPreselectedSongs }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', event_type: '', event_date: '', venue: '', notes: '' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function submit() {
    if (!form.name.trim() || !form.email.trim()) { alert('Please enter your name and email.'); return }
    setSubmitting(true)
    const songList = preselectedSongs.map(s => `${s.title}${s.composer ? ` (${s.composer})` : ''}`).join('\n')
    const { error } = await supabase.from('inquiries').insert([{
      user_id: preselectedSongs.length > 0
        ? (await supabase.from('repertoire').select('user_id').limit(1).single()).data?.user_id
        : (await supabase.from('gigs').select('user_id').limit(1).single()).data?.user_id,
      name: form.name, email: form.email, phone: form.phone,
      event_type: form.event_type, event_date: form.event_date || null,
      venue: form.venue,
      notes: (form.notes ? form.notes + '\n\n' : '') + (songList ? 'Requested songs:\n' + songList : ''),
      stage: 'enquired'
    }])
    setSubmitting(false)
    if (error) { alert(error.message); return }
    setSubmitted(true)
    setPreselectedSongs([])
  }

  if (submitted) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🎵</div>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 400, fontStyle: 'italic', marginBottom: 12, color: '#1a1714' }}>Thank you!</h2>
        <p style={{ color: '#9a9189', fontSize: 15, lineHeight: 1.7 }}>Your enquiry has been received. Paige will be in touch shortly to discuss your event.</p>
      </div>
    </div>
  )

  return (
    <div>
      <Hero title="Contact" subtitle="Let's create something beautiful together" />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 20px' }}>

        {preselectedSongs.length > 0 && (
          <div style={{ background: '#f5e6e2', borderRadius: 12, padding: '16px 20px', marginBottom: 28, border: '1px solid #e8c8c0' }}>
            <p style={{ color: '#b07870', fontWeight: 500, fontSize: 13, marginBottom: 8 }}>🎵 Songs from your repertoire selection ({preselectedSongs.length}):</p>
            {preselectedSongs.map(s => (
              <p key={s.id} style={{ color: '#9a9189', fontSize: 13, marginTop: 3 }}>· {s.title}{s.composer ? ` — ${s.composer}` : ''}</p>
            ))}
          </div>
        )}

        <div style={{ background: 'white', borderRadius: 20, padding: 40, border: '1px solid #ede5dc', boxShadow: '0 2px 20px rgba(26,23,20,.06)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
                <input type={f.type} value={form[f.key]} placeholder={f.placeholder}
                  onChange={e => setField(f.key, e.target.value)}
                  style={{ padding: '10px 13px', border: '1px solid #ede5dc', borderRadius: 8, fontSize: 14, fontFamily: 'Jost, sans-serif', background: '#fdfaf7', color: '#1a1714', outline: 'none' }}
                />
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: 10, fontWeight: 500, color: '#9a9189', marginBottom: 6, letterSpacing: '.1em', textTransform: 'uppercase', fontFamily: 'Jost, sans-serif' }}>Additional Notes</label>
              <textarea value={form.notes} placeholder="Any special requests or questions…"
                onChange={e => setField('notes', e.target.value)}
                style={{ padding: '10px 13px', border: '1px solid #ede5dc', borderRadius: 8, fontSize: 14, fontFamily: 'Jost, sans-serif', background: '#fdfaf7', color: '#1a1714', minHeight: 100, resize: 'vertical', outline: 'none' }}
              />
            </div>
          </div>

          <button onClick={submit} disabled={submitting} style={{
            width: '100%', marginTop: 24, padding: '15px',
            background: '#c9a097', color: 'white', border: 'none',
            borderRadius: 10, fontSize: 12, fontWeight: 500,
            letterSpacing: '.1em', textTransform: 'uppercase',
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontFamily: 'Jost, sans-serif', opacity: submitting ? .7 : 1
          }}>
            {submitting ? 'Sending…' : '✉ Send Enquiry'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <p style={{ fontSize: 13, color: '#9a9189' }}>Or email directly: <a href="mailto:hello@paigecamryn.com" style={{ color: '#c9a097', textDecoration: 'none' }}>hello@paigecamryn.com</a></p>
        </div>
      </div>
    </div>
  )
}

export default function PublicSite() {
  const [page, setPage] = useState('events')
  const [preselectedSongs, setPreselectedSongs] = useState([])

  return (
    <div style={{ minHeight: "100vh", width: "100%", background: "#fdfaf7", fontFamily: 'Jost, system-ui, sans-serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <Nav page={page} setPage={setPage} />
      {page === 'events'     && <EventsPage setPage={setPage} />}
      {page === 'weddings'   && <WeddingsPage setPage={setPage} />}
      {page === 'repertoire' && <RepertoirePage setPage={setPage} setPreselectedSongs={setPreselectedSongs} />}
      {page === 'contact'    && <ContactPage preselectedSongs={preselectedSongs} setPreselectedSongs={setPreselectedSongs} />}
      <Footer />
    </div>
  )
}
