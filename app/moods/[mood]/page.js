'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../../components/Navbar'
import PostCard from '../../components/PostCard'
import { createClient } from '../../lib/supabase-client'
import ReportModal from '../../components/ReportModal'
import { containsBannedWord } from '../../lib/wordFilter'
import { checkRateLimit } from '../../lib/rateLimit'

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

export default function MoodRoom() {
  const { mood } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const channelRef = useRef(null)
  const messagesEndRef = useRef(null)

  const room = moodRooms.find(r => r.slug === mood)

  const [messages, setMessages] = useState([])
  const [posts, setPosts] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [currentProfile, setCurrentProfile] = useState(null)
  const [onlineCount, setOnlineCount] = useState(0)
  const [messageInput, setMessageInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showPostForm, setShowPostForm] = useState(false)
  const [postContent, setPostContent] = useState('')
  const [postMood, setPostMood] = useState(room?.mood || '')
  const [submitting, setSubmitting] = useState(false)
  const [reportTarget, setReportTarget] = useState(null)
  const [blurSpoilers, setBlurSpoilers] = useState(true)

  const moodOptions = [
    'Empty', 'Heartbroken', 'Wholesome', 'Happy',
    'Emotionally Destroyed', 'Healing', 'Bittersweet', 'Warm',
  ]

  useEffect(() => {
  let presenceInterval
  let countInterval
  let currentChannel
  let cancelled = false
  const presenceKey = `guest_${Math.random().toString(36).slice(2)}`

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (cancelled) return

    setCurrentUser(user)
    const finalKey = user?.id || presenceKey

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()
      if (!cancelled) setCurrentProfile(profile)
    }

    if (user) {
        const { data: userPref } = await supabase
            .from('profiles')
            .select('blur_spoilers')
            .eq('id', user.id)
            .single()
        setBlurSpoilers(userPref?.blur_spoilers ?? true)
        }

    // Clean up messages older than 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    await supabase
    .from('mood_messages')
    .delete()
    .eq('room_slug', mood)
    .lt('created_at', twentyFourHoursAgo)

    const { data: recentMessages } = await supabase
    .from('mood_messages')
    .select('*')
    .eq('room_slug', mood)
    .order('created_at', { ascending: true })
    .limit(100)

    if (!cancelled) setMessages(recentMessages || [])
    if (!cancelled) await loadPosts()
    if (!cancelled) setLoading(false)

    await supabase
      .from('room_presence')
      .upsert({
        room_slug: mood,
        user_id: finalKey,
        last_seen: new Date().toISOString(),
      }, { onConflict: 'room_slug,user_id' })

    presenceInterval = setInterval(async () => {
      await supabase
        .from('room_presence')
        .upsert({
          room_slug: mood,
          user_id: finalKey,
          last_seen: new Date().toISOString(),
        }, { onConflict: 'room_slug,user_id' })
    }, 60000)

    async function refreshCount() {
      if (cancelled) return
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
      const { data } = await supabase
        .from('room_presence')
        .select('user_id')
        .eq('room_slug', mood)
        .gte('last_seen', twoMinutesAgo)
      if (!cancelled) setOnlineCount(data?.length || 1)
    }

    refreshCount()
    countInterval = setInterval(refreshCount, 15000)

    // Create channel and add listener BEFORE subscribing
    const channelName = `mood-room-${mood}-${Date.now()}`
    currentChannel = supabase.channel(channelName)

    currentChannel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'mood_messages',
        filter: `room_slug=eq.${mood}`,
      },
      (payload) => {
        if (!cancelled) setMessages(prev => [...prev, payload.new])
      }
    )

    currentChannel.subscribe()
    channelRef.current = currentChannel

    window.addEventListener('beforeunload', () => {
      supabase.from('room_presence').delete()
        .eq('room_slug', mood).eq('user_id', finalKey).then()
    })
  }

  load()

  return () => {
    cancelled = true
    clearInterval(presenceInterval)
    clearInterval(countInterval)
    if (currentChannel) {
      supabase.removeChannel(currentChannel)
    }
  }
}, [mood])

  useEffect(() => {
  if (messagesEndRef.current) {
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
}, [messages])

  async function loadPosts() {
    let query = supabase
      .from('posts')
      .select('*, profiles(username, avatar_url), reactions(*), anime(title, slug)')
      .order('created_at', { ascending: false })
      .limit(20)

    if (room?.mood) {
      query = query.eq('mood', room.mood)
    }

    const { data } = await query
    setPosts(data || [])
  }

  async function handleSendMessage(e) {
    e.preventDefault()
    if (!messageInput.trim()) return

    if (!currentUser) {
        router.push('/login')
        return
    }

    if (containsBannedWord(messageInput)) {
        alert('Your message contains inappropriate content and cannot be sent.')
        return
    }

    const { allowed, message } = await checkRateLimit(currentUser.id, 'live_chat')
    if (!allowed) {
        alert(message)
        return
    }

    setSending(true)

    await supabase
        .from('mood_messages')
        .insert({
        room_slug: mood,
        user_id: currentUser.id,
        username: currentProfile?.username || 'anonymous',
        content: messageInput.trim(),
        })

    setMessageInput('')
    setSending(false)
    }

    async function handlePost(e) {
        e.preventDefault()

        if (!currentUser) {
            router.push('/login')
            return
        }

        if (!postContent.trim()) return

        if (containsBannedWord(postContent)) {
            alert('Your post contains inappropriate content.')
            return
        }

        const { allowed, message } = await checkRateLimit(currentUser.id, 'post')

        if (!allowed) {
            alert(message)
            return
        }

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
        padding: '40px 24px',
        textAlign: 'center',
        borderBottom: '1px solid var(--border)',
      }}>
        <p style={{ fontSize: '40px', marginBottom: '12px' }}>{room.emoji}</p>
        <h1 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '32px',
          fontWeight: '600',
          color: 'var(--text)',
          marginBottom: '8px',
        }}>
          {room.name}
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-soft)', marginBottom: '12px' }}>
          {room.desc}
        </p>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'white',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          padding: '6px 16px',
          fontSize: '14px',
          fontWeight: '500',
          color: 'var(--text)',
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#4ade80',
            display: 'inline-block',
          }} />
          {onlineCount} {onlineCount === 1 ? 'person' : 'people'} here now
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Live chat section */}
        <div style={{
          backgroundColor: 'white',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          marginBottom: '40px',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#4ade80',
              display: 'inline-block',
            }} />
            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>
              Live Chat
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-soft)' }}>
              — talk with people feeling the same right now
            </span>
          </div>

          {/* Messages */}
          <div style={{
            height: '380px',
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            {loading ? (
              <p style={{ textAlign: 'center', color: 'var(--text-soft)', marginTop: '40px' }}>
                Connecting...
              </p>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-soft)', marginTop: '60px' }}>
                <p style={{ fontSize: '28px', marginBottom: '12px' }}>{room.emoji}</p>
                <p style={{ fontSize: '15px' }}>No one has said anything yet.</p>
                <p style={{ fontSize: '14px', marginTop: '4px' }}>Be the first to share how you're feeling.</p>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start',
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--lavender)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    flexShrink: 0,
                    overflow: 'hidden',
                    }}>
                    🌸
                    </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', marginBottom: '3px', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                        <Link href={`/profile/${msg.username}`} style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            color: 'var(--text)',
                            textDecoration: 'none',
                        }}>
                            {msg.username}
                        </Link>
                        <span style={{ fontSize: '11px', color: 'var(--text-soft)' }}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        </div>
                        {currentUser && msg.user_id !== currentUser.id && (
                        <button
                            onClick={() => setReportTarget({ userId: msg.user_id, content: msg.content })}
                            style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '12px',
                            color: 'var(--text-soft)',
                            padding: '2px 4px',
                            opacity: 0.5,
                            }}
                            title="Report message"
                        >
                            ⚑
                        </button>
                        )}
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: '1.5' }}>
                        {msg.content}
                    </p>
                    </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border)',
          }}>
            {currentUser ? (
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  placeholder="Share how you're feeling..."
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: '20px',
                    border: '2px solid var(--border)',
                    fontSize: '14px',
                    color: 'var(--text)',
                    outline: 'none',
                    backgroundColor: 'var(--bg)',
                  }}
                />
                <button
                  type="submit"
                  disabled={sending || !messageInput.trim()}
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: sending ? 'not-allowed' : 'pointer',
                    opacity: sending || !messageInput.trim() ? 0.7 : 1,
                  }}
                >
                  Send
                </button>
              </form>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-soft)', marginBottom: '10px' }}>
                  Join the conversation
                </p>
                <button
                  onClick={() => router.push('/login')}
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '10px 24px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Log in to chat
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recovery posts section */}
        <h2 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '24px',
          fontWeight: '600',
          color: 'var(--text)',
          marginBottom: '8px',
        }}>
          Recovery Posts
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-soft)', marginBottom: '20px' }}>
          Longer thoughts, recommendations, and comfort posts from the community.
        </p>

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
            {room.emoji} Write a longer post or ask for recommendations...
          </button>
        )}

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
              placeholder="Share how you're feeling, ask for recommendations, or leave a comfort post..."
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

        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-soft)' }}>
            <p style={{ fontSize: '15px' }}>No posts yet. Be the first to share.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={currentUser?.id}
                currentUsername={currentProfile?.username}
                blurSpoilers={blurSpoilers}
                />
            ))}
          </div>
        )}
      </div>

      {reportTarget && (
        <ReportModal
          reportedUserId={reportTarget.userId}
          messageContent={reportTarget.content}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  )
}