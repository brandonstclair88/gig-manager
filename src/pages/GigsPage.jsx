import React, { useState, useMemo } from 'react'
import { Plus, Search } from 'lucide-react'
import { supabase } from '../supabase'
import { currency, fmtDate, invoiceBadge } from '../utils'
import GigModal from '../components/GigModal'
import GigDetail from '../components/GigDetail'

export default function GigsPage({ gigs, userId, onRefresh }) {
  const [showModal, setShowModal] = useState(false)
  const [editingGig, setEditingGig] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [showArchived, setShowArchived] = useState(false)

  const selectedGig = gigs.find(g => g.id === selectedId)

  const filtered = useMemo(() => {
    return gigs
      .filter(g => {
        const q = search.toLowerCase()
        const matchSearch = !q || g.title?.toLowerCase().includes(q) || g.client?.toLowerCase().includes(q) || g.venue?.toLowerCase().includes(q)
        const matchStatus = statusFilter === 'all' || g.invoice_status === statusFilter
        const matchArchived = showArchived ? g.archived : !g.archived
        return matchSearch && matchStatus && matchArchived
      })
      .sort((a, b) => {
        if (sortBy === 'date') return (a.date || '').localeCompare(b.date || '')
        if (sortBy === 'fee') return Number(b.fee || 0) - Number(a.fee || 0)
        if (sortBy === 'client') return (a.client || '').localeCompare(b.client || '')
        return 0
      })
  }, [gigs, search, statusFilter, sortBy, showArchived])

  async function deleteGig(id) {
    if (!confirm('Delete this gig? This cannot be undone.')) return
    const { error } = await supabase.from('gigs').delete().eq('id', id)
    if (error) { alert(error.message); return }
    setSelectedId(null)
    onRefresh()
  }

  async function toggleArchive(id, archived) {
    const { error } = await supabase.from('gigs').update({ archived: !archived }).eq('id', id)
    if (error) { alert(error.message); return }
    setSelectedId(null)
    onRefresh()
    alert(archived ? 'Gig unarchived!' : 'Gig archived! Toggle "Show Archived" to view it.')
  }

  function openAdd() { setEditingGig(null); setShowModal(true) }
  function openEdit(g) { setEditingGig(g); setShowModal(true) }

  return (
    <div>
      <div className="page-header">
        <h1>Gigs</h1>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Gig</button>
      </div>

      <div className="filter-bar">
        <div style={{ position: 'relative', flex: 2, minWidth: 180 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink3)' }} />
          <input
            placeholder="Search gigs, clients, venues…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 36 }}
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ flex: 1, minWidth: 130 }}>
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ flex: 1, minWidth: 120 }}>
          <option value="date">Sort by date</option>
          <option value="fee">Sort by fee</option>
          <option value="client">Sort by client</option>
        </select>
        <button
          className={`btn btn-sm ${showArchived ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setShowArchived(a => !a)}
        >
          {showArchived ? '📦 Archived' : '📦 Show Archived'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedGig ? '1fr 1.4fr' : '1fr', gap: 16, alignItems: 'start' }}>
        <div>
          {filtered.length === 0 && (
            <div className="empty card">
              <p>No gigs found. Add your first gig!</p>
            </div>
          )}
          <div style={{ display: 'grid', gap: 10 }}>
            {filtered.map(g => {
              const balance = Math.max(Number(g.fee || 0) - Number(g.paid || 0), 0)
              return (
                <button
                  key={g.id}
                  onClick={() => setSelectedId(g.id === selectedId ? null : g.id)}
                  style={{
                    display: 'block', textAlign: 'left', width: '100%',
                    background: g.id === selectedId ? 'var(--blush)' : 'white',
                    color: g.id === selectedId ? 'white' : 'var(--ink)',
                    border: `1px solid ${g.id === selectedId ? 'var(--blush)' : 'var(--paper3)'}`,
                    borderRadius: 'var(--radius)', padding: '16px 18px',
                    cursor: 'pointer', transition: 'all .15s', boxShadow: 'var(--shadow)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <strong style={{ fontSize: 15 }}>{g.title}</strong>
                    <span className={`badge ${invoiceBadge(g.invoice_status)}`} style={{ flexShrink: 0 }}>{g.invoice_status || 'draft'}</span>
                  </div>
                  <p style={{ fontSize: 13, opacity: .75, marginTop: 4 }}>{g.client} · {fmtDate(g.date)}</p>
                  <p style={{ fontSize: 13, opacity: .7, marginTop: 2 }}>{g.venue}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{currency(g.fee)}</span>
                    {balance > 0 && <span style={{ fontSize: 12, color: g.id === selectedId ? '#fca5a5' : 'var(--red)' }}>Owes {currency(balance)}</span>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {selectedGig && (
          <GigDetail
            gig={selectedGig}
            onEdit={() => openEdit(selectedGig)}
            onDelete={() => deleteGig(selectedGig.id)}
            onArchive={() => toggleArchive(selectedGig.id, selectedGig.archived)}
            onRefresh={onRefresh}
          />
        )}
      </div>

      {showModal && (
        <GigModal
          gig={editingGig}
          userId={userId}
          onClose={() => setShowModal(false)}
          onSaved={onRefresh}
        />
      )}
    </div>
  )
}
