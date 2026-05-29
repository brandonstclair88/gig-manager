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
        if (error || !data) { setError('Contract not found.') }
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

    // Send email notification
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'signed',
          data: { ...gig, signed_by: name.trim() }
        })
      })
    } catch (e) { console.error('Notification failed', e) }

    setSigned(true)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#fdfaf7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#9a9189', fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontStyle: 'italic' }}>Loading contract…</p>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#fdfaf7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#a33030', fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontStyle: 'italic' }}>{error}</p>
    </div>
  )

  if (signed) return (
    <div style={{ minHeight: '100vh', background: '#fdfaf7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>✅</div>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 400, fontStyle: 'italic', marginBottom: 12, color: '#1a1714' }}>Contract Signed!</h1>
        <p style={{ color: '#9a9189', marginBottom: 8, fontSize: 15 }}>Thank you, <strong>{gig.signed_by}</strong>.</p>
        <p style={{ color: '#9a9189', fontSize: 14 }}>Signed on {fmtDate(gig.signed_at?.slice(0, 10))} for <strong>{gig.title}</strong>.</p>
        <p style={{ color: '#b0a89e', fontSize: 13, marginTop: 16, fontStyle: 'italic' }}>You can close this page.</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', width: '100%', background: '#fdfaf7', fontFamily: 'Jost, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#f2ebe3', borderBottom: '1px solid #ede5dc', padding: '48px 20px 36px', textAlign: 'center' }}>
        <p style={{ color: '#c9a097', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.2em', marginBottom: 12, fontWeight: 500 }}>Performance Agreement</p>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', color: '#1a1714', fontSize: 40, fontWeight: 400, fontStyle: 'italic', marginBottom: 8 }}>Paige Camryn Music</h1>
        <p style={{ color: '#9a9189', fontSize: 14, letterSpacing: '.08em' }}>Luxury Event Harpist</p>
        <div style={{ width: 40, height: 1, background: '#c9a097', margin: '20px auto 0' }} />
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 20px' }}>

        {/* Contract text */}
        <div style={{ background: 'white', borderRadius: 16, padding: 36, marginBottom: 24, border: '1px solid #ede5dc', boxShadow: '0 2px 20px rgba(26,23,20,.06)' }}>
          <p style={{ color: '#c9a097', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.16em', marginBottom: 16, fontWeight: 500 }}>Contract Details</p>
          <pre style={{ fontFamily: 'Courier New, monospace', fontSize: 12, whiteSpace: 'pre-wrap', lineHeight: 1.8, color: '#3d3733' }}>
            {contractText(gig)}
          </pre>
        </div>

        {/* Signing box */}
        <div style={{ background: 'white', borderRadius: 16, padding: 36, border: '1px solid #ede5dc', boxShadow: '0 2px 20px rgba(26,23,20,.06)' }}>
          <p style={{ color: '#c9a097', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.16em', marginBottom: 12, fontWeight: 500 }}>Sign Below</p>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 400, fontStyle: 'italic', marginBottom: 8, color: '#1a1714' }}>Sign this contract</h2>
          <p style={{ color: '#9a9189', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
            By typing your full name below and clicking Sign, you agree to the terms of this performance agreement.
          </p>

          <label style={{ display: 'block', fontSize: 10, fontWeight: 500, color: '#9a9189', marginBottom: 6, letterSpacing: '.1em', textTransform: 'uppercase' }}>
            Full Name
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Type your full legal name"
            style={{
              width: '100%', padding: '12px 14px',
              border: '1px solid #ede5dc', borderRadius: 8,
              fontSize: 16, fontFamily: 'Jost, sans-serif',
              marginBottom: 16, boxSizing: 'border-box',
              background: '#fdfaf7', color: '#1a1714', outline: 'none'
            }}
          />

          <div style={{ background: '#f5e6e2', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: '#b07870', border: '1px solid #e8c8c0' }}>
            📍 Your IP address and timestamp will be recorded as part of this agreement.
          </div>

          <button
            onClick={sign}
            disabled={signing || !name.trim()}
            style={{
              width: '100%', padding: '14px',
              background: name.trim() ? '#c9a097' : '#e8c8c0',
              color: 'white', border: 'none', borderRadius: 10,
              fontSize: 13, fontWeight: 500, letterSpacing: '.1em',
              textTransform: 'uppercase', fontFamily: 'Jost, sans-serif',
              cursor: name.trim() ? 'pointer' : 'not-allowed',
              transition: 'background .15s'
            }}
          >
            {signing ? 'Signing…' : '✍ Sign Contract'}
          </button>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 40, paddingTop: 28, borderTop: '1px solid #ede5dc' }}>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 15, color: '#9a9189' }}>Paige Camryn Music · Luxury Event Harpist</p>
        </div>

      </div>
    </div>
  )
}
