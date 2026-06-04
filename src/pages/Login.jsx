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
      <div style={{ fontSize: 48, marginBottom: 16 }}>📡</div>
      <h2 style={{ fontSize: 32, letterSpacing: 2, color: 'var(--cyan)' }}>LINK SENT</h2>
      <p style={{ color: 'var(--text-muted)', fontWeight: 500, marginTop: 12, maxWidth: 280, lineHeight: 1.6 }}>
        Magic link sent to <span style={{ color: 'var(--text)' }}>{email}</span>.<br />Check your inbox.
      </p>
      <button style={{ marginTop: 32, background: 'none', border: 'none', color: 'var(--cyan)', fontWeight: 600, fontSize: 13, cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase' }}
        onClick={() => setSent(false)}>
        ← Different email
      </button>
    </div>
  )

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
      <button onClick={() => navigate('/')}
        style={{ alignSelf: 'flex-start', background: 'none', border: 'none', fontSize: 20, marginBottom: 24, cursor: 'pointer', color: 'var(--text-muted)' }}>
        ←
      </button>

      <div style={{ fontSize: 48, marginBottom: 16 }}>⚔️</div>
      <h1 style={{ fontSize: 40, letterSpacing: 4, marginBottom: 6,
        background: 'linear-gradient(135deg, #00D4FF, #8B5CF6)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>RIVAL</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 40, textAlign: 'center', letterSpacing: 0.5 }}>
        Enter your email to receive a magic sign-in link.
      </p>

      <div style={{ width: '100%', maxWidth: 320 }}>
        <label style={{ fontWeight: 600, fontSize: 11, display: 'block', marginBottom: 8, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Email address</label>
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
          {loading ? 'SENDING...' : 'SEND MAGIC LINK'}
        </button>
      </div>
    </div>
  )
}
