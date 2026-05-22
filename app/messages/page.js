'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import { createClient } from '../lib/supabase-client'
import ReportModal from '../components/ReportModal'

export default function Messages() {
  const supabase = createClient()
  const router = useRouter()
  const messagesEndRef = useRef(null)
  const channelRef = useRef(null)

  const [currentUser, setCurrentUser] = useState(null)
  const [currentProfile, setCurrentProfile] = useState(null)
  const [conversations, setConversations] = useState([])
  const [activeConvo, setActiveConvo] = useState(null)
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [reportTarget, setReportTarget] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setCurrentUser(user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setCurrentProfile(profile)
      await loadConversations(user.id)
      setLoading(false)

      // Auto open conversation if user param is present
      const params = new URLSearchParams(window.location.search)
      const targetUsername = params.get('user')
      if (targetUsername) {
        const { data: targetProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', targetUsername)
          .single()

        if (targetProfile) {
          const { data: iFollow } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', user.id)
            .eq('following_id', targetProfile.id)
            .single()

          const { data: theyFollow } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', targetProfile.id)
            .eq('following_id', user.id)
            .single()

          if (iFollow && theyFollow) {
            await openChat(user, targetProfile)
          } else {
            alert('You can only message users who follow you back.')
          }
        }
      }
    }

    load()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages])

  async function loadConversations(userId) {
    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(id, username, avatar_url), receiver:profiles!messages_receiver_id_fkey(id, username, avatar_url)')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (!data) return

    const convMap = {}
    data.forEach(msg => {
      const other = msg.sender_id === userId ? msg.receiver : msg.sender
      if (!other) return
      if (!convMap[other.id]) {
        convMap[other.id] = {
          profile: other,
          lastMessage: msg,
          unread: 0,
        }
      }
      if (!msg.read && msg.receiver_id === userId) {
        convMap[other.id].unread++
      }
    })

    setConversations(Object.values(convMap))
  }

  // Single function to open a chat — always cleans up old channel first
  async function openChat(user, otherProfile) {
    // Clean up existing channel first
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    setActiveConvo(otherProfile)
    setLoadingMessages(true)
    setMessages([])

    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(id, username), receiver:profiles!messages_receiver_id_fkey(id, username)')
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${otherProfile.id}),and(sender_id.eq.${otherProfile.id},receiver_id.eq.${user.id})`
      )
      .order('created_at', { ascending: true })

    setMessages(data || [])
    setLoadingMessages(false)

    // Mark as read in database
    await supabase
    .from('messages')
    .update({ read: true })
    .eq('sender_id', otherProfile.id)
    .eq('receiver_id', user.id)
    .eq('read', false)

    // Clear unread count in state directly
    setConversations(prev =>
    prev.map(convo =>
        convo.profile.id === otherProfile.id
        ? { ...convo, unread: 0 }
        : convo
    )
    )

    // Set up single realtime channel
    const channelName = `messages-${[user.id, otherProfile.id].sort().join('-')}-${Date.now()}`
    const channel = supabase.channel(channelName)

    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      },
      (payload) => {
        const msg = payload.new
        const isRelevant =
          (msg.sender_id === user.id && msg.receiver_id === otherProfile.id) ||
          (msg.sender_id === otherProfile.id && msg.receiver_id === user.id)
        if (isRelevant) {
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev
            return [...prev, msg]
          })
        }
      }
    )

    channel.subscribe()
    channelRef.current = channel
  }

  async function openConversation(otherProfile) {
    if (!currentUser) return
    await openChat(currentUser, otherProfile)
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!messageInput.trim() || !activeConvo || !currentUser) return
    setSending(true)

    await supabase
      .from('messages')
      .insert({
        sender_id: currentUser.id,
        receiver_id: activeConvo.id,
        content: messageInput.trim(),
      })

    setMessageInput('')
    setSending(false)
    await loadConversations(currentUser.id)
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

      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '32px 24px',
        display: 'flex',
        gap: '24px',
        height: 'calc(100vh - 96px)',
      }}>

        {/* Conversations sidebar */}
        <div style={{
          width: '300px',
          flexShrink: 0,
          backgroundColor: 'white',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            padding: '20px',
            borderBottom: '1px solid var(--border)',
          }}>
            <h2 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '20px',
              fontWeight: '600',
              color: 'var(--text)',
            }}>
              Messages
            </h2>
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {conversations.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-soft)' }}>
                <p style={{ fontSize: '24px', marginBottom: '12px' }}>💬</p>
                <p style={{ fontSize: '14px' }}>No conversations yet.</p>
                <p style={{ fontSize: '13px', marginTop: '8px' }}>
                  Follow someone and have them follow you back to message them.
                </p>
              </div>
            ) : (
              conversations.map(convo => (
                <div
                  key={convo.profile.id}
                  onClick={() => openConversation(convo.profile)}
                  style={{
                    padding: '16px 20px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border)',
                    backgroundColor: activeConvo?.id === convo.profile.id ? 'var(--lavender)' : 'transparent',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--lavender)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    flexShrink: 0,
                  }}>
                    🌸
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>
                        {convo.profile.username}
                      </p>
                      {convo.unread > 0 && (
                        <span style={{
                          backgroundColor: 'var(--primary)',
                          color: 'white',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '600',
                        }}>
                          {convo.unread}
                        </span>
                      )}
                    </div>
                    <p style={{
                      fontSize: '13px',
                      color: 'var(--text-soft)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {convo.lastMessage.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div style={{
          flex: 1,
          backgroundColor: 'white',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {!activeConvo ? (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              color: 'var(--text-soft)',
              gap: '12px',
              padding: '24px',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '40px' }}>💬</p>
              <p style={{ fontSize: '16px' }}>Select a conversation or visit someone's profile to message them.</p>
            </div>
          ) : (
            <>
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--lavender)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                }}>
                  🌸
                </div>
                <Link href={`/profile/${activeConvo.username}`} style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: 'var(--text)',
                  textDecoration: 'none',
                }}>
                  {activeConvo.username}
                </Link>
              </div>

              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                {loadingMessages ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-soft)' }}>Loading...</p>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-soft)', marginTop: '40px' }}>
                    <p style={{ fontSize: '24px', marginBottom: '12px' }}>🌸</p>
                    <p style={{ fontSize: '14px' }}>Start the conversation!</p>
                  </div>
                ) : (
                  messages.map(msg => {
                const isOwn = msg.sender_id === currentUser.id
                return (
                    <div key={msg.id} style={{
                    display: 'flex',
                    justifyContent: isOwn ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-end',
                    gap: '6px',
                    }}>
                    {!isOwn && (
                        <button
                        onClick={() => setReportTarget({ userId: msg.sender_id, content: msg.content })}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '12px',
                            color: 'var(--text-soft)',
                            padding: '4px',
                            opacity: 0.5,
                            flexShrink: 0,
                        }}
                        title="Report message"
                        >
                        ⚑
                        </button>
                    )}
                    <div style={{
                        maxWidth: '70%',
                        backgroundColor: isOwn ? 'var(--primary)' : 'var(--bg)',
                        color: isOwn ? 'white' : 'var(--text)',
                        borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        padding: '10px 16px',
                        fontSize: '14px',
                        lineHeight: '1.5',
                    }}>
                        {msg.content}
                    </div>
                    </div>
                )
                })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div style={{
                padding: '16px 20px',
                borderTop: '1px solid var(--border)',
              }}>
                <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    placeholder="Send a message..."
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
              </div>
            </>
          )}
        </div>
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