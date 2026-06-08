import { eachDayOfInterval, parseISO, format } from 'date-fns'

export default function BattleCalendar({ players, allGoals = [], allCheckIns = [], challenge }) {
  if (!players || players.length === 0) return null

  const player1 = players.find(p => p.slot === 1)
  const player2 = players.find(p => p.slot === 2)
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const days = eachDayOfInterval({
    start: parseISO(challenge.start_date),
    end: parseISO(challenge.end_date),
  })

  // completion for a player on a given day: done / their goal count
  const dayStat = (player, dayStr) => {
    if (!player) return null
    const goalCount = (player.goal_ids || []).length
    const done = allCheckIns.filter(ci => ci.player_id === player.id && ci.date === dayStr).length
    return { done, goalCount }
  }

  const Cell = ({ player, dayStr, color, isFuture }) => {
    const stat = dayStat(player, dayStr)
    if (!player) {
      return <div style={{ flex: 1, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.04)' }} />
    }
    if (isFuture) {
      return (
        <div style={{
          flex: 1, height: 30, borderRadius: 8,
          border: '1px dashed var(--glass-border)',
          background: 'transparent',
        }} />
      )
    }
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

  return (
    <div className="card" style={{ padding: 18, marginTop: 16 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-soft)', marginBottom: 4 }}>
        📅 Daily progress
      </p>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
        See who showed up each day
      </p>

      {/* header row with player names */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <div style={{ width: 52, flexShrink: 0 }} />
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: 13, color: 'var(--player-a)' }}>
          {player1 ? `${player1.avatar_emoji} ${player1.display_name}` : '—'}
        </div>
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: 13, color: 'var(--player-b)' }}>
          {player2 ? `${player2.avatar_emoji} ${player2.display_name}` : 'Waiting…'}
        </div>
      </div>

      {/* scrollable day rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
        {days.map(day => {
          const dayStr = format(day, 'yyyy-MM-dd')
          const isFuture = dayStr > todayStr
          const isToday = dayStr === todayStr
          return (
            <div key={dayStr} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{
                width: 52, flexShrink: 0, fontSize: 11, fontWeight: isToday ? 700 : 500,
                color: isToday ? 'var(--white)' : 'var(--text-muted)',
              }}>
                {format(day, 'EEE d')}
              </div>
              <Cell player={player1} dayStr={dayStr} color="var(--player-a)" isFuture={isFuture} />
              <Cell player={player2} dayStr={dayStr} color="var(--player-b)" isFuture={isFuture} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
