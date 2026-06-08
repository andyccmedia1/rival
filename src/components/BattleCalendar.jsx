import { useState } from 'react'
import { eachDayOfInterval, parseISO, format } from 'date-fns'

export default function BattleCalendar({ players, allGoals = [], allCheckIns = [], challenge }) {
  const [openDay, setOpenDay] = useState(null)

  if (!players || players.length === 0) return null

  const player1 = players.find(p => p.slot === 1)
  const player2 = players.find(p => p.slot === 2)
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const days = eachDayOfInterval({
    start: parseISO(challenge.start_date),
    end: parseISO(challenge.end_date),
  })

  const goalsOf = (player) =>
    player ? allGoals.filter(g => (player.goal_ids || []).includes(g.id)) : []

  const didComplete = (player, goalId, dayStr) =>
    allCheckIns.some(ci => ci.player_id === player.id && ci.goal_id === goalId && ci.date === dayStr)

  const dayStat = (player, dayStr) => {
    if (!player) return null
    const goalCount = (player.goal_ids || []).length
    const done = allCheckIns.filter(ci => ci.player_id === player.id && ci.date === dayStr).length
    return { done, goalCount }
  }

  const Cell = ({ player, dayStr, color, isFuture }) => {
    if (!player) return <div style={{ flex: 1, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.04)' }} />
    if (isFuture) {
      return <div style={{ flex: 1, height: 30, borderRadius: 8, border: '1px dashed var(--glass-border)' }} />
    }
    const stat = dayStat(player, dayStr)
    const complete = stat.goalCount > 0 && stat.done >= stat.goalCount
    const partial = stat.done > 0 && !complete
    return (
      <div style={{
        flex: 1, height: 30, borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700,
        background: complete ? color : partial ? color + '40' : 'rgba(255,255,255,0.06)',
        border: `1px solid ${complete || partial ? color : 'var(--glass-border)'}`,
        color: complete ? '#3A1A5C' : 'var(--white)',
      }}>
        {complete ? '✓' : stat.done > 0 ? `${stat.done}/${stat.goalCount}` : ''}
      </div>
    )
  }

  // breakdown of each player's goals for a given day
  const Breakdown = ({ player, color, dayStr, isFuture }) => {
    const goals = goalsOf(player)
    if (!player) return <div style={{ flex: 1 }} />
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {goals.map(g => {
          const done = !isFuture && didComplete(player, g.id, dayStr)
          return (
            <div key={g.id} style={{
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 11,
              color: done ? 'var(--white)' : 'var(--text-muted)',
            }}>
              <span style={{
                width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? color : 'transparent',
                border: `1px solid ${done ? color : 'var(--glass-border)'}`,
                color: '#3A1A5C', fontSize: 9, fontWeight: 900,
              }}>{done ? '✓' : ''}</span>
              <span style={{ textDecoration: done ? 'none' : 'none' }}>{g.emoji} {g.label}</span>
            </div>
          )
        })}
      </div>
    )
  }

  const GoalSummary = ({ player, color }) => {
    const goals = goalsOf(player)
    return (
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 700, fontSize: 13, color, marginBottom: 6, textAlign: 'center' }}>
          {player ? `${player.avatar_emoji} ${player.display_name}` : 'Waiting…'}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {goals.map(g => (
            <div key={g.id} style={{ fontSize: 11, color: 'var(--text-soft)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span>{g.emoji}</span>
              <span style={{ flex: 1 }}>{g.label}</span>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{g.times_per_week || 7}×/wk</span>
            </div>
          ))}
          {goals.length === 0 && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: 18, marginTop: 16 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-soft)', marginBottom: 4 }}>
        🎯 The commitments
      </p>
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, paddingBottom: 16, borderBottom: '1px solid var(--glass-border)' }}>
        <GoalSummary player={player1} color="var(--player-a)" />
        <GoalSummary player={player2} color="var(--player-b)" />
      </div>

      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-soft)', marginBottom: 4 }}>
        📅 Daily progress
      </p>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
        Tap any day to see exactly what each of you completed
      </p>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <div style={{ width: 52, flexShrink: 0 }} />
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: 13, color: 'var(--player-a)' }}>
          {player1 ? `${player1.avatar_emoji} ${player1.display_name}` : '—'}
        </div>
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: 13, color: 'var(--player-b)' }}>
          {player2 ? `${player2.avatar_emoji} ${player2.display_name}` : 'Waiting…'}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 360, overflowY: 'auto' }}>
        {days.map(day => {
          const dayStr = format(day, 'yyyy-MM-dd')
          const isFuture = dayStr > todayStr
          const isToday = dayStr === todayStr
          const isOpen = openDay === dayStr
          return (
            <div key={dayStr}>
              <div
                onClick={() => !isFuture && setOpenDay(isOpen ? null : dayStr)}
                style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: isFuture ? 'default' : 'pointer' }}
              >
                <div style={{
                  width: 52, flexShrink: 0, fontSize: 11, fontWeight: isToday ? 700 : 500,
                  color: isToday ? 'var(--white)' : 'var(--text-muted)',
                }}>
                  {format(day, 'EEE d')}
                </div>
                <Cell player={player1} dayStr={dayStr} color="var(--player-a)" isFuture={isFuture} />
                <Cell player={player2} dayStr={dayStr} color="var(--player-b)" isFuture={isFuture} />
              </div>

              {isOpen && (
                <div style={{
                  display: 'flex', gap: 8, marginTop: 6, padding: '10px 8px',
                  background: 'rgba(255,255,255,0.06)', borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                }}>
                  <div style={{ width: 52, flexShrink: 0 }} />
                  <Breakdown player={player1} color="var(--player-a)" dayStr={dayStr} isFuture={isFuture} />
                  <Breakdown player={player2} color="var(--player-b)" dayStr={dayStr} isFuture={isFuture} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
