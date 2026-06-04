import { format, eachDayOfInterval, parseISO } from 'date-fns'

export default function Scoreboard({ players, allCheckIns, allGoals = [], mySlot, challenge }) {
  if (!players || players.length === 0) return null

  const weeksInChallenge = Math.max(1, Math.ceil(challenge.duration_days / 7))

  const getScore = (player) => {
    const ci = allCheckIns.filter(c => c.player_id === player.id)
    const playerGoals = allGoals.filter(g => (player.goal_ids || []).includes(g.id))
    const total = playerGoals.reduce((sum, g) => sum + (g.times_per_week || 7) * weeksInChallenge, 0)
    const pct = total > 0 ? Math.round((ci.length / total) * 100) : 0
    return { count: ci.length, total, pct }
  }

  const player1 = players.find(p => p.slot === 1)
  const player2 = players.find(p => p.slot === 2)

  return (
    <div className="card" style={{ padding: 16 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
        Battle standings
      </p>

      <div style={{ display: 'flex', gap: 10 }}>
        {[player1, player2].map((p, i) => {
          if (!p) {
            return (
              <div key={i} style={{
                flex: 1, padding: '14px 12px', borderRadius: 'var(--radius-sm)',
                background: 'var(--surface)', border: '2px dashed var(--border)',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: 24, marginBottom: 4 }}>❓</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 700 }}>Waiting for opponent…</p>
              </div>
            )
          }
          const score = getScore(p)
          const isMe = p.slot === mySlot
          const leading = players.length === 2 && getScore(players[0]).pct !== getScore(players[1]).pct &&
            score.pct === Math.max(...players.map(pl => getScore(pl).pct))

          return (
            <div key={p.id} style={{
              flex: 1, padding: '14px 12px', borderRadius: 'var(--radius-sm)',
              background: isMe ? 'var(--purple-light)' : 'var(--surface)',
              border: `2px solid ${leading ? 'var(--yellow)' : isMe ? 'var(--purple)' : 'var(--border)'}`,
              textAlign: 'center', position: 'relative',
            }}>
              {leading && (
                <span style={{ position: 'absolute', top: -10, right: -6, fontSize: 20 }}>👑</span>
              )}
              {isMe && (
                <span style={{
                  position: 'absolute', top: -10, left: 8,
                  background: 'var(--purple)', color: 'white',
                  fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 99,
                }}>YOU</span>
              )}
              <div style={{ fontSize: 32, marginBottom: 4 }}>{p.avatar_emoji}</div>
              <p style={{ fontWeight: 800, fontSize: 14, marginBottom: 8, color: isMe ? 'var(--navy-mid)' : 'var(--text)' }}>{p.display_name}</p>

              <div style={{
                background: 'rgba(0,0,0,0.08)', borderRadius: 99, height: 8, marginBottom: 6,
              }}>
                <div style={{
                  background: isMe ? 'var(--purple)' : 'var(--coral)',
                  height: '100%', borderRadius: 99,
                  width: `${score.pct}%`,
                  transition: 'width 0.6s ease',
                }} />
              </div>
              <p style={{ fontWeight: 900, fontSize: 22, color: isMe ? 'var(--purple)' : 'var(--coral)' }}>
                {score.pct}%
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                {score.count} / {score.total} done
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
