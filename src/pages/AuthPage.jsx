import React, { useState } from 'react'
import { supabase } from '../supabase'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function handle() {
    setLoading(true)
    setMsg('')
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMsg(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMsg(error.message)
      else setMsg('Check your email to confirm your account.')
    }
    setLoading(false)
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>Paige Camryn Music</h1>
        <p>{mode === 'login' ? 'Sign in to your account' : 'Create a new account'}</p>
        <div className="field" style={{ marginBottom: 14 }}>
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <div className="field" style={{ marginBottom: 20 }}>
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handle()} />
        </div>
        {msg && <p style={{ color: msg.startsWith('Check') ? 'green' : 'red', fontSize: 13, marginBottom: 14 }}>{msg}</p>}
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}
          onClick={handle} disabled={loading}>
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink3)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button style={{ background: 'none', border: 'none', color: 'var(--gold)', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMsg('') }}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
