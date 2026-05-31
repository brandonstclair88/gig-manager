import React, { useState, useMemo } from 'react'
import { Plus, X, Edit2, Music } from 'lucide-react'
import { supabase } from '../supabase'

const CATEGORIES = ['Classical', 'Wedding', 'Pop', 'Rock', 'Jazz', 'Celtic', 'Folk', 'Country', 'Christmas', 'Hymns', 'Film & TV', 'Other']

function SongModal({ song, userId, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: song?.title || '',
    composer: song?.composer || '',
    categories: song?.categories || (song?.category ? [song.category] : []),
    notes: song?.notes || ''
  })
  const [loading, setLoading] = useState(false)

  function toggleCategory(cat) {
    setForm(f => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter(c => c !== cat)
        : [...f.categories, cat]
    }))
  }

  async function save() {
    if (!form.title.trim()) { alert('Please enter a song title.'); return }
    setLoading(true)
    const payload = {
      title: form.title,
      composer: form.composer,
      category: form.categories[0] || 'Other',
      categories: form.categories,
      notes: form.notes
    }
    let error
    if (song?.id) {
      ;({ error } = await supabase.from('repertoire').update(payload).eq('id', song.id))
    } else {
      ;({ error } = await supabase.from('repertoire').insert([{ ...payload, user_id: userId }]))
    }
    setLoading(false)
    if (error) { alert(error.message); return }
    onSaved(); onClose()
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 500 }}>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        <h2>{song?.id ? 'Edit Song' : 'Add Song'}</h2>
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="field">
            <label>Song Title</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Canon in D" />
          </div>
          <div className="field">
            <label>Composer / Artist</label>
            <input value={form.composer} onChange={e => setForm(f => ({ ...f, composer: e.target.value }))} placeholder="e.g. Pachelbel" />
          </div>
          <div className="field">
            <label>Categories (select all that apply)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 500, fontFamily: 'Jost, sans-serif',
                    background: form.categories.includes(cat) ? 'var(--blush)' : 'var(--paper2)',
                    color: form.categories.includes(cat) ? 'white' : 'var(--ink3)',
                    transition: 'all .15s'
                  }}
                >{cat}</button>
              ))}
            </div>
            {form.categories.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 4 }}>Please select at least one category</p>
            )}
          </div>
          <div className="field">
            <label>Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes for clients…" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={loading || form.categories.length === 0}>
            {loading ? 'Saving…' : 'Save Song'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function RepertoirePage({ repertoire, userId, onRefresh }) {
  const [showModal, setShowModal] = useState(false)
  const [editingSong, setEditingSong] = useState(null)
  const [activeCategory, setActiveCategory] = useState('All')

  const usedCategories = useMemo(() => {
    const cats = new Set()
    repertoire.forEach(s => {
      if (s.categories?.length) s.categories.forEach(c => cats.add(c))
      else if (s.category) cats.add(s.category)
    })
    return ['All', ...CATEGORIES.filter(c => cats.has(c))]
  }, [repertoire])

  const filtered = useMemo(() => {
    if (activeCategory === 'All') return repertoire
    return repertoire.filter(s => {
      const cats = s.categories?.length ? s.categories : (s.category ? [s.category] : [])
      return cats.includes(activeCategory)
    })
  }, [repertoire, activeCategory])

  const grouped = useMemo(() => {
    if (activeCategory !== 'All') return { [activeCategory]: filtered }
    const map = {}
    filtered.forEach(s => {
      const cats = s.categories?.length ? s.categories : (s.category ? [s.category] : ['Other'])
      cats.forEach(cat => {
        if (!map[cat]) map[cat] = []
        if (!map[cat].find(x => x.id === s.id)) map[cat].push(s)
      })
    })
    return map
  }, [filtered, activeCategory])

  async function deleteSong(id) {
    if (!confirm('Delete this song?')) return
    const { error } = await supabase.from('repertoire').delete().eq('id', id)
    if (error) { alert(error.message); return }
    onRefresh()
  }

  function copyPublicLink() {
    const url = `${window.location.origin}?site=true`
    navigator.clipboard.writeText(url)
    alert('Public site link copied!\n\n' + url)
  }

  return (
    <div>
      <div className="page-header">
        <h1>Repertoire</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={copyPublicLink}>
            🔗 Copy Public Link
          </button>
          <button className="btn btn-primary" onClick={() => { setEditingSong(null); setShowModal(true) }}>
            <Plus size={16} /> Add Song
          </button>
        </div>
      </div>

      <div style={{ background: 'var(--paper2)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: 'var(--green)', border: '1px solid var(--paper3)' }}>
        🎵 Share your public site link with clients so they can browse your songs and submit song requests when enquiring.
      </div>

      {/* Category filter */}
      <div className="tabs" style={{ marginBottom: 24, flexWrap: 'wrap' }}>
        {usedCategories.map(c => (
          <button key={c} className={`tab${activeCategory === c ? ' active' : ''}`} onClick={() => setActiveCategory(c)}>
            {c} ({c === 'All' ? repertoire.length : repertoire.filter(s => {
              const cats = s.categories?.length ? s.categories : (s.category ? [s.category] : [])
              return cats.includes(c)
            }).length})
          </button>
        ))}
      </div>

      {repertoire.length === 0 && (
        <div className="card empty">
          <Music size={32} style={{ margin: '0 auto 12px', display: 'block' }} />
          <p>No songs yet. Add your first song to build your repertoire!</p>
        </div>
      )}

      {Object.entries(grouped).map(([category, songs]) => (
        <div key={category} style={{ marginBottom: 28 }}>
          {activeCategory === 'All' && (
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, marginBottom: 12, color: 'var(--ink2)', fontStyle: 'italic' }}>
              {category}
            </h3>
          )}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Composer / Artist</th>
                  <th>Categories</th>
                  <th>Notes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {songs.map(s => {
                  const cats = s.categories?.length ? s.categories : (s.category ? [s.category] : [])
                  return (
                    <tr key={s.id}>
                      <td><strong>{s.title}</strong></td>
                      <td>{s.composer || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {cats.map(c => (
                            <span key={c} className="badge badge-gold" style={{ fontSize: 10 }}>{c}</span>
                          ))}
                        </div>
                      </td>
                      <td className="muted">{s.notes || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setEditingSong(s); setShowModal(true) }}>
                            <Edit2 size={13} />
                          </button>
                          <button className="btn btn-danger btn-icon btn-sm" onClick={() => deleteSong(s.id)}>
                            <X size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {showModal && (
        <SongModal
          song={editingSong}
          userId={userId}
          onClose={() => setShowModal(false)}
          onSaved={onRefresh}
        />
      )}
    </div>
  )
}
