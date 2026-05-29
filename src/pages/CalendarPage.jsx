import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { fmtDate, fmtTime } from '../utils'
import GigModal from '../components/GigModal'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function CalendarPage({ gigs, userId, onRefresh }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [showModal, setShowModal] = useState(false)
  const [prefilledDate, setPrefilledDate] = useState(null)
  const [hoverGig, setHoverGig] = useState(null)

  function prev() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function next() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrev = new Date(year, month, 0).getDate()

  const cells = []
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrev - i, currentMonth: false, date: null })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, currentMonth: true, date })
  }
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, currentMonth: false, date: null })
  }

  function gigsForDate(date) {
    return gigs.filter(g => g.date === date)
  }

  function isToday(date) {
    return date === today.toISOString().slice(0, 10)
  }

  function clickCell(cell) {
    if (!cell.currentMonth) return
    setPrefilledDate(cell.date)
    setShowModal(true)
  }

  return (
    <div>
      <div className="page-header">
        <div className="cal-nav">
          <button className="btn btn-ghost btn-icon" onClick={prev}><ChevronLeft size={18} /></button>
          <h2>{MONTHS[month]} {year}</h2>
          <button className="btn btn-ghost btn-icon" onClick={next}><ChevronRight size={18} /></button>
        </div>
        <button className="btn btn-primary" onClick={() => { setPrefilledDate(null); setShowModal(true) }}>
          <Plus size={16} /> Add Gig
        </button>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div className="cal-header">
          {DAYS.map(d => <div key={d} className="cal-day-name">{d}</div>)}
        </div>
        <div className="calendar-grid">
          {cells.map((cell, i) => {
            const dayGigs = cell.date ? gigsForDate(cell.date) : []
            return (
              <div
                key={i}
                className={`cal-cell${!cell.currentMonth ? ' other-month' : ''}${cell.date && isToday(cell.date) ? ' today' : ''}`}
                onClick={() => clickCell(cell)}
              >
                <div className="cal-num">{cell.day}</div>
                {dayGigs.map(g => (
                  <div
                    key={g.id}
                    className={`cal-gig${g.invoice_status !== 'paid' ? ' unpaid' : ''}`}
                    title={`${g.title} — ${g.client}`}
                    onMouseEnter={() => setHoverGig(g)}
                    onMouseLeave={() => setHoverGig(null)}
                  >
                    {g.title}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {hoverGig && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          background: 'var(--ink)', color: 'var(--paper)',
          borderRadius: 14, padding: '14px 18px', zIndex: 50,
          boxShadow: 'var(--shadow-lg)', maxWidth: 260, pointerEvents: 'none'
        }}>
          <p style={{ fontWeight: 700, marginBottom: 4 }}>{hoverGig.title}</p>
          <p style={{ fontSize: 13, opacity: .8 }}>{hoverGig.client} · {fmtDate(hoverGig.date)}</p>
          {hoverGig.time && <p style={{ fontSize: 13, opacity: .7 }}>{fmtTime(hoverGig.time)}</p>}
          <p style={{ fontSize: 13, opacity: .7 }}>{hoverGig.venue}</p>
        </div>
      )}

      {showModal && (
        <GigModal
          gig={prefilledDate ? { date: prefilledDate } : null}
          userId={userId}
          onClose={() => setShowModal(false)}
          onSaved={onRefresh}
        />
      )}
    </div>
  )
}
