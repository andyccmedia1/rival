import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { format, differenceInDays, parseISO, startOfWeek, endOfWeek } from 'date-fns'
import CheckInCard from '../components/CheckInCard'
import Scoreboard from '../components/Scoreboard'
import InviteBanner from '../components/InviteBanner'

export default function Dashboard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [challenge, setChallenge] = useState(null)
  const [players, setPlayers] = useState([])
  const [myGoals, setMyGoals] = useState([])
  const [checkIns, setCheckIns] = useState([])
  const [allCheckIns, setAllCheckIns] = useState([])
  const [myPlayer, setMyPlayer] = useState(null)
  const [allGoals, setAllGoals] = useState([])
  const [loading, setLoading] = useState(true)

  const local = JSON.parse(localStorage.getItem(`rival_player_${id}`) || 'null')

  const load = useCallback(async () => {
    const { data: c } = await supabase.from('challenges').select('*').eq('id', id).single()
    if (!c) { navigate('/'); return }
    setChallenge(c)

    const { data: ps } = await supabase.from('players').select('*').eq('challenge_id', id)
    setPlayers(ps || [])

    const me = ps?.find(p => (user && p.user_id === user.id) || p.slot === local?.slot)
    setMyPlayer(me || null)

    const { data: allGoalsData } = await supabase.from('goals').select('*').eq('challenge_id', id)
    setAllGoals(allGoalsData || [])

    if (me) {
      const goals = (allGoalsData || []).filter(g => (me.goal_ids || []).includes(g.id))
      setMyGoals(goals)

      const today = format(new Date(), 'yyyy-MM-dd')
      const { data: ci } = await supabase.from('check_ins')
        .select('*').eq('player_id', me.id).eq('date', today)
      setCheckIns(ci || [])
    }

    const { data: allCI } = await supabase.from('check_ins').select('*')
      .in('player_id', (ps || []).map(p => p.id))
    setAllCheckIns(allCI || [])

    if (c.status === 'complete') navigate(`/challenge/${id}/results`)
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const channel = supabase.channel(`challenge-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'check_ins' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, load)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [id, load])

  const handleCheckIn = async (goalId) => {
    if (!myPlayer) return
    const today = format(new Date(), 'yyyy-MM-dd')
    const already = checkIns.find(ci => ci.goal_id === goalId)
    if (already) {
      await supabase.from('check_ins').delete().eq('id', already.id)
    } else {
      await supabase.from('check_ins').insert({
        player_id: myPlayer.id,
        goal_id: goalId,
        date: today,
        completed_at: new Date().toISOString(),
      })
    }
    load()
  }

  const checkEndCondition = async () => {
    if (!challenge) return
    const end = parseISO(challenge.end_date)
    if (new Date() > end) {
      await supabase.from('challenges').update({ status: 'complete' }).eq('id', id)
      navigate(`/challenge/${id}/results`)
    }
  }

  useEffect(() => { checkEndCondition() }, [challenge])

  if (loading) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 18 }}>Loading battle...</p>
    </div>
  )

  if (!local && !myPlayer) return (
    <div className="page" style={{ textAlign: 'center', paddingTop: 80 }}>
      <div style={{ fontSize: 60 }}>🔒</div>
      <h2 style={{ marginTop: 16 }}>You're not in this challenge</h2>
      <button className="btn-primary" style={{ marginTop: 24 }} onClick={() => navigate('/')}>Go home</button>
    </div>
  )

  const today = format(new Date(), 'yyyy-MM-dd')
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')

  const getWeeklyCount = (goalId) =>
    allCheckIns.filter(ci =>
      ci.goal_id === goalId &&
      ci.player_id === myPlayer?.id &&
      ci.date >= weekStart &&
      ci.date <= weekEnd
    ).length

  const daysLeft = differenceInDays(parseISO(challenge.end_date), new Date()) + 1
  const daysTotal = challenge.duration_days
  const daysPassed = daysTotal - daysLeft

  const mySlot = myPlayer?.slot ?? local?.slot
  const partner = players.find(p => p.slot !== mySlot)
  const waiting = challenge.status === 'pending'

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, letterSpacing: 3, color: 'var(--cyan)' }}>BATTLE ⚔️</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2, letterSpacing: 0.5 }}>
            DAY {daysPassed + 1} / {daysTotal}
          </p>
        </div>
        <div style={{
          background: 'var(--cyan-dim)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-sm)',
          padding: '6px 14px',
          textAlign: 'center',
        }}>
          <p style={{ fontWeight: 700, fontSize: 22, color: 'var(--cyan)', lineHeight: 1, fontFamily: 'Rajdhani, sans-serif' }}>{daysLeft}</p>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>days left</p>
        </div>
      </div>

      <div style={{ background: 'var(--surface2)', borderRadius: 2, height: 3, marginBottom: 24 }}>
        <div style={{
          background: 'linear-gradient(90deg, var(--cyan), var(--purple))',
          height: '100%',
          borderRadius: 2,
          width: `${Math.round((daysPassed / daysTotal) * 100)}%`,
          transition: 'width 0.5s ease',
          boxShadow: '0 0 8px var(--cyan-glow)',
        }} />
      </div>

      {waiting && <InviteBanner challengeId={id} inviteCode={challenge.invite_code} />}

      <Scoreboard
        players={players}
        allCheckIns={allCheckIns}
        allGoals={allGoals}
        mySlot={mySlot}
        challenge={challenge}
      />

      <div style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 18, letterSpacing: 2, marginBottom: 4, color: 'var(--text)' }}>TODAY'S CHECK-IN</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 16, letterSpacing: 0.5 }}>
          {format(new Date(), 'EEEE, MMMM d').toUpperCase()}
        </p>

        {myGoals.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>No goals found.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {myGoals.map(goal => (
              <CheckInCard
                key={goal.id}
                goal={goal}
                checked={!!checkIns.find(ci => ci.goal_id === goal.id)}
                onToggle={() => handleCheckIn(goal.id)}
                weeklyCount={getWeeklyCount(goal.id)}
                weeklyTarget={goal.times_per_week || 7}
              />
            ))}
          </div>
        )}

        {myGoals.length > 0 && (
          <div style={{
            marginTop: 16, textAlign: 'center', padding: 12,
            background: checkIns.length === myGoals.length ? 'var(--green-dim)' : 'var(--surface2)',
            border: `1px solid ${checkIns.length === myGoals.length ? 'var(--green)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-sm)',
            transition: 'all 0.4s',
          }}>
            <p style={{ fontWeight: 700, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase',
              color: checkIns.length === myGoals.length ? 'var(--green)' : 'var(--text-muted)' }}>
              {checkIns.length === myGoals.length
                ? '⚡ All objectives complete'
                : `${checkIns.length} / ${myGoals.length} objectives today`}
            </p>
          </div>
        )}
      </div>

    </div>
  )
}
