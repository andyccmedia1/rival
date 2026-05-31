import { GOAL_OPTIONS } from '../lib/supabase'

export default function GoalPicker({ selected, onToggle }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {GOAL_OPTIONS.map(goal => {
        const active = selected.includes(goal.id)
        return (
          <button
            key={goal.id}
            onClick={() => onToggle(goal.id)}
            style={{
              padding: '14px 12px',
              borderRadius: 'var(--radius)',
              background: active ? goal.color + '18' : 'var(--white)',
              border: `2px solid ${active ? goal.color : 'var(--border)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              textAlign: 'left',
              transition: 'all 0.15s',
              transform: active ? 'scale(1.02)' : 'scale(1)',
            }}
          >
            <span style={{ fontSize: 22 }}>{goal.emoji}</span>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: active ? goal.color : 'var(--text)' }}>
                {goal.label}
              </p>
            </div>
            {active && (
              <span style={{ marginLeft: 'auto', fontSize: 16, color: goal.color }}>✓</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
