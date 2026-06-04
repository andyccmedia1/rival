import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'
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
      options: { emailRedirectTo: `${window.location.origin}${redirect}` },
    })
    setLoading(false)
    if (err) return setError(err.message)
    setSent(true)
  }

  if (sent) return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', paddingTop: 80 }}>
      <div className="card animate-slide-up" style={{ padding: 36, maxWidth: 340 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>📬</div>
        <h2 style={{ fontSize: 28, color: 'var(--white)' }}>Check your email</h2>
        <p style={{ color: 'var(--text-soft)', fontWeight: 500, marginTop: 12, lineHeight: 1.6 }}>
          Magic link sent to <span style={{ color: 'var(--white)', fontWeight: 600 }}>{email}</span>. Tap it to sign in.
        </p>
        <button style={{ marginTop: 28, background: 'none', border: 'none', color: 'var(--text-soft)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
          onClick={() => setSent(false)}>
          ← Try a different email
        </button>
      </div>
    </div>
  )

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
      <button onClick={() => navigate('/')}
        style={{ alignSelf: 'flex-start', background: 'none', border: 'none', fontSize: 24, marginBottom: 24, cursor: 'pointer', color: 'var(--white)' }}>
        ←
      </button>

      <div className="animate-float" style={{ fontSize: 56, marginBottom: 14, filter: 'drop-shadow(0 8px 24px rgba(40,20,80,0.4))' }}>⚔️</div>
      <h1 style={{ fontSize: 44, marginBottom: 8, fontWeight: 800, color: 'var(--white)', textShadow: '0 4px 24px rgba(40,20,80,0.35)' }}>Rival</h1>
      <p style={{ color: 'var(--text-soft)', fontSize: 15, marginBottom: 36, textAlign: 'center' }}>
        We'll email you a magic link — no password needed.
      </p>

      <div className="card" style={{ width: '100%', maxWidth: 340, padding: 24 }}>
        <label style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 8, color: 'var(--text-soft)' }}>Your email</label>
        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setError('') }}
          placeholder="you@example.com"
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          autoFocus
        />
        {error && <p style={{ color: 'var(--red)', fontWeight: 600, marginTop: 8, fontSize: 13 }}>{error}</p>}
        <button className="btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={handleSend} disabled={loading}>
          {loading ? 'Sending...' : '✉️ Send magic link'}
        </button>
      </div>
    </div>
  )
}
