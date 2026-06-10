import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { computeScore, goalsForPlayer } from '../lib/scoring'
import Confetti from '../components/Confetti'

export default function Results() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const local = JSON.parse(localStorage.getItem(`rival_player_${id}`) || 'null')

  useEffect(() => {
    const load = async () => {
      const { data: c } = await supabase.from('challenges').select('*').eq('id', id).single()
      if (!c) { navigate('/'); return }
      const { data: ps } = await supabase.from('players').select('*').eq('challenge_id', id)
      const { data: allCI } = await supabase.from('check_ins').select('*')
        .in('player_id', (ps || []).map(p => p.id))
      const { data: goals } = await supabase.from('goals').select('*').eq('challenge_id', id)

      const scores = (ps || []).map(p => {
        const pGoals = goalsForPlayer(p, goals || [])
        const { earned, total, pct } = computeScore(p, pGoals, allCI || [], c)
        return { ...p, checkIns: earned, totalPossible: total, pct, goals: pGoals }
      })

      scores.sort((a, b) => b.pct - a.pct)
      const tied = scores.length === 2 && scores[0].pct === scores[1].pct

      setData({ challenge: c, scores, tied })
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text-muted)', fontWeight: 700 }}>Tallying results...</p>
    </div>
  )

  const { challenge, scores, tied } = data
  const winner = scores[0]
  const loser = scores[1]
  const iWon = winner?.slot === local?.slot
  const iLost = loser?.slot === local?.slot && !tied

  return (
    <div className="page" style={{ textAlign: 'center' }}>
      {iWon && <Confetti />}

      <div style={{ fontSize: 72, marginBottom: 8, lineHeight: 1 }}>
        {tied ? '🤝' : iWon ? '🏆' : '😤'}
      </div>

      <h1 style={{ fontSize: 40, color: 'var(--pink)', marginBottom: 8 }}>
        {tied ? "It's a tie!" : iWon ? 'You won!' : `${winner?.display_name} won!`}
      </h1>

      <p style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: 40, fontSize: 16 }}>
        {tied ? 'Both warriors stayed the course equally! 🔥' :
         iWon ? 'You crushed it! Absolute legend! 🔥' :
         'Better luck next time, warrior! 💪'}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
        {scores.map((p, i) => (
          <div key={p.id} className="card" style={{
            border: i === 0 && !tied ? '2px solid var(--yellow)' : undefined,
            background: i === 0 && !tied ? 'var(--yellow-light)' : undefined,
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            {i === 0 && !tied && <span style={{ fontSize: 24 }}>🥇</span>}
            {i === 1 && <span style={{ fontSize: 24 }}>🥈</span>}
            {tied && <span style={{ fontSize: 24 }}>🤝</span>}
            <span style={{ fontSize: 32 }}>{p.avatar_emoji}</span>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <p style={{ fontWeight: 800, fontSize: 17 }}>{p.display_name}</p>
              <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: 14 }}>
                {p.checkIns} check-ins / {p.totalPossible} possible
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontWeight: 900, fontSize: 28, color: i === 0 ? 'var(--purple)' : 'var(--text-muted)' }}>
                {p.pct}%
              </p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="btn-primary" onClick={() => navigate('/create')}>
          ⚔️ New challenge
        </button>
        <button className="btn-secondary" onClick={() => navigate('/')}>
          Go home
        </button>
      </div>
    </div>
  )
}
