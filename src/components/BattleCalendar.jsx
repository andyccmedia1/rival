import { eachDayOfInterval, parseISO, format } from 'date-fns'

export default function BattleCalendar({ players, allGoals = [], allCheckIns = [], challenge, myPlayerId, onToggle }) {
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

  // a row of per-goal chips for one player on one day
  const DayCell = ({ player, dayStr, color, isFuture }) => {
    if (!player) return <div style={{ flex: 1, minHeight: 34, borderRadius: 8, background: 'rgba(255,255,255,0.04)' }} />
    if (isFuture) {
      return <div style={{ flex: 1, minHeight: 34, borderRadius: 8, border: '1px dashed var(--glass-border)' }} />
    }
    const goals = goalsOf(player)
    const doneCount = goals.filter(g => didComplete(player, g.id, dayStr)).length
    const allDone = goals.length > 0 && doneCount === goals.length
    const editable = player.id === myPlayerId && typeof onToggle === 'function'
    return (
      <div style={{
        flex: 1, minHeight: 34, borderRadius: 8, padding: '5px 6px',
        display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center', justifyContent: 'center',
        background: allDone ? color + '22' : 'rgba(255,255,255,0.06)',
        border: `1px solid ${allDone ? color : editable ? 'var(--glass-border-strong)' : 'var(--glass-border)'}`,
      }}>
        {goals.map(g => {
          const done = didComplete(player, g.id, dayStr)
          const chipStyle = {
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 22, height: 22, borderRadius: 6, fontSize: 12,
            background: done ? color : 'transparent',
            border: `1px solid ${done ? color : 'var(--glass-border)'}`,
            opacity: done ? 1 : 0.35,
            filter: done ? 'none' : 'grayscale(1)',
            padding: 0,
          }
          if (editable) {
            return (
              <button
                key={g.id}
                onClick={() => onToggle(g.id, dayStr)}
                title={`${g.label} — tap to ${done ? 'uncheck' : 'check'}`}
                style={{ ...chipStyle, cursor: 'pointer' }}
              >{g.emoji}</button>
            )
          }
          return (
            <span key={g.id} title={`${g.label}${done ? ' ✓' : ' (missed)'}`} style={chipStyle}>{g.emoji}</span>
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
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-soft)', marginBottom: 8 }}>
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
        Lit = done · dim = missed. Tap an icon in your row to fix any past day.
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 420, overflowY: 'auto' }}>
        {days.map(day => {
          const dayStr = format(day, 'yyyy-MM-dd')
          const isFuture = dayStr > todayStr
          const isToday = dayStr === todayStr
          return (
            <div key={dayStr} style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
              <div style={{
                width: 52, flexShrink: 0, fontSize: 11, fontWeight: isToday ? 700 : 500,
                color: isToday ? 'var(--white)' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center',
              }}>
                {format(day, 'EEE d')}
              </div>
              <DayCell player={player1} dayStr={dayStr} color="var(--player-a)" isFuture={isFuture} />
              <DayCell player={player2} dayStr={dayStr} color="var(--player-b)" isFuture={isFuture} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
