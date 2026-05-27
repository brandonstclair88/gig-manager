import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CalendarDays, DollarSign, FileText, Music, Bell, Plus, CheckCircle2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import './styles.css';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function currency(n) {
  return Number(n || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

function App() {
  const [gigs, setGigs] = useState([]);
  const [selectedGigId, setSelectedGigId] = useState(null);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [form, setForm] = useState({
    title: '',
    client: '',
    venue: '',
    date: '',
    time: '',
    fee: '',
    deposit: '',
    paid: '',
    setlist: '',
    notes: '',
    practiceDate: ''
  });

  useEffect(() => {
    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);

      if (session?.user) {
        loadGigs();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkUser() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    setUser(session?.user || null);

    if (session?.user) {
      loadGigs();
    }
  }

  async function loadGigs() {
    const { data, error } = await supabase
      .from('gigs')
      .select('*')
      .order('gig_date', { ascending: true });

    if (error) {
      alert(error.message);
      return;
    }

    const mapped = data.map(g => ({
      id: g.id,
      title: g.title,
      client: '',
      venue: g.venue,
      date: g.gig_date,
      time: g.start_time,
      fee: Number(g.fee || 0),
      deposit: Number(g.deposit || 0),
      paid: Number(g.paid || 0),
      invoiceStatus: g.status || 'draft',
      contractStatus: 'not sent',
      setlist: g.setlist || '',
      notes: g.notes || '',
      practiceDate: g.practice_date || ''
    }));

    setGigs(mapped);
    setSelectedGigId(mapped[0]?.id || null);
  }

  async function signUp() {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert('Check your email to confirm signup.');
  }

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setGigs([]);
    setSelectedGigId(null);
  }

  const selectedGig = gigs.find(g => g.id === selectedGigId) || gigs[0];

  const stats = useMemo(() => {
    const total = gigs.reduce((sum, g) => sum + Number(g.paid || 0), 0);
    const outstanding = gigs.reduce((sum, g) => sum + Math.max(Number(g.fee || 0) - Number(g.paid || 0), 0);
    const upcoming = gigs.filter(g => g.date && new Date(g.date) >= new Date(new Date().toDateString())).length;
    return { total, outstanding, upcoming };
  }, [gigs]);

  async function addGig(e) {
    e.preventDefault();

    const { data, error } = await supabase
      .from('gigs')
      .insert({
        title: form.title,
        venue: form.venue,
        gig_date: form.date || null,
        start_time: form.time || null,
        fee: Number(form.fee || 0),
        deposit: Number(form.deposit || 0),
        paid: Number(form.paid || 0),
        status: Number(form.paid || 0) >= Number(form.fee || 0) ? 'paid' : 'draft',
        setlist: form.setlist,
        notes: `${form.notes}\n\nClient: ${form.client}`,
        practice_date: form.practiceDate || null
      })
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    await loadGigs();
    setSelectedGigId(data.id);
    setForm({ title: '', client: '', venue: '', date: '', time: '', fee: '', deposit: '', paid: '', setlist: '', notes: '', practiceDate: '' });
  }

  async function markPaid(id) {
    const gig = gigs.find(g => g.id === id);
    if (!gig) return;

    const { error } = await supabase
      .from('gigs')
      .update({
        paid: gig.fee,
        status: 'paid'
      })
      .eq('id', id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadGigs();
  }

  function generateContract(g) {
    return `PERFORMANCE AGREEMENT\n\nThis agreement is between ${g.client || '[Client]'} and the Performer for the event "${g.title || '[Event]'}" at ${g.venue || '[Venue]'} on ${g.date || '[Date]'} at ${g.time || '[Time]'}.\n\nFee: ${currency(g.fee)}\nDeposit: ${currency(g.deposit)}\nBalance Due: ${currency(Math.max((g.fee || 0) - (g.deposit || 0), 0))}\n\nThe Performer agrees to provide live musical performance services for the event. The Client agrees to provide safe access to the performance area, reasonable setup time, and payment according to the terms above.\n\nCancellation terms, overtime, travel, equipment, and weather policies should be reviewed and customized before signing.\n\nClient Signature: ____________________ Date: __________\nPerformer Signature: ________________ Date: __________`;
  }

  function copyContract() {
    navigator.clipboard.writeText(generateContract(selectedGig));
    alert('Contract copied to clipboard.');
  }

  if (!user) {
    return (
      <main className="auth">
        <div className="panel form">
          <h1>Gig Manager Login</h1>

          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          <div className="actions">
            <button onClick={signIn}>Login</button>
            <button onClick={signUp}>Sign Up</button>
          </div>
        </div>
      </main>
    );
  }

  return <main>
    <header className="hero">
      <div>
        <p className="eyebrow">Solo Musician Business Manager</p>
        <h1>Gig Manager</h1>
        <button onClick={signOut}>Sign Out</button>
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
