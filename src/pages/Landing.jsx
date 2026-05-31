import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', paddingTop: 60 }}>

      <div className="animate-float" style={{ fontSize: 80, marginBottom: 8, lineHeight: 1 }}>⚔️</div>

      <h1 style={{ fontSize: 52, color: 'var(--pink)', marginBottom: 8 }}>Rival</h1>
      <p style={{ fontSize: 18, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 48 }}>
        Challenge your partner.<br />Stay the course. Win glory.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320 }}>
        <button className="btn-primary" style={{ fontSize: 18 }} onClick={() => navigate('/create')}>
          ✨ Create a challenge
        </button>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          Got an invite? Your partner's link will bring you right in.
        </p>
      </div>

      <div style={{ marginTop: 64, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, width: '100%' }}>
        {[
          { icon: '🎯', label: 'Set goals' },
          { icon: '✅', label: 'Daily check-ins' },
          { icon: '🏆', label: 'Winner revealed' },
        ].map(({ icon, label }) => (
          <div key={label} className="card" style={{ textAlign: 'center', padding: '16px 8px' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>{label}</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 48, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {['📖 Read', '🏃 Exercise', '💧 Hydrate', '🧘 Meditate', '🌙 Sleep', '🥗 Eat clean'].map(g => (
          <span key={g} style={{
            background: 'var(--purple-light)',
            color: 'var(--navy-mid)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-pill)',
            fontSize: 13,
            fontWeight: 700,
          }}>{g}</span>
        ))}
      </div>

    </div>
  )
}
