import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import {
  CalendarDays,
  DollarSign,
  FileText,
  Music,
  Bell,
  Plus,
  CheckCircle2
} from 'lucide-react';
import './styles.css';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function currency(n) {
  return Number(n || 0).toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD'
  });
}

function App() {
  const [user, setUser] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [gigs, setGigs] = useState([]);
  const [selectedGigId, setSelectedGigId] = useState(null);

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
    practice_date: ''
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      loadGigs();
    } else {
      setGigs([]);
      setSelectedGigId(null);
    }
  }, [user]);

  async function signUp() {
    const { error } = await supabase.auth.signUp({
      email: authEmail,
      password: authPassword
    });

    if (error) {
      alert(error.message);
    } else {
      alert('Check your email to confirm your account.');
    }
  }

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPassword
    });

    if (error) {
      alert(error.message);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function loadGigs() {
    const { data, error } = await supabase
      .from('gigs')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      alert(error.message);
      return;
    }

    setGigs(data || []);

    if (data && data.length > 0) {
      setSelectedGigId(data[0].id);
    }
  }

  const selectedGig = gigs.find(g => g.id === selectedGigId) || gigs[0];

  const stats = useMemo(() => {
    const total = gigs.reduce((sum, g) => sum + Number(g.paid || 0), 0);

    const outstanding = gigs.reduce(
      (sum, g) => sum + Math.max(Number(g.fee || 0) - Number(g.paid || 0), 0),
      0
    );

    const upcoming = gigs.filter(g => {
      if (!g.date) return false;
      return new Date(g.date) >= new Date(new Date().toDateString());
    }).length;

    return { total, outstanding, upcoming };
  }, [gigs]);

  async function addGig(e) {
    e.preventDefault();

    const newGig = {
      user_id: user.id,
      title: form.title,
      client: form.client,
      venue: form.venue,
      date: form.date || null,
      time: form.time || null,
      fee: Number(form.fee || 0),
      deposit: Number(form.deposit || 0),
      paid: Number(form.paid || 0),
      setlist: form.setlist,
      notes: form.notes,
      practice_date: form.practice_date || null,
      invoice_status:
        Number(form.paid || 0) >= Number(form.fee || 0) ? 'paid' : 'draft',
      contract_status: 'not sent'
    };

    const { error } = await supabase.from('gigs').insert([newGig]);

    if (error) {
      alert(error.message);
      return;
    }

    setForm({
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
      practice_date: ''
    });

    loadGigs();
  }

  async function markPaid(id, fee) {
    const { error } = await supabase
      .from('gigs')
      .update({
        paid: fee,
        invoice_status: 'paid'
      })
      .eq('id', id);

    if (error) {
      alert(error.message);
      return;
    }

    loadGigs();
  }

  function generateContract(g) {
    return `PERFORMANCE AGREEMENT

This agreement is between ${g.client || '[Client]'} and the Performer for the event "${g.title || '[Event]'}" at ${g.venue || '[Venue]'} on ${g.date || '[Date]'} at ${g.time || '[Time]'}.

Fee: ${currency(g.fee)}
Deposit: ${currency(g.deposit)}
Balance Due: ${currency(Math.max(Number(g.fee || 0) - Number(g.deposit || 0), 0))}

The Performer agrees to provide live musical performance services for the event.

Client Signature: ____________________

Performer Signature: __________________`;
  }
function downloadInvoice() {
  if (!selectedGig) return;

  const balance = Math.max(Number(selectedGig.fee || 0) - Number(selectedGig.paid || 0), 0);

  const invoiceText = `
INVOICE

Client: ${selectedGig.client || ''}
Event: ${selectedGig.title || ''}
Venue: ${selectedGig.venue || ''}
Date: ${selectedGig.date || ''}
Time: ${selectedGig.time || ''}

Fee: ${currency(selectedGig.fee)}
Deposit: ${currency(selectedGig.deposit)}
Paid: ${currency(selectedGig.paid)}
Balance Due: ${currency(balance)}

Thank you for your business.
`;

  const blob = new Blob([invoiceText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `${selectedGig.title || 'invoice'}-invoice.txt`;
  link.click();

  URL.revokeObjectURL(url);
}
  function copyContract() {
    if (!selectedGig) return;

    navigator.clipboard.writeText(generateContract(selectedGig));
    alert('Contract copied to clipboard.');
  }

  if (!user) {
    return (
      <main>
        <section className="panel form">
          <h1>Gig Manager Login</h1>

          <label>Email</label>
          <input
            type="email"
            value={authEmail}
            onChange={e => setAuthEmail(e.target.value)}
          />

          <label>Password</label>
          <input
            type="password"
            value={authPassword}
            onChange={e => setAuthPassword(e.target.value)}
          />

          <div className="actions">
            <button type="button" onClick={signIn}>Log In</button>
            <button type="button" onClick={signUp}>Sign Up</button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <header className="hero">
        <div>
          <p className="eyebrow">SOLO MUSICIAN BUSINESS MANAGER</p>
          <h1>Gig Manager</h1>
          <button type="button" onClick={signOut}>Sign Out</button>
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
          <h2><Music size={20} /> Gigs</h2>

          <div className="gigList">
            {gigs.map(g => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGigId(g.id)}
                className={g.id === selectedGig?.id ? 'gig active' : 'gig'}
              >
                <strong>{g.title}</strong>
                <span>{g.date} · {g.venue}</span>
                <em>{currency(g.fee)} · {g.invoice_status}</em>
              </button>
            ))}
          </div>
        </div>

        <div className="panel detail">
          {selectedGig && (
            <>
              <h2>{selectedGig.title}</h2>
              <p className="muted">{selectedGig.date} at {selectedGig.time} · {selectedGig.venue}</p>

              <div className="miniGrid">
                <p><strong>Client</strong><br />{selectedGig.client}</p>
                <p><strong>Fee</strong><br />{currency(selectedGig.fee)}</p>
                <p><strong>Paid</strong><br />{currency(selectedGig.paid)}</p>
                <p><strong>Balance</strong><br />{currency(Math.max(Number(selectedGig.fee || 0) - Number(selectedGig.paid || 0), 0))}</p>
              </div>

              <p><strong>Set list</strong><br />{selectedGig.setlist || 'No set list yet.'}</p>
              <p><strong>Notes</strong><br />{selectedGig.notes || 'No notes yet.'}</p>
              <p><strong>Practice reminder</strong><br />{selectedGig.practice_date || 'None set.'}</p>

              <div className="actions">
                <button type="button" onClick={() => markPaid(selectedGig.id, selectedGig.fee)}>
                  <CheckCircle2 size={16} /> Mark paid
                </button>

                <button type="button" onClick={copyContract}><button type="button" onClick={downloadInvoice}>
  Download invoice
</button>
                  <FileText size={16} /> Copy contract
                </button>
              </div>

              <textarea readOnly value={generateContract(selectedGig)} />
            </>
          )}
        </div>

        <form className="panel form" onSubmit={addGig}>
          <h2><Plus size={20} /> Add a gig</h2>

          <label>Title<input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label>
          <label>Client<input value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} /></label>
          <label>Venue<input value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} /></label>
          <label>Date<input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></label>
          <label>Time<input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} /></label>
          <label>Fee<input type="number" value={form.fee} onChange={e => setForm({ ...form, fee: e.target.value })} /></label>
          <label>Deposit<input type="number" value={form.deposit} onChange={e => setForm({ ...form, deposit: e.target.value })} /></label>
          <label>Paid<input type="number" value={form.paid} onChange={e => setForm({ ...form, paid: e.target.value })} /></label>
          <label>Practice Date<input type="date" value={form.practice_date} onChange={e => setForm({ ...form, practice_date: e.target.value })} /></label>
          <label>Set List<textarea value={form.setlist} onChange={e => setForm({ ...form, setlist: e.target.value })} /></label>
          <label>Notes<textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></label>

          <button type="submit">Save gig</button>
        </form>
      </section>
    </main>
  );
}

function Card({ icon, label, value }) {
  return (
    <div className="card">
      {icon}
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);

