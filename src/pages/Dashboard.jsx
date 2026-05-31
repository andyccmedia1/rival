import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { format, differenceInDays, isToday, parseISO } from 'date-fns'
import CheckInCard from '../components/CheckInCard'
import Scoreboard from '../components/Scoreboard'
import InviteBanner from '../components/InviteBanner'

export default function Dashboard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [challenge, setChallenge] = useState(null)
  const [players, setPlayers] = useState([])
  const [myGoals, setMyGoals] = useState([])
  const [checkIns, setCheckIns] = useState([])
  const [allCheckIns, setAllCheckIns] = useState([])
  const [myPlayer, setMyPlayer] = useState(null)
  const [loading, setLoading] = useState(true)

  const local = JSON.parse(localStorage.getItem(`rival_player_${id}`) || 'null')

  const load = useCallback(async () => {
    const { data: c } = await supabase.from('challenges').select('*').eq('id', id).single()
    if (!c) { navigate('/'); return }
    setChallenge(c)

    const { data: ps } = await supabase.from('players').select('*').eq('challenge_id', id)
    setPlayers(ps || [])

    const me = ps?.find(p => p.slot === local?.slot)
    setMyPlayer(me || null)

    if (me) {
      const { data: goals } = await supabase.from('goals').select('*').in('id', me.goal_ids || [])
      setMyGoals(goals || [])

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

  if (!local) return (
    <div className="page" style={{ textAlign: 'center', paddingTop: 80 }}>
      <div style={{ fontSize: 60 }}>🔒</div>
      <h2 style={{ marginTop: 16 }}>You're not in this challenge</h2>
      <button className="btn-primary" style={{ marginTop: 24 }} onClick={() => navigate('/')}>Go home</button>
    </div>
  )

  const today = format(new Date(), 'yyyy-MM-dd')
  const daysLeft = differenceInDays(parseISO(challenge.end_date), new Date()) + 1
  const daysTotal = challenge.duration_days
  const daysPassed = daysTotal - daysLeft

  const partner = players.find(p => p.slot !== local?.slot)
  const waiting = challenge.status === 'pending'

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 28, color: 'var(--pink)' }}>Battle ⚔️</h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: 14 }}>
            Day {daysPassed + 1} of {daysTotal} • {daysLeft} days left
          </p>
        </div>
        <div style={{
          background: 'var(--purple-light)',
          borderRadius: 'var(--radius-sm)',
          padding: '6px 12px',
          textAlign: 'center',
        }}>
          <p style={{ fontWeight: 800, fontSize: 20, color: 'var(--purple)', lineHeight: 1 }}>{daysLeft}</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>days left</p>
        </div>
      </div>

      <div style={{ background: 'var(--border)', borderRadius: 99, height: 8, marginBottom: 24 }}>
        <div style={{
          background: 'linear-gradient(90deg, var(--pink), var(--purple))',
          height: '100%',
          borderRadius: 99,
          width: `${Math.round((daysPassed / daysTotal) * 100)}%`,
          transition: 'width 0.5s ease',
        }} />
      </div>

      {waiting && <InviteBanner challengeId={id} inviteCode={challenge.invite_code} />}

      <Scoreboard
        players={players}
        allCheckIns={allCheckIns}
        myGoals={myGoals}
        mySlot={local?.slot}
        challenge={challenge}
      />

      <div style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 22, marginBottom: 4 }}>Today's check-in</h2>
        <p style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: 16, fontSize: 14 }}>
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
              />
            ))}
          </div>
        )}

        {myGoals.length > 0 && (
          <div style={{
            marginTop: 16, textAlign: 'center', padding: 12,
            background: checkIns.length === myGoals.length ? 'var(--teal-light)' : 'var(--surface2)',
            borderRadius: 'var(--radius)',
            transition: 'background 0.4s',
          }}>
            <p style={{ fontWeight: 800, fontSize: 15, color: checkIns.length === myGoals.length ? '#0F6E56' : 'var(--text-muted)' }}>
              {checkIns.length === myGoals.length
                ? '🎉 All done for today! Keep it up!'
                : `${checkIns.length} / ${myGoals.length} completed today`}
            </p>
          </div>
        )}
      </div>

    </div>
  )
}
