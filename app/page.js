'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from './components/Navbar'

const moods = [
  { label: 'Empty', emoji: '🕳️' },
  { label: 'Heartbroken', emoji: '💔' },
  { label: 'Wholesome', emoji: '🌸' },
  { label: 'Happy', emoji: '☀️' },
  { label: 'Need Recs', emoji: '📺' },
  { label: 'Need to Talk', emoji: '💬' },
  { label: 'Emotionally Destroyed', emoji: '😭' },
  { label: 'Healing', emoji: '🌿' },
]

export default function Home() {
  const [search, setSearch] = useState('')
  const router = useRouter()

  function handleSearch(e) {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/anime?search=${encodeURIComponent(search)}`)
    }
  }

  function handleMood(mood) {
    router.push(`/moods/${mood.toLowerCase().replace(/ /g, '-')}`)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <Navbar />

      {/* Hero */}
      <section style={{
        textAlign: 'center',
        padding: '80px 24px 60px',
        maxWidth: '720px',
        margin: '0 auto',
      }}>
        <p style={{
          fontSize: '13px',
          fontWeight: '500',
          color: 'var(--primary)',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          marginBottom: '16px',
        }}>
          a cosy place for romance recovery
        </p>

        <h1 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '52px',
          fontWeight: '600',
          color: 'var(--text)',
          lineHeight: '1.2',
          marginBottom: '20px',
        }}>
          What romance anime<br />stayed with you?
        </h1>

        <p style={{
          fontSize: '18px',
          color: 'var(--text-soft)',
          marginBottom: '40px',
          lineHeight: '1.6',
        }}>
          Find people who felt it too, talk after the ending,<br />and discover what to watch next.
        </p>

        {/* Search */}
        <form onSubmit={handleSearch} style={{
          display: 'flex',
          gap: '12px',
          maxWidth: '480px',
          margin: '0 auto 48px',
        }}>
          <input
            type="text"
            placeholder="Search the anime you just finished..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: '14px 20px',
              borderRadius: '30px',
              border: '2px solid var(--border)',
              backgroundColor: 'white',
              fontSize: '15px',
              color: 'var(--text)',
              outline: 'none',
            }}
          />
          <button type="submit" style={{
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '30px',
            padding: '14px 28px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
          }}>
            Find
          </button>
        </form>

        {/* Mood buttons */}
        <div>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-soft)',
            marginBottom: '16px',
            fontWeight: '500',
          }}>
            or tell us how you're feeling
          </p>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            justifyContent: 'center',
          }}>
            {moods.map((mood) => (
              <button
                key={mood.label}
                onClick={() => handleMood(mood.label)}
                style={{
                  backgroundColor: 'white',
                  border: '2px solid var(--border)',
                  borderRadius: '20px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {mood.emoji} {mood.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Recently Active Rooms */}
      <section style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '0 24px 60px',
      }}>
        <h2 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '28px',
          fontWeight: '600',
          color: 'var(--text)',
          marginBottom: '24px',
        }}>
          Recently Active Rooms
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
        }}>
          {[
            { title: 'Our Dating Story', mood: 'Empty but happy', replies: 18 },
            { title: 'Horimiya', mood: 'Wholesome', replies: 34 },
            { title: 'The Angel Next Door', mood: 'Healing', replies: 22 },
            { title: 'A Sign of Affection', mood: 'Soft and warm', replies: 15 },
            { title: 'Tsuki ga Kirei', mood: 'Emotionally destroyed', replies: 41 },
            { title: 'Your Lie in April', mood: 'Heartbroken', replies: 67 },
          ].map((room) => (
            <div key={room.title} style={{
              backgroundColor: 'white',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '20px',
              cursor: 'pointer',
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: 'var(--text)',
                marginBottom: '8px',
              }}>{room.title}</h3>
              <p style={{
                fontSize: '13px',
                color: 'var(--primary)',
                marginBottom: '12px',
                fontWeight: '500',
              }}>Most common mood: {room.mood}</p>
              <p style={{
                fontSize: '13px',
                color: 'var(--text-soft)',
              }}>{room.replies} replies today</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mood Rooms */}
      <section style={{
        backgroundColor: 'var(--lavender)',
        padding: '60px 24px',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '28px',
            fontWeight: '600',
            color: 'var(--text)',
            marginBottom: '8px',
          }}>
            Mood Rooms
          </h2>
          <p style={{
            fontSize: '15px',
            color: 'var(--text-soft)',
            marginBottom: '24px',
          }}>
            Find people feeling exactly what you feel right now.
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '16px',
          }}>
            {[
              { name: 'I Feel Empty', desc: 'For when real life feels too quiet after the ending.', emoji: '🕳️' },
              { name: 'I Need Wholesome Romance', desc: 'Soft, warm, no drama.', emoji: '🌸' },
              { name: 'I Want to Cry', desc: 'Sometimes you just need to feel it.', emoji: '😭' },
              { name: 'I Need a Happy Ending', desc: 'No tragedy allowed in here.', emoji: '💕' },
              { name: 'Post-Anime Depression', desc: 'The real empty feeling after something beautiful ends.', emoji: '🌙' },
              { name: 'I Need People to Talk To', desc: 'Find your romance anime people.', emoji: '💬' },
            ].map((room) => (
              <div key={room.name} style={{
                backgroundColor: 'white',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '20px',
                cursor: 'pointer',
              }}>
                <p style={{ fontSize: '24px', marginBottom: '10px' }}>{room.emoji}</p>
                <h3 style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: 'var(--text)',
                  marginBottom: '8px',
                }}>{room.name}</h3>
                <p style={{
                  fontSize: '13px',
                  color: 'var(--text-soft)',
                  lineHeight: '1.5',
                }}>{room.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '40px 24px',
        color: 'var(--text-soft)',
        fontSize: '14px',
        borderTop: '1px solid var(--border)',
      }}>
        nagomi — a cosy place for romance recovery 🌸
      </footer>
    </div>
  )
}