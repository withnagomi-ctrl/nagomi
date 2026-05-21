'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '../../components/Navbar'
import PostCard from '../../components/PostCard'
import { createClient } from '../../lib/supabase-client'

const moodRooms = [
  { name: 'I Feel Empty', slug: 'empty', emoji: '🕳️', desc: 'For when real life feels too quiet after the ending.', mood: 'Empty' },
  { name: 'I Need Wholesome Romance', slug: 'wholesome', emoji: '🌸', desc: 'Soft, warm, no drama.', mood: 'Wholesome' },
  { name: 'I Want to Cry', slug: 'want-to-cry', emoji: '😭', desc: 'Sometimes you just need to feel it.', mood: 'Heartbroken' },
  { name: 'I Need a Happy Ending', slug: 'happy-ending', emoji: '💕', desc: 'No tragedy allowed in here.', mood: 'Happy' },
  { name: 'I Need Actual Dating', slug: 'actual-dating', emoji: '💑', desc: 'No 24 episodes of almost holding hands.', mood: 'Wholesome' },
  { name: 'I Hate Love Triangles', slug: 'no-love-triangles', emoji: '🚫', desc: 'Just two people. That is it.', mood: 'Wholesome' },
  { name: 'I Want Slow Burn', slug: 'slow-burn', emoji: '🕯️', desc: 'The tension. The waiting. Worth it.', mood: 'Bittersweet' },
  { name: 'I Need Something Healing', slug: 'healing', emoji: '🌿', desc: 'Comfort romance for the soul.', mood: 'Healing' },
  { name: 'I Need People to Talk To', slug: 'need-to-talk', emoji: '💬', desc: 'Find your romance anime people.', mood: null },
  { name: 'Emotionally Destroyed', slug: 'emotionally-destroyed', emoji: '💀', desc: 'You watched something that ended you.', mood: 'Emotionally Destroyed' },
  { name: 'Post-Anime Depression', slug: 'post-anime-depression', emoji: '🌙', desc: 'The real empty feeling after something beautiful ends.', mood: 'Empty' },
  { name: 'Comfort Romance', slug: 'comfort', emoji: '🫂', desc: 'Warm, safe, rewatch forever.', mood: 'Healing' },
]

const moodOptions = [
  'Empty', 'Heartbroken', 'Wholesome', 'Happy',
  'Emotionally Destroyed', 'Healing', 'Bittersweet', 'Warm',
]

export default function MoodRoom() {
  const { mood } = useParams()
  const router = useRouter()
  const supabase = createClient()

  const room = moodRooms.find(r => r.slug === mood)

  const [posts, setPosts] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPostForm, setShowPostForm] = useState(false)
  const [postContent, setPostContent] = useState('')
  const [postMood, setPostMood] = useState(room?.mood || '')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
      await loadPosts()
      setLoading(false)
    }
    load()
  }, [mood])

  async function loadPosts() {
    let query = supabase
      .from('posts')
      .select('*, profiles(username, avatar_url), reactions(*), anime(title, slug)')
      .order('created_at', { ascending: false })
      .limit(50)

    if (room?.mood) {
      query = query.eq('mood', room.mood)
    }

    const { data } = await query
    setPosts(data || [])
  }

  async function handlePost(e) {
    e.preventDefault()
    if (!currentUser) {
      router.push('/login')
      return
    }
    if (!postContent.trim()) return
    setSubmitting(true)

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: currentUser.id,
        content: postContent,
        mood: postMood || room?.mood || null,
        post_type: 'Reaction',
        spoiler_level: 'none',
      })
      .select('*, profiles(username, avatar_url), reactions(*), anime(title, slug)')
      .single()

    if (!error && data) {
      setPosts(prev => [data, ...prev])
      setPostContent('')
      setShowPostForm(false)
    }

    setSubmitting(false)
  }

  if (!room) return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <Navbar />
      <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-soft)' }}>
        Mood room not found.
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <Navbar />

      {/* Header */}
      <div style={{
        backgroundColor: 'var(--lavender)',
        padding: '60px 24px',
        textAlign: 'center',
        borderBottom: '1px solid var(--border)',
      }}>
        <p style={{ fontSize: '48px', marginBottom: '16px' }}>{room.emoji}</p>
        <h1 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '36px',
          fontWeight: '600',
          color: 'var(--text)',
          marginBottom: '12px',
        }}>
          {room.name}
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--text-soft)', maxWidth: '480px', margin: '0 auto' }}>
          {room.desc}
        </p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Post button */}
        {!showPostForm && (
          <button
            onClick={() => currentUser ? setShowPostForm(true) : router.push('/login')}
            style={{
              width: '100%',
              backgroundColor: 'white',
              border: '2px solid var(--border)',
              borderRadius: '16px',
              padding: '16px 20px',
              fontSize: '15px',
              color: 'var(--text-soft)',
              cursor: 'pointer',
              textAlign: 'left',
              marginBottom: '24px',
            }}
          >
            {room.emoji} Share how you're feeling...
          </button>
        )}

        {/* Post form */}
        {showPostForm && (
          <div style={{
            backgroundColor: 'white',
            border: '2px solid var(--primary)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
          }}>
            <textarea
              value={postContent}
              onChange={e => setPostContent(e.target.value)}
              placeholder="Share how you're feeling..."
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                fontSize: '15px',
                color: 'var(--text)',
                outline: 'none',
                resize: 'vertical',
                backgroundColor: 'var(--bg)',
                marginBottom: '16px',
              }}
            />

            <select
              value={postMood}
              onChange={e => setPostMood(e.target.value)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: '2px solid var(--border)',
                fontSize: '14px',
                color: 'var(--text)',
                backgroundColor: 'white',
                outline: 'none',
                cursor: 'pointer',
                marginBottom: '16px',
              }}
            >
              <option value="">Select mood...</option>
              {moodOptions.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowPostForm(false)}
                style={{
                  backgroundColor: 'white',
                  border: '2px solid var(--border)',
                  borderRadius: '12px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'var(--text)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handlePost}
                disabled={submitting || !postContent.trim()}
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting || !postContent.trim() ? 0.7 : 1,
                }}
              >
                {submitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        )}

        {/* Posts */}
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-soft)', padding: '40px' }}>Loading...</p>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-soft)' }}>
            <p style={{ fontSize: '32px', marginBottom: '16px' }}>{room.emoji}</p>
            <p style={{ fontSize: '16px' }}>No posts yet. Be the first to share.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={currentUser?.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}