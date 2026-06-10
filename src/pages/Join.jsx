import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase, GOAL_OPTIONS, AVATARS } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import GoalPicker from '../components/GoalPicker'
import AvatarPicker from '../components/AvatarPicker'

const CUSTOM_COLORS = ['#BA7517', '#D4537E', '#1D9E75', '#534AB7', '#D85A30', '#185FA5']
const CUSTOM_EMOJIS = ['⭐', '🎯', '💡', '🔥', '🌟', '💪', '🎨', '🧩']

export default function Join() {
  const { inviteCode } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [challenge, setChallenge] = useState(null)
  const [challenger, setChallenger] = useState(null)
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[3])
  const [goals, setGoals] = useState([])
  const [goalFrequencies, setGoalFrequencies] = useState({})
  const [customGoals, setCustomGoals] = useState([])
  const [customInput, setCustomInput] = useState('')
  const [customFreq, setCustomFreq] = useState(7)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: c } = await supabase
        .from('challenges')
        .select('*')
        .eq('invite_code', inviteCode)
        .single()

      if (!c) { setError('Challenge not found!'); setLoading(false); return }

      const { data: players } = await supabase
        .from('players')
        .select('*')
        .eq('challenge_id', c.id)

      if (players?.length >= 2) { setError('This challenge is already full!'); setLoading(false); return }

      const existing = localStorage.getItem(`rival_player_${c.id}`)
      if (existing) { navigate(`/challenge/${c.id}`); return }

      if (user) {
        const { data: myPlayer } = await supabase
          .from('players')
          .select('*')
          .eq('challenge_id', c.id)
          .eq('user_id', user.id)
          .maybeSingle()
        if (myPlayer) { navigate(`/challenge/${c.id}`); return }
      }

      setChallenge(c)
      setChallenger(players?.[0] || null)
      setLoading(false)
    }
    load()
  }, [inviteCode, user])

  const toggleGoal = (id) => {
    setGoals(g => g.includes(id) ? g.filter(x => x !== id) : [...g, id])
    setGoalFrequencies(f => ({ ...f, [id]: f[id] || 7 }))
  }

  const handleFrequencyChange = (id, val) => {
    setGoalFrequencies(f => ({ ...f, [id]: val }))
  }

  const addCustomGoal = () => {
    const val = customInput.trim()
    if (!val) return
    if (customGoals.length >= 8) { setError('Max 8 custom goals!'); return }
    const idx = customGoals.length
    setCustomGoals(prev => [...prev, {
      id: `custom-${Date.now()}`,
      label: val,
      emoji: CUSTOM_EMOJIS[idx % CUSTOM_EMOJIS.length],
      color: CUSTOM_COLORS[idx % CUSTOM_COLORS.length],
      timesPerWeek: customFreq,
    }])
    setCustomInput('')
    setCustomFreq(7)
    setError('')
  }

  const removeCustomGoal = (cid) => setCustomGoals(prev => prev.filter(g => g.id !== cid))
  const updateCustomGoalFreq = (cid, freq) =>
    setCustomGoals(prev => prev.map(g => g.id === cid ? { ...g, timesPerWeek: freq } : g))

  const handleJoin = async () => {
    if (!name.trim()) return setError('Enter your name!')
    if (goals.length + customGoals.length === 0) return setError('Pick at least one goal!')
    setSaving(true)
    setError('')

    try {
      const goalList = [
        ...goals.map(id => {
          const g = GOAL_OPTIONS.find(o => o.id === id)
          return { challenge_id: challenge.id, label: g.label, emoji: g.emoji, color: g.color, player_slot: 2, times_per_week: goalFrequencies[id] || 7 }
        }),
        ...customGoals.map(g => ({
          challenge_id: challenge.id, label: g.label, emoji: g.emoji, color: g.color, player_slot: 2, times_per_week: g.timesPerWeek || 7
        })),
      ]

      const { data: savedGoals, error: gErr } = await supabase
        .from('goals').insert(goalList).select()
      if (gErr) throw gErr

      const { error: pErr } = await supabase.from('players').insert({
        challenge_id: challenge.id,
        display_name: name.trim(),
        avatar_emoji: avatar,
        slot: 2,
        goal_ids: savedGoals.map(g => g.id),
        user_id: user.id,
      })
      // unique(challenge_id, slot) → someone else grabbed slot 2 first
      if (pErr) {
        if (pErr.code === '23505') throw new Error('Someone just joined this challenge — it\'s now full!')
        throw pErr
      }

      const { error: uErr } = await supabase.from('challenges')
        .update({ status: 'active' }).eq('id', challenge.id).eq('status', 'pending')
      if (uErr) throw uErr

      localStorage.setItem(`rival_player_${challenge.id}`, JSON.stringify({ slot: 2, name: name.trim(), avatar }))
      navigate(`/challenge/${challenge.id}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading || authLoading) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text-muted)', fontWeight: 700 }}>Loading challenge...</p>
    </div>
  )

  if (error && !challenge) return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ fontSize: 60 }}>😢</div>
      <h2 style={{ marginTop: 16 }}>{error}</h2>
      <button className="btn-primary" style={{ marginTop: 24 }} onClick={() => navigate('/')}>Go home</button>
    </div>
  )

  if (!user) return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', paddingTop: 60 }}>
      <div className="animate-float" style={{ fontSize: 56, marginBottom: 14, filter: 'drop-shadow(0 8px 24px rgba(40,20,80,0.4))' }}>⚔️</div>
      <h1 style={{ color: 'var(--white)', fontSize: 34, marginBottom: 8 }}>You've been challenged!</h1>
      {challenger && (
        <p style={{ color: 'var(--text-soft)', fontWeight: 500, marginBottom: 4, fontSize: 16 }}>
          {challenger.avatar_emoji} <strong>{challenger.display_name}</strong> wants a {challenge.duration_days}-day battle
        </p>
      )}
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 32, maxWidth: 300, lineHeight: 1.5 }}>
        Sign in to accept — so you can track this challenge from any device, anytime.
      </p>
      <button className="btn-primary" style={{ width: '100%', maxWidth: 320 }}
        onClick={() => navigate(`/login?redirect=/join/${inviteCode}`)}>
        Sign in to accept
      </button>
    </div>
  )

  return (
    <div className="page">
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 48 }}>⚔️</div>
        <h1 style={{ color: 'var(--pink)', fontSize: 36 }}>You've been challenged!</h1>
        {challenger && (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 28 }}>{challenger.avatar_emoji}</span>
            <span style={{ fontWeight: 800, fontSize: 18 }}>{challenger.display_name}</span>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>wants a {challenge.duration_days}-day battle</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
        {[1, 2].map(s => (
          <div key={s} style={{
            flex: 1, height: 5, borderRadius: 99,
            background: s <= step ? 'var(--pink)' : 'var(--border)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>

      {step === 1 && (
        <div className="animate-slide-up">
          <h2 style={{ fontSize: 28, marginBottom: 6 }}>Choose your fighter 🦁</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontWeight: 600 }}>Who are you?</p>

          <AvatarPicker value={avatar} onChange={setAvatar} />

          <div style={{ marginTop: 20 }}>
            <label style={{ fontWeight: 700, fontSize: 15, display: 'block', marginBottom: 8 }}>Your name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="Enter your name..." maxLength={20} />
          </div>

          <button className="btn-primary" style={{ width: '100%', marginTop: 32 }}
            onClick={() => name.trim() ? setStep(2) : setError('Enter your name!')}>
            Next →
          </button>
          {error && <p style={{ color: 'var(--coral)', marginTop: 8, fontWeight: 700, textAlign: 'center' }}>{error}</p>}
        </div>
      )}

      {step === 2 && (
        <div className="animate-slide-up">
          <h2 style={{ fontSize: 28, marginBottom: 6 }}>Your daily goals 🎯</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontWeight: 600 }}>Pick what you'll commit to</p>

          <GoalPicker
            selected={goals}
            onToggle={toggleGoal}
            frequencies={goalFrequencies}
            onFrequencyChange={handleFrequencyChange}
          />

          <div style={{ marginTop: 20 }}>
            <label style={{ fontWeight: 700, fontSize: 15, display: 'block', marginBottom: 10 }}>
              Add custom goals
              <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: 13, marginLeft: 8 }}>({customGoals.length}/8)</span>
            </label>

            {customGoals.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                {customGoals.map(g => (
                  <div key={g.id} style={{
                    background: 'rgba(255,255,255,0.12)', border: '1px solid var(--glass-border-strong)',
                    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                    borderRadius: 'var(--radius-sm)', padding: '10px 12px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 20 }}>{g.emoji}</span>
                      <span style={{ fontWeight: 600, flex: 1, color: 'var(--white)' }}>{g.label}</span>
                      <button onClick={() => removeCustomGoal(g.id)} style={{
                        background: 'none', border: 'none', fontSize: 20,
                        color: 'var(--text-soft)', padding: '0 4px', lineHeight: 1, cursor: 'pointer',
                      }}>×</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-soft)' }}>days/week:</span>
                      {[1,2,3,4,5,6,7].map(n => (
                        <button key={n} onClick={() => updateCustomGoalFreq(g.id, n)} style={{
                          width: 26, height: 26, borderRadius: '50%',
                          border: `1px solid ${n === (g.timesPerWeek || 7) ? 'var(--white)' : 'var(--glass-border)'}`,
                          background: n === (g.timesPerWeek || 7) ? 'var(--white)' : 'rgba(255,255,255,0.08)',
                          color: n === (g.timesPerWeek || 7) ? '#7B4FB0' : 'var(--white)',
                          fontWeight: 700, fontSize: 11, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>{n}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={customInput}
                onChange={e => { setCustomInput(e.target.value); setError('') }}
                placeholder="e.g. No social media, Walk 10k steps..."
                maxLength={40}
                onKeyDown={e => e.key === 'Enter' && addCustomGoal()}
              />
              <button onClick={addCustomGoal} style={{
                background: 'var(--white)', color: '#7B4FB0',
                borderRadius: 'var(--radius-sm)', padding: '10px 18px',
                fontWeight: 900, fontSize: 22, flexShrink: 0, lineHeight: 1,
              }}>+</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-soft)' }}>days/week:</span>
              {[1,2,3,4,5,6,7].map(n => (
                <button key={n} onClick={() => setCustomFreq(n)} style={{
                  width: 28, height: 28, borderRadius: '50%',
                  border: `1px solid ${n === customFreq ? 'var(--white)' : 'var(--glass-border)'}`,
                  background: n === customFreq ? 'var(--white)' : 'rgba(255,255,255,0.08)',
                  color: n === customFreq ? '#7B4FB0' : 'var(--white)',
                  fontWeight: 700, fontSize: 12, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {n}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, fontWeight: 600 }}>
              Press Enter or + to add each goal
            </p>
          </div>

          {error && <p style={{ color: 'var(--coral)', marginBottom: 12, fontWeight: 700, textAlign: 'center' }}>{error}</p>}

          <button className="btn-primary" style={{ width: '100%', marginTop: 32 }} onClick={handleJoin} disabled={saving}>
            {saving ? 'Joining...' : '⚡ Accept challenge!'}
          </button>
        </div>
      )}
    </div>
  )
}
