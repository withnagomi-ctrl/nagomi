'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '../lib/supabase-client'
import { containsBannedWord } from '../lib/wordFilter'
import { checkRateLimit } from '../lib/rateLimit'

const reactionTypes = [
  { type: 'felt_this', emoji: '🫀' },
  { type: 'same', emoji: '😭' },
  { type: 'comfort', emoji: '🌸' },
  { type: 'heartbroken', emoji: '💔' },
]

function CommentReactions({ comment, currentUserId }) {
  const [reactions, setReactions] = useState(comment.comment_reactions || [])
  const supabase = createClient()

  async function handleReaction(reactionType) {
    if (!currentUserId) return

    const existing = reactions.find(r => r.user_id === currentUserId && r.reaction_type === reactionType)

    if (existing) {
      await supabase
        .from('comment_reactions')
        .delete()
        .eq('id', existing.id)
      setReactions(prev => prev.filter(r => r.id !== existing.id))
    } else {
      const { data } = await supabase
        .from('comment_reactions')
        .insert({ comment_id: comment.id, user_id: currentUserId, reaction_type: reactionType })
        .select()
        .single()
      if (data) setReactions(prev => [...prev, data])

      // Notify comment owner
      if (comment.user_id !== currentUserId) {
        const { data: pref } = await supabase
          .from('profiles')
          .select('notif_reactions, username')
          .eq('id', comment.user_id)
          .single()

        if (pref?.notif_reactions !== false) {
          await supabase.from('notifications').insert({
            user_id: comment.user_id,
            type: 'reaction',
            content: `Someone reacted to your comment 🫀`,
            read: false,
          })
        }
      }
    }
  }

  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
      {reactionTypes.map(r => {
        const count = reactions.filter(rx => rx.reaction_type === r.type).length
        const reacted = reactions.some(rx => rx.user_id === currentUserId && rx.reaction_type === r.type)
        return (
          <button
            key={r.type}
            onClick={() => handleReaction(r.type)}
            style={{
              backgroundColor: reacted ? 'var(--lavender)' : 'var(--bg)',
              border: `1px solid ${reacted ? 'var(--secondary)' : 'var(--border)'}`,
              borderRadius: '20px',
              padding: '4px 10px',
              fontSize: '12px',
              cursor: currentUserId ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: 'var(--text)',
            }}
          >
            {r.emoji} {count > 0 && count}
          </button>
        )
      })}
    </div>
  )
}

export default function CommentSection({ postId, postOwnerId, currentUserId, currentUsername }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadComments()
  }, [postId])

  async function loadComments() {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(username, avatar_url), comment_reactions(*)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    setComments(data || [])
    setLoading(false)
  }

  function handleReply(comment) {
    setReplyingTo(comment)
    setInput(`@${comment.profiles?.username} `)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!input.trim() || !currentUserId) return

    if (containsBannedWord(input)) {
    alert('Your comment contains inappropriate content and cannot be posted.')
    return
    }

    const { allowed, message: limitMessage } = await checkRateLimit(currentUserId, 'comment')

    if (!allowed) {
        alert(limitMessage)
        return
    }

    setSubmitting(true)

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: currentUserId,
        content: input.trim(),
        parent_id: replyingTo?.id || null,
      })
      .select('*, profiles(username, avatar_url), comment_reactions(*)')
      .single()

    if (!error && data) {
      setComments(prev => [...prev, data])
      setInput('')
      setReplyingTo(null)

      // Notify post owner if commenting (not replying)
      if (!replyingTo && postOwnerId && postOwnerId !== currentUserId) {
        const { data: pref } = await supabase
          .from('profiles')
          .select('notif_replies')
          .eq('id', postOwnerId)
          .single()

        if (pref?.notif_replies !== false) {
          await supabase.from('notifications').insert({
            user_id: postOwnerId,
            type: 'comment',
            content: `${currentUsername} commented on your post 💬`,
            read: false,
          })
        }
      }

      // Notify parent comment owner if replying
      if (replyingTo && replyingTo.user_id !== currentUserId) {
        const { data: pref } = await supabase
          .from('profiles')
          .select('notif_replies')
          .eq('id', replyingTo.user_id)
          .single()

        if (pref?.notif_replies !== false) {
          await supabase.from('notifications').insert({
            user_id: replyingTo.user_id,
            type: 'comment',
            content: `${currentUsername} replied to your comment 💬`,
            read: false,
          })
        }
      }
    }

    setSubmitting(false)
  }

  async function handleDelete(commentId) {
    await supabase.from('comments').delete().eq('id', commentId)
    setComments(prev => prev.filter(c => c.id !== commentId))
  }

  const visibleComments = showAll ? comments : comments.slice(0, 3)

  return (
    <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>

      {/* Comment count */}
      <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-soft)', marginBottom: '12px' }}>
        💬 {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
      </p>

      {/* Comments list */}
      {!loading && visibleComments.map(comment => (
        <div key={comment.id} style={{
          marginBottom: '12px',
          paddingLeft: comment.parent_id ? '24px' : '0',
          borderLeft: comment.parent_id ? '2px solid var(--border)' : 'none',
        }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'var(--lavender)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                flexShrink: 0,
                overflow: 'hidden',
                }}>
                {comment.profiles?.avatar_url ? (
                    <img src={comment.profiles.avatar_url} alt={comment.profiles?.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : '🌸'}
                </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', marginBottom: '4px' }}>
                <Link href={`/profile/${comment.profiles?.username}`} style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'var(--text)',
                  textDecoration: 'none',
                }}>
                  {comment.profiles?.username}
                </Link>
                <span style={{ fontSize: '11px', color: 'var(--text-soft)' }}>
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: '1.5', marginBottom: '6px' }}>
                {comment.content}
              </p>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {currentUserId && (
                  <button
                    onClick={() => handleReply(comment)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '12px',
                      color: 'var(--text-soft)',
                      cursor: 'pointer',
                      padding: 0,
                      fontWeight: '500',
                    }}
                  >
                    Reply
                  </button>
                )}
                {currentUserId === comment.user_id && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '12px',
                      color: 'var(--text-soft)',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
              <CommentReactions comment={comment} currentUserId={currentUserId} />
            </div>
          </div>
        </div>
      ))}

      {comments.length > 3 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '13px',
            color: 'var(--primary)',
            cursor: 'pointer',
            fontWeight: '500',
            marginBottom: '12px',
            padding: 0,
          }}
        >
          View all {comments.length} comments
        </button>
      )}

      {/* Reply indicator */}
      {replyingTo && (
        <div style={{
          backgroundColor: 'var(--lavender)',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '12px',
          color: 'var(--text-soft)',
          marginBottom: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span>Replying to @{replyingTo.profiles?.username}</span>
          <button
            onClick={() => { setReplyingTo(null); setInput('') }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--text-soft)' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Comment input */}
      {currentUserId && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Add a comment..."
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '20px',
              border: '2px solid var(--border)',
              fontSize: '13px',
              color: 'var(--text)',
              outline: 'none',
              backgroundColor: 'var(--bg)',
            }}
          />
          <button
            type="submit"
            disabled={submitting || !input.trim()}
            style={{
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting || !input.trim() ? 0.7 : 1,
            }}
          >
            Post
          </button>
        </form>
      )}

      {!currentUserId && (
        <p style={{ fontSize: '13px', color: 'var(--text-soft)', marginTop: '8px' }}>
          <Link href="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '500' }}>Log in</Link> to comment.
        </p>
      )}
    </div>
  )
}