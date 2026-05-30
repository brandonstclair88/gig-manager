import React, { useEffect, useState, useCallback } from 'react'
import { LayoutDashboard, Music, CalendarDays, DollarSign, Users, LogOut, MessageSquare, BookOpen, Star, Moon, Sun } from 'lucide-react'
import { supabase } from './supabase'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import GigsPage from './pages/GigsPage'
import CalendarPage from './pages/CalendarPage'
import FinancePage from './pages/FinancePage'
import ClientsPage from './pages/ClientsPage'
import TestimonialsPage from './pages/TestimonialsPage'
import SignPage from './pages/SignPage'
import RepertoirePage from './pages/RepertoirePage'
import InquiriesPage from './pages/InquiriesPage'
import PublicSite from './pages/PublicSite'

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { id: 'inquiries',  label: 'Inquiries',  icon: MessageSquare },
  { id: 'gigs',       label: 'Gigs',       icon: Music },
  { id: 'calendar',   label: 'Calendar',   icon: CalendarDays },
  { id: 'finance',    label: 'Finance',    icon: DollarSign },
  { id: 'clients',    label: 'Clients',    icon: Users },
  { id: 'repertoire', label: 'Repertoire', icon: BookOpen },
  { id: 'testimonials', label: 'Testimonials', icon: Star, badge: true },
]

export default function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [page, setPage] = useState('dashboard')
  const [gigs, setGigs] = useState([])
  const [clients, setClients] = useState([])
  const [repertoire, setRepertoire] = useState([])
  const [inquiries, setInquiries] = useState([])
  const [pendingTestimonials, setPendingTestimonials] = useState(0)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  // Public pages
  if (window.location.search.includes('gig=')) return <SignPage />
  if (window.location.search.includes('site=')) return <PublicSite />

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null)
      setAuthLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const loadGigs = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase.from('gigs').select('*').order('date', { ascending: true })
    if (!error) setGigs(data || [])
  }, [user])

  const loadClients = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase.from('clients').select('*').order('name', { ascending: true })
    if (!error) setClients(data || [])
  }, [user])

  const loadRepertoire = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase.from('repertoire').select('*').order('category').order('title')
    if (!error) setRepertoire(data || [])
  }, [user])

  const loadPendingTestimonials = useCallback(async () => {
    if (!user) return
    const { count } = await supabase.from('testimonials').select('*', { count: 'exact', head: true }).eq('approved', false)
    setPendingTestimonials(count || 0)
  }, [user])

  const loadInquiries = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase.from('inquiries').select('*').order('created_at', { ascending: false })
    if (!error) setInquiries(data || [])
  }, [user])

  function refresh() { loadGigs(); loadClients(); loadRepertoire(); loadInquiries(); loadPendingTestimonials() }

  useEffect(() => {
    if (user) { loadGigs(); loadClients(); loadRepertoire(); loadInquiries(); loadPendingTestimonials() }
    else { setGigs([]); setClients([]); setRepertoire([]); setInquiries([]) }
  }, [user])

  async function signOut() {
    await supabase.auth.signOut()
  }

  if (authLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--ink)' }}>
      <p style={{ color: 'var(--paper)', fontFamily: 'Playfair Display, serif', fontSize: 22 }}>Loading…</p>
    </div>
  )

  if (!user) return <AuthPage />

  return (
    <>
      <nav className="sidebar">
        <div className="sidebar-logo">
          Paige Camryn Music
          <span>Luxury Event Harpist</span>
        </div>

        <div className="sidebar-nav-group">
          {NAV.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              className={`nav-btn${page === id ? ' active' : ''}`}
              onClick={() => setPage(id)}
              style={{ position: 'relative' }}
            >
              <Icon size={17} />
              {label}
              {badge && pendingTestimonials > 0 && (
                <span style={{
                  position: 'absolute', top: 6, right: 6,
                  background: 'var(--blush)', color: 'white',
                  borderRadius: 20, fontSize: 10, fontWeight: 700,
                  padding: '1px 6px', lineHeight: 1.4
                }}>{pendingTestimonials}</span>
              )}
            </button>
          ))}
        </div>

        <div className="sidebar-spacer" />

        <div style={{ fontSize: 12, color: 'var(--ink3)', padding: '0 14px', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.email}
        </div>
        <button
          onClick={() => setDarkMode(d => !d)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,.08)', background: 'transparent', color: '#8a8078', fontSize: 12, cursor: 'pointer', width: '100%', marginBottom: 6, fontFamily: 'Jost, sans-serif' }}
        >
          {darkMode ? <Sun size={14} /> : <Moon size={14} />}
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button className="sign-out-btn" onClick={signOut}>
          <LogOut size={15} /> Sign Out
        </button>
      </nav>

      <main className="page">
        {page === 'dashboard'  && <DashboardPage gigs={gigs} onNavigate={setPage} />}
        {page === 'inquiries'  && <InquiriesPage inquiries={inquiries} userId={user.id} onRefresh={refresh} />}
        {page === 'gigs'       && <GigsPage gigs={gigs} userId={user.id} onRefresh={refresh} />}
        {page === 'calendar'   && <CalendarPage gigs={gigs} userId={user.id} onRefresh={refresh} />}
        {page === 'finance'    && <FinancePage gigs={gigs} />}
        {page === 'clients'    && <ClientsPage clients={clients} gigs={gigs} userId={user.id} onRefresh={refresh} />}
        {page === 'repertoire' && <RepertoirePage repertoire={repertoire} userId={user.id} onRefresh={refresh} />}
        {page === 'testimonials' && <TestimonialsPage />}
      </main>
    </>
  )
}
