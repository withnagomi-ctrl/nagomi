'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import { createClient } from '../lib/supabase-client'
import { containsBannedWord } from '../lib/wordFilter'
import { checkRateLimit } from '../lib/rateLimit'
import ReportModal from '../components/ReportModal'

export default function Messages() {
  const supabase = createClient()
  const router = useRouter()
  const messagesEndRef = useRef(null)
  const channelRef = useRef(null)

  const [currentUser, setCurrentUser] = useState(null)
  const [currentProfile, setCurrentProfile] = useState(null)
  const [conversations, setConversations] = useState([])
  const [requests, setRequests] = useState([])
  const [activeConvo, setActiveConvo] = useState(null)
  const [activeIsRequest, setActiveIsRequest] = useState(false)
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [activeTab, setActiveTab] = useState('messages')
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
      await loadRequests(user.id)
      setLoading(false)

      const params = new URLSearchParams(window.location.search)
      const targetUsername = params.get('user')
      if (targetUsername) {
        const { data: targetProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', targetUsername)
          .single()

        if (targetProfile) {
            const { data: blockBetweenUsers } = await supabase
                .from('blocks')
                .select('*')
                .or(
                `and(blocker_id.eq.${user.id},blocked_id.eq.${targetProfile.id}),and(blocker_id.eq.${targetProfile.id},blocked_id.eq.${user.id})`
                )
                .maybeSingle()

            if (blockBetweenUsers) {
                alert('You cannot message this user because one of you has blocked the other.')
                return
            }

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

          // Check their messaging preference
            const { data: targetFullProfile } = await supabase
            .from('profiles')
            .select('who_can_message')
            .eq('id', targetProfile.id)
            .single()

            const msgPref = targetFullProfile?.who_can_message || 'requests'

            if (msgPref === 'nobody') {
            alert('This user is not accepting messages.')
            return
            }

            if (msgPref === 'mutuals' && !(iFollow && theyFollow)) {
            alert('This user only accepts messages from mutuals.')
            return
            }

            if (iFollow && theyFollow) {
            await openChat(user, targetProfile, false)
            } else {
            if (msgPref === 'everyone' || msgPref === 'requests') {
                const { data: existingRequest } = await supabase
                .from('messages')
                .select('*')
                .eq('sender_id', user.id)
                .eq('receiver_id', targetProfile.id)
                .eq('is_request', true)
                .single()

                if (existingRequest) {
                alert('You have already sent a message request to this user.')
                } else {
                await openChat(user, targetProfile, msgPref === 'requests' || !iFollow || !theyFollow)
                }
            }
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
      .eq('is_request', false)
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

  async function loadRequests(userId) {
    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(id, username, avatar_url)')
      .eq('receiver_id', userId)
      .eq('is_request', true)
      .eq('request_status', 'pending')
      .order('created_at', { ascending: false })

    setRequests(data || [])
  }

  async function openChat(user, otherProfile, isRequest) {
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    setActiveConvo(otherProfile)
    setActiveIsRequest(isRequest)
    setLoadingMessages(true)
    setMessages([])

    if (isRequest) {
      // For new request — show empty chat with send one message ability
      setLoadingMessages(false)
      return
    }

    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(id, username, avatar_url), receiver:profiles!messages_receiver_id_fkey(id, username, avatar_url)')
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${otherProfile.id}),and(sender_id.eq.${otherProfile.id},receiver_id.eq.${user.id})`
      )
      .order('created_at', { ascending: true })

    setMessages(data || [])
    setLoadingMessages(false)

    await supabase
      .from('messages')
      .update({ read: true })
      .eq('sender_id', otherProfile.id)
      .eq('receiver_id', user.id)
      .eq('read', false)

    setConversations(prev =>
      prev.map(convo =>
        convo.profile.id === otherProfile.id
          ? { ...convo, unread: 0 }
          : convo
      )
    )

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
    await openChat(currentUser, otherProfile, false)
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!messageInput.trim() || !activeConvo || !currentUser) return

        const { data: blockBetweenUsers } = await supabase
        .from('blocks')
        .select('*')
        .or(
            `and(blocker_id.eq.${currentUser.id},blocked_id.eq.${activeConvo.id}),and(blocker_id.eq.${activeConvo.id},blocked_id.eq.${currentUser.id})`
        )
        .maybeSingle()

        if (blockBetweenUsers) {
        alert('You cannot message this user because one of you has blocked the other.')
        return
        }

        if (containsBannedWord(messageInput)) {
      alert('Your message contains inappropriate content and cannot be sent.')
      return
    }

    const { allowed, message: limitMessage } = await checkRateLimit(currentUser.id, 'direct_message')
    if (!allowed) {
      alert(limitMessage)
      return
    }

    setSending(true)

    if (activeIsRequest) {
      // Send as a message request
      const { error: requestError } = await supabase
        .from('messages')
        .insert({
            sender_id: currentUser.id,
            receiver_id: activeConvo.id,
            content: messageInput.trim(),
            is_request: true,
            request_status: 'pending',
        })

        if (requestError) {
        alert(requestError.message)
        setSending(false)
        return
        }

        const { data: msgPref } = await supabase
        .from('profiles')
        .select('notif_messages, username')
        .eq('id', activeConvo.id)
        .single()

        if (msgPref?.notif_messages !== false) {
        await supabase
            .from('notifications')
            .insert({
            user_id: activeConvo.id,
            type: 'message',
            content: `${currentProfile.username} sent you a message request 💬`,
            link: '/messages',
            read: false,
            })
        }

        alert('Message request sent. They will be able to accept or decline it.')
      setActiveConvo(null)
      setActiveIsRequest(false)
    } else {
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
            sender_id: currentUser.id,
            receiver_id: activeConvo.id,
            content: messageInput.trim(),
        })

        if (messageError) {
        alert(messageError.message)
        setSending(false)
        return
        }

        await loadConversations(currentUser.id)
    }

    setMessageInput('')
    setSending(false)
  }

  async function handleAcceptRequest(request) {
    // Update request status
    await supabase
      .from('messages')
      .update({ is_request: false, request_status: 'accepted' })
      .eq('id', request.id)

    await loadRequests(currentUser.id)
    await loadConversations(currentUser.id)
    await openChat(currentUser, request.sender, false)
    setActiveTab('messages')
  }

  async function handleDeclineRequest(request) {
    await supabase
      .from('messages')
      .update({ request_status: 'declined' })
      .eq('id', request.id)

    await loadRequests(currentUser.id)
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

        {/* Sidebar */}
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
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            <button
              onClick={() => setActiveTab('messages')}
              style={{
                flex: 1,
                padding: '16px',
                fontSize: '14px',
                fontWeight: '600',
                color: activeTab === 'messages' ? 'var(--primary)' : 'var(--text-soft)',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'messages' ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              Messages
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              style={{
                flex: 1,
                padding: '16px',
                fontSize: '14px',
                fontWeight: '600',
                color: activeTab === 'requests' ? 'var(--primary)' : 'var(--text-soft)',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'requests' ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              Requests
              {requests.length > 0 && (
                <span style={{
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  fontSize: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600',
                  marginLeft: '6px',
                }}>
                  {requests.length}
                </span>
              )}
            </button>
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {activeTab === 'messages' && (
              <>
                {conversations.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-soft)' }}>
                    <p style={{ fontSize: '24px', marginBottom: '12px' }}>💬</p>
                    <p style={{ fontSize: '14px', marginBottom: '6px' }}>No conversations yet.</p>
                    <p style={{ fontSize: '12px', lineHeight: '1.5' }}>
                    Visit someone’s profile and send a respectful message request to start chatting.
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
                        overflow: 'hidden',
                        }}>
                        {convo.profile?.avatar_url ? (
                            <img
                            src={convo.profile.avatar_url}
                            alt={convo.profile?.username || 'user'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            '🌸'
                        )}
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
              </>
            )}

            {activeTab === 'requests' && (
              <>
                {requests.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-soft)' }}>
                    <p style={{ fontSize: '24px', marginBottom: '12px' }}>📬</p>
                    <p style={{ fontSize: '14px' }}>No message requests.</p>
                  </div>
                ) : (
                  requests.map(request => (
                    <div
                      key={request.id}
                      style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
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
                            {request.sender?.avatar_url ? (
                                <img
                                src={request.sender.avatar_url}
                                alt={request.sender?.username || 'user'}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                '🌸'
                            )}
                            </div>
                        <Link href={`/profile/${request.sender.username}`} style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: 'var(--text)',
                          textDecoration: 'none',
                        }}>
                          {request.sender.username}
                        </Link>
                      </div>
                      <p style={{
                        fontSize: '13px',
                        color: 'var(--text-soft)',
                        marginBottom: '12px',
                        backgroundColor: 'var(--bg)',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        lineHeight: '1.5',
                      }}>
                        "{request.content}"
                      </p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleAcceptRequest(request)}
                          style={{
                            flex: 1,
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeclineRequest(request)}
                          style={{
                            flex: 1,
                            backgroundColor: 'white',
                            border: '2px solid var(--border)',
                            borderRadius: '8px',
                            padding: '8px',
                            fontSize: '13px',
                            fontWeight: '500',
                            color: 'var(--text)',
                            cursor: 'pointer',
                          }}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
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
                    overflow: 'hidden',
                    flexShrink: 0,
                    }}>
                    {activeConvo?.avatar_url ? (
                        <img
                        src={activeConvo.avatar_url}
                        alt={activeConvo?.username || 'user'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        '🌸'
                    )}
                    </div>
                <Link href={`/profile/${activeConvo.username}`} style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: 'var(--text)',
                  textDecoration: 'none',
                }}>
                  {activeConvo.username}
                </Link>
                {activeIsRequest && (
                  <span style={{
                    backgroundColor: 'var(--lavender)',
                    color: 'var(--text)',
                    borderRadius: '20px',
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: '500',
                  }}>
                    Message Request
                  </span>
                )}
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
                ) : activeIsRequest ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-soft)', marginTop: '40px' }}>
                    <p style={{ fontSize: '24px', marginBottom: '12px' }}>📬</p>
                    <p style={{ fontSize: '14px', marginBottom: '4px' }}>
                      Send one message to {activeConvo.username}.
                    </p>
                    <p style={{ fontSize: '13px' }}>
                      They will be able to accept or decline your request.
                    </p>
                  </div>
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
                <div style={{
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    marginBottom: '12px',
                    fontSize: '12px',
                    color: 'var(--text-soft)',
                    lineHeight: '1.5',
                    }}>
                    Keep conversations respectful. Do not share private details like your school, address, phone number, exact location, passwords, or private social accounts.
                    </div>

                    <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    placeholder={activeIsRequest ? 'Send a message request...' : 'Send a message...'}
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
                    {activeIsRequest ? 'Request' : 'Send'}
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