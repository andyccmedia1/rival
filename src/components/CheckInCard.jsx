import { useState } from 'react'

export default function CheckInCard({ goal, checked, onToggle, weeklyCount = 0, weeklyTarget = 7 }) {
  const [animating, setAnimating] = useState(false)

  const handleClick = () => {
    if (!checked) {
      setAnimating(true)
      setTimeout(() => setAnimating(false), 500)
    }
    onToggle()
  }

  const weeklyDone = weeklyCount >= weeklyTarget
  const isDaily = weeklyTarget === 7

  return (
    <button
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        borderRadius: 'var(--radius)',
        background: checked ? goal.color + '18' : 'var(--surface2)',
        border: `1px solid ${checked ? goal.color : 'var(--border)'}`,
        boxShadow: checked ? `0 0 12px ${goal.color}44` : 'none',
        textAlign: 'left',
        width: '100%',
        transition: 'all 0.2s',
      }}
    >
      <span style={{ fontSize: 26 }}>{goal.emoji}</span>

      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 700, fontSize: 15, color: checked ? goal.color : 'var(--text)' }}>
          {goal.label}
        </p>
        {!isDaily && (
          <p style={{
            fontSize: 12, fontWeight: 700, marginTop: 2,
            color: weeklyDone ? '#0F6E56' : 'var(--text-muted)',
          }}>
            {weeklyDone ? '✅' : `${weeklyCount}/${weeklyTarget}`} this week
          </p>
        )}
      </div>

      <div style={{
        width: 28, height: 28,
        borderRadius: '50%',
        background: checked ? goal.color : 'transparent',
        border: `1.5px solid ${checked ? goal.color : 'var(--border-strong)'}`,
        boxShadow: checked ? `0 0 8px ${goal.color}88` : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14,
        transition: 'all 0.2s',
        animation: animating ? 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
        flexShrink: 0,
      }}>
        {checked && <span style={{ color: 'white', fontWeight: 900 }}>✓</span>}
      </div>
    </button>
  )
}
