import { AVATARS } from '../lib/supabase'

export default function AvatarPicker({ value, onChange }) {
  return (
    <div>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'var(--purple-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 44, margin: '0 auto 16px', border: '3px solid var(--purple)',
      }}>
        {value}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
        {AVATARS.map(a => (
          <button
            key={a}
            onClick={() => onChange(a)}
            style={{
              fontSize: 28, padding: 8,
              borderRadius: 'var(--radius-sm)',
              background: a === value ? 'var(--purple-light)' : 'transparent',
              border: `2px solid ${a === value ? 'var(--purple)' : 'transparent'}`,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  )
}
