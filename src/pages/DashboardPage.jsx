import React, { useMemo, useState } from 'react'
import { CalendarDays, Bell, Mail } from 'lucide-react'
import { currency, fmtDate, fmtTime, invoiceBadge } from '../utils'

export default function DashboardPage({ gigs, onNavigate }) {
  const [sendingDigest, setSendingDigest] = useState(false)
  const [digestSent, setDigestSent] = useState(false)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const stats = useMemo(() => {
    const paid = gigs.reduce((s, g) => s + Number(g.paid || 0), 0)
    const outstanding = gigs.reduce((s, g) => s + Math.max(Number(g.fee || 0) - Number(g.paid || 0), 0), 0)
    const upcoming = gigs.filter(g => g.date && new Date(g.date + 'T00:00:00') >= today)
    const overdue = gigs.filter(g => g.invoice_status === 'overdue' || (
      g.date && new Date(g.date + 'T00:00:00') < today && g.invoice_status !== 'paid'
    ))
    const totalExpenses = gigs.reduce((s, g) => s + (g.expenses || []).reduce((es, e) => es + Number(e.amount || 0), 0), 0)
    const depositReminders = gigs.filter(g => {
      if (!g.date) return false
      const gigDate = new Date(g.date + 'T00:00:00')
      const daysUntil = (gigDate - today) / (1000 * 60 * 60 * 24)
      return daysUntil >= 0 && daysUntil <= 30 && Number(g.deposit || 0) === 0 && g.invoice_status !== 'paid'
    })
    return { paid, outstanding, upcoming, overdue, totalExpenses, netProfit: paid - totalExpenses, depositReminders }
  }, [gigs])

  const nextGig = stats.upcoming[0]

  const practiceReminders = gigs.filter(g => {
    if (!g.practice_date) return false
    const pd = new Date(g.practice_date + 'T00:00:00')
    const diff = (pd - today) / (1000 * 60 * 60 * 24)
    return diff >= 0 && diff <= 7
  })

  async function sendWeeklyDigest() {
    setSendingDigest(true)
    setDigestSent(false)

    const upcomingGigs = gigs
      .filter(g => g.date && new Date(g.date + 'T00:00:00') >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(g => ({
        ...g,
        days_until: Math.ceil((new Date(g.date + 'T00:00:00') - today) / (1000 * 60 * 60 * 24))
      }))

    const res = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'weekly_digest',
        data: { gigs: upcomingGigs }
      })
    })

    setSendingDigest(false)
    if (res.ok) {
      setDigestSent(true)
      setTimeout(() => setDigestSent(false), 5000)
    } else {
      alert('Failed to send digest. Please try again.')
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <p className="muted">{today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
          <button
            className="btn btn-ghost btn-sm"
            onClick={sendWeeklyDigest}
            disabled={sendingDigest}
            style={digestSent ? { background: '#e2ede6', color: 'var(--green)' } : {}}
          >
            <Mail size={14} />
            {sendingDigest ? 'Sending…' : digestSent ? '✓ Digest Sent!' : 'Send Weekly Digest'}
          </button>
        </div>
      </div>

      {nextGig && (
        <div style={{
          background: '#f5e6e2', color: 'var(--ink)',
          borderRadius: 'var(--radius)', padding: '24px 28px',
          marginBottom: 20, display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: 16,
          border: '1px solid #e8c8c0'
        }}>
          <div>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--blush)', marginBottom: 6, fontWeight: 500 }}>Next Gig</p>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, marginBottom: 6, fontStyle: 'italic' }}>{nextGig.title}</h2>
            <p style={{ opacity: .75, fontSize: 14 }}>{fmtDate(nextGig.date)}{nextGig.time ? ` at ${fmtTime(nextGig.time)}` : ''} · {nextGig.venue}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 11, opacity: .6, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Fee</p>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, color: 'var(--rose)' }}>{currency(nextGig.fee)}</p>
            <span className={`badge ${invoiceBadge(nextGig.invoice_status)}`}>{nextGig.invoice_status}</span>
          </div>
        </div>
      )}

      <div className="stats">
        <div className="stat-card">
          <div className="label">Collected</div>
          <div className="value">{currency(stats.paid)}</div>
          <div className="sub">income to date</div>
        </div>
        <div className="stat-card">
          <div className="label">Outstanding</div>
          <div className="value">{currency(stats.outstanding)}</div>
          <div className="sub">yet to be paid</div>
        </div>
        <div className="stat-card">
          <div className="label">Net Profit</div>
          <div className="value">{currency(stats.netProfit)}</div>
          <div className="sub">after expenses</div>
        </div>
        <div className="stat-card">
          <div className="label">Upcoming</div>
          <div className="value">{stats.upcoming.length}</div>
          <div className="sub">booked gigs</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontStyle: 'italic' }}>
            <CalendarDays size={18} /> Upcoming Gigs
          </h3>
          {stats.upcoming.length === 0
            ? <p className="muted">No upcoming gigs booked.</p>
            : stats.upcoming.slice(0, 5).map((g, i) => (
              <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < Math.min(stats.upcoming.length, 5) - 1 ? '1px solid var(--paper3)' : 'none' }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{g.title}</p>
                  <p className="muted">{fmtDate(g.date)} · {g.client}</p>
                </div>
                <p style={{ fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{currency(g.fee)}</p>
              </div>
            ))}
        </div>

        <div className="card">
          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontStyle: 'italic' }}>
            <Bell size={18} /> Alerts
          </h3>

          {stats.overdue.length === 0 && practiceReminders.length === 0 && stats.depositReminders.length === 0 && (
            <p className="muted">All clear — no alerts right now.</p>
          )}

          {stats.depositReminders.map(g => (
            <div key={g.id} style={{ background: '#fef3cd', borderRadius: 10, padding: '10px 14px', marginBottom: 10, border: '1px solid #fde68a' }}>
              <p style={{ fontWeight: 600, fontSize: 14, color: '#856404' }}>💰 Deposit not received: {g.title}</p>
              <p style={{ fontSize: 12, color: '#856404', opacity: .8, marginTop: 2 }}>{fmtDate(g.date)} · No deposit recorded yet</p>
            </div>
          ))}

          {stats.overdue.map(g => (
            <div key={g.id} style={{ background: '#fde8e8', borderRadius: 10, padding: '10px 14px', marginBottom: 10, border: '1px solid #fca5a5' }}>
              <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--red)' }}>⚠ Unpaid: {g.title}</p>
              <p style={{ fontSize: 12, color: 'var(--red)', opacity: .8, marginTop: 2 }}>{fmtDate(g.date)} · {currency(Math.max(Number(g.fee || 0) - Number(g.paid || 0), 0))} outstanding</p>
            </div>
          ))}

          {practiceReminders.map(g => (
            <div key={g.id} style={{ background: '#f5e6e2', borderRadius: 10, padding: '10px 14px', marginBottom: 10, border: '1px solid #e8c8c0' }}>
              <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--rose)' }}>🎵 Practice reminder: {g.title}</p>
              <p style={{ fontSize: 12, color: 'var(--rose)', opacity: .8, marginTop: 2 }}>Practice on {fmtDate(g.practice_date)} for {fmtDate(g.date)} gig</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
