import { computeScore, goalsForPlayer } from '../lib/scoring'

export default function Scoreboard({ players, allCheckIns, allGoals = [], mySlot, challenge }) {
  if (!players || players.length === 0) return null

  const getScore = (player) => {
    const { earned, total, pct } = computeScore(
      player, goalsForPlayer(player, allGoals), allCheckIns, challenge
    )
    return { count: earned, total, pct }
  }

  const player1 = players.find(p => p.slot === 1)
  const player2 = players.find(p => p.slot === 2)

  return (
    <div className="card" style={{ padding: 18 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-soft)', marginBottom: 14 }}>
        ⚔️ Battle standings
      </p>

      <div style={{ display: 'flex', gap: 10 }}>
        {[player1, player2].map((p, i) => {
          const slotColor = i === 0 ? 'var(--player-a)' : 'var(--player-b)'
          if (!p) {
            return (
              <div key={i} style={{
                flex: 1, padding: '16px 12px', borderRadius: 'var(--radius-sm)',
                background: 'var(--glass-soft)', border: '1px dashed var(--glass-border)',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: 26, marginBottom: 4 }}>❓</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Waiting…</p>
              </div>
            )
          }
          const score = getScore(p)
          const isMe = p.slot === mySlot
          const leading = players.length === 2 && getScore(players[0]).pct !== getScore(players[1]).pct &&
            score.pct === Math.max(...players.map(pl => getScore(pl).pct))

          return (
            <div key={p.id} style={{
              flex: 1, padding: '16px 12px', borderRadius: 'var(--radius-sm)',
              background: 'var(--glass-soft)',
              border: `1px solid ${leading ? 'var(--gold)' : isMe ? slotColor : 'var(--glass-border)'}`,
              boxShadow: leading ? '0 0 24px rgba(255,214,107,0.3)' : 'none',
              textAlign: 'center', position: 'relative',
            }}>
              {leading && (
                <span style={{ position: 'absolute', top: -12, right: -4, fontSize: 22 }}>👑</span>
              )}
              {isMe && (
                <span style={{
                  position: 'absolute', top: -9, left: 8,
                  background: slotColor, color: '#3A1A5C',
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                }}>YOU</span>
              )}
              <div style={{ fontSize: 34, marginBottom: 6 }}>{p.avatar_emoji}</div>
              <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: 'var(--white)', fontFamily: 'Sora, sans-serif' }}>{p.display_name}</p>

              <div style={{
                background: 'rgba(255,255,255,0.12)', borderRadius: 99, height: 6, marginBottom: 8,
              }}>
                <div style={{
                  background: slotColor,
                  height: '100%', borderRadius: 99,
                  width: `${score.pct}%`,
                  transition: 'width 0.6s ease',
                  boxShadow: `0 0 10px ${slotColor}`,
                }} />
              </div>
              <p style={{ fontWeight: 800, fontSize: 26, color: slotColor, fontFamily: 'Sora, sans-serif' }}>
                {score.pct}%
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                {score.count} / {score.total}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
