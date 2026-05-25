'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../lib/supabase-client'
import Navbar from '../../components/Navbar'

function FollowButton({ targetId, currentUserId, supabase }) {
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function check() {
      const { data } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetId)
        .single()
      setFollowing(!!data)
      setLoading(false)
    }
    check()
  }, [targetId])

  async function toggle() {
    if (following) {
      await supabase.from('follows').delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', targetId)
      setFollowing(false)
    } else {
      await supabase.from('follows').insert({
        follower_id: currentUserId,
        following_id: targetId,
      })
      setFollowing(true)
    }
  }

  if (loading) return null

  return (
    <button onClick={toggle} style={{
      backgroundColor: following ? 'white' : 'var(--primary)',
      border: following ? '2px solid var(--border)' : 'none',
      borderRadius: '20px',
      padding: '6px 16px',
      fontSize: '13px',
      fontWeight: '500',
      color: following ? 'var(--text)' : 'white',
      cursor: 'pointer',
      flexShrink: 0,
    }}>
      {following ? 'Following' : 'Follow'}
    </button>
  )
}

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
  const [isBlocked, setIsBlocked] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [showFollowingModal, setShowFollowingModal] = useState(false)
  const [followersList, setFollowersList] = useState([])
  const [followingList, setFollowingList] = useState([])
  const [loadingList, setLoadingList] = useState(false)

    function isOnline(lastSeen, showStatus) {
    if (!showStatus) return false
    if (!lastSeen) return false
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    return new Date(lastSeen) > fiveMinutesAgo
    }

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

      if (user) {
        const { data: blockData } = await supabase
            .from('blocks')
            .select('*')
            .eq('blocker_id', user.id)
            .eq('blocked_id', profileData.id)
            .single()
        setIsBlocked(!!blockData)

        const { data: muteData } = await supabase
            .from('mutes')
            .select('*')
            .eq('muter_id', user.id)
            .eq('muted_id', profileData.id)
            .single()
        setIsMuted(!!muteData)
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

    // Check their follow preference
    const { data: targetPref } = await supabase
        .from('profiles')
        .select('who_can_follow')
        .eq('id', profile.id)
        .single()

    if (targetPref?.who_can_follow === 'nobody' && !isFollowing) {
        alert('This user is not accepting followers.')
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

// Send notification
const { data: followPref } = await supabase
  .from('profiles')
  .select('notif_follows')
  .eq('id', profile.id)
  .single()

if (followPref?.notif_follows !== false) {
  await supabase
    .from('notifications')
    .insert({
        user_id: profile.id,
        actor_id: currentUser.id,
        type: 'follow',
        content: `${currentProfile.username} started following you 🌸`,
        link: `/profile/${currentProfile.username}`,
        read: false,
    })
}

setIsFollowing(true)
setFollowerCount(prev => prev + 1)
    }
  }

  async function loadFollowers() {
    setLoadingList(true)
    const { data } = await supabase
        .from('follows')
        .select('follower_id, profiles!follows_follower_id_fkey(id, username, avatar_url, bio)')
        .eq('following_id', profile.id)
    setFollowersList(data || [])
    setLoadingList(false)
    }

    async function loadFollowing() {
    setLoadingList(true)
    const { data } = await supabase
        .from('follows')
        .select('following_id, profiles!follows_following_id_fkey(id, username, avatar_url, bio)')
        .eq('follower_id', profile.id)
    setFollowingList(data || [])
    setLoadingList(false)
    }

  async function handleBlock() {
    if (!currentUser) return

    if (isBlocked) {
        await supabase
        .from('blocks')
        .delete()
        .eq('blocker_id', currentUser.id)
        .eq('blocked_id', profile.id)
        setIsBlocked(false)
    } else {
        await supabase
        .from('blocks')
        .insert({ blocker_id: currentUser.id, blocked_id: profile.id })
        setIsBlocked(true)
        // Also unfollow if following
        if (isFollowing) {
        await supabase
            .from('follows')
            .delete()
            .eq('follower_id', currentUser.id)
            .eq('following_id', profile.id)
        setIsFollowing(false)
        setFollowerCount(prev => prev - 1)
        }
    }
    }

    async function handleMute() {
    if (!currentUser) return

    if (isMuted) {
        await supabase
        .from('mutes')
        .delete()
        .eq('muter_id', currentUser.id)
        .eq('muted_id', profile.id)
        setIsMuted(false)
    } else {
        await supabase
        .from('mutes')
        .insert({ muter_id: currentUser.id, muted_id: profile.id })
        setIsMuted(true)
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
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--lavender)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                }}>
                    {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.username} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : '🌸'}
                </div>
                {isOnline(profile.last_seen, profile.show_online_status) && (
                    <div style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: '#4ade80',
                    border: '2px solid white',
                    }} />
                )}
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
                ⚙️ Settings
            </Link>
            ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                <button onClick={handleFollow} style={{
                backgroundColor: isFollowing ? 'white' : 'var(--primary)',
                border: isFollowing ? '2px solid var(--border)' : 'none',
                borderRadius: '20px',
                padding: '8px 20px',
                fontSize: '14px',
                fontWeight: '500',
                color: isFollowing ? 'var(--text)' : 'white',
                cursor: 'pointer',
                width: '120px',
                }}>
                {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button
                onClick={() => router.push(`/messages?user=${profile.username}`)}
                style={{
                    backgroundColor: 'white',
                    border: '2px solid var(--border)',
                    borderRadius: '20px',
                    padding: '8px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    width: '120px',
                }}
                >
                💬 Message
                </button>
                <button
                onClick={handleMute}
                style={{
                    backgroundColor: 'white',
                    border: '2px solid var(--border)',
                    borderRadius: '20px',
                    padding: '8px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    width: '120px',
                }}
                >
                {isMuted ? '🔔 Unmute' : '🔇 Mute'}
                </button>
                <button
                onClick={handleBlock}
                style={{
                    backgroundColor: isBlocked ? '#ffe4e4' : 'white',
                    border: `2px solid ${isBlocked ? '#e85555' : 'var(--border)'}`,
                    borderRadius: '20px',
                    padding: '8px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: isBlocked ? '#e85555' : 'var(--text)',
                    cursor: 'pointer',
                    width: '120px',
                }}
                >
                {isBlocked ? '🚫 Unblock' : '🚫 Block'}
                </button>
            </div>
            )}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '32px', marginBottom: '24px' }}>
            <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text)' }}>{posts.length}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-soft)' }}>Posts</p>
            </div>
            <div
                style={{ textAlign: 'center', cursor: 'pointer' }}
                onClick={() => { setShowFollowersModal(true); loadFollowers() }}
            >
                <p style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text)' }}>{followerCount}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-soft)', textDecoration: 'underline' }}>Followers</p>
            </div>
            <div
                style={{ textAlign: 'center', cursor: 'pointer' }}
                onClick={() => { setShowFollowingModal(true); loadFollowing() }}
            >
                <p style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text)' }}>{followingCount}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-soft)', textDecoration: 'underline' }}>Following</p>
            </div>
            </div>

          {/* Anime info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
            {profile.favourite_anime?.length > 0 && (profile.show_favourite_anime !== false || isOwnProfile) && (
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
      {/* Followers Modal */}
        {showFollowersModal && (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '24px',
        }}>
            <div style={{
            backgroundColor: 'white', borderRadius: '20px',
            width: '100%', maxWidth: '420px', maxHeight: '80vh',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', fontWeight: '600', color: 'var(--text)' }}>
                Followers
                </h3>
                <button onClick={() => setShowFollowersModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-soft)' }}>
                ✕
                </button>
            </div>
            <div style={{ overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {loadingList ? (
                <p style={{ textAlign: 'center', color: 'var(--text-soft)', padding: '20px' }}>Loading...</p>
                ) : followersList.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-soft)', padding: '20px' }}>No followers yet.</p>
                ) : (
                followersList.map(f => (
                    <div key={f.follower_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <Link
                        href={`/profile/${f.profiles?.username}`}
                        onClick={() => setShowFollowersModal(false)}
                        style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', textDecoration: 'none', flex: 1 }}
                    >
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--lavender)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', overflow: 'hidden', flexShrink: 0 }}>
                                {f.profiles?.avatar_url ? (
                                <img src={f.profiles.avatar_url} alt={f.profiles?.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : '🌸'}
                            </div>
                            {f.profiles?.username}
                            </div>
                        {f.profiles?.bio && (
                        <p style={{ fontSize: '12px', color: 'var(--text-soft)', fontWeight: '400', marginTop: '2px' }}>
                            {f.profiles.bio.slice(0, 50)}{f.profiles.bio.length > 50 ? '...' : ''}
                        </p>
                        )}
                    </Link>
                    {currentUser && f.follower_id !== currentUser.id && (
                        <FollowButton
                        targetId={f.follower_id}
                        targetUsername={f.profiles?.username}
                        currentUserId={currentUser.id}
                        supabase={supabase}
                        />
                    )}
                    </div>
                ))
                )}
            </div>
            </div>
        </div>
        )}

        {/* Following Modal */}
        {showFollowingModal && (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '24px',
        }}>
            <div style={{
            backgroundColor: 'white', borderRadius: '20px',
            width: '100%', maxWidth: '420px', maxHeight: '80vh',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', fontWeight: '600', color: 'var(--text)' }}>
                Following
                </h3>
                <button onClick={() => setShowFollowingModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-soft)' }}>
                ✕
                </button>
            </div>
            <div style={{ overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {loadingList ? (
                <p style={{ textAlign: 'center', color: 'var(--text-soft)', padding: '20px' }}>Loading...</p>
                ) : followingList.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-soft)', padding: '20px' }}>Not following anyone yet.</p>
                ) : (
                followingList.map(f => (
                    <div key={f.following_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <Link
                        href={`/profile/${f.profiles?.username}`}
                        onClick={() => setShowFollowingModal(false)}
                        style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', textDecoration: 'none', flex: 1 }}
                    >
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--lavender)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', overflow: 'hidden', flexShrink: 0 }}>
                                {f.profiles?.avatar_url ? (
                                <img src={f.profiles.avatar_url} alt={f.profiles?.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : '🌸'}
                            </div>
                            {f.profiles?.username}
                            </div>
                        {f.profiles?.bio && (
                        <p style={{ fontSize: '12px', color: 'var(--text-soft)', fontWeight: '400', marginTop: '2px' }}>
                            {f.profiles.bio.slice(0, 50)}{f.profiles.bio.length > 50 ? '...' : ''}
                        </p>
                        )}
                    </Link>
                    {currentUser && f.following_id !== currentUser.id && (
                        <FollowButton
                        targetId={f.following_id}
                        targetUsername={f.profiles?.username}
                        currentUserId={currentUser.id}
                        supabase={supabase}
                        />
                    )}
                    </div>
                ))
                )}
            </div>
            </div>
        </div>
        )}
    </div>
  )
}