import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const rawRedirect = searchParams.get('redirect') || '/'
  // only allow internal paths (block //evil.com and absolute URLs)
  const redirect = /^\/(?!\/)/.test(rawRedirect) ? rawRedirect : '/'
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!email.trim()) return setError('Enter your email!')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    setLoading(true)
    setError('')

    const fn = mode === 'signup'
      ? supabase.auth.signUp({ email: email.trim(), password })
      : supabase.auth.signInWithPassword({ email: email.trim(), password })

    const { data, error: err } = await fn
    setLoading(false)

    if (err) return setError(err.message)

    // If sign-up requires email confirmation, there's no session yet.
    if (mode === 'signup' && !data.session) {
      return setError('Account created! Please confirm your email, then sign in.')
    }

    navigate(redirect)
  }

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
      <button onClick={() => navigate('/')}
        style={{ alignSelf: 'flex-start', background: 'none', border: 'none', fontSize: 24, marginBottom: 24, cursor: 'pointer', color: 'var(--white)' }}>
        ←
      </button>

      <div className="animate-float" style={{ fontSize: 56, marginBottom: 14, filter: 'drop-shadow(0 8px 24px rgba(40,20,80,0.4))' }}>⚔️</div>
      <h1 style={{ fontSize: 44, marginBottom: 8, fontWeight: 800, color: 'var(--white)', textShadow: '0 4px 24px rgba(40,20,80,0.35)' }}>Rival</h1>
      <p style={{ color: 'var(--text-soft)', fontSize: 15, marginBottom: 28, textAlign: 'center' }}>
        {mode === 'signup' ? 'Create an account to track your challenges.' : 'Welcome back, warrior.'}
      </p>

      <div className="card" style={{ width: '100%', maxWidth: 340, padding: 24 }}>
        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 'var(--radius-pill)', padding: 4, marginBottom: 20 }}>
          {[['signin', 'Sign in'], ['signup', 'Create account']].map(([m, label]) => (
            <button key={m} onClick={() => { setMode(m); setError('') }} style={{
              flex: 1, padding: '9px 12px', borderRadius: 'var(--radius-pill)',
              background: mode === m ? 'var(--white)' : 'transparent',
              color: mode === m ? '#7B4FB0' : 'var(--text-soft)',
              fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
            }}>{label}</button>
          ))}
        </div>

        <label style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 8, color: 'var(--text-soft)' }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setError('') }}
          placeholder="you@example.com"
          autoFocus
        />

        <label style={{ fontWeight: 600, fontSize: 14, display: 'block', margin: '14px 0 8px', color: 'var(--text-soft)' }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={e => { setPassword(e.target.value); setError('') }}
          placeholder="••••••••"
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />

        {error && <p style={{ color: 'var(--red)', fontWeight: 600, marginTop: 10, fontSize: 13 }}>{error}</p>}

        <button className="btn-primary" style={{ width: '100%', marginTop: 18 }} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Please wait...' : mode === 'signup' ? '✨ Create account' : '⚔️ Sign in'}
        </button>
      </div>
    </div>
  )
}
