import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { contractText, fmtDate } from '../utils'

export default function SignPage() {
  const [gig, setGig] = useState(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)
  const [signed, setSigned] = useState(false)
  const [error, setError] = useState('')

  const gigId = new URLSearchParams(window.location.search).get('gig')

  useEffect(() => {
    if (!gigId) { setError('Invalid link.'); setLoading(false); return }
    supabase.from('gigs').select('*').eq('id', gigId).single()
      .then(({ data, error }) => {
        if (error || !data) { setError('Contract not found.'); }
        else {
          setGig(data)
          if (data.signed_at) setSigned(true)
        }
        setLoading(false)
      })
  }, [gigId])

  async function sign() {
    if (!name.trim()) { alert('Please enter your full name to sign.'); return }
    setSigning(true)
    const { error } = await supabase.from('gigs').update({
      signed_by: name.trim(),
      signed_at: new Date().toISOString(),
      contract_status: 'signed'
    }).eq('id', gigId)
    setSigning(false)
    if (error) { alert(error.message); return }
    setSigned(true)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0d0b' }}>
      <p style={{ color: '#f0c060', fontFamily: 'Playfair Display, serif', fontSize: 22 }}>Loading contract…</p>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0d0b' }}>
      <p style={{ color: '#fca5a5', fontFamily: 'Playfair Display, serif', fontSize: 22 }}>{error}</p>
    </div>
  )

  if (signed) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0d0b', padding: 20 }}>
      <div style={{ background: '#faf8f4', borderRadius: 24, padding: 48, maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, marginBottom: 12 }}>Contract Signed!</h1>
        <p style={{ color: '#7a746e', marginBottom: 8 }}>Thank you, <strong>{gig.signed_by}</strong>.</p>
        <p style={{ color: '#7a746e', fontSize: 14 }}>
          Signed on {fmtDate(gig.signed_at?.slice(0, 10))} for <strong>{gig.title}</strong>.
        </p>
        <p style={{ color: '#7a746e', fontSize: 13, marginTop: 16 }}>You can close this page.</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0f0d0b', padding: '40px 20px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <p style={{ color: '#c9973a', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.14em', marginBottom: 8 }}>Performance Agreement</p>
          <h1 style={{ fontFamily: 'Playfair Display, serif', color: '#faf8f4', fontSize: 32, marginBottom: 8 }}>Paige Camryn Music</h1>
          <p style={{ color: '#7a746e', fontSize: 14 }}>Luxury Event Harpist</p>
        </div>

        {/* Contract */}
        <div style={{ background: '#faf8f4', borderRadius: 20, padding: 32, marginBottom: 24 }}>
          <pre style={{ fontFamily: 'Courier New, monospace', fontSize: 13, whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#0f0d0b' }}>
            {contractText(gig)}
          </pre>
        </div>

        {/* Signing box */}
        <div style={{ background: '#faf8f4', borderRadius: 20, padding: 32 }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, marginBottom: 8 }}>Sign this contract</h2>
          <p style={{ color: '#7a746e', fontSize: 14, marginBottom: 20 }}>
            By typing your full name below and clicking Sign, you agree to the terms of this performance agreement.
          </p>

          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3a3530', marginBottom: 6 }}>
            Full Name
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Type your full legal name"
            style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e8e0d4', borderRadius: 10, fontSize: 16, fontFamily: 'inherit', marginBottom: 16, boxSizing: 'border-box' }}
          />

          <div style={{ background: '#f2ede4', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#7a746e' }}>
            📍 Your IP address and timestamp will be recorded as part of this agreement.
          </div>

          <button
            onClick={sign}
            disabled={signing || !name.trim()}
            style={{ width: '100%', padding: '14px', background: '#0f0d0b', color: '#faf8f4', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: name.trim() ? 'pointer' : 'not-allowed', opacity: name.trim() ? 1 : 0.5 }}
          >
            {signing ? 'Signing…' : '✍️ Sign Contract'}
          </button>
        </div>

      </div>
    </div>
  )
}
