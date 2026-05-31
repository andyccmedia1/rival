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
    <div style={{
      background: 'var(--yellow-light)',
      border: '2px solid var(--yellow)',
      borderRadius: 'var(--radius)',
      padding: 16,
      marginBottom: 20,
    }}>
      <p style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>
        ⏳ Waiting for your opponent...
      </p>
      <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: 13, marginBottom: 12 }}>
        Share this link to invite them:
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{
          flex: 1, background: 'var(--white)', borderRadius: 'var(--radius-sm)',
          padding: '8px 12px', fontSize: 13, fontWeight: 600,
          border: '1.5px solid var(--border)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          color: 'var(--text-muted)',
        }}>
          {url}
        </div>
        <button onClick={handleCopy} style={{
          background: copied ? 'var(--teal)' : 'var(--navy)',
          color: 'white', borderRadius: 'var(--radius-sm)',
          padding: '8px 14px', fontSize: 13, fontWeight: 800, flexShrink: 0,
          transition: 'background 0.2s',
        }}>
          {copied ? '✓ Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  )
}
