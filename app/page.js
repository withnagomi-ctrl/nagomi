'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from './components/Navbar'
import Link from 'next/link'
import { createClient } from './lib/supabase-client'

const moods = [
  { label: 'Empty', emoji: '🕳️', slug: 'empty' },
  { label: 'Heartbroken', emoji: '💔', slug: 'want-to-cry' },
  { label: 'Wholesome', emoji: '🌸', slug: 'wholesome' },
  { label: 'Happy', emoji: '☀️', slug: 'happy-ending' },
  { label: 'Need Recs', emoji: '📺', slug: 'healing' },
  { label: 'Need to Talk', emoji: '💬', slug: 'need-to-talk' },
  { label: 'Emotionally Destroyed', emoji: '😭', slug: 'emotionally-destroyed' },
  { label: 'Healing', emoji: '🌿', slug: 'healing' },
]

export default function Home() {
  const [search, setSearch] = useState('')
  const [presenceCounts, setPresenceCounts] = useState({})
  const [totalOnline, setTotalOnline] = useState(0)
  const [recentPosts, setRecentPosts] = useState([])
  const router = useRouter()
  const supabase = createClient()
  const [activeRooms, setActiveRooms] = useState([])

  useEffect(() => {
    async function loadData() {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()

      const { data: presenceData } = await supabase
        .from('room_presence')
        .select('room_slug')
        .gte('last_seen', twoMinutesAgo)

      if (presenceData) {
        const counts = {}
        presenceData.forEach(row => {
          counts[row.room_slug] = (counts[row.room_slug] || 0) + 1
        })
        setPresenceCounts(counts)
        setTotalOnline(presenceData.length)
      }

      const { data: posts } = await supabase
        .from('posts')
        .select('*, profiles(username), anime(title, slug)')
        .order('created_at', { ascending: false })
        .limit(6)

      setRecentPosts(posts || [])

      const { data: activeRooms } = await supabase
  .from('posts')
  .select('anime_id, anime(id, title, slug, image_url)')
  .not('anime_id', 'is', null)
  .order('created_at', { ascending: false })
  .limit(50)

if (activeRooms) {
  const roomMap = {}
  activeRooms.forEach(post => {
    if (!post.anime) return
    if (!roomMap[post.anime_id]) {
      roomMap[post.anime_id] = {
        ...post.anime,
        postCount: 0,
      }
    }
    roomMap[post.anime_id].postCount++
  })

  const sorted = Object.values(roomMap)
    .sort((a, b) => b.postCount - a.postCount)
    .slice(0, 6)

  setActiveRooms(sorted)
}
    }

    loadData()
    const interval = setInterval(loadData, 15000)
    return () => clearInterval(interval)
  }, [])

  function handleSearch(e) {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/anime?search=${encodeURIComponent(search)}`)
    }
  }

  function handleMood(slug) {
    router.push(`/moods/${slug}`)
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
          marginBottom: '16px',
          lineHeight: '1.6',
        }}>
          Find people who felt it too, talk after the ending,<br />and discover what to watch next.
        </p>

        {totalOnline > 0 && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'white',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '500',
            color: 'var(--text)',
            marginBottom: '32px',
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#4ade80',
              display: 'inline-block',
            }} />
            {totalOnline} {totalOnline === 1 ? 'person' : 'people'} online in mood rooms right now
          </div>
        )}

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
            {moods.map((mood) => {
              const count = presenceCounts[mood.slug] || 0
              return (
                <button
                  key={mood.label}
                  onClick={() => handleMood(mood.slug)}
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
                  {count > 0 && (
                    <span style={{
                      backgroundColor: 'var(--lavender)',
                      borderRadius: '20px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: 'var(--text)',
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Recently Active Rooms */}
      {activeRooms.length > 0 && (
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
      marginBottom: '8px',
    }}>
      Most Active Rooms
    </h2>
    <p style={{ fontSize: '15px', color: 'var(--text-soft)', marginBottom: '24px' }}>
      Anime people are talking about right now.
    </p>
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '16px',
    }}>
      {activeRooms.map(room => (
        <Link key={room.id} href={`/anime/${room.slug}`} style={{ textDecoration: 'none' }}>
          <div style={{
            backgroundColor: 'white',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '20px',
            cursor: 'pointer',
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
          }}>
            {room.image_url && (
              <img
                src={room.image_url}
                alt={room.title}
                style={{
                  width: '50px',
                  height: '70px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  flexShrink: 0,
                }}
              />
            )}
            <div>
              <h3 style={{
                fontSize: '15px',
                fontWeight: '600',
                color: 'var(--text)',
                marginBottom: '6px',
              }}>{room.title}</h3>
              <p style={{
                fontSize: '12px',
                color: 'var(--text-soft)',
              }}>{room.postCount} {room.postCount === 1 ? 'post' : 'posts'}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  </section>
)}

      {/* Mood Rooms with live counts */}
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
              { name: 'I Feel Empty', desc: 'For when real life feels too quiet after the ending.', emoji: '🕳️', slug: 'empty' },
              { name: 'I Need Wholesome Romance', desc: 'Soft, warm, no drama.', emoji: '🌸', slug: 'wholesome' },
              { name: 'I Want to Cry', desc: 'Sometimes you just need to feel it.', emoji: '😭', slug: 'want-to-cry' },
              { name: 'I Need a Happy Ending', desc: 'No tragedy allowed in here.', emoji: '💕', slug: 'happy-ending' },
              { name: 'Post-Anime Depression', desc: 'The real empty feeling after something beautiful ends.', emoji: '🌙', slug: 'post-anime-depression' },
              { name: 'I Need People to Talk To', desc: 'Find your romance anime people.', emoji: '💬', slug: 'need-to-talk' },
            ].map((room) => {
              const count = presenceCounts[room.slug] || 0
              return (
                <Link key={room.name} href={`/moods/${room.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    backgroundColor: 'white',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '20px',
                    cursor: 'pointer',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
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
                      flex: 1,
                      marginBottom: '12px',
                    }}>{room.desc}</p>
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
      </section>

      {/* Recent posts feed */}
      {recentPosts.length > 0 && (
        <section style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '60px 24px',
        }}>
          <h2 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '28px',
            fontWeight: '600',
            color: 'var(--text)',
            marginBottom: '24px',
          }}>
            Latest from the community
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px',
          }}>
            {recentPosts.map(post => (
              <div key={post.id} style={{
                backgroundColor: 'white',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '20px',
              }}>
                {post.anime && (
                  <p style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '500', marginBottom: '8px' }}>
                    📺 {post.anime.title}
                  </p>
                )}
                <p style={{
                  fontSize: '14px',
                  color: 'var(--text)',
                  lineHeight: '1.6',
                  marginBottom: '12px',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {post.content}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Link href={`/profile/${post.profiles?.username}`} style={{
                    fontSize: '13px',
                    color: 'var(--text-soft)',
                    textDecoration: 'none',
                    fontWeight: '500',
                  }}>
                    {post.profiles?.username}
                  </Link>
                  {post.mood && (
                    <span style={{
                      backgroundColor: 'var(--lavender)',
                      borderRadius: '20px',
                      padding: '3px 10px',
                      fontSize: '11px',
                      fontWeight: '500',
                      color: 'var(--text)',
                    }}>
                      {post.mood}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
       <footer style={{
        textAlign: 'center',
        padding: '40px 24px',
        color: 'var(--text-soft)',
        fontSize: '14px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        alignItems: 'center',
      }}>
        <p>nagomi — a cosy place for romance recovery 🌸</p>

        <div style={{
          display: 'flex',
          gap: '24px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          <a href="/rules" style={{ color: 'var(--text-soft)', textDecoration: 'none', fontSize: '13px' }}>
            Community Rules
          </a>

          <a href="/about" style={{ color: 'var(--text-soft)', textDecoration: 'none', fontSize: '13px' }}>
            About
          </a>

          <a href="/terms" style={{ color: 'var(--text-soft)', textDecoration: 'none', fontSize: '13px' }}>
            Terms
          </a>

          <a href="/privacy" style={{ color: 'var(--text-soft)', textDecoration: 'none', fontSize: '13px' }}>
            Privacy
          </a>
        </div>
      </footer>
    </div>
  )
}