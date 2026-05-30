import React, { useState, useEffect, useRef } from 'react'
import { Search, X, Music, Users, MessageSquare } from 'lucide-react'
import { fmtDate, currency } from '../utils'

export default function GlobalSearch({ gigs, clients, inquiries, onNavigate }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  // Keyboard shortcut cmd+k
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
    else setQuery('')
  }, [open])

  const q = query.toLowerCase().trim()

  const results = q.length < 2 ? [] : [
    ...gigs.filter(g =>
      g.title?.toLowerCase().includes(q) ||
      g.client?.toLowerCase().includes(q) ||
      g.venue?.toLowerCase().includes(q)
    ).slice(0, 4).map(g => ({ type: 'gig', item: g })),

    ...clients.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    ).slice(0, 3).map(c => ({ type: 'client', item: c })),

    ...inquiries.filter(i =>
      i.name?.toLowerCase().includes(q) ||
      i.event_type?.toLowerCase().includes(q) ||
      i.venue?.toLowerCase().includes(q)
    ).slice(0, 3).map(i => ({ type: 'inquiry', item: i })),
  ]

  function select(type) {
    onNavigate(type === 'gig' ? 'gigs' : type === 'client' ? 'clients' : 'inquiries')
    setOpen(false)
  }

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', background: 'rgba(255,255,255,.08)',
          border: '1px solid rgba(255,255,255,.1)', borderRadius: 8,
          color: '#a09890', fontSize: 13, cursor: 'pointer', width: '100%',
          marginBottom: 8, fontFamily: 'Jost, sans-serif'
        }}
      >
        <Search size={14} />
        <span style={{ flex: 1, textAlign: 'left' }}>Search…</span>
        <span style={{ fontSize: 11, opacity: .6, background: 'rgba(255,255,255,.1)', padding: '2px 6px', borderRadius: 4 }}>⌘K</span>
      </button>

      {/* Modal */}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(26,23,20,.6)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '80px 20px' }}
          onClick={e => e.target === e.currentTarget && setOpen(false)}
        >
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 560, boxShadow: '0 20px 60px rgba(26,23,20,.2)', overflow: 'hidden' }}>

            {/* Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid #ede5dc' }}>
              <Search size={18} color="#9a9189" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search gigs, clients, inquiries…"
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 16, fontFamily: 'Jost, sans-serif', background: 'transparent', color: '#1a1714' }}
              />
              {query && (
                <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9a9189', display: 'flex', padding: 4 }}>
                  <X size={16} />
                </button>
              )}
              <button onClick={() => setOpen(false)} style={{ background: '#f2ebe3', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, color: '#9a9189', cursor: 'pointer', fontFamily: 'Jost, sans-serif' }}>ESC</button>
            </div>

            {/* Results */}
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {q.length < 2 && (
                <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                  <p style={{ color: '#9a9189', fontSize: 14 }}>Type at least 2 characters to search</p>
                </div>
              )}

              {q.length >= 2 && results.length === 0 && (
                <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                  <p style={{ color: '#9a9189', fontSize: 14 }}>No results for "{query}"</p>
                </div>
              )}

              {results.length > 0 && (
                <div style={{ padding: '8px 0' }}>
                  {/* Gigs */}
                  {results.filter(r => r.type === 'gig').length > 0 && (
                    <>
                      <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.12em', color: '#9a9189', fontWeight: 500, padding: '8px 20px 4px', fontFamily: 'Jost, sans-serif' }}>Gigs</p>
                      {results.filter(r => r.type === 'gig').map(({ item: g }) => (
                        <button
                          key={g.id}
                          onClick={() => select('gig')}
                          style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '12px 20px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'background .1s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fdfaf7'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f5e6e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Music size={16} color="#c9a097" />
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 600, fontSize: 14, color: '#1a1714' }}>{g.title}</p>
                            <p style={{ fontSize: 12, color: '#9a9189', marginTop: 2 }}>{g.client} · {fmtDate(g.date)} · {currency(g.fee)}</p>
                          </div>
                        </button>
                      ))}
                    </>
                  )}

                  {/* Clients */}
                  {results.filter(r => r.type === 'client').length > 0 && (
                    <>
                      <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.12em', color: '#9a9189', fontWeight: 500, padding: '8px 20px 4px', fontFamily: 'Jost, sans-serif' }}>Clients</p>
                      {results.filter(r => r.type === 'client').map(({ item: c }) => (
                        <button
                          key={c.id}
                          onClick={() => select('client')}
                          style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '12px 20px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'background .1s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fdfaf7'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f2ebe3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Users size={16} color="#c9a097" />
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 600, fontSize: 14, color: '#1a1714' }}>{c.name}</p>
                            <p style={{ fontSize: 12, color: '#9a9189', marginTop: 2 }}>{c.email || '—'} · {c.phone || '—'}</p>
                          </div>
                        </button>
                      ))}
                    </>
                  )}

                  {/* Inquiries */}
                  {results.filter(r => r.type === 'inquiry').length > 0 && (
                    <>
                      <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.12em', color: '#9a9189', fontWeight: 500, padding: '8px 20px 4px', fontFamily: 'Jost, sans-serif' }}>Inquiries</p>
                      {results.filter(r => r.type === 'inquiry').map(({ item: i }) => (
                        <button
                          key={i.id}
                          onClick={() => select('inquiry')}
                          style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '12px 20px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'background .1s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fdfaf7'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#fef3cd', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <MessageSquare size={16} color="#856404" />
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 600, fontSize: 14, color: '#1a1714' }}>{i.name}</p>
                            <p style={{ fontSize: 12, color: '#9a9189', marginTop: 2 }}>{i.event_type || '—'} · {fmtDate(i.event_date)} · {i.stage}</p>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '10px 20px', borderTop: '1px solid #ede5dc', display: 'flex', gap: 16, fontSize: 11, color: '#9a9189', fontFamily: 'Jost, sans-serif' }}>
              <span>↵ to select</span>
              <span>ESC to close</span>
              <span>⌘K to toggle</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
