import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSend = async () => {
    if (!email.trim()) return setError('Enter your email!')
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    setLoading(false)
    if (err) return setError(err.message)
    setSent(true)
  }

  if (sent) return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', paddingTop: 80 }}>
      <div style={{ fontSize: 64 }}>📬</div>
      <h2 style={{ marginTop: 16, fontSize: 28 }}>Check your email!</h2>
      <p style={{ color: 'var(--text-muted)', fontWeight: 600, marginTop: 8, maxWidth: 280 }}>
        We sent a magic link to <strong>{email}</strong>. Click it to sign in.
      </p>
      <button style={{ marginTop: 32, background: 'none', border: 'none', color: 'var(--purple)', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
        onClick={() => setSent(false)}>
        ← Try a different email
      </button>
    </div>
  )

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
      <button onClick={() => navigate('/')}
        style={{ alignSelf: 'flex-start', background: 'none', border: 'none', fontSize: 24, marginBottom: 24, cursor: 'pointer', color: 'var(--text)' }}>
        ←
      </button>

      <div style={{ fontSize: 64, marginBottom: 8 }}>⚔️</div>
      <h1 style={{ fontSize: 36, color: 'var(--pink)', marginBottom: 8 }}>Sign in to Rival</h1>
      <p style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: 40, textAlign: 'center' }}>
        We'll email you a magic link — no password needed.
      </p>

      <div style={{ width: '100%', maxWidth: 320 }}>
        <label style={{ fontWeight: 700, fontSize: 15, display: 'block', marginBottom: 8 }}>Your email</label>
        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setError('') }}
          placeholder="you@example.com"
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          autoFocus
        />
        {error && <p style={{ color: 'var(--coral)', fontWeight: 700, marginTop: 8 }}>{error}</p>}
        <button className="btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={handleSend} disabled={loading}>
          {loading ? 'Sending...' : '✉️ Send magic link'}
        </button>
      </div>
    </div>
  )
}
