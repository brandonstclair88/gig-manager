import React, { useMemo } from 'react'
import { CalendarDays, Bell } from 'lucide-react'
import { currency, fmtDate, fmtTime, invoiceBadge } from '../utils'

export default function DashboardPage({ gigs, onNavigate }) {
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
    return { paid, outstanding, upcoming, overdue, totalExpenses, netProfit: paid - totalExpenses }
  }, [gigs])

  const nextGig = stats.upcoming[0]

  const practiceReminders = gigs.filter(g => {
    if (!g.practice_date) return false
    const pd = new Date(g.practice_date + 'T00:00:00')
    const diff = (pd - today) / (1000 * 60 * 60 * 24)
    return diff >= 0 && diff <= 7
  })

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="muted">{today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </div>

      {nextGig && (
        <div style={{
          background: 'var(--ink)', color: 'var(--paper)',
          borderRadius: 'var(--radius)', padding: '24px 28px',
          marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16
        }}>
          <div>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--gold2)', marginBottom: 6 }}>Next Gig</p>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, marginBottom: 6 }}>{nextGig.title}</h2>
            <p style={{ opacity: .75, fontSize: 14 }}>{fmtDate(nextGig.date)}{nextGig.time ? ` at ${fmtTime(nextGig.time)}` : ''} · {nextGig.venue}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 11, opacity: .6, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Fee</p>
            <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, color: 'var(--gold2)' }}>{currency(nextGig.fee)}</p>
            <span className={`badge ${invoiceBadge(nextGig.invoice_status)}`}>{nextGig.invoice_status}</span>
          </div>
        </div>
      )}

      <div className="stats">
        <div className="stat-card green">
          <div className="label">Collected</div>
          <div className="value">{currency(stats.paid)}</div>
          <div className="sub">income to date</div>
        </div>
        <div className="stat-card gold">
          <div className="label">Outstanding</div>
          <div className="value">{currency(stats.outstanding)}</div>
          <div className="sub">yet to be paid</div>
        </div>
        <div className="stat-card green">
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
          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
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
          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={18} /> Alerts
          </h3>
          {stats.overdue.length === 0 && practiceReminders.length === 0 && (
            <p className="muted">All clear — no alerts right now.</p>
          )}
          {stats.overdue.map(g => (
            <div key={g.id} style={{ background: '#fde8e8', borderRadius: 10, padding: '10px 14px', marginBottom: 10 }}>
              <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--red)' }}>⚠ Unpaid: {g.title}</p>
              <p style={{ fontSize: 12, color: 'var(--red)', opacity: .8 }}>{fmtDate(g.date)} · {currency(Math.max(Number(g.fee || 0) - Number(g.paid || 0), 0))} outstanding</p>
            </div>
          ))}
          {practiceReminders.map(g => (
            <div key={g.id} style={{ background: '#fef3cd', borderRadius: 10, padding: '10px 14px', marginBottom: 10 }}>
              <p style={{ fontWeight: 600, fontSize: 14, color: '#856404' }}>🎵 Practice reminder: {g.title}</p>
              <p style={{ fontSize: 12, color: '#856404', opacity: .8 }}>Practice on {fmtDate(g.practice_date)} for {fmtDate(g.date)} gig</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
