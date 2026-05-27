import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CalendarDays, DollarSign, FileText, Music, Bell, Plus, CheckCircle2 } from 'lucide-react';
import './styles.css';

const seedGigs = [
  {
    id: crypto.randomUUID(),
    title: 'Wedding Ceremony',
    client: 'Avery Johnson',
    venue: 'Rosewood Gardens',
    date: '2026-06-20',
    time: '16:00',
    fee: 900,
    deposit: 300,
    paid: 300,
    invoiceStatus: 'sent',
    contractStatus: 'sent',
    setlist: 'Canon in D, Perfect, At Last',
    notes: 'Arrive 90 minutes early. Outdoor ceremony.',
    practiceDate: '2026-06-15',
  },
  {
    id: crypto.randomUUID(),
    title: 'Restaurant Dinner Set',
    client: 'Marco Silva',
    venue: 'The Copper Room',
    date: '2026-06-05',
    time: '19:00',
    fee: 350,
    deposit: 0,
    paid: 350,
    invoiceStatus: 'paid',
    contractStatus: 'signed',
    setlist: 'Jazz standards, pop covers',
    notes: 'Two 45-minute sets.',
    practiceDate: '2026-06-03',
  },
];

function currency(n) {
  return Number(n || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

function App() {
  const [gigs, setGigs] = useState(() => JSON.parse(localStorage.getItem('gigs') || 'null') || seedGigs);
  const [selectedGigId, setSelectedGigId] = useState(gigs[0]?.id);
  const [form, setForm] = useState({ title: '', client: '', venue: '', date: '', time: '', fee: '', deposit: '', paid: '', setlist: '', notes: '', practiceDate: '' });

  function save(next) {
    setGigs(next);
    localStorage.setItem('gigs', JSON.stringify(next));
  }

  const selectedGig = gigs.find(g => g.id === selectedGigId) || gigs[0];

  const stats = useMemo(() => {
    const total = gigs.reduce((sum, g) => sum + Number(g.paid || 0), 0);
    const outstanding = gigs.reduce((sum, g) => sum + Math.max(Number(g.fee || 0) - Number(g.paid || 0), 0), 0);
    const upcoming = gigs.filter(g => new Date(g.date) >= new Date(new Date().toDateString())).length;
    return { total, outstanding, upcoming };
  }, [gigs]);

  function addGig(e) {
    e.preventDefault();
    const gig = {
      id: crypto.randomUUID(),
      ...form,
      fee: Number(form.fee || 0),
      deposit: Number(form.deposit || 0),
      paid: Number(form.paid || 0),
      invoiceStatus: Number(form.paid || 0) >= Number(form.fee || 0) ? 'paid' : 'draft',
      contractStatus: 'not sent',
    };
    const next = [...gigs, gig].sort((a, b) => a.date.localeCompare(b.date));
    save(next);
    setSelectedGigId(gig.id);
    setForm({ title: '', client: '', venue: '', date: '', time: '', fee: '', deposit: '', paid: '', setlist: '', notes: '', practiceDate: '' });
  }

  function markPaid(id) {
    save(gigs.map(g => g.id === id ? { ...g, paid: g.fee, invoiceStatus: 'paid' } : g));
  }

  function generateContract(g) {
    return `PERFORMANCE AGREEMENT\n\nThis agreement is between ${g.client || '[Client]'} and the Performer for the event "${g.title || '[Event]'}" at ${g.venue || '[Venue]'} on ${g.date || '[Date]'} at ${g.time || '[Time]'}.\n\nFee: ${currency(g.fee)}\nDeposit: ${currency(g.deposit)}\nBalance Due: ${currency(Math.max((g.fee || 0) - (g.deposit || 0), 0))}\n\nThe Performer agrees to provide live musical performance services for the event. The Client agrees to provide safe access to the performance area, reasonable setup time, and payment according to the terms above.\n\nCancellation terms, overtime, travel, equipment, and weather policies should be reviewed and customized before signing.\n\nClient Signature: ____________________ Date: __________\nPerformer Signature: ________________ Date: __________`;
  }

  function copyContract() {
    navigator.clipboard.writeText(generateContract(selectedGig));
    alert('Contract copied to clipboard.');
  }

  return <main>
    <header className="hero">
      <div>
        <p className="eyebrow">Solo Musician Business Manager</p>
        <h1>Gig Manager</h1>
        <p>Track bookings, invoices, income, contracts, and practice reminders in one place.</p>
      </div>
    </header>

    <section className="stats">
      <Card icon={<CalendarDays />} label="Upcoming gigs" value={stats.upcoming} />
      <Card icon={<DollarSign />} label="Collected income" value={currency(stats.total)} />
      <Card icon={<Bell />} label="Outstanding" value={currency(stats.outstanding)} />
    </section>

    <section className="grid">
      <div className="panel">
        <h2><Music size={20}/> Gigs</h2>
        <div className="gigList">
          {gigs.map(g => <button key={g.id} onClick={() => setSelectedGigId(g.id)} className={g.id === selectedGig?.id ? 'gig active' : 'gig'}>
            <strong>{g.title}</strong><span>{g.date} · {g.venue}</span><em>{currency(g.fee)} · {g.invoiceStatus}</em>
          </button>)}
        </div>
      </div>

      <div className="panel detail">
        {selectedGig && <>
          <h2>{selectedGig.title}</h2>
          <p className="muted">{selectedGig.date} at {selectedGig.time} · {selectedGig.venue}</p>
          <div className="miniGrid">
            <p><strong>Client</strong><br />{selectedGig.client}</p>
            <p><strong>Fee</strong><br />{currency(selectedGig.fee)}</p>
            <p><strong>Paid</strong><br />{currency(selectedGig.paid)}</p>
            <p><strong>Balance</strong><br />{currency(Math.max(selectedGig.fee - selectedGig.paid, 0))}</p>
          </div>
          <p><strong>Set list</strong><br />{selectedGig.setlist || 'No set list yet.'}</p>
          <p><strong>Notes</strong><br />{selectedGig.notes || 'No notes yet.'}</p>
          <p><strong>Practice reminder</strong><br />{selectedGig.practiceDate || 'None set.'}</p>
          <div className="actions">
            <button onClick={() => markPaid(selectedGig.id)}><CheckCircle2 size={16}/> Mark paid</button>
            <button onClick={copyContract}><FileText size={16}/> Copy contract</button>
          </div>
          <textarea readOnly value={generateContract(selectedGig)} />
        </>}
      </div>

      <form className="panel form" onSubmit={addGig}>
        <h2><Plus size={20}/> Add a gig</h2>
        {['title','client','venue','date','time','fee','deposit','paid','practiceDate'].map(name =>
          <label key={name}>{name.replace(/([A-Z])/g, ' $1')}<input type={name.includes('date') || name === 'date' ? 'date' : name === 'time' ? 'time' : ['fee','deposit','paid'].includes(name) ? 'number' : 'text'} value={form[name]} onChange={e => setForm({...form, [name]: e.target.value})} /></label>
        )}
        <label>Set list<textarea value={form.setlist} onChange={e => setForm({...form, setlist: e.target.value})} /></label>
        <label>Notes<textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></label>
        <button type="submit">Save gig</button>
      </form>
    </section>
  </main>;
}

function Card({ icon, label, value }) {
  return <div className="card">{icon}<div><span>{label}</span><strong>{value}</strong></div></div>;
}

createRoot(document.getElementById('root')).render(<App />);
