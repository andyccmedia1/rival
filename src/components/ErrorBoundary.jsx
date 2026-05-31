import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      const msg = this.state.error?.message || String(this.state.error)
      const isMissingEnv = msg.includes('supabaseUrl') || msg.includes('placeholder') || msg.includes('env')
      return (
        <div style={{
          fontFamily: 'Nunito, sans-serif',
          maxWidth: 480, margin: '60px auto', padding: '0 20px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontFamily: 'Fredoka One, cursive', fontSize: 28, color: '#FF6B9D', marginBottom: 12 }}>
            {isMissingEnv ? 'Missing environment variables' : 'Something went wrong'}
          </h2>
          {isMissingEnv ? (
            <div style={{ textAlign: 'left', background: '#F7F8FF', borderRadius: 12, padding: 20, fontSize: 15, lineHeight: 1.7 }}>
              <p style={{ fontWeight: 700, marginBottom: 12 }}>Set these in Netlify:</p>
              <p style={{ marginBottom: 4 }}><strong>Site settings → Environment variables</strong></p>
              <code style={{ display: 'block', background: '#1A1B3A', color: '#FFD93D', padding: '12px 16px', borderRadius: 8, fontSize: 13, marginTop: 12, lineHeight: 2 }}>
                VITE_SUPABASE_URL<br />
                VITE_SUPABASE_ANON_KEY
              </code>
              <p style={{ marginTop: 16, color: '#6B6E9A', fontSize: 14 }}>
                Then go to <strong>Deploys → Trigger deploy</strong> to rebuild with the new values.
              </p>
            </div>
          ) : (
            <p style={{ color: '#6B6E9A', fontSize: 14, background: '#F7F8FF', borderRadius: 8, padding: 16 }}>
              {msg}
            </p>
          )}
        </div>
      )
    }
    return this.props.children
  }
}
