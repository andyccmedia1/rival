import { useState } from 'react'

export default function CheckInCard({ goal, checked, onToggle }) {
  const [animating, setAnimating] = useState(false)

  const handleClick = () => {
    if (!checked) {
      setAnimating(true)
      setTimeout(() => setAnimating(false), 500)
    }
    onToggle()
  }

  return (
    <button
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        borderRadius: 'var(--radius)',
        background: checked ? goal.color + '14' : 'var(--white)',
        border: `2px solid ${checked ? goal.color : 'var(--border)'}`,
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
      </div>

      <div style={{
        width: 28, height: 28,
        borderRadius: '50%',
        background: checked ? goal.color : 'transparent',
        border: `2.5px solid ${checked ? goal.color : 'var(--border)'}`,
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
