import { GOAL_OPTIONS } from '../lib/supabase'

const FREQ_OPTIONS = [1, 2, 3, 4, 5, 6, 7]

export default function GoalPicker({ selected, onToggle, frequencies = {}, onFrequencyChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {GOAL_OPTIONS.map(goal => {
        const active = selected.includes(goal.id)
        const freq = frequencies[goal.id] || 7

        return (
          <div key={goal.id}>
            <button
              onClick={() => onToggle(goal.id)}
              style={{
                width: '100%',
                padding: '14px 12px',
                borderRadius: active ? 'var(--radius) var(--radius) 0 0' : 'var(--radius)',
                background: active ? goal.color + '18' : 'var(--white)',
                border: `2px solid ${active ? goal.color : 'var(--border)'}`,
                borderBottom: active ? 'none' : `2px solid ${active ? goal.color : 'var(--border)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 22 }}>{goal.emoji}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: active ? goal.color : 'var(--text)' }}>
                  {goal.label}
                </p>
              </div>
              {active && (
                <span style={{ fontSize: 12, fontWeight: 700, color: goal.color, flexShrink: 0 }}>
                  {freq}×/wk ✓
                </span>
              )}
            </button>

            {active && (
              <div style={{
                border: `2px solid ${goal.color}`,
                borderTop: 'none',
                borderRadius: '0 0 var(--radius) var(--radius)',
                background: goal.color + '0C',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>
                  days/week:
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {FREQ_OPTIONS.map(n => (
                    <button
                      key={n}
                      onClick={e => { e.stopPropagation(); onFrequencyChange?.(goal.id, n) }}
                      style={{
                        width: 30, height: 30,
                        borderRadius: '50%',
                        border: `2px solid ${n === freq ? goal.color : 'var(--border)'}`,
                        background: n === freq ? goal.color : 'white',
                        color: n === freq ? 'white' : 'var(--text)',
                        fontWeight: 800,
                        fontSize: 13,
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                        flexShrink: 0,
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
