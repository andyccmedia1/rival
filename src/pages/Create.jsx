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
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[0])
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [goals, setGoals] = useState([])
  const [customGoals, setCustomGoals] = useState([])
  const [customInput, setCustomInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const durationDays = startDate && endDate ? differenceInDays(endDate, startDate) : 0

  const toggleGoal = (id) => {
    setGoals(g => g.includes(id) ? g.filter(x => x !== id) : [...g, id])
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
    }])
    setCustomInput('')
    setError('')
  }

  const removeCustomGoal = (id) => {
    setCustomGoals(prev => prev.filter(g => g.id !== id))
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
      const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase()

      const { data: challenge, error: cErr } = await supabase
        .from('challenges')
        .insert({
          invite_code: inviteCode,
          duration_days: durationDays,
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
          status: 'pending',
        })
        .select()
        .single()

      if (cErr) throw cErr

      const goalList = [
        ...goals.map(id => {
          const g = GOAL_OPTIONS.find(o => o.id === id)
          return { challenge_id: challenge.id, label: g.label, emoji: g.emoji, color: g.color, player_slot: 1 }
        }),
        ...customGoals.map(g => ({
          challenge_id: challenge.id, label: g.label, emoji: g.emoji, color: g.color, player_slot: 1
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
        ...(user ? { user_id: user.id } : {}),
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

          <GoalPicker selected={goals} onToggle={(id) => { toggleGoal(id); setError('') }} />

          <div style={{ marginTop: 20 }}>
            <label style={{ fontWeight: 700, fontSize: 15, display: 'block', marginBottom: 10 }}>
              Add custom goals
              <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: 13, marginLeft: 8 }}>({customGoals.length}/8)</span>
            </label>

            {customGoals.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                {customGoals.map(g => (
                  <div key={g.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: g.color + '14', border: `2px solid ${g.color}`,
                    borderRadius: 'var(--radius-sm)', padding: '10px 12px',
                  }}>
                    <span style={{ fontSize: 20 }}>{g.emoji}</span>
                    <span style={{ fontWeight: 700, flex: 1, color: g.color }}>{g.label}</span>
                    <button onClick={() => removeCustomGoal(g.id)} style={{
                      background: 'none', border: 'none', fontSize: 20,
                      color: 'var(--text-muted)', padding: '0 4px', lineHeight: 1, cursor: 'pointer',
                    }}>×</button>
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
                background: 'var(--navy)', color: 'white',
                borderRadius: 'var(--radius-sm)', padding: '10px 18px',
                fontWeight: 900, fontSize: 22, flexShrink: 0, lineHeight: 1,
              }}>+</button>
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
