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
          <di
