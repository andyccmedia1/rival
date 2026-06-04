import { useState } from 'react'

export default function InviteBanner({ challengeId, inviteCode }) {
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}/join/${inviteCode}`

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="card" style={{
      background: 'rgba(255,214,107,0.15)',
      border: '1px solid var(--gold)',
      padding: 16,
      marginBottom: 20,
    }}>
      <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: 'var(--white)' }}>
        ⏳ Waiting for your opponent...
      </p>
      <p style={{ color: 'var(--text-soft)', fontWeight: 500, fontSize: 13, marginBottom: 12 }}>
        Share this link to invite them:
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{
          flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)',
          padding: '10px 12px', fontSize: 13, fontWeight: 500,
          border: '1px solid var(--glass-border)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          color: 'var(--white)',
        }}>
          {url}
        </div>
        <button onClick={handleCopy} style={{
          background: copied ? 'var(--green)' : 'var(--white)',
          color: copied ? '#08402F' : '#7B4FB0', borderRadius: 'var(--radius-sm)',
          padding: '8px 16px', fontSize: 13, fontWeight: 700, flexShrink: 0,
          transition: 'background 0.2s',
        }}>
          {copied ? '✓ Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  )
}
