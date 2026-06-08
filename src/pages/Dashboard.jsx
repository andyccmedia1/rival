import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { format, differenceInDays, parseISO, startOfWeek, endOfWeek } from 'date-fns'
import CheckInCard from '../components/CheckInCard'
import Scoreboard from '../components/Scoreboard'
import BattleCalendar from '../components/BattleCalendar'
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
  const todayKey = format(new Date(), 'yyyy-MM-dd')
  const [doneToday, setDoneToday] = useState(
    () => localStorage.getItem(`rival_done_${id}_${todayKey}`) === '1'
  )

  const markDoneToday = () => {
    localStorage.setItem(`rival_done_${id}_${todayKey}`, '1')
    setDoneToday(true)
  }

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

  const now = new Date()
  const startD = parseISO(challenge.start_date)
  const endD = parseISO(challenge.end_date)
  const notStarted = today < challenge.start_date
  const daysTotal = challenge.duration_days
  const daysUntilStart = Math.max(0, differenceInDays(startD, now) + (today < challenge.start_date ? 1 : 0))
  const daysPassed = Math.min(daysTotal, Math.max(0, differenceInDays(now, startD)))
  const daysLeft = Math.max(0, differenceInDays(endD, now) + 1)

  const mySlot = myPlayer?.slot ?? local?.slot
  const partner = players.find(p => p.slot !== mySlot)
  const waiting = challenge.status === 'pending'

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 30, color: 'var(--white)' }}>Battle ⚔️</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2, fontWeight: 500 }}>
            {notStarted
              ? `Starts ${format(startD, 'MMM d')} · in ${daysUntilStart} ${daysUntilStart === 1 ? 'day' : 'days'}`
              : `Day ${daysPassed + 1} of ${daysTotal} · ${daysLeft} days left`}
          </p>
        </div>
        <div style={{
          background: 'var(--glass)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 16px',
          textAlign: 'center',
        }}>
          <p style={{ fontWeight: 700, fontSize: 24, color: 'var(--white)', lineHeight: 1, fontFamily: 'Sora, sans-serif' }}>{notStarted ? daysUntilStart : daysLeft}</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{notStarted ? 'til start' : 'days left'}</p>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 99, height: 6, marginBottom: 24 }}>
        <div style={{
          background: 'linear-gradient(90deg, var(--player-a), var(--player-b))',
          height: '100%',
          borderRadius: 99,
          width: `${notStarted ? 0 : Math.round((daysPassed / daysTotal) * 100)}%`,
          transition: 'width 0.5s ease',
          boxShadow: '0 0 12px rgba(255,255,255,0.4)',
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

      <BattleCalendar
        players={players}
        allCheckIns={allCheckIns}
        allGoals={allGoals}
        challenge={challenge}
      />

      {notStarted ? (
        <div className="card" style={{ marginTop: 28, textAlign: 'center', padding: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
          <h2 style={{ fontSize: 22, marginBottom: 6, color: 'var(--white)' }}>Challenge hasn't started yet</h2>
          <p style={{ color: 'var(--text-soft)', fontWeight: 500, lineHeight: 1.5 }}>
            Check-ins open on <strong>{format(startD, 'EEEE, MMMM d')}</strong>.<br />
            Come back in {daysUntilStart} {daysUntilStart === 1 ? 'day' : 'days'} to start your streak!
          </p>
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--glass-border)' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Your goals</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 10 }}>
              {myGoals.map(goal => (
                <span key={goal.id} style={{
                  background: 'var(--glass-soft)', border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-pill)', padding: '6px 14px', fontSize: 13, fontWeight: 500,
                }}>{goal.emoji} {goal.label}</span>
              ))}
            </div>
          </div>
        </div>
      ) : (
      <div style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 22, marginBottom: 4, color: 'var(--white)' }}>Today's check-in</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16, fontWeight: 500 }}>
          {format(new Date(), 'EEEE, MMMM d')}
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
          <>
            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 14 }}>
              ✓ Each tap saves automatically
            </p>

            {doneToday ? (
              <div style={{
                marginTop: 12, textAlign: 'center', padding: 16,
                background: 'rgba(91,233,185,0.18)', border: '1px solid var(--green)',
                borderRadius: 'var(--radius-sm)', backdropFilter: 'blur(8px)',
              }}>
                <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--green)' }}>
                  {checkIns.length === myGoals.length
                    ? '🎉 Locked in — all goals done today!'
                    : `✅ Logged for today · ${checkIns.length}/${myGoals.length} done`}
                </p>
                <button onClick={() => { localStorage.removeItem(`rival_done_${id}_${todayKey}`); setDoneToday(false) }}
                  style={{ marginTop: 8, background: 'none', border: 'none', color: 'var(--text-soft)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  Edit today's check-in
                </button>
              </div>
            ) : (
              <>
                <div style={{
                  marginTop: 12, textAlign: 'center', padding: 12,
                  background: 'var(--glass-soft)', border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-soft)' }}>
                    {checkIns.length} / {myGoals.length} completed today
                  </p>
                </div>
                <button className="btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={markDoneToday}>
                  {checkIns.length === myGoals.length ? '🎉 Done for today!' : '✓ Done for today'}
                </button>
              </>
            )}
          </>
        )}
      </div>
      )}

    </div>
  )
}
