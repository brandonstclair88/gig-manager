import React, { useState, useMemo } from 'react'
import { Plus, X, Edit2, Music } from 'lucide-react'
import { supabase } from '../supabase'

const CATEGORIES = ['Classical', 'Wedding', 'Pop', 'Rock', 'Jazz', 'Celtic', 'Christmas', 'Hymns', 'Film & TV', 'Other']

const EMPTY = { title: '', composer: '', category: 'Classical', notes: '' }

function SongModal({ song, userId, onClose, onSaved }) {
  const [form, setForm] = useState(song || EMPTY)
  const [loading, setLoading] = useState(false)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function save() {
    if (!form.title.trim()) { alert('Please enter a song title.'); return }
    setLoading(true)
    const payload = { title: form.title, composer: form.composer, category: form.category, notes: form.notes }
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
      <div className="modal" style={{ maxWidth: 480 }}>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        <h2>{song?.id ? 'Edit Song' : 'Add Song'}</h2>
        <div style={{ display: 'grid', gap: 14 }}>
          <div className="field">
            <label>Song Title</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Canon in D" />
          </div>
          <div className="field">
            <label>Composer / Artist</label>
            <input value={form.composer} onChange={e => set('composer', e.target.value)} placeholder="e.g. Pachelbel" />
          </div>
          <div className="field">
            <label>Category</label>
            <select value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes for clients…" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={loading}>{loading ? 'Saving…' : 'Save Song'}</button>
        </div>
      </div>
    </div>
  )
}

export default function RepertoirePage({ repertoire, userId, onRefresh }) {
  const [showModal, setShowModal] = useState(false)
  const [editingSong, setEditingSong] = useState(null)
  const [activeCategory, setActiveCategory] = useState('All')

  const categories = useMemo(() => {
    const used = [...new Set(repertoire.map(s => s.category).filter(Boolean))]
    return ['All', ...CATEGORIES.filter(c => used.includes(c))]
  }, [repertoire])

  const filtered = useMemo(() => {
    return activeCategory === 'All'
      ? repertoire
      : repertoire.filter(s => s.category === activeCategory)
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

  async function deleteSong(id) {
    if (!confirm('Delete this song?')) return
    const { error } = await supabase.from('repertoire').delete().eq('id', id)
    if (error) { alert(error.message); return }
    onRefresh()
  }

  function copyPublicLink() {
    const url = `${window.location.origin}?repertoire=true`
    navigator.clipboard.writeText(url)
    alert('Public repertoire link copied!\n\n' + url)
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

      <div style={{ background: '#d4edda', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: 'var(--green)' }}>
        🎵 Share your public repertoire link with clients so they can browse your songs and submit song requests when enquiring.
      </div>

      {/* Category filter */}
      <div className="tabs" style={{ marginBottom: 24, flexWrap: 'wrap' }}>
        {categories.map(c => (
          <button key={c} className={`tab${activeCategory === c ? ' active' : ''}`} onClick={() => setActiveCategory(c)}>
            {c} {c === 'All' ? `(${repertoire.length})` : `(${repertoire.filter(s => s.category === c).length})`}
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
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, marginBottom: 12, color: 'var(--ink2)' }}>
              {category}
            </h3>
          )}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Composer / Artist</th>
                  <th>Notes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {songs.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.title}</strong></td>
                    <td>{s.composer || '—'}</td>
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
                ))}
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
