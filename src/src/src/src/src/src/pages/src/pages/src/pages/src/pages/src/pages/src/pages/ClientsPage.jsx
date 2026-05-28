import React, { useState, useMemo } from 'react'
import { Plus, X, Edit2 } from 'lucide-react'
import { supabase } from '../supabase'
import { currency, fmtDate, invoiceBadge } from '../utils'

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

  const clientGigs = useMemo(() => {
    if (!selectedClient) return []
    return gigs.filter(g => g.client?.toLowerCase() === selectedClient.name?.toLowerCase())
  }, [selectedClient, gigs])

  const clientStats = useMemo(() => {
    const paid = clientGigs.reduce((s, g) => s + Number(g.paid || 0), 0)
    const fee = clientGigs.reduce((s, g) => s + Number(g.fee || 0), 0)
    return { paid, fee, count: clientGigs.length }
  }, [clientGigs])

  async function deleteClient(id) {
    if (!confirm('Delete this client?')) return
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) { alert(error.message); return }
    setSelectedId(nu
