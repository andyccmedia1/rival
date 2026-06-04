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
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14 }}>
        ◈ Battle Standings
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
              background: isMe ? 'var(--purple-dim)' : 'var(--surface2)',
              border: `1px solid ${leading ? 'var(--yellow)' : isMe ? 'var(--purple)' : 'var(--border)'}`,
              boxShadow: isMe ? '0 0 20px var(--purple-glow)' : 'none',
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
                background: 'rgba(255,255,255,0.05)', borderRadius: 2, height: 3, marginBottom: 8,
              }}>
                <div style={{
                  background: isMe ? 'var(--purple)' : 'var(--cyan)',
                  height: '100%', borderRadius: 2,
                  width: `${score.pct}%`,
                  transition: 'width 0.6s ease',
                  boxShadow: isMe ? '0 0 6px var(--purple-glow)' : '0 0 6px var(--cyan-glow)',
                }} />
              </div>
              <p style={{ fontWeight: 700, fontSize: 24, color: isMe ? 'var(--purple)' : 'var(--cyan)', fontFamily: 'Rajdhani, sans-serif' }}>
                {score.pct}%
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: 0.5 }}>
                {score.count} / {score.total}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
