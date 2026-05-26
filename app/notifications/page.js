'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import { createClient } from '../lib/supabase-client'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const channelRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data } = await supabase
      .from('notifications')
      .select('*, actor:profiles!notifications_actor_id_fkey(username, avatar_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

      if (!cancelled) {
        setNotifications(data || [])
        setLoading(false)
      }

      // Mark all as read
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      // Realtime listener for new notifications
      const channel = supabase.channel(`notifications-${user.id}-${Date.now()}`)

      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          if (cancelled) return

          const { data: fullNotification } = await supabase
            .from('notifications')
            .select('*, actor:profiles!notifications_actor_id_fkey(username, avatar_url)')
            .eq('id', payload.new.id)
            .single()

          const notificationToAdd = fullNotification || payload.new

          setNotifications(prev => {
            if (prev.some(n => n.id === notificationToAdd.id)) return prev
            return [notificationToAdd, ...prev]
          })

          // Mark new notification as read immediately since we're on the page
          supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', payload.new.id)
            .then()
        }
      )

      channel.subscribe()
      channelRef.current = channel
    }

    load()

    return () => {
      cancelled = true
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [])

  function getNotificationIcon(type) {
    switch (type) {
      case 'follow': return '🌸'
      case 'reaction': return '🫀'
      case 'comment': return '💬'
      case 'message': return '✉️'
      case 'watch_club': return '📺'
      default: return '🔔'
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <Navbar />
      <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-soft)' }}>
        Loading...
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <Navbar />

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '36px',
          fontWeight: '600',
          color: 'var(--text)',
          marginBottom: '8px',
        }}>
          Notifications
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-soft)', marginBottom: '32px' }}>
          What's been happening while you were away.
        </p>

        {notifications.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '60px',
            textAlign: 'center',
            color: 'var(--text-soft)',
          }}>
            <p style={{ fontSize: '32px', marginBottom: '12px' }}>🔔</p>
            <p style={{ fontSize: '15px', marginBottom: '6px' }}>No notifications yet.</p>
            <p style={{ fontSize: '13px', lineHeight: '1.6' }}>
              Follow people, post in anime rooms, or join mood rooms to start seeing activity here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => notif.link && router.push(notif.link)}
                style={{
                  backgroundColor: notif.read ? 'white' : 'var(--lavender)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start',
                  cursor: notif.link ? 'pointer' : 'default',
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--lavender)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  flexShrink: 0,
                  overflow: 'hidden',
                }}>
                  {notif.actor?.avatar_url ? (
                    <img
                      src={notif.actor.avatar_url}
                      alt={notif.actor?.username || 'user'}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    getNotificationIcon(notif.type)
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: '1.5' }}>
                    {notif.content}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-soft)', marginTop: '4px' }}>
                    {new Date(notif.created_at).toLocaleDateString()} at {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {!notif.read && (
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    flexShrink: 0,
                    marginTop: '4px',
                  }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}