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
                borderRadius: active ? 'var(--radius-sm) var(--radius-sm) 0 0' : 'var(--radius-sm)',
                background: active ? 'rgba(255,255,255,0.22)' : 'var(--glass-soft)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: `1px solid ${active ? 'var(--glass-border-strong)' : 'var(--glass-border)'}`,
                borderBottom: active ? 'none' : `1px solid var(--glass-border)`,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 22 }}>{goal.emoji}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--white)' }}>
                  {goal.label}
                </p>
              </div>
              {active && (
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--white)', flexShrink: 0 }}>
                  {freq}×/wk ✓
                </span>
              )}
            </button>

            {active && (
              <div style={{
                border: '1px solid var(--glass-border-strong)',
                borderTop: 'none',
                borderRadius: '0 0 var(--radius-sm) var(--radius-sm)',
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-soft)', flexShrink: 0 }}>
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
                        border: `1px solid ${n === freq ? 'var(--white)' : 'var(--glass-border)'}`,
                        background: n === freq ? 'var(--white)' : 'rgba(255,255,255,0.08)',
                        color: n === freq ? '#7B4FB0' : 'var(--white)',
                        fontWeight: 700,
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
