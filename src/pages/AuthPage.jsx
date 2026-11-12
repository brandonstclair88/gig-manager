import React, { useState } from 'react'
import { supabase } from '../supabase'

// Sign-in only. This dashboard has a single owner, so there is no sign-up
// form — new accounts should also be disabled in Supabase (Authentication →
// Sign In / Providers → "Allow new users to sign up").
export default function AuthPage({ notice }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(notice || '')

  async function handle() {
    setLoading(true)
    setMsg('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMsg(error.message)
    setLoading(false)
  }

  return (
    <div className="auth-wrap" style={{ width: "100%" }}>
      <div className="auth-card">
        <h1>Paige Camryn Music</h1>
        <p>Sign in to your account</p>
        <div className="field" style={{ marginBottom: 14 }}>
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <div className="field" style={{ marginBottom: 20 }}>
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            autoComplete="current-password" onKeyDown={e => e.key === 'Enter' && handle()} />
        </div>
        {msg && <p style={{ color: 'red', fontSize: 13, marginBottom: 14 }}>{msg}</p>}
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
          onClick={handle} disabled={loading}>
          {loading ? 'Please wait…' : 'Sign In'}
        </button>
      </div>
    </div>
  )
}
