'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../lib/supabase-client'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSignup(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Check username is taken
    const { data: existing } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single()

    if (existing) {
      setError('That username is already taken.')
      setLoading(false)
      return
    }

    // Sign up
    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signupError) {
      setError(signupError.message)
      setLoading(false)
      return
    }

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        username,
      })

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    router.push('/onboarding')
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
          Join Nagomi
        </h1>
        <p style={{
          fontSize: '14px',
          color: 'var(--text-soft)',
          textAlign: 'center',
          marginBottom: '32px',
        }}>
          A cosy place for romance recovery 🌸
        </p>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', display: 'block', marginBottom: '6px' }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="aftercredits"
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
              placeholder="at least 6 characters"
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
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-soft)', marginTop: '24px' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--primary)', fontWeight: '500', textDecoration: 'none' }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}