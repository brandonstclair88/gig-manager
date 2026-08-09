import React, { useState, useMemo } from 'react'
import { Plus, X, Edit2 } from 'lucide-react'
import { supabase } from '../supabase'
import { currency, fmtDate, invoiceBadge, reportableGigs, gigFee, gigPaid } from '../utils'

const EMPTY_CLIENT = { name: '', email: '', phone: '', notes: '' }

function ClientModal({ client, userId, onClose, onSaved }) {
  const [form, setForm] = useState(client || EMPTY_CLIENT)
  const [loading, setLoading] = useState(false)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function save() {
    setLoading(true)
    const payload = { name: form.name, email: form.email, phone: form.phone, notes: form.notes }
    let error
    if (client?.id) {
      ;({ error } = await supabase.from('clients').update(payload).eq('id', client.id))
    } else {
      ;({ error } = await supabase.from('clients').insert([{ ...payload, user_id: userId }]))
    }
    setLoading(false)
    if (error) { alert(error.message); return }
    onSaved(); onClose()
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        <h2>{client?.id ? 'Edit Client' : 'Add Client'}</h2>
        <div style={{ display: 'grid', gap: 14 }}>
          <div className="field"><label>Name</label><input value={form.name} onChange={e => set('name', e.target.value)} /></div>
          <div className="field"><label>Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
          <div className="field"><label>Phone</label><input value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
          <div className="field"><label>Notes</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={loading}>{loading ? 'Saving…' : 'Save Client'}</button>
        </div>
      </div>
    </div>
  )
}

export default function ClientsPage({ clients, gigs, userId, onRefresh }) {
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  const selectedClient = clients.find(c => c.id === selectedId)

  const live = useMemo(() => reportableGigs(gigs), [gigs])

  // Gigs store the client as free text, so matching is by normalised name.
  // Trim as well as lowercase — a trailing space shouldn't orphan a gig.
  const nameKey = n => (n || '').trim().toLowerCase()

  // Index gigs by client name once instead of re-filtering per client row.
  const gigsByClient = useMemo(() => {
    const map = new Map()
    live.forEach(g => {
      const k = nameKey(g.client)
      if (!k) return
      if (!map.has(k)) map.set(k, [])
      map.get(k).push(g)
    })
    return map
  }, [live])

  const clientGigs = useMemo(() => {
    if (!selectedClient) return []
    return gigsByClient.get(nameKey(selectedClient.name)) || []
  }, [selectedClient, gigsByClient])

  const clientStats = useMemo(() => {
    const paid = clientGigs.reduce((s, g) => s + gigPaid(g), 0)
    const fee = clientGigs.reduce((s, g) => s + gigFee(g), 0)
    return { paid, fee, count: clientGigs.length }
  }, [clientGigs])

  // Names that appear on gigs but have no client record. These were silently
  // absent from this page while still showing up in Finance → Top Clients.
  const unlinked = useMemo(() => {
    const known = new Set(clients.map(c => nameKey(c.name)))
    return [...gigsByClient.entries()]
      .filter(([k]) => !known.has(k))
      .map(([, gs]) => ({
        name: gs[0].client.trim(),
        email: gs.find(g => g.client_email)?.client_email || '',
        count: gs.length,
        paid: gs.reduce((s, g) => s + gigPaid(g), 0),
      }))
      .sort((a, b) => b.paid - a.paid)
  }, [clients, gigsByClient])

  async function deleteClient(id) {
    if (!confirm('Delete this client?')) return
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) { alert(error.message); return }
    setSelectedId(null); onRefresh()
  }

  return (
    <div>
      <div className="page-header">
        <h1>Clients</h1>
        <button className="btn btn-primary" onClick={() => { setEditingClient(null); setShowModal(true) }}>
          <Plus size={16} /> Add Client
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedClient ? '280px 1fr' : '1fr', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 10 }}>
          {clients.length === 0 && (
            <div className="card empty"><p>No clients yet. Add your first client!</p></div>
          )}
          {clients.map(c => {
            const cGigs = gigsByClient.get(nameKey(c.name)) || []
            const cPaid = cGigs.reduce((s, g) => s + gigPaid(g), 0)
            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id === selectedId ? null : c.id)}
                style={{
                  display: 'block', textAlign: 'left', width: '100%',
                  background: c.id === selectedId ? 'var(--blush)' : 'var(--paper)',
                  color: c.id === selectedId ? 'white' : 'var(--ink)',
                  border: `1px solid ${c.id === selectedId ? 'var(--blush)' : 'var(--paper3)'}`,
                  borderRadius: 'var(--radius)', padding: '14px 16px',
                  cursor: 'pointer', transition: 'all .15s', boxShadow: 'var(--shadow)'
                }}
              >
                <strong style={{ fontSize: 15 }}>{c.name}</strong>
                {c.email && <p style={{ fontSize: 12, opacity: .7, marginTop: 3 }}>{c.email}</p>}
                <p style={{ fontSize: 12, opacity: .6, marginTop: 2 }}>{cGigs.length} gig{cGigs.length !== 1 ? 's' : ''} · {currency(cPaid)} earned</p>
              </button>
            )
          })}
        </div>

        {selectedClient && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 26 }}>{selectedClient.name}</h2>
                {selectedClient.email && <p className="muted" style={{ marginTop: 4 }}>{selectedClient.email}</p>}
                {selectedClient.phone && <p className="muted">{selectedClient.phone}</p>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => { setEditingClient(selectedClient); setShowModal(true) }}>
                  <Edit2 size={14} /> Edit
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => deleteClient(selectedClient.id)}>
                  <X size={14} /> Delete
                </button>
              </div>
            </div>

            {selectedClient.notes && (
              <p style={{ marginBottom: 16, color: 'var(--ink2)', fontSize: 14 }}>{selectedClient.notes}</p>
            )}

            <div className="mini-grid" style={{ marginBottom: 20 }}>
              <div className="mini-cell">
                <div className="mini-label">Total Gigs</div>
                <div className="mini-val">{clientStats.count}</div>
              </div>
              <div className="mini-cell">
                <div className="mini-label">Total Earned</div>
                <div className="mini-val" style={{ color: 'var(--green)' }}>{currency(clientStats.paid)}</div>
              </div>
              <div className="mini-cell">
                <div className="mini-label">Total Booked</div>
                <div className="mini-val">{currency(clientStats.fee)}</div>
              </div>
            </div>

            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, marginBottom: 12 }}>Gig History</h3>
            {clientGigs.length === 0
              ? <p className="muted">No gigs linked to this client yet. Make sure gig client names match exactly.</p>
              : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Date</th>
                        <th>Fee</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientGigs.map(g => (
                        <tr key={g.id}>
                          <td><strong>{g.title}</strong><br /><span className="muted">{g.venue}</span></td>
                          <td>{fmtDate(g.date)}</td>
                          <td>{currency(g.fee)}</td>
                          <td><span className={`badge ${invoiceBadge(g.invoice_status)}`}>{g.invoice_status || 'draft'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        )}
      </div>

      {unlinked.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontStyle: 'italic', marginBottom: 6 }}>
            On gigs but not in your client list
          </h3>
          <p className="muted" style={{ marginBottom: 14, fontSize: 13 }}>
            These names are typed on gigs but have no client record, so they don't appear above.
          </p>
          <div style={{ display: 'grid', gap: 8 }}>
            {unlinked.map(u => (
              <div key={u.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '10px 0', borderBottom: '1px solid var(--paper3)' }}>
                <div>
                  <strong style={{ fontSize: 14 }}>{u.name}</strong>
                  <p className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                    {u.count} gig{u.count !== 1 ? 's' : ''} · {currency(u.paid)} collected
                  </p>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setEditingClient({ name: u.name, email: u.email, phone: '', notes: '' }); setShowModal(true) }}
                >
                  <Plus size={14} /> Add as client
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <ClientModal
          client={editingClient}
          userId={userId}
          onClose={() => setShowModal(false)}
          onSaved={onRefresh}
        />
      )}
    </div>
  )
}
