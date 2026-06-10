import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, differenceInDays } from 'date-fns'
import { supabase, GOAL_OPTIONS, AVATARS } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import GoalPicker from '../components/GoalPicker'
import AvatarPicker from '../components/AvatarPicker'
import DateRangePicker from '../components/DateRangePicker'

const CUSTOM_COLORS = ['#BA7517', '#D4537E', '#1D9E75', '#534AB7', '#D85A30', '#185FA5']
const CUSTOM_EMOJIS = ['⭐', '🎯', '💡', '🔥', '🌟', '💪', '🎨', '🧩']

export default function Create() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[0])
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [goals, setGoals] = useState([])
  const [goalFrequencies, setGoalFrequencies] = useState({})
  const [customGoals, setCustomGoals] = useState([])
  const [customInput, setCustomInput] = useState('')
  const [customFreq, setCustomFreq] = useState(7)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const durationDays = startDate && endDate ? differenceInDays(endDate, startDate) : 0

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

  const removeCustomGoal = (id) => {
    setCustomGoals(prev => prev.filter(g => g.id !== id))
  }

  const updateCustomGoalFreq = (id, freq) => {
    setCustomGoals(prev => prev.map(g => g.id === id ? { ...g, timesPerWeek: freq } : g))
  }

  const handleCreate = async () => {
    if (!name.trim()) return setError('Enter your name!')
    if (!startDate || !endDate) return setError('Pick a start and end date!')
    if (durationDays < 1) return setError('End date must be after start date!')
    const totalGoals = goals.length + customGoals.length
    if (totalGoals === 0) return setError('Pick at least one goal!')
    setLoading(true)
    setError('')

    try {
      // fixed-length 6-char code (no ambiguous 0/O/1/I), retry on rare collision
      const genCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        let c = ''
        for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)]
        return c
      }

      let challenge = null
      for (let attempt = 0; attempt < 5 && !challenge; attempt++) {
        const { data, error: cErr } = await supabase
          .from('challenges')
          .insert({
            invite_code: genCode(),
            duration_days: durationDays,
            start_date: format(startDate, 'yyyy-MM-dd'),
            end_date: format(endDate, 'yyyy-MM-dd'),
            status: 'pending',
          })
          .select()
          .single()
        if (!cErr) { challenge = data; break }
        // 23505 = unique_violation (code collision) → retry; else bail
        if (cErr.code !== '23505') throw cErr
      }
      if (!challenge) throw new Error('Could not generate a unique invite code, please try again.')

      const goalList = [
        ...goals.map(id => {
          const g = GOAL_OPTIONS.find(o => o.id === id)
          return { challenge_id: challenge.id, label: g.label, emoji: g.emoji, color: g.color, player_slot: 1, times_per_week: goalFrequencies[id] || 7 }
        }),
        ...customGoals.map(g => ({
          challenge_id: challenge.id, label: g.label, emoji: g.emoji, color: g.color, player_slot: 1, times_per_week: g.timesPerWeek || 7
        })),
      ]

      const { data: savedGoals, error: gErr } = await supabase
        .from('goals').insert(goalList).select()
      if (gErr) throw gErr

      const { error: pErr } = await supabase.from('players').insert({
        challenge_id: challenge.id,
        display_name: name.trim(),
        avatar_emoji: avatar,
        slot: 1,
        goal_ids: savedGoals.map(g => g.id),
        user_id: user.id,
      })
      if (pErr) throw pErr

      localStorage.setItem(`rival_player_${challenge.id}`, JSON.stringify({ slot: 1, name: name.trim(), avatar }))
      navigate(`/challenge/${challenge.id}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text-muted)', fontWeight: 700 }}>Loading...</p>
    </div>
  )

  if (!user) return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', paddingTop: 60 }}>
      <div className="animate-float" style={{ fontSize: 56, marginBottom: 14, filter: 'drop-shadow(0 8px 24px rgba(40,20,80,0.4))' }}>⚔️</div>
      <h1 style={{ color: 'var(--white)', fontSize: 32, marginBottom: 8 }}>Sign in to create</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 32, maxWidth: 300, lineHeight: 1.5 }}>
        Create an account so your challenge is saved to your profile and you can track it from any device.
      </p>
      <button className="btn-primary" style={{ width: '100%', maxWidth: 320 }}
        onClick={() => navigate('/login?redirect=/create')}>
        Sign in to continue
      </button>
    </div>
  )

  return (
    <div className="page">
      <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/')}
        style={{ background: 'none', border: 'none', fontSize: 24, marginBottom: 16, cursor: 'pointer', color: 'var(--text)' }}>
        ←
      </button>

      <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{
            flex: 1, height: 5, borderRadius: 99,
            background: s <= step ? 'var(--pink)' : 'var(--border)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>

      {step === 1 && (
        <div className="animate-slide-up">
          <h2 style={{ fontSize: 30, marginBottom: 6 }}>Who are you? 🐉</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontWeight: 600 }}>Choose your fighter</p>

          <AvatarPicker value={avatar} onChange={setAvatar} />

          <div style={{ marginTop: 20 }}>
            <label style={{ fontWeight: 700, fontSize: 15, display: 'block', marginBottom: 8 }}>Your name</label>
            <input value={name} onChange={e => { setName(e.target.value); setError('') }}
              placeholder="Enter your name..." maxLength={20}
              onKeyDown={e => e.key === 'Enter' && name.trim() && setStep(2)} />
          </div>

          <div style={{ marginTop: 24 }}>
            <label style={{ fontWeight: 700, fontSize: 15, display: 'block', marginBottom: 12 }}>Challenge dates 📅</label>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={({ start, end }) => { setStartDate(start); setEndDate(end); setError('') }}
            />
          </div>

          <button className="btn-primary" style={{ width: '100%', marginTop: 28 }}
            onClick={() => {
              if (!name.trim()) return setError('Enter your name!')
              if (!startDate || !endDate) return setError('Pick a start and end date!')
              setError('')
              setStep(2)
            }}>
            Next →
          </button>
          {error && <p style={{ color: 'var(--coral)', marginTop: 8, fontWeight: 700, textAlign: 'center' }}>{error}</p>}
        </div>
      )}

      {step === 2 && (
        <div className="animate-slide-up">
          <h2 style={{ fontSize: 30, marginBottom: 6 }}>Your daily goals 🎯</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontWeight: 600 }}>What will you commit to each day?</p>

          <GoalPicker
            selected={goals}
            onToggle={(id) => { toggleGoal(id); setError('') }}
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

          <button className="btn-primary" style={{ width: '100%', marginTop: 28 }}
            onClick={() => {
              if (goals.length + customGoals.length === 0) return setError('Pick or add at least one goal!')
              setError('')
              setStep(3)
            }}>
            Next →
          </button>
          {error && <p style={{ color: 'var(--coral)', marginTop: 8, fontWeight: 700, textAlign: 'center' }}>{error}</p>}
        </div>
      )}

      {step === 3 && (
        <div className="animate-slide-up">
          <h2 style={{ fontSize: 30, marginBottom: 6 }}>Ready to rumble? ⚔️</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontWeight: 600 }}>Review your challenge setup</p>

          <div className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 44 }}>{avatar}</div>
            <div>
              <p style={{ fontWeight: 800, fontSize: 18 }}>{name}</p>
              <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{durationDays}-day challenge</p>
              <p style={{ color: 'var(--purple)', fontWeight: 700, fontSize: 13 }}>
                {format(startDate, 'MMM d')} → {format(endDate, 'MMM d, yyyy')}
              </p>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <p style={{ fontWeight: 700, marginBottom: 12, color: 'var(--text-muted)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>
              Daily goals ({goals.length + customGoals.length})
            </p>
            {goals.map(id => {
              const g = GOAL_OPTIONS.find(o => o.id === id)
              return (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>{g.emoji}</span>
                  <span style={{ fontWeight: 700 }}>{g.label}</span>
                </div>
              )
            })}
            {customGoals.map(g => (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>{g.emoji}</span>
                <span style={{ fontWeight: 700 }}>{g.label}</span>
              </div>
            ))}
          </div>

          {error && (
            <div style={{
              background: '#FFF0F0', border: '2px solid var(--coral)',
              borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: 16,
            }}>
              <p style={{ color: '#993C1D', fontWeight: 700, fontSize: 14 }}>⚠️ {error}</p>
              {(error.toLowerCase().includes('fetch') || error.toLowerCase().includes('network') || error.toLowerCase().includes('failed')) && (
                <p style={{ color: '#993C1D', fontSize: 13, marginTop: 6, fontWeight: 600, lineHeight: 1.5 }}>
                  Supabase connection failed. Check that VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in Netlify → Site settings → Environment variables, then trigger a redeploy.
                </p>
              )}
            </div>
          )}

          <button className="btn-primary" style={{ width: '100%' }} onClick={handleCreate} disabled={loading}>
            {loading ? '⏳ Creating...' : '⚡ Launch challenge!'}
          </button>
        </div>
      )}
    </div>
  )
}
