import React, { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Download, FileText } from 'lucide-react'
import {
  currency, fmtDate, invoiceBadge, exportCSV,
  reportableGigs, gigFee, gigPaid, gigOutstanding, gigExpenses,
} from '../utils'
import { byLeadSource, byEventCategory, salesSummary, UNRECORDED } from '../salesOrder'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function exportTaxSummary(gigs, year) {
  const yearGigs = reportableGigs(gigs).filter(g => g.date && new Date(g.date + 'T00:00:00').getFullYear() === year)
  const income = yearGigs.reduce((s, g) => s + gigPaid(g), 0)
  const expenses = yearGigs.reduce((s, g) => s + gigExpenses(g), 0)
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
      const exp = gigExpenses(g)
      return [
        ``,
        `Event:    ${g.title}`,
        `Client:   ${g.client || '—'}`,
        `Date:     ${g.date}`,
        `Income:   $${gigPaid(g).toFixed(2)}`,
        `Expenses: $${exp.toFixed(2)}`,
        `Net:      $${(gigPaid(g) - exp).toFixed(2)}`,
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

/**
 * Shared renderer for the two sales breakdowns. Each row carries a share bar
 * sized against the largest row, because the ranking question ("is Website
 * twice word-of-mouth or barely ahead?") is much easier to read as a bar than
 * as five dollar figures.
 */
function BreakdownTable({ rows, emptyText }) {
  if (!rows.length) return <p className="muted">{emptyText}</p>
  const max = Math.max(...rows.map(r => r.paid), 1)

  return (
    <div>
      {rows.map((r, i) => (
        <div
          key={r.key}
          style={{ padding: '11px 0', borderBottom: i < rows.length - 1 ? '1px solid var(--paper3)' : 'none' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
            <p style={{ fontWeight: 600, fontSize: 14, opacity: r.key === UNRECORDED ? .6 : 1 }}>{r.key}</p>
            <p style={{ fontWeight: 700, color: 'var(--green)', flexShrink: 0 }}>{currency(r.paid)}</p>
          </div>

          <div
            aria-hidden="true"
            style={{ height: 5, background: 'var(--paper3)', borderRadius: 3, margin: '7px 0 6px' }}
          >
            <div style={{ width: `${(r.paid / max) * 100}%`, height: '100%', background: 'var(--blush)', borderRadius: 3 }} />
          </div>

          <p className="muted" style={{ fontSize: 12 }}>
            {r.gigs} gig{r.gigs !== 1 ? 's' : ''}
            {r.hours > 0 && ` · ${+r.hours.toFixed(2)} hr${r.hours !== 1 ? 's' : ''}`}
            {r.avgRate !== null && ` · ${currency(r.avgRate)}/hr avg`}
            {r.comps > 0 && ` · ${r.comps} comp${r.comps !== 1 ? 's' : ''}`}
          </p>
        </div>
      ))}
    </div>
  )
}

export default function FinancePage({ gigs }) {
  // Every figure on this page reflects live gigs only. Archived and canceled
  // gigs stay in the database but are deliberately excluded from all reporting.
  const live = useMemo(() => reportableGigs(gigs), [gigs])

  const stats = useMemo(() => {
    const total = live.reduce((s, g) => s + gigPaid(g), 0)
    const outstanding = live.reduce((s, g) => s + gigOutstanding(g), 0)
    const fees = live.reduce((s, g) => s + gigFee(g), 0)
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const upcoming = live.filter(g => g.date && new Date(g.date + 'T00:00:00') >= today).length
    const totalExpenses = live.reduce((s, g) => s + gigExpenses(g), 0)
    const netProfit = total - totalExpenses
    return { total, outstanding, fees, upcoming, totalExpenses, netProfit }
  }, [live])

  const chartData = useMemo(() => {
    const byMonth = {}
    live.forEach(g => {
      if (!g.date) return
      const d = new Date(g.date + 'T00:00:00')
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`
      if (!byMonth[key]) byMonth[key] = { key, month: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, income: 0, fees: 0 }
      byMonth[key].income += gigPaid(g)
      byMonth[key].fees += gigFee(g)
    })
    // Sort chronologically before trimming — object key order is insertion
    // order, which follows the gig list, not the calendar.
    return Object.values(byMonth).sort((a, b) => a.key.localeCompare(b.key)).slice(-12)
  }, [live])

  const topClients = useMemo(() => {
    const map = {}
    live.forEach(g => {
      if (!g.client) return
      const key = g.client.trim().toLowerCase()
      if (!key) return
      if (!map[key]) map[key] = { client: g.client.trim(), gigs: 0, paid: 0, fee: 0 }
      map[key].gigs++
      map[key].paid += gigPaid(g)
      map[key].fee += gigFee(g)
    })
    return Object.values(map).sort((a, b) => b.paid - a.paid).slice(0, 5)
  }, [live])

  const leadSources = useMemo(() => byLeadSource(gigs), [gigs])
  const categories = useMemo(() => byEventCategory(gigs), [gigs])
  const sales = useMemo(() => salesSummary(gigs), [gigs])

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

  const currentYear = new Date().getFullYear()
  const [taxYear, setTaxYear] = useState(currentYear)

  // Offer every year that actually has gigs, not just the last three.
  const availableYears = useMemo(() => {
    const years = new Set(live.filter(g => g.date).map(g => new Date(g.date + 'T00:00:00').getFullYear()))
    years.add(currentYear)
    return [...years].sort((a, b) => b - a)
  }, [live, currentYear])

  const taxYearGigs = useMemo(
    () => live.filter(g => g.date && new Date(g.date + 'T00:00:00').getFullYear() === taxYear),
    [live, taxYear]
  )
  const taxIncome = taxYearGigs.reduce((s, g) => s + gigPaid(g), 0)
  const taxExpenses = taxYearGigs.reduce((s, g) => s + gigExpenses(g), 0)
  const taxNet = taxIncome - taxExpenses

  // Gigs arrive sorted date-ascending, so slice(0, 6) was showing the OLDEST
  // gigs under a "Recent" heading. Sort newest-first before trimming.
  const recentGigs = useMemo(
    () => [...live].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 6),
    [live]
  )

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
              {availableYears.map(y => (
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

      {/* Sales orders — replaces the tab of the same name in PC records.xlsx */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 4 }}>
          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontStyle: 'italic', margin: 0 }}>Where Bookings Come From</h3>
          <p className="muted" style={{ fontSize: 12 }}>
            {sales.avgRate !== null && <>{currency(sales.avgRate)}/hr average · </>}
            {+sales.hours.toFixed(2)} hours played
            {sales.comps > 0 && <> · {sales.comps} comp{sales.comps !== 1 ? 's' : ''}</>}
            {sales.canceled > 0 && <> · {sales.canceled} canceled</>}
          </p>
        </div>

        {/* A channel ranking is only as good as its coverage. Say so plainly
            rather than letting a table built on half the bookings look
            like the whole picture. */}
        {sales.coverage < 1 && (
          <p className="muted" style={{ fontSize: 12, marginBottom: 14 }}>
            {sales.recorded} of {sales.gigs} gigs have a source recorded
            ({Math.round(sales.coverage * 100)}%). The rest are grouped under “{UNRECORDED}”.
          </p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>By source</p>
            <BreakdownTable rows={leadSources} emptyText="No sources recorded yet." />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>By event type</p>
            <BreakdownTable rows={categories} emptyText="No event types recorded yet." />
          </div>
        </div>
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
          {recentGigs.map((g, i) => (
            <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < recentGigs.length - 1 ? '1px solid var(--paper3)' : 'none' }}>
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
