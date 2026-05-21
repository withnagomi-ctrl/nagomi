'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../lib/supabase-client'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginError) {
      setError(loginError.message)
      setLoading(false)
      return
    }

    router.push('/')
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        backgroundColor: 'white',
        border: '1px solid var(--border)',
        borderRadius: '24px',
        padding: '48px',
        width: '100%',
        maxWidth: '420px',
      }}>
        <h1 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '32px',
          fontWeight: '600',
          color: 'var(--text)',
          marginBottom: '8px',
          textAlign: 'center',
        }}>
          Welcome back
        </h1>
        <p style={{
          fontSize: '14px',
          color: 'var(--text-soft)',
          textAlign: 'center',
          marginBottom: '32px',
        }}>
          Nagomi missed you 🌸
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', display: 'block', marginBottom: '6px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '2px solid var(--border)',
                fontSize: '15px',
                color: 'var(--text)',
                outline: 'none',
                backgroundColor: 'var(--bg)',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', display: 'block', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="your password"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '2px solid var(--border)',
                fontSize: '15px',
                color: 'var(--text)',
                outline: 'none',
                backgroundColor: 'var(--bg)',
              }}
            />
          </div>

          {error && (
            <p style={{ fontSize: '13px', color: '#e85555', textAlign: 'center' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '14px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: '8px',
            }}
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-soft)', marginTop: '24px' }}>
          Don't have an account?{' '}
          <Link href="/signup" style={{ color: 'var(--primary)', fontWeight: '500', textDecoration: 'none' }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}