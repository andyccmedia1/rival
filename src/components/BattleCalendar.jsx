import { eachDayOfInterval, parseISO, format, startOfWeek } from 'date-fns'

const weekKeyOf = (date) => format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')

export default function BattleCalendar({ players, allGoals = [], allCheckIns = [], challenge, myPlayerId, onToggle }) {
  if (!players || players.length === 0) return null

  const player1 = players.find(p => p.slot === 1)
  const player2 = players.find(p => p.slot === 2)
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const days = eachDayOfInterval({
    start: parseISO(challenge.start_date),
    end: parseISO(challenge.end_date),
  })

  // group challenge days into Mon–Sun week buckets
  const weeks = []
  let cur = null
  for (const d of days) {
    const key = weekKeyOf(d)
    if (!cur || cur.key !== key) { cur = { key, days: [] }; weeks.push(cur) }
    cur.days.push(d)
  }

  const goalsOf = (player) =>
    player ? allGoals.filter(g => (player.goal_ids || []).includes(g.id)) : []

  const didComplete = (player, goalId, dayStr) =>
    allCheckIns.some(ci => ci.player_id === player.id && ci.goal_id === goalId && ci.date === dayStr)

  // weekly target + done for a goal, prorated for partial weeks
  const weekGoalStat = (player, goal, weekDays) => {
    const dCount = weekDays.length
    const n = goal.times_per_week || 7
    const target = Math.min(dCount, Math.round((n * dCount) / 7))
    const done = weekDays.reduce((sum, d) =>
      sum + (didComplete(player, goal.id, format(d, 'yyyy-MM-dd')) ? 1 : 0), 0)
    return { target, done, met: target > 0 && done >= target }
  }

  // per-week summary badges for one player
  const WeekSummary = ({ player, color, weekDays }) => {
    if (!player) return <div style={{ flex: 1 }} />
    const goals = goalsOf(player)
    return (
      <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'center' }}>
        {goals.map(g => {
          const { target, done, met } = weekGoalStat(player, g, weekDays)
          return (
            <span key={g.id} title={`${g.label}: ${done}/${target} this week`} style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              fontSize: 11, fontWeight: 700, padding: '3px 7px', borderRadius: 'var(--radius-pill)',
              background: met ? color : 'rgba(255,255,255,0.06)',
              border: `1px solid ${met ? color : 'var(--glass-border)'}`,
              color: met ? '#3A1A5C' : 'var(--text-soft)',
            }}>
              {g.emoji} {done}/{target}
            </span>
          )
        })}
      </div>
    )
  }

  // a row of per-goal chips for one player on one day (lit = logged that day)
  const DayCell = ({ player, dayStr, color, isFuture }) => {
    if (!player) return <div style={{ flex: 1, minHeight: 30, borderRadius: 8, background: 'rgba(255,255,255,0.04)' }} />
    if (isFuture) return <div style={{ flex: 1, minHeight: 30, borderRadius: 8, border: '1px dashed var(--glass-border)' }} />
    const goals = goalsOf(player)
    const editable = player.id === myPlayerId && typeof onToggle === 'function'
    return (
      <div style={{
        flex: 1, minHeight: 30, borderRadius: 8, padding: '4px 6px',
        display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,255,255,0.05)',
        border: `1px solid ${editable ? 'var(--glass-border-strong)' : 'var(--glass-border)'}`,
      }}>
        {goals.map(g => {
          const done = didComplete(player, g.id, dayStr)
          const chipStyle = {
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 20, height: 20, borderRadius: 6, fontSize: 11,
            background: done ? color : 'transparent',
            border: `1px solid ${done ? color : 'var(--glass-border)'}`,
            opacity: done ? 1 : 0.3, filter: done ? 'none' : 'grayscale(1)', padding: 0,
          }
          if (editable) {
            return (
              <button key={g.id} onClick={() => onToggle(g.id, dayStr)}
                title={`${g.label} — tap to ${done ? 'remove' : 'log'} for this day`}
                style={{ ...chipStyle, cursor: 'pointer' }}>{g.emoji}</button>
            )
          }
          return <span key={g.id} title={`${g.label}${done ? ' — logged' : ''}`} style={chipStyle}>{g.emoji}</span>
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
        📅 Weekly progress
      </p>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
        Badge turns solid when a goal hits its weekly target. Tap your daily icons to fix any past day.
      </p>

      {/* column headers */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
        <div style={{ width: 52, flexShrink: 0 }} />
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: 13, color: 'var(--player-a)' }}>
          {player1 ? `${player1.avatar_emoji} ${player1.display_name}` : '—'}
        </div>
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: 13, color: 'var(--player-b)' }}>
          {player2 ? `${player2.avatar_emoji} ${player2.display_name}` : 'Waiting…'}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 460, overflowY: 'auto' }}>
        {weeks.map((wk, wi) => {
          const first = wk.days[0]
          const last = wk.days[wk.days.length - 1]
          return (
            <div key={wk.key}>
              {/* week label + per-goal weekly tally */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ width: 52, flexShrink: 0, fontSize: 11, fontWeight: 700, color: 'var(--white)' }}>
                  Wk {wi + 1}
                  <div style={{ fontSize: 9, fontWeight: 500, color: 'var(--text-muted)' }}>
                    {format(first, 'MMM d')}–{format(last, 'd')}
                  </div>
                </div>
                <WeekSummary player={player1} color="var(--player-a)" weekDays={wk.days} />
                <WeekSummary player={player2} color="var(--player-b)" weekDays={wk.days} />
              </div>

              {/* daily detail */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {wk.days.map(day => {
                  const dayStr = format(day, 'yyyy-MM-dd')
                  const isFuture = dayStr > todayStr
                  const isToday = dayStr === todayStr
                  return (
                    <div key={dayStr} style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
                      <div style={{
                        width: 52, flexShrink: 0, fontSize: 10, fontWeight: isToday ? 700 : 500,
                        color: isToday ? 'var(--white)' : 'var(--text-muted)', display: 'flex', alignItems: 'center',
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
        })}
      </div>
    </div>
  )
}
