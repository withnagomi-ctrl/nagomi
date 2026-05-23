'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase-client'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const router = useRouter()
  const supabase = createClient()
  const pathname = usePathname()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', user.id)
          .single()
        setProfile(profile)
        // Update last seen
        await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', user.id)
      }
      // Get unread notification count
        if (user) {
        const { count: notifCount } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('read', false)
        setUnreadNotifs(notifCount || 0)

        const { count: msgCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', user.id)
            .eq('read', false)
        setUnreadMessages(msgCount || 0)
        }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => setProfile(data))
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
  async function refreshCounts() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { count: notifCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)
    setUnreadNotifs(notifCount || 0)

    const { count: msgCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('read', false)
    setUnreadMessages(msgCount || 0)
  }

  refreshCounts()
}, [pathname])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav style={{
      backgroundColor: 'var(--bg-card)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <Link href="/" style={{
        fontFamily: 'Playfair Display, serif',
        fontSize: '24px',
        fontWeight: '600',
        color: 'var(--primary)',
        textDecoration: 'none',
        letterSpacing: '0.5px',
      }}>
        nagomi
      </Link>

      {/* Nav links */}
      <div style={{
        display: 'flex',
        gap: '32px',
        alignItems: 'center',
      }}>
        <Link href="/explore" style={{ color: 'var(--text-soft)', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
          Explore
        </Link>
        <Link href="/anime" style={{ color: 'var(--text-soft)', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
          Anime Rooms
        </Link>
        <Link href="/moods" style={{ color: 'var(--text-soft)', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
          Mood Rooms
        </Link>
        <Link href="/recommendations" style={{ color: 'var(--text-soft)', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
            Recommendations
            </Link>
            <Link href="/seasonal" style={{ color: 'var(--text-soft)', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
            Release Calendar
            </Link>
      </div>

      {/* Auth */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        {user && profile ? (
          <>
            <Link href="/notifications" style={{
                color: 'var(--text-soft)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                }}>
                🔔
                {unreadNotifs > 0 && (
                    <span style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-8px',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '600',
                    }}>
                    {unreadNotifs}
                    </span>
                )}
                </Link>
            <Link href="/messages" style={{
  color: 'var(--text-soft)',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: '500',
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
}}>
  💬
  {unreadMessages > 0 && (
    <span style={{
      position: 'absolute',
      top: '-6px',
      right: '-8px',
      backgroundColor: 'var(--primary)',
      color: 'white',
      borderRadius: '50%',
      width: '16px',
      height: '16px',
      fontSize: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '600',
    }}>
      {unreadMessages}
    </span>
  )}
</Link>
            <Link href={`/profile/${profile.username}`} style={{
              backgroundColor: 'var(--lavender)',
              color: 'var(--text)',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              padding: '8px 20px',
              borderRadius: '20px',
            }}>
              {profile.username}
            </Link>
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: 'transparent',
                border: '2px solid var(--border)',
                borderRadius: '20px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--text-soft)',
                cursor: 'pointer',
              }}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" style={{ color: 'var(--text-soft)', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
              Log in
            </Link>
            <Link href="/signup" style={{
              backgroundColor: 'var(--primary)',
              color: 'white',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              padding: '8px 20px',
              borderRadius: '20px',
            }}>
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}