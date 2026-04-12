import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [showPw, setShowPw]     = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Invalid credentials')
      sessionStorage.setItem('mio_auth_token', json.token)
      window.location.reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#f1f5f9', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '16px'
    }}>
      <div style={{
        background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        border: '1px solid #e2e8f0', padding: '32px', width: '100%', maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '48px', height: '48px', borderRadius: '8px', background: '#6366f1',
            color: 'white', fontSize: '20px', fontWeight: 'bold', marginBottom: '16px'
          }}>🔐</div>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b' }}>QC Dashboard</h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Voice Agent Quality Control</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px',
                fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit'
              }}
              placeholder="product@meritto.com"
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', paddingRight: '50px', border: '1px solid #cbd5e1',
                  borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit'
                }}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  fontSize: '12px', fontWeight: '500', color: '#94a3b8', border: 'none', background: 'none',
                  cursor: 'pointer', padding: '4px 8px'
                }}
              >{showPw ? 'Hide' : 'Show'}</button>
            </div>
          </div>
          {error && (
            <p style={{ fontSize: '13px', color: '#dc2626', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '6px', padding: '10px 12px', margin: '0' }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 16px', background: '#6366f1', color: 'white', fontSize: '14px', fontWeight: '600',
              borderRadius: '6px', border: 'none', cursor: 'pointer', opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s'
            }}
          >{loading ? 'Signing in…' : 'Sign In'}</button>
        </form>
        <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginTop: '20px' }}>Mio QC · Powered by Meritto</p>
      </div>
    </div>
  )
}
