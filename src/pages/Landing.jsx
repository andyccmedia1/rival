import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { format, parseISO } from 'date-fns'

export default function Landing() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [challenges, setChallenges] = useState([])
  const [loadingChallenges, setLoadingChallenges] = useState(false)

  useEffect(() => {
    if (!user) return
    setLoadingChallenges(true)
    supabase
      .from('players')
      .select('*, challenges(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setChallenges(data || [])
        setLoadingChallenges(false)
      })
  }, [user])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (loading) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text-muted)', fontWeight: 700 }}>Loading...</p>
    </div>
  )

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 60 }}>

      <div className="animate-float" style={{ fontSize: 64, marginBottom: 12, lineHeight: 1 }}>⚔️</div>
      <h1 style={{
        fontSize: 56, marginBottom: 8, letterSpacing: 4,
        background: 'linear-gradient(135deg, #00D4FF, #8B5CF6)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>RIVAL</h1>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 36, letterSpacing: 2, textTransform: 'uppercase' }}>
        Challenge your partner. Stay the course. Win glory.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320 }}>
        <button className="btn-primary" style={{ fontSize: 18 }} onClick={() => navigate('/create')}>
          ✨ Create a challenge
        </button>

        {!user ? (
          <button onClick={() => navigate('/login')} style={{
            background: 'transparent', border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-sm)', padding: '12px 20px',
            fontWeight: 600, fontSize: 14, cursor: 'pointer', color: 'var(--text-dim)',
            letterSpacing: 0.3,
          }}>
            Sign in to track your challenges
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: 0.5 }}>
              {user.email}
            </p>
            <button onClick={handleSignOut} style={{
              background: 'none', border: 'none', color: 'var(--red)',
              fontWeight: 600, fontSize: 12, cursor: 'pointer', letterSpacing: 0.3,
            }}>SIGN OUT</button>
          </div>
        )}

        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          Got an invite? Your partner's link will bring you right in.
        </p>
      </div>

      {user && (
        <div style={{ width: '100%', marginTop: 40, textAlign: 'left' }}>
          <h2 style={{ fontSize: 18, marginBottom: 16, letterSpacing: 2, color: 'var(--cyan)', textTransform: 'uppercase' }}>My Challenges</h2>
          {loadingChallenges ? (
            <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Loading...</p>
          ) : challenges.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 24 }}>
              <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>No challenges yet. Create one!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {challenges.map(p => {
                const c = p.challenges
                if (!c) return null
                const statusColor = c.status === 'active' ? 'var(--green)' : c.status === 'complete' ? 'var(--purple)' : 'var(--text-muted)'
                const statusLabel = c.status === 'active' ? 'ACTIVE' : c.status === 'complete' ? 'COMPLETE' : 'WAITING'
                return (
                  <div key={p.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => navigate(`/challenge/${c.id}`)}>
                      <p style={{ fontWeight: 800, fontSize: 16 }}>{p.avatar_emoji} {p.display_name}</p>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>
                        {c.duration_days} days · {format(parseISO(c.start_date), 'MMM d')} → {format(parseISO(c.end_date), 'MMM d')}
                      </p>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: statusColor, flexShrink: 0 }}>{statusLabel}</span>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (!confirm('Delete this challenge? This cannot be undone.')) return
                        await supabase.from('check_ins').delete().in('player_id', [p.id])
                        await supabase.from('goals').delete().eq('challenge_id', c.id)
                        await supabase.from('players').delete().eq('challenge_id', c.id)
                        await supabase.from('challenges').delete().eq('id', c.id)
                        setChallenges(prev => prev.filter(x => x.id !== p.id))
                      }}
                      style={{
                        background: 'none', border: 'none', fontSize: 18,
                        cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0,
                        padding: '4px 6px', lineHeight: 1,
                      }}
                      title="Delete challenge"
                    >🗑️</button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, width: '100%' }}>
        {[
          { icon: '⚡', label: 'Set goals' },
          { icon: '◈', label: 'Daily check-ins' },
          { icon: '◉', label: 'Winner revealed' },
        ].map(({ icon, label }) => (
          <div key={label} className="card" style={{ textAlign: 'center', padding: '16px 8px' }}>
            <div style={{ fontSize: 22, marginBottom: 6, color: 'var(--cyan)' }}>{icon}</div>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase' }}>{label}</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32, display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
        {['Read', 'Exercise', 'Hydrate', 'Meditate', 'Sleep', 'Eat clean'].map(g => (
          <span key={g} style={{
            background: 'var(--cyan-dim)',
            color: 'var(--cyan)',
            border: '1px solid rgba(0,212,255,0.2)',
            padding: '4px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 0.8,
            textTransform: 'uppercase',
          }}>{g}</span>
        ))}
      </div>

    </div>
  )
}
