'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import { createClient } from '../lib/supabase-client'

const moodRooms = [
  { name: 'I Feel Empty', slug: 'empty', emoji: '🕳️', desc: 'For when real life feels too quiet after the ending.' },
  { name: 'I Need Wholesome Romance', slug: 'wholesome', emoji: '🌸', desc: 'Soft, warm, no drama.' },
  { name: 'I Want to Cry', slug: 'want-to-cry', emoji: '😭', desc: 'Sometimes you just need to feel it.' },
  { name: 'I Need a Happy Ending', slug: 'happy-ending', emoji: '💕', desc: 'No tragedy allowed in here.' },
  { name: 'I Need Actual Dating', slug: 'actual-dating', emoji: '💑', desc: 'No 24 episodes of almost holding hands.' },
  { name: 'I Hate Love Triangles', slug: 'no-love-triangles', emoji: '🚫', desc: 'Just two people. That is it.' },
  { name: 'I Want Slow Burn', slug: 'slow-burn', emoji: '🕯️', desc: 'The tension. The waiting. Worth it.' },
  { name: 'I Need Something Healing', slug: 'healing', emoji: '🌿', desc: 'Comfort romance for the soul.' },
  { name: 'I Need People to Talk To', slug: 'need-to-talk', emoji: '💬', desc: 'Find your romance anime people.' },
  { name: 'Emotionally Destroyed', slug: 'emotionally-destroyed', emoji: '💀', desc: 'You watched something that ended you.' },
  { name: 'Post-Anime Depression', slug: 'post-anime-depression', emoji: '🌙', desc: 'The real empty feeling after something beautiful ends.' },
  { name: 'Comfort Romance', slug: 'comfort', emoji: '🫂', desc: 'Warm, safe, rewatch forever.' },
]

export default function MoodsPage() {
  const [presenceCounts, setPresenceCounts] = useState({})
  const supabase = createClient()

  useEffect(() => {
    async function loadCounts() {
      // Only count users seen in the last 2 minutes as online
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()

      const { data } = await supabase
        .from('room_presence')
        .select('room_slug')
        .gte('last_seen', twoMinutesAgo)

      if (data) {
        const counts = {}
        data.forEach(row => {
          counts[row.room_slug] = (counts[row.room_slug] || 0) + 1
        })
        setPresenceCounts(counts)
      }
    }

    loadCounts()

    // Refresh counts every 15 seconds
    const interval = setInterval(loadCounts, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <Navbar />

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '36px',
          fontWeight: '600',
          color: 'var(--text)',
          marginBottom: '8px',
        }}>
          Mood Rooms
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-soft)', marginBottom: '40px' }}>
          Find people feeling exactly what you feel right now.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
        }}>
          {moodRooms.map(room => {
            const count = presenceCounts[room.slug] || 0
            return (
              <Link
                key={room.slug}
                href={`/moods/${room.slug}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  backgroundColor: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  padding: '24px',
                  cursor: 'pointer',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  <p style={{ fontSize: '32px', marginBottom: '12px' }}>{room.emoji}</p>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'var(--text)',
                    marginBottom: '8px',
                  }}>
                    {room.name}
                  </h3>
                  <p style={{
                    fontSize: '13px',
                    color: 'var(--text-soft)',
                    lineHeight: '1.6',
                    flex: 1,
                    marginBottom: '16px',
                  }}>
                    {room.desc}
                  </p>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: count > 0 ? '#16a34a' : 'var(--text-soft)',
                  }}>
                    <span style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: count > 0 ? '#4ade80' : 'var(--border)',
                      display: 'inline-block',
                    }} />
                    {count > 0 ? `${count} online now` : 'No one online yet'}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}