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
        padding: '15px 16px',
        borderRadius: 'var(--radius-sm)',
        background: checked ? 'rgba(255,255,255,0.2)' : 'var(--glass-soft)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: `1px solid ${checked ? 'var(--glass-border-strong)' : 'var(--glass-border)'}`,
        boxShadow: checked ? '0 4px 20px rgba(40,20,80,0.2)' : 'none',
        textAlign: 'left',
        width: '100%',
        transition: 'all 0.2s',
      }}
    >
      <span style={{ fontSize: 26 }}>{goal.emoji}</span>

      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--white)' }}>
          {goal.label}
        </p>
        {!isDaily && (
          <p style={{
            fontSize: 12, fontWeight: 600, marginTop: 2,
            color: weeklyDone ? 'var(--green)' : 'var(--text-muted)',
          }}>
            {weeklyDone ? '✓ done' : `${weeklyCount}/${weeklyTarget}`} this week
          </p>
        )}
      </div>

      <div style={{
        width: 28, height: 28,
        borderRadius: '50%',
        background: checked ? 'var(--white)' : 'transparent',
        border: `2px solid ${checked ? 'var(--white)' : 'var(--glass-border-strong)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14,
        transition: 'all 0.2s',
        animation: animating ? 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
        flexShrink: 0,
      }}>
        {checked && <span style={{ color: '#7B4FB0', fontWeight: 900 }}>✓</span>}
      </div>
    </button>
  )
}
