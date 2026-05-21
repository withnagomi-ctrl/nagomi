'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../lib/supabase-client'
import Navbar from '../../components/Navbar'

export default function ProfilePage() {
  const { username } = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [currentProfile, setCurrentProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      if (user) {
        const { data: cp } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setCurrentProfile(cp)
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()

      if (!profileData) {
        router.push('/')
        return
      }

      setProfile(profileData)

      const { data: postsData } = await supabase
        .from('posts')
        .select('*, anime(title, slug)')
        .eq('user_id', profileData.id)
        .order('created_at', { ascending: false })
        .limit(20)

      setPosts(postsData || [])

      const { count: followers } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', profileData.id)

      const { count: following } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', profileData.id)

      setFollowerCount(followers || 0)
      setFollowingCount(following || 0)

      if (user) {
        const { data: followData } = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', user.id)
          .eq('following_id', profileData.id)
          .single()
        setIsFollowing(!!followData)
      }

      setLoading(false)
    }

    load()
  }, [username])

  async function handleFollow() {
    if (!currentUser) {
      router.push('/login')
      return
    }

    if (isFollowing) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUser.id)
        .eq('following_id', profile.id)
      setIsFollowing(false)
      setFollowerCount(prev => prev - 1)
    } else {
      await supabase
        .from('follows')
        .insert({ follower_id: currentUser.id, following_id: profile.id })
      setIsFollowing(true)
      setFollowerCount(prev => prev + 1)
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

  const isOwnProfile = currentUser && currentProfile?.username === username

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <Navbar />

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px' }}>

        {/* Profile header */}
        <div style={{
          backgroundColor: 'white',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '40px',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              {/* Avatar */}
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: 'var(--lavender)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                flexShrink: 0,
              }}>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.username} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : '🌸'}
              </div>
              <div>
                <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>
                  {profile.username}
                </h1>
                <p style={{ fontSize: '14px', color: 'var(--text-soft)' }}>
                  {profile.bio || 'No bio yet.'}
                </p>
              </div>
            </div>

            {/* Action button */}
            {isOwnProfile ? (
              <Link href="/settings" style={{
                backgroundColor: 'white',
                border: '2px solid var(--border)',
                borderRadius: '20px',
                padding: '8px 20px',
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--text)',
                textDecoration: 'none',
              }}>
                Edit profile
              </Link>
            ) : (
              <button onClick={handleFollow} style={{
                backgroundColor: isFollowing ? 'white' : 'var(--primary)',
                border: isFollowing ? '2px solid var(--border)' : 'none',
                borderRadius: '20px',
                padding: '8px 20px',
                fontSize: '14px',
                fontWeight: '500',
                color: isFollowing ? 'var(--text)' : 'white',
                cursor: 'pointer',
              }}>
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '32px', marginBottom: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text)' }}>{posts.length}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-soft)' }}>Posts</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text)' }}>{followerCount}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-soft)' }}>Followers</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text)' }}>{followingCount}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-soft)' }}>Following</p>
            </div>
          </div>

          {/* Anime info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
            {profile.favourite_anime?.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '14px' }}>💕</span>
                <span style={{ fontSize: '14px', color: 'var(--text-soft)' }}>Favourite:</span>
                <span style={{ fontSize: '14px', color: 'var(--text)', fontWeight: '500' }}>{profile.favourite_anime.join(', ')}</span>
              </div>
            )}
            {profile.anime_that_broke_me && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '14px' }}>💔</span>
                <span style={{ fontSize: '14px', color: 'var(--text-soft)' }}>Broke me:</span>
                <span style={{ fontSize: '14px', color: 'var(--text)', fontWeight: '500' }}>{profile.anime_that_broke_me}</span>
              </div>
            )}
            {profile.anime_that_healed_me && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '14px' }}>🌿</span>
                <span style={{ fontSize: '14px', color: 'var(--text-soft)' }}>Healed me:</span>
                <span style={{ fontSize: '14px', color: 'var(--text)', fontWeight: '500' }}>{profile.anime_that_healed_me}</span>
              </div>
            )}
          </div>

          {/* Mood tags */}
          {profile.mood_tags?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {profile.mood_tags.map(tag => (
                <span key={tag} style={{
                  backgroundColor: 'var(--lavender)',
                  color: 'var(--text)',
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: '500',
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Looking for */}
          {profile.looking_for?.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-soft)' }}>Looking for:</span>
              {profile.looking_for.map(item => (
                <span key={item} style={{
                  backgroundColor: 'var(--cream)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  borderRadius: '20px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: '500',
                }}>
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Posts */}
        <h2 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '22px',
          fontWeight: '600',
          color: 'var(--text)',
          marginBottom: '16px',
        }}>
          Posts
        </h2>

        {posts.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '40px',
            textAlign: 'center',
            color: 'var(--text-soft)',
            fontSize: '15px',
          }}>
            No posts yet. {isOwnProfile ? 'Start by joining an anime room!' : ''}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {posts.map(post => (
              <div key={post.id} style={{
                backgroundColor: 'white',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '20px',
              }}>
                {post.anime && (
                  <p style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '500', marginBottom: '8px' }}>
                    {post.anime.title}
                  </p>
                )}
                {post.mood && (
                  <p style={{ fontSize: '12px', color: 'var(--text-soft)', marginBottom: '8px' }}>
                    Feeling: {post.mood}
                  </p>
                )}
                <p style={{ fontSize: '15px', color: 'var(--text)', lineHeight: '1.6' }}>
                  {post.content}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-soft)', marginTop: '12px' }}>
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}