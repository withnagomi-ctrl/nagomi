'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '../lib/supabase-client'



const reactionTypes = [
  { type: 'felt_this', label: 'Felt this', emoji: '🫀' },
  { type: 'same_pain', label: 'Same pain', emoji: '😭' },
  { type: 'comfort', label: 'Comfort', emoji: '🌸' },
  { type: 'heartbroken', label: 'Heartbroken', emoji: '💔' },
  { type: 'added_to_list', label: 'Added to list', emoji: '📺' },
]

export default function PostCard({ post, currentUserId, blurSpoilers }) {
  const [deleted, setDeleted] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [reactions, setReactions] = useState(post.reactions || [])
  const supabase = createClient()

  async function handleReaction(reactionType) {
    if (!currentUserId) return

    const existing = reactions.find(r => r.user_id === currentUserId && r.reaction_type === reactionType)

    if (existing) {
      await supabase
        .from('reactions')
        .delete()
        .eq('id', existing.id)
      setReactions(prev => prev.filter(r => r.id !== existing.id))
    } else {
      const { data } = await supabase
  .from('reactions')
  .insert({ post_id: post.id, user_id: currentUserId, reaction_type: reactionType })
  .select()
  .single()

if (data && post.user_id !== currentUserId) {
  const reactionLabel = reactionTypes.find(r => r.type === reactionType)?.label || reactionType
  await supabase
    .from('notifications')
    .insert({
      user_id: post.user_id,
      type: 'reaction',
      content: `Someone reacted "${reactionLabel}" to your post 🫀`,
      link: `/anime/${post.anime?.slug || ''}`,
      read: false,
    })
}

if (data) setReactions(prev => [...prev, data])
    }
  }

  async function handleDelete() {
    if (!currentUserId || currentUserId !== post.user_id) return
    const confirmed = window.confirm('Delete this post?')
    if (!confirmed) return

    await supabase
        .from('posts')
        .delete()
        .eq('id', post.id)

    setDeleted(true)
    }

  function getReactionCount(type) {
    return reactions.filter(r => r.reaction_type === type).length
  }

  function hasReacted(type) {
    return reactions.some(r => r.user_id === currentUserId && r.reaction_type === type)
  }

  if (deleted) return null

  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '20px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
          }}>
            🌸
          </div>
          <div>
            <Link href={`/profile/${post.profiles?.username}`} style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text)',
              textDecoration: 'none',
            }}>
              {post.profiles?.username || 'anonymous'}
            </Link>
            <p style={{ fontSize: '12px', color: 'var(--text-soft)' }}>
              {new Date(post.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {post.anime && (
            <Link href={`/anime/${post.anime.slug}`} style={{ textDecoration: 'none' }}>
                <p style={{
                fontSize: '13px',
                color: 'var(--primary)',
                fontWeight: '500',
                marginBottom: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                }}>
                {post.anime.title}
                </p>
            </Link>
          )}
          {post.mood && (
            <span style={{
              backgroundColor: 'var(--lavender)',
              color: 'var(--text)',
              borderRadius: '20px',
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: '500',
            }}>
              {post.mood}
            </span>
          )}
          {post.spoiler_level !== 'none' && (
            <span style={{
              backgroundColor: '#ffe4e4',
              color: '#e85555',
              borderRadius: '20px',
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: '500',
            }}>
              ⚠️ {post.spoiler_level} spoilers
            </span>
          )}
        </div>
      </div>

      {/* Content */}
    {post.spoiler_level !== 'none' && blurSpoilers && !revealed ? (
    <div style={{ position: 'relative', marginBottom: '16px' }}>
        <p style={{
        fontSize: '15px',
        color: 'var(--text)',
        lineHeight: '1.7',
        filter: 'blur(6px)',
        userSelect: 'none',
        }}>
        {post.content}
        </p>
        <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        }}>
        <button
            onClick={() => setRevealed(true)}
            style={{
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            padding: '8px 20px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            }}
        >
            ⚠️ Reveal spoiler
        </button>
        </div>
    </div>
    ) : (
    <p style={{
        fontSize: '15px',
        color: 'var(--text)',
        lineHeight: '1.7',
        marginBottom: '16px',
    }}>
        {post.content}
    </p>
    )}

      {/* Reactions and actions */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {reactionTypes.map(r => (
          <button
            key={r.type}
            onClick={() => handleReaction(r.type)}
            style={{
              backgroundColor: hasReacted(r.type) ? 'var(--lavender)' : 'var(--bg)',
              border: `1px solid ${hasReacted(r.type) ? 'var(--secondary)' : 'var(--border)'}`,
              borderRadius: '20px',
              padding: '6px 12px',
              fontSize: '13px',
              cursor: currentUserId ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: 'var(--text)',
            }}
          >
            {r.emoji} {getReactionCount(r.type) > 0 && getReactionCount(r.type)}
          </button>
        ))}
      </div>
      </div>
        {currentUserId === post.user_id && (
        <button
            onClick={handleDelete}
            style={{
            background: 'none',
            border: 'none',
            fontSize: '12px',
            color: 'var(--text-soft)',
            cursor: 'pointer',
            padding: '4px 8px',
            opacity: 0.6,
            }}
        >
            🗑 Delete
        </button>
        )}
    </div>
  )
}