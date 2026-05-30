import React, { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Download, FileText } from 'lucide-react'
import { currency, fmtDate, invoiceBadge, exportCSV } from '../utils'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function exportTaxSummary(gigs, year) {
  const yearGigs = gigs.filter(g => g.date && new Date(g.date + 'T00:00:00').getFullYear() === year)
  const income = yearGigs.reduce((s, g) => s + Number(g.paid || 0), 0)
  const expenses = yearGigs.reduce((s, g) => s + (g.expenses || []).reduce((es, e) => es + Number(e.amount || 0), 0), 0)
  const netProfit = income - expenses
  const gigCount = yearGigs.length

  const lines = [
    `TAX SUMMARY ${year}`,
    `Paige Camryn Music`,
    `Generated: ${new Date().toLocaleDateString('en-US')}`,
    ``,
    `═══════════════════════════════════════`,
    `INCOME SUMMARY`,
    `═══════════════════════════════════════`,
    `Total Gigs Performed: ${gigCount}`,
    `Gross Income:         $${income.toFixed(2)}`,
    `Total Expenses:       $${expenses.toFixed(2)}`,
    `Net Profit:           $${netProfit.toFixed(2)}`,
    ``,
    `═══════════════════════════════════════`,
    `GIG BREAKDOWN`,
    `═══════════════════════════════════════`,
    ...yearGigs.map(g => {
      const gigExpenses = (g.expenses || []).reduce((s, e) => s + Number(e.amount || 0), 0)
      return [
        ``,
        `Event:    ${g.title}`,
        `Client:   ${g.client || '—'}`,
        `Date:     ${g.date}`,
        `Income:   $${Number(g.paid || 0).toFixed(2)}`,
        `Expenses: $${gigExpenses.toFixed(2)}`,
        `Net:      $${(Number(g.paid || 0) - gigExpenses).toFixed(2)}`,
      ].join('\n')
    }),
    ``,
    `═══════════════════════════════════════`,
    `EXPENSE DETAIL`,
    `═══════════════════════════════════════`,
    ...yearGigs.flatMap(g => (g.expenses || []).map(e => `${g.title}: ${e.description} — $${Number(e.amount).toFixed(2)}`)),
    ``,
    `═══════════════════════════════════════`,
    `This document is for informational purposes only.`,
    `Please consult a tax professional for filing advice.`,
  ]

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tax-summary-${year}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

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

  const availableYears = [...new Set(gigs.filter(g => g.date).map(g => new Date(g.date + 'T00:00:00').getFullYear()))].sort((a, b) => b - a)
  const currentYear = new Date().getFullYear()
  const [taxYear, setTaxYear] = useState(currentYear)

  const taxYearGigs = gigs.filter(g => g.date && new Date(g.date + 'T00:00:00').getFullYear() === taxYear)
  const taxIncome = taxYearGigs.reduce((s, g) => s + Number(g.paid || 0), 0)
  const taxExpenses = taxYearGigs.reduce((s, g) => s + (g.expenses || []).reduce((es, e) => es + Number(e.amount || 0), 0), 0)
  const taxNet = taxIncome - taxExpenses

  return (
    <div>
      <div className="page-header">
        <h1>Finance</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => exportCSV(gigs)}>
            <Download size={15} /> Export CSV
          </button>
        </div>
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

      {/* Tax Year Summary */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontStyle: 'italic', margin: 0 }}>Tax Year Summary</h3>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <select value={taxYear} onChange={e => setTaxYear(Number(e.target.value))} style={{ width: 'auto', padding: '8px 12px' }}>
              {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button className="btn btn-ghost btn-sm" onClick={() => exportTaxSummary(gigs, taxYear)}>
              <FileText size={14} /> Download Tax Summary
            </button>
          </div>
        </div>
        <div className="mini-grid">
          <div className="mini-cell">
            <div className="mini-label">Gigs Performed</div>
            <div className="mini-val">{taxYearGigs.length}</div>
          </div>
          <div className="mini-cell">
            <div className="mini-label">Gross Income</div>
            <div className="mini-val" style={{ color: 'var(--green)' }}>{currency(taxIncome)}</div>
          </div>
          <div className="mini-cell">
            <div className="mini-label">Total Expenses</div>
            <div className="mini-val" style={{ color: 'var(--red)' }}>{currency(taxExpenses)}</div>
          </div>
          <div className="mini-cell">
            <div className="mini-label">Net Profit</div>
            <div className="mini-val" style={{ color: taxNet >= 0 ? 'var(--green)' : 'var(--red)' }}>{currency(taxNet)}</div>
          </div>
        </div>
        {taxYearGigs.length === 0 && (
          <p className="muted" style={{ marginTop: 12 }}>No gigs found for {taxYear}.</p>
        )}
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
