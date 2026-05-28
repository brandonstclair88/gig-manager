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

  const selectedGig = gigs.find(g => g.id === selectedId)

  const filtered = useMemo(() => {
    return gigs
      .filter(g => {
        const q = search.toLowerCase()
        const matchSearch = !q || g.title?.toLowerCase().includes(q) || g.client?.toLowerCase().includes(q) || g.venue?.toLowerCase().includes(q)
        const matchStatus = statusFilter === 'all' || g.invoice_status === statusFilter
        return matchSearch && matchStatus
      })
      .sort((a, b) => {
        if (sortBy === 'date') return (a.date || '').localeCompare(b.date || '')
        if (sortBy === 'fee') return Number(b.fee || 0) - Number(a.fee || 0)
        if (sortBy === 'client') return (a.client || '').localeCompare(b.client || '')
        return 0
      })
  }, [gigs, search, statusFilter, sortBy])

  async function deleteGig(id) {
    if (!confirm('Delete this gig? This cannot be undone.')) return
    const { error } = await supabase.from('gigs').delete().eq('id', id)
    if (error) { alert(error.message); return }
    setSelectedId(null)
    onRefresh()
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
                    background: g.id === selectedId ? 'var(--ink)' : 'white',
                    color: g.id === selectedId ? 'var(--paper)' : 'var(--ink)',
                    border: `1px solid ${g.id === selectedId ? 'var(--ink)' : 'var(--paper3)'}`,
                    borderRadius: 'var(--radius)', padding: '16px 18px',
                    cursor: 'pointer', transition: 'all .15s', boxShadow: 'var(--shadow)'
