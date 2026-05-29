import React, { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Download } from 'lucide-react'
import { currency, fmtDate, invoiceBadge, exportCSV } from '../utils'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function FinancePage({ gigs }) {
  const stats = useMemo(() => {
    const total = gigs.reduce((s, g) => s + Number(g.paid || 0), 0)
    const outstanding = gigs.reduce((s, g) => s + Math.max(Number(g.fee || 0) - Number(g.paid || 0), 0), 0)
    const fees = gigs.reduce((s, g) => s + Number(g.fee || 0), 0)
    const upcoming = gigs.filter(g => g.date && new Date(g.date + 'T00:00:00') >= new Date()).length
    const totalExpenses = gigs.reduce((s, g) => s + (g.expenses || []).reduce((es, e) => es + Number(e.amount || 0), 0), 0)
    const netProfit = total - totalExpenses
    return { total, outstanding, fees, upcoming, totalExpenses, netProfit }
  }, [gigs])

  const chartData = useMemo(() => {
    const byMonth = {}
    gigs.forEach(g => {
      if (!g.date) return
      const d = new Date(g.date + 'T00:00:00')
      const key = `${d.getFullYear()}-${d.getMonth()}`
      if (!byMonth[key]) byMonth[key] = { month: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, income: 0, fees: 0 }
      byMonth[key].income += Number(g.paid || 0)
      byMonth[key].fees += Number(g.fee || 0)
    })
    return Object.values(byMonth).slice(-12)
  }, [gigs])

  const topClients = useMemo(() => {
    const map = {}
    gigs.forEach(g => {
      if (!g.client) return
      if (!map[g.client]) map[g.client] = { client: g.client, gigs: 0, paid: 0, fee: 0 }
      map[g.client].gigs++
      map[g.client].paid += Number(g.paid || 0)
      map[g.client].fee += Number(g.fee || 0)
    })
    return Object.values(map).sort((a, b) => b.paid - a.paid).slice(0, 5)
  }, [gigs])

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '10px 14px', borderRadius: 10, fontSize: 13 }}>
        <p style={{ fontWeight: 700, marginBottom: 4 }}>{label}</p>
        <p>Collected: <strong>{currency(payload[0]?.value)}</strong></p>
        <p>Booked: <strong>{currency(payload[1]?.value)}</strong></p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>Finance</h1>
        <button className="btn btn-ghost" onClick={() => exportCSV(gigs)}>
          <Download size={15} /> Export CSV
        </button>
      </div>

      <div className="stats">
        <div className="stat-card green">
          <div className="label">Collected Income</div>
          <div className="value">{currency(stats.total)}</div>
        </div>
        <div className="stat-card gold">
          <div className="label">Total Booked</div>
          <div className="value">{currency(stats.fees)}</div>
        </div>
        <div className="stat-card red">
          <div className="label">Outstanding</div>
          <div className="value">{currency(stats.outstanding)}</div>
        </div>
        <div className="stat-card red">
          <div className="label">Total Expenses</div>
          <div className="value">{currency(stats.totalExpenses)}</div>
        </div>
        <div className="stat-card green">
          <div className="label">Net Profit</div>
          <div className="value">{currency(stats.netProfit)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Upcoming Gigs</div>
          <div className="value">{stats.upcoming}</div>
        </div>
      </div>

      <div className="chart-card" style={{ marginBottom: 20 }}>
        <h3>Monthly Income</h3>
        {chartData.length === 0
          ? <p className="muted">No data yet. Add gigs to see income trends.</p>
          : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--paper3)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--ink3)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--ink3)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="income" fill="var(--green)" radius={[6, 6, 0, 0]} name="Collected" />
                <Bar dataKey="fees" fill="var(--paper3)" radius={[6, 6, 0, 0]} name="Booked" />
              </BarChart>
            </ResponsiveContainer>
          )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, marginBottom: 16 }}>Top Clients</h3>
          {topClients.length === 0
            ? <p className="muted">No clients yet.</p>
            : topClients.map((c, i) => (
              <div key={c.client} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < topClients.length - 1 ? '1px solid var(--paper3)' : 'none' }}>
                <div>
                  <p style={{ fontWeight: 600 }}>{c.client}</p>
                  <p className="muted">{c.gigs} gig{c.gigs !== 1 ? 's' : ''}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 700, color: 'var(--green)' }}>{currency(c.paid)}</p>
                  <p className="muted">{currency(c.fee)} booked</p>
                </div>
              </div>
            ))}
        </div>

        <div className="card">
          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, marginBottom: 16 }}>Recent Gigs</h3>
          {gigs.slice(0, 6).map((g, i) => (
            <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 5 ? '1px solid var(--paper3)' : 'none' }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{g.title}</p>
                <p className="muted">{fmtDate(g.date)}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: 700 }}>{currency(g.fee)}</p>
                <span className={`badge ${invoiceBadge(g.invoice_status)}`}>{g.invoice_status || 'draft'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
