import React, { useState } from 'react'
import { Edit2, Trash2, CheckCircle2, FileText, Download, Link, Plus, X, Send, PenLine, CreditCard, Archive, Calendar } from 'lucide-react'
import { supabase } from '../supabase'
import { currency, fmtDate, fmtTime, invoiceBadge, contractText, downloadPDFInvoice } from '../utils'

export default function GigDetail({ gig, onEdit, onDelete, onArchive, onRefresh }) {
  const [tab, setTab] = useState('overview')
  const [expense, setExpense] = useState({ description: '', amount: '' })
  const [expenses, setExpenses] = useState(gig.expenses || [])

  const balance = Math.max(Number(gig.fee || 0) - Number(gig.paid || 0), 0)

  async function markPaid() {
    const { error } = await supabase.from('gigs')
      .update({ paid: gig.fee, invoice_status: 'paid' })
      .eq('id', gig.id)
    if (error) { alert(error.message); return }
    onRefresh()
  }

  async function saveExpenses(updated) {
    setExpenses(updated)
    await supabase.from('gigs').update({ expenses: updated }).eq('id', gig.id)
    onRefresh()
  }

  function addExpense() {
    if (!expense.description || !expense.amount) return
    const updated = [...expenses, { ...expense, amount: Number(expense.amount) }]
    saveExpenses(updated)
    setExpense({ description: '', amount: '' })
  }

  function removeExpense(i) {
    saveExpenses(expenses.filter((_, idx) => idx !== i))
  }

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0)
  const profit = Number(gig.paid || 0) - totalExpenses

  async function sendContractEmail() {
    if (!gig.client_email) {
      alert('No client email on this gig. Edit the gig to add one.')
      return
    }
    const res = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'contract',
        data: { ...gig, origin: window.location.origin }
      })
    })
    if (res.ok) {
      alert(`Contract sent to ${gig.client_email}!`)
    } else {
      alert('Failed to send email. Please check the client email address.')
    }
  }

  const [signingAsPerformer, setSigningAsPerformer] = useState(false)
  const [syncingCalendar, setSyncingCalendar] = useState(false)

  async function syncToCalendar() {
    setSyncingCalendar(true)
    try {
      const action = gig.calendar_event_id ? 'update' : 'create'
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, gig })
      })
      const data = await res.json()
      if (data.eventId && !gig.calendar_event_id) {
        await supabase.from('gigs').update({ calendar_event_id: data.eventId }).eq('id', gig.id)
      }
      alert('✅ Synced to Google Calendar!')
      onRefresh()
    } catch (e) {
      alert('Failed to sync: ' + e.message)
    }
    setSyncingCalendar(false)
  }
  const [showPayment, setShowPayment] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentDesc, setPaymentDesc] = useState('')
  const [passFee, setPassFee] = useState(true)
  const [sendingPayment, setSendingPayment] = useState(false)

  async function sendPaymentLink() {
    if (!paymentAmount) { alert('Please enter an amount.'); return }
    setSendingPayment(true)
    const res = await fetch('/api/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: paymentAmount,
        gigId: gig.id,
        gigTitle: gig.title,
        client: gig.client,
        client_email: gig.client_email,
        description: paymentDesc || `Payment for ${gig.title}`,
        passFeeToCient: passFee
      })
    })
    const data = await res.json()
    setSendingPayment(false)
    if (data.url) {
      navigator.clipboard.writeText(data.url)
      alert('Payment link copied to clipboard! Send it to your client.')
      setShowPayment(false)
    } else {
      alert('Failed to create payment link: ' + (data.error || 'Unknown error'))
    }
  }
  const [performerName, setPerformerName] = useState('Paige St. Clair')

  async function signAsPerformer() {
    if (!performerName.trim()) return
    setSigningAsPerformer(true)
    const { error } = await supabase.from('gigs').update({
      performer_signature: performerName.trim(),
      performer_signed_at: new Date().toISOString(),
    }).eq('id', gig.id)
    setSigningAsPerformer(false)
    if (error) { alert(error.message); return }
    onRefresh()
  }

  function copySigningLink() {
    const url = `${window.location.origin}?gig=${gig.id}`
    navigator.clipboard.writeText(url)
    alert('Signing link copied! Send this to your client:\n\n' + url)
  }

  function copyContract() {
    navigator.clipboard.writeText(contractText(gig))
    alert('Contract copied to clipboard.')
  }

  return (
    <div className="card" style={{ marginTop: 0 }}>
      <div className="detail-header">
        <div>
          <h2>{gig.title}</h2>
          <p className="muted" style={{ marginTop: 4 }}>
            {fmtDate(gig.date)}{gig.time ? ` at ${fmtTime(gig.time)}` : ''} · {gig.venue || '—'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span className={`badge ${invoiceBadge(gig.invoice_status)}`}>{gig.invoice_status || 'draft'}</span>
          {gig.contract_status === 'signed' && <span className="badge badge-green">✍️ Signed</span>}
          <button className="btn btn-ghost btn-sm" onClick={onEdit}><Edit2 size={14} /> Edit</button>
          <button className="btn btn-danger btn-sm" onClick={onDelete}><Trash2 size={14} /> Delete</button>
          <button className="btn btn-ghost btn-sm" onClick={onArchive}>
            <Archive size={14} /> {gig.archived ? 'Unarchive' : 'Archive'}
          </button>
        </div>
      </div>

      <div className="tabs">
        {['overview', 'financials', 'setlist', 'contract', 'expenses'].map(t => (
          <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <div className="mini-grid">
            <div className="mini-cell">
              <div className="mini-label">Client</div>
              <div className="mini-val" style={{ fontSize: 14 }}>{gig.client || '—'}</div>
            </div>
            <div className="mini-cell">
              <div className="mini-label">Fee</div>
              <div className="mini-val">{currency(gig.fee)}</div>
            </div>
            <div className="mini-cell">
              <div className="mini-label">Paid</div>
              <div className="mini-val" style={{ color: 'var(--green)' }}>{currency(gig.paid)}</div>
            </div>
            <div className="mini-cell">
              <div className="mini-label">Balance Due</div>
              <div className="mini-val" style={{ color: 'var(--ink)' }}>{currency(balance)}</div>
            </div>
          </div>

          {gig.venue_address && (
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <p><strong>📍 Venue:</strong> {gig.venue_address}</p>
              
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => window.open(`maps://maps.apple.com/?q=${encodeURIComponent(gig.venue_address)}`, '_blank')}
              >📍 Open in Apple Maps</button>
            </div>
          )}

          {gig.practice_date && (
            <p style={{ marginTop: 12 }}>
              <strong>🎵 Practice reminder:</strong> {fmtDate(gig.practice_date)}
            </p>
          )}

          {gig.signed_at && (
            <div style={{ background: '#d4edda', borderRadius: 10, padding: '10px 14px', marginTop: 12 }}>
              <p style={{ color: 'var(--green)', fontWeight: 600, fontSize: 14 }}>✍️ Signed by {gig.signed_by}</p>
              <p style={{ color: 'var(--green)', fontSize: 12, marginTop: 2 }}>on {fmtDate(gig.signed_at?.slice(0, 10))}</p>
            </div>
          )}

          <div className="actions-row" style={{ marginTop: 20 }}>
            {balance > 0 && (
              <button className="btn btn-gold btn-sm" onClick={markPaid}>
                <CheckCircle2 size={14} /> Mark Fully Paid
              </button>
            )}
            <button className="btn btn-ghost btn-sm" onClick={() => downloadPDFInvoice(gig)}>
              <Download size={14} /> Download Invoice PDF
            </button>
            <button className="btn btn-ghost btn-sm" onClick={syncToCalendar} disabled={syncingCalendar}>
              <Calendar size={14} /> {syncingCalendar ? 'Syncing…' : gig.calendar_event_id ? 'Update Calendar' : 'Add to Calendar'}
            </button>
            {balance > 0 && (
              <button className="btn btn-primary btn-sm" onClick={() => { setPaymentAmount(balance); setShowPayment(true) }}>
                <CreditCard size={14} /> Request Payment
              </button>
            )}
          </div>

          {showPayment && (
            <div style={{ background: '#f5e6e2', borderRadius: 12, padding: 20, marginTop: 16, border: '1px solid #e8c8c0' }}>
              <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--rose)', marginBottom: 14 }}>💳 Create Payment Link</p>
              <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
                <div className="field">
                  <label>Amount ($)</label>
                  <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
                </div>
                <div className="field">
                  <label>Description (optional)</label>
                  <input value={paymentDesc} onChange={e => setPaymentDesc(e.target.value)} placeholder={`Deposit for ${gig.title}`} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox"
                    id="passFee"
                    checked={passfee}
                    onChange={e => setPassFee(e.target.checked)}
                    style={{ width: 'auto', margin: 0 }}
                  />
                  <label htmlFor="passFee" style={{ textTransform: 'none', fontSize: 13, color: 'var(--ink2)', margin: 0 }}>
                    Pass Stripe fee (2.9% + $0.30) to client
                  </label>
                </div>
                {passFee && paymentAmount && (
                  <p style={{ fontSize: 12, color: 'var(--ink3)' }}>
                    Client will be charged: ${(Math.round((Number(paymentAmount) * 100 + 30) / (1 - 0.029)) / 100).toFixed(2)}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowPayment(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={sendPaymentLink} disabled={sendingPayment}>
                  <CreditCard size={14} /> {sendingPayment ? 'Creating…' : 'Copy Payment Link'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'financials' && (
        <>
          <div className="mini-grid">
            <div className="mini-cell">
              <div className="mini-label">Fee</div>
              <div className="mini-val">{currency(gig.fee)}</div>
            </div>
            <div className="mini-cell">
              <div className="mini-label">Deposit</div>
              <div className="mini-val">{currency(gig.deposit)}</div>
            </div>
            <div className="mini-cell">
              <div className="mini-label">Paid</div>
              <div className="mini-val">{currency(gig.paid)}</div>
            </div>
            <div className="mini-cell">
              <div className="mini-label">Balance</div>
              <div className="mini-val" style={{ color: 'var(--ink)' }}>{currency(balance)}</div>
            </div>
            <div className="mini-cell">
              <div className="mini-label">Expenses</div>
              <div className="mini-val" style={{ color: 'var(--red)' }}>{currency(totalExpenses)}</div>
            </div>
            <div className="mini-cell">
              <div className="mini-label">Net Profit</div>
              <div className="mini-val" style={{ color: profit >= 0 ? 'var(--green)' : 'var(--red)' }}>{currency(profit)}</div>
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => downloadPDFInvoice(gig)}>
              <Download size={14} /> Download Invoice PDF
            </button>
            {gig.venue_address && (
              
              <a
                href={`maps://maps.apple.com/?q=${encodeURIComponent(gig.venue_address)}&saddr=Thousand+Oaks,CA`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', background: 'var(--paper2)', color: 'var(--ink2)', borderRadius: 8, fontSize: 11, fontWeight: 500, textDecoration: 'none', border: '1px solid var(--paper3)', letterSpacing: '.06em' }}
              >
                📍 Get Directions
              </a>
            )}
          </div>
        </>
      )}

      {tab === 'setlist' && (
        <div>
          {gig.setlist
            ? <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{gig.setlist}</p>
            : <p className="muted">No set list added yet. Edit the gig to add one.</p>}
          {gig.notes && (
            <>
              <hr className="divider" />
              <p><strong>Notes</strong></p>
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, marginTop: 8 }} className="muted">{gig.notes}</p>
            </>
          )}
        </div>
      )}

      {tab === 'contract' && (
        <div>
          <div className="actions-row" style={{ marginBottom: 14 }}>
            <button className="btn btn-ghost btn-sm" onClick={copyContract}>
              <FileText size={14} /> Copy Contract Text
            </button>
            <button className="btn btn-primary btn-sm" onClick={copySigningLink}>
              <Link size={14} /> Copy Signing Link
            </button>
            {gig.client_email && (
              <button className="btn btn-gold btn-sm" onClick={sendContractEmail}>
                <Send size={14} /> Email Contract to Client
              </button>
            )}
          </div>

          {/* Client signature status */}
          {gig.signed_at ? (
            <div style={{ background: '#e2ede6', borderRadius: 10, padding: '12px 16px', marginBottom: 12, border: '1px solid #c3dbc9' }}>
              <p style={{ color: 'var(--green)', fontWeight: 600 }}>✍️ Client signed: {gig.signed_by}</p>
              <p style={{ color: 'var(--green)', fontSize: 13, marginTop: 2 }}>on {fmtDate(gig.signed_at?.slice(0, 10))}</p>
            </div>
          ) : (
            <div style={{ background: '#fef3cd', borderRadius: 10, padding: '12px 16px', marginBottom: 12, fontSize: 13, color: '#856404', border: '1px solid #fde68a' }}>
              ⏳ Awaiting client signature. Copy the signing link and send it to your client.
            </div>
          )}

          {/* Performer signature */}
          {gig.performer_signed_at ? (
            <div style={{ background: '#e2ede6', borderRadius: 10, padding: '12px 16px', marginBottom: 14, border: '1px solid #c3dbc9' }}>
              <p style={{ color: 'var(--green)', fontWeight: 600 }}>✍️ Performer signed: {gig.performer_signature}</p>
              <p style={{ color: 'var(--green)', fontSize: 13, marginTop: 2 }}>on {fmtDate(gig.performer_signed_at?.slice(0, 10))}</p>
            </div>
          ) : (
            <div style={{ background: '#f5e6e2', borderRadius: 10, padding: '16px', marginBottom: 14, border: '1px solid #e8c8c0' }}>
              <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--rose)', marginBottom: 10 }}>✍️ Sign as Performer</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={performerName}
                  onChange={e => setPerformerName(e.target.value)}
                  placeholder="Your full legal name"
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid #e8c8c0', borderRadius: 8, fontSize: 14, background: 'white' }}
                />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={signAsPerformer}
                  disabled={signingAsPerformer || !performerName.trim()}
                >
                  <PenLine size={14} /> {signingAsPerformer ? 'Signing…' : 'Sign'}
                </button>
              </div>
            </div>
          )}

          <p className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
            Your client clicks the link, reads the contract, types their name and signs. No account needed.
          </p>
          <div className="contract-preview">{contractText(gig)}</div>
        </div>
      )}

      {tab === 'expenses' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <input
              placeholder="Description (travel, gear hire…)"
              value={expense.description}
              onChange={e => setExpense(x => ({ ...x, description: e.target.value }))}
              style={{ flex: 2, minWidth: 140 }}
            />
            <input
              type="number" placeholder="Amount"
              value={expense.amount}
              onChange={e => setExpense(x => ({ ...x, amount: e.target.value }))}
              style={{ flex: 1, minWidth: 100 }}
            />
            <button className="btn btn-primary btn-sm" onClick={addExpense}><Plus size={14} /> Add</button>
          </div>
          {expenses.length === 0
            ? <p className="muted">No expenses recorded for this gig.</p>
            : expenses.map((ex, i) => (
              <div key={i} className="expense-row">
                <span style={{ flex: 1 }}>{ex.description}</span>
                <span style={{ fontWeight: 600 }}>{currency(ex.amount)}</span>
                <button className="btn btn-icon btn-danger btn-sm" onClick={() => removeExpense(i)}><X size={14} /></button>
              </div>
            ))
          }
          {expenses.length > 0 && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--paper3)', display: 'flex', justifyContent: 'space-between' }}>
              <strong>Total Expenses</strong>
              <strong style={{ color: 'var(--red)' }}>{currency(totalExpenses)}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
