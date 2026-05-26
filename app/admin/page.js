'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import { createClient } from '../lib/supabase-client'

export default function AdminDashboard() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('reports')
  const [reports, setReports] = useState([])
  const [users, setUsers] = useState([])
  const [posts, setPosts] = useState([])
  const [stats, setStats] = useState({})
  const [bannedUsers, setBannedUsers] = useState([])
  const [banReason, setBanReason] = useState('')
  const [banningUserId, setBanningUserId] = useState(null)
  const [showBanModal, setShowBanModal] = useState(false)
  const [currentAdminId, setCurrentAdminId] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
        }

        setCurrentAdminId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!profile?.is_admin) {
        router.push('/')
        return
      }

      await Promise.all([
        loadReports(),
        loadUsers(),
        loadPosts(),
        loadStats(),
        loadBannedUsers(),
      ])

      setLoading(false)
    }

    load()
  }, [])

  async function loadReports() {
    const { data } = await supabase
      .from('reports')
      .select('*, reporter:profiles!reports_reporter_id_fkey(username), reported_user:profiles!reports_reported_user_id_fkey(username)')
      .order('created_at', { ascending: false })
      .limit(50)
    setReports(data || [])
  }

  async function loadUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, bio, created_at, is_admin')
      .eq('is_banned', false)
      .order('created_at', { ascending: false })
      .limit(50)
    setUsers(data || [])
  }

  async function loadPosts() {
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(username), anime(title)')
      .order('created_at', { ascending: false })
      .limit(50)
    setPosts(data || [])
  }

  async function loadStats() {
    const [
      { count: userCount },
      { count: postCount },
      { count: reportCount },
      { count: messageCount },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('messages').select('*', { count: 'exact', head: true }),
    ])

    setStats({ userCount, postCount, reportCount, messageCount })
  }

  async function loadBannedUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, bio, ban_reason, banned_at')
      .eq('is_banned', true)
      .order('banned_at', { ascending: false })
    setBannedUsers(data || [])
  }

  async function logAdminAction(actionType, targetType, targetId, reason = null, metadata = {}) {
  if (!currentAdminId) return

  await supabase
    .from('admin_audit_logs')
    .insert({
      admin_id: currentAdminId,
      action_type: actionType,
      target_type: targetType,
      target_id: targetId,
      reason,
      metadata,
    })
}

  
  async function dismissReport(reportId) {
    const res = await fetch('/api/admin-dismiss-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId }),
    })

    const data = await res.json()

    if (!res.ok || !data.success) {
        alert(data.error || 'Failed to dismiss report.')
        return
    }

    await loadReports()
    }

  async function banUser(userId) {
    setBanningUserId(userId)
    setShowBanModal(true)
  }

  async function confirmBan() {
    const res = await fetch('/api/ban-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: banningUserId, reason: banReason }),
    })

    const data = await res.json()
    if (data.success) {
      setShowBanModal(false)
      setBanReason('')
      setBanningUserId(null)
      await loadUsers()
      await loadBannedUsers()
    } else {
      alert('Failed to ban user.')
    }
  }

  async function unbanUser(userId) {
    const confirmed = window.confirm('Unban this user?')
    if (!confirmed) return

    const res = await fetch('/api/ban-user', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })

    const data = await res.json()
    if (data.success) {
      await loadBannedUsers()
      await loadUsers()
    } else {
      alert('Failed to unban user.')
    }
  }

  async function deletePost(postId) {
    const confirmed = window.confirm('Delete this post?')
    if (!confirmed) return

    const res = await fetch('/api/admin-delete-post', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
    })

    const data = await res.json()

    if (!res.ok || !data.success) {
        alert(data.error || 'Failed to delete post.')
        return
    }

    await loadPosts()
    }

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <Navbar />
      <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-soft)' }}>
        Loading...
      </div>
    </div>
  )

  const sectionTitle = {
    fontFamily: 'Playfair Display, serif',
    fontSize: '20px',
    fontWeight: '600',
    color: 'var(--text)',
    marginBottom: '16px',
  }

  const card = {
    backgroundColor: 'white',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '12px',
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <Navbar />

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '36px',
          fontWeight: '600',
          color: 'var(--text)',
          marginBottom: '8px',
        }}>
          Admin Dashboard
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-soft)', marginBottom: '32px' }}>
          Nagomi moderation and management.
        </p>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '40px',
        }}>
          {[
            { label: 'Total Users', value: stats.userCount, emoji: '👥' },
            { label: 'Total Posts', value: stats.postCount, emoji: '📝' },
            { label: 'Pending Reports', value: stats.reportCount, emoji: '🚨' },
            { label: 'Total Messages', value: stats.messageCount, emoji: '💬' },
          ].map(stat => (
            <div key={stat.label} style={{
              backgroundColor: 'white',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '20px',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '28px', marginBottom: '8px' }}>{stat.emoji}</p>
              <p style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text)', marginBottom: '4px' }}>
                {stat.value || 0}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-soft)' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '4px',
          borderBottom: '1px solid var(--border)',
          marginBottom: '32px',
        }}>
          {['reports', 'users', 'posts', 'moodrooms', 'banned'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '500',
                color: activeTab === tab ? 'var(--primary)' : 'var(--text-soft)',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              {tab === 'moodrooms' ? 'Mood Rooms' : tab === 'banned' ? 'Banned Users' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'reports' && stats.reportCount > 0 && (
                <span style={{
                  backgroundColor: '#e85555',
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
                  {stats.reportCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Reports */}
        {activeTab === 'reports' && (
          <div>
            <h2 style={sectionTitle}>Reports</h2>
            {reports.filter(r => r.status === 'pending').length === 0 ? (
              <div style={{ ...card, textAlign: 'center', color: 'var(--text-soft)' }}>
                <p style={{ fontSize: '24px', marginBottom: '8px' }}>✅</p>
                <p>No pending reports.</p>
              </div>
            ) : (
              reports.filter(r => r.status === 'pending').map(report => (
                <div key={report.id} style={card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>
                        Reported by{' '}
                        <Link href={`/profile/${report.reporter?.username}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                          {report.reporter?.username}
                        </Link>
                      </p>
                      {report.reported_user && (
                        <p style={{ fontSize: '13px', color: 'var(--text-soft)', marginBottom: '4px' }}>
                          Reported user:{' '}
                          <Link href={`/profile/${report.reported_user?.username}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                            {report.reported_user?.username}
                          </Link>
                        </p>
                      )}
                      <p style={{ fontSize: '13px', color: 'var(--text-soft)' }}>
                        Reason: <strong>{report.reason}</strong>
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--text-soft)', marginTop: '4px' }}>
                        {new Date(report.created_at).toLocaleDateString()} at {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => dismissReport(report.id)}
                        style={{
                          backgroundColor: 'white',
                          border: '2px solid var(--border)',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          fontSize: '13px',
                          fontWeight: '500',
                          color: 'var(--text)',
                          cursor: 'pointer',
                        }}
                      >
                        Dismiss
                      </button>
                      {report.reported_user_id && (
                        <button
                          onClick={() => banUser(report.reported_user_id)}
                          style={{
                            backgroundColor: '#e85555',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            fontSize: '13px',
                            fontWeight: '500',
                            color: 'white',
                            cursor: 'pointer',
                          }}
                        >
                          Ban User
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}

            {reports.filter(r => r.status === 'dismissed').length > 0 && (
              <>
                <h2 style={{ ...sectionTitle, marginTop: '32px', fontSize: '16px', color: 'var(--text-soft)' }}>
                  Dismissed Reports
                </h2>
                {reports.filter(r => r.status === 'dismissed').map(report => (
                  <div key={report.id} style={{ ...card, opacity: 0.6 }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-soft)' }}>
                      {report.reporter?.username} reported {report.reported_user?.username} — {report.reason}
                    </p>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Users */}
        {activeTab === 'users' && (
          <div>
            <h2 style={sectionTitle}>Users ({users.length})</h2>
            {users.map(user => (
              <div key={user.id} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                    <Link href={`/profile/${user.username}`} style={{
                      fontSize: '15px',
                      fontWeight: '600',
                      color: 'var(--text)',
                      textDecoration: 'none',
                    }}>
                      {user.username}
                    </Link>
                    {user.is_admin && (
                      <span style={{
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                        borderRadius: '20px',
                        padding: '2px 10px',
                        fontSize: '11px',
                        fontWeight: '600',
                      }}>
                        Admin
                      </span>
                    )}
                  </div>
                  {user.bio && (
                    <p style={{ fontSize: '13px', color: 'var(--text-soft)', marginBottom: '4px' }}>
                      {user.bio.slice(0, 80)}{user.bio.length > 80 ? '...' : ''}
                    </p>
                  )}
                  <p style={{ fontSize: '12px', color: 'var(--text-soft)' }}>
                    Joined {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                {!user.is_admin && (
                  <button
                    onClick={() => banUser(user.id)}
                    style={{
                      backgroundColor: '#ffe4e4',
                      border: '2px solid #e85555',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#e85555',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    Ban
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Posts */}
        {activeTab === 'posts' && (
          <div>
            <h2 style={sectionTitle}>Recent Posts ({posts.length})</h2>
            {posts.map(post => (
              <div key={post.id} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <Link href={`/profile/${post.profiles?.username}`} style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: 'var(--primary)',
                      textDecoration: 'none',
                    }}>
                      {post.profiles?.username}
                    </Link>
                    {post.anime && (
                      <span style={{ fontSize: '12px', color: 'var(--text-soft)' }}>
                        in {post.anime.title}
                      </span>
                    )}
                    {post.spoiler_level !== 'none' && (
                      <span style={{
                        backgroundColor: '#ffe4e4',
                        color: '#e85555',
                        borderRadius: '20px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        fontWeight: '500',
                      }}>
                        {post.spoiler_level} spoilers
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: '1.6' }}>
                    {post.content.slice(0, 150)}{post.content.length > 150 ? '...' : ''}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-soft)', marginTop: '6px' }}>
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => deletePost(post.id)}
                  style={{
                    backgroundColor: '#ffe4e4',
                    border: '2px solid #e85555',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#e85555',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Mood Rooms */}
        {activeTab === 'moodrooms' && (
          <div>
            <h2 style={sectionTitle}>Mood Room Messages</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-soft)', marginBottom: '24px' }}>
              Clear live chat messages from mood rooms.
            </p>

            <div style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>
                  All Mood Rooms
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-soft)' }}>
                  Delete every message from every mood room instantly.
                </p>
              </div>
              <button
                onClick={async () => {
                  const confirmed = window.confirm('Are you sure you want to delete ALL messages from ALL mood rooms? This cannot be undone.')
                  if (!confirmed) return
                  await supabase.from('mood_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000')
                  alert('All mood room messages deleted.')
                }}
                style={{
                  backgroundColor: '#e85555',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'white',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                Clear All
              </button>
            </div>

            {[
              { name: 'I Feel Empty', slug: 'empty' },
              { name: 'I Need Wholesome Romance', slug: 'wholesome' },
              { name: 'I Want to Cry', slug: 'want-to-cry' },
              { name: 'I Need a Happy Ending', slug: 'happy-ending' },
              { name: 'I Need Actual Dating', slug: 'actual-dating' },
              { name: 'I Hate Love Triangles', slug: 'no-love-triangles' },
              { name: 'I Want Slow Burn', slug: 'slow-burn' },
              { name: 'I Need Something Healing', slug: 'healing' },
              { name: 'I Need People to Talk To', slug: 'need-to-talk' },
              { name: 'Emotionally Destroyed', slug: 'emotionally-destroyed' },
              { name: 'Post-Anime Depression', slug: 'post-anime-depression' },
              { name: 'Comfort Romance', slug: 'comfort' },
            ].map(room => (
              <div key={room.slug} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text)' }}>
                  {room.name}
                </p>
                <button
                  onClick={async () => {
                    const confirmed = window.confirm(`Delete all messages from "${room.name}"? This cannot be undone.`)
                    if (!confirmed) return
                    await supabase.from('mood_messages').delete().eq('room_slug', room.slug)
                    alert(`Messages cleared from ${room.name}.`)
                  }}
                  style={{
                    backgroundColor: '#ffe4e4',
                    border: '2px solid #e85555',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#e85555',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  Clear
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Banned Users */}
        {activeTab === 'banned' && (
          <div>
            <h2 style={sectionTitle}>Banned Users ({bannedUsers.length})</h2>
            {bannedUsers.length === 0 ? (
              <div style={{ ...card, textAlign: 'center', color: 'var(--text-soft)' }}>
                <p style={{ fontSize: '24px', marginBottom: '8px' }}>✅</p>
                <p>No banned users.</p>
              </div>
            ) : (
              bannedUsers.map(user => (
                <div key={user.id} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>
                      {user.username}
                    </p>
                    <p style={{ fontSize: '13px', color: '#e85555', marginBottom: '4px', fontWeight: '500' }}>
                      Reason: {user.ban_reason || 'No reason provided'}
                    </p>
                    {user.banned_at && (
                      <p style={{ fontSize: '12px', color: 'var(--text-soft)' }}>
                        Banned on {new Date(user.banned_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => unbanUser(user.id)}
                    style={{
                      backgroundColor: 'white',
                      border: '2px solid var(--border)',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: 'var(--text)',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    Unban
                  </button>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      {/* Ban Modal */}
      {showBanModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '24px',
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '20px',
            padding: '32px', width: '100%', maxWidth: '420px',
          }}>
            <h3 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '22px', fontWeight: '600', color: 'var(--text)', marginBottom: '8px',
            }}>
              Ban User
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-soft)', marginBottom: '20px' }}>
              Add a reason for this ban. This is for your records only.
            </p>
            <textarea
              value={banReason}
              onChange={e => setBanReason(e.target.value)}
              placeholder="e.g. Harassment in mood room chat"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '2px solid var(--border)',
                fontSize: '14px',
                color: 'var(--text)',
                outline: 'none',
                resize: 'vertical',
                minHeight: '100px',
                backgroundColor: 'var(--bg)',
                marginBottom: '20px',
              }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => { setShowBanModal(false); setBanReason(''); setBanningUserId(null) }}
                style={{
                  flex: 1, backgroundColor: 'white', border: '2px solid var(--border)',
                  borderRadius: '12px', padding: '12px', fontSize: '14px',
                  fontWeight: '500', color: 'var(--text)', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmBan}
                style={{
                  flex: 1, backgroundColor: '#e85555', border: 'none',
                  borderRadius: '12px', padding: '12px', fontSize: '14px',
                  fontWeight: '600', color: 'white', cursor: 'pointer',
                }}
              >
                Ban User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}