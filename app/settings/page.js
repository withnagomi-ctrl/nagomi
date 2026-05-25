'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import { createClient } from '../lib/supabase-client'
import AvatarUpload from '../components/AvatarUpload'

const moodTags = [
  'Wholesome', 'Happy Ending', 'Actual Dating', 'Slow Burn',
  'No Love Triangle', 'Emotional Damage', 'Healing', 'Bittersweet',
  'Comedy Romance', 'Fantasy Romance', 'School Romance', 'Adult Romance',
]

const lookingForOptions = [
  'Recommendations', 'Friends', 'Discussion', 'Watch Clubs', 'Romance Recovery',
]

export default function Settings() {
  const [activeSection, setActiveSection] = useState('profile')
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const router = useRouter()
  const supabase = createClient()

  // Profile fields
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [favouriteAnime, setFavouriteAnime] = useState('')
  const [animeThatBrokeMe, setAnimeThatBrokeMe] = useState('')
  const [animeThatHealedMe, setAnimeThatHealedMe] = useState('')
  const [favouriteCouple, setFavouriteCouple] = useState('')
  const [currentWatch, setCurrentWatch] = useState('')
  const [selectedMoods, setSelectedMoods] = useState([])
  const [selectedLookingFor, setSelectedLookingFor] = useState([])

  // Privacy fields
  const [whoCanMessage, setWhoCanMessage] = useState('requests')
  const [whoCanFollow, setWhoCanFollow] = useState('everyone')
  const [showOnlineStatus, setShowOnlineStatus] = useState(true)
  const [showFavouriteAnime, setShowFavouriteAnime] = useState(true)

  // Notification fields
  const [notifReplies, setNotifReplies] = useState(true)
  const [notifReactions, setNotifReactions] = useState(true)
  const [notifFollows, setNotifFollows] = useState(true)
  const [notifMessages, setNotifMessages] = useState(true)

  // Spoiler fields
  const [blurSpoilers, setBlurSpoilers] = useState(true)

  // Blocked and muted users
  const [blockedUsers, setBlockedUsers] = useState([])
  const [mutedUsers, setMutedUsers] = useState([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setCurrentUser(user)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        setUsername(profileData.username || '')
        setBio(profileData.bio || '')
        setFavouriteAnime(profileData.favourite_anime?.[0] || '')
        setAnimeThatBrokeMe(profileData.anime_that_broke_me || '')
        setAnimeThatHealedMe(profileData.anime_that_healed_me || '')
        setFavouriteCouple(profileData.favourite_couple || '')
        setCurrentWatch(profileData.current_watch || '')
        setSelectedMoods(profileData.mood_tags || [])
        setSelectedLookingFor(profileData.looking_for || [])
        setWhoCanMessage(profileData.who_can_message || 'requests')
        setWhoCanFollow(profileData.who_can_follow || 'everyone')
        setShowOnlineStatus(profileData.show_online_status ?? true)
        setShowFavouriteAnime(profileData.show_favourite_anime ?? true)
        setNotifReplies(profileData.notif_replies ?? true)
        setNotifReactions(profileData.notif_reactions ?? true)
        setNotifFollows(profileData.notif_follows ?? true)
        setNotifMessages(profileData.notif_messages ?? true)
        setBlurSpoilers(profileData.blur_spoilers ?? true)
      }

      // Load blocked users
      const { data: blocks } = await supabase
        .from('blocks')
        .select('blocked_id, profiles!blocks_blocked_id_fkey(username)')
        .eq('blocker_id', user.id)
      setBlockedUsers(blocks || [])

      // Load muted users
      const { data: mutes } = await supabase
        .from('mutes')
        .select('muted_id, profiles!mutes_muted_id_fkey(username)')
        .eq('muter_id', user.id)
      setMutedUsers(mutes || [])

      setLoading(false)
    }

    load()
  }, [])

  async function saveProfile() {
    setSaving(true)
    setMessage(null)

    if (username !== profile.username) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single()
      if (existing) {
        setMessage({ type: 'error', text: 'That username is already taken.' })
        setSaving(false)
        return
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        username,
        bio,
        favourite_anime: favouriteAnime ? [favouriteAnime] : [],
        anime_that_broke_me: animeThatBrokeMe,
        anime_that_healed_me: animeThatHealedMe,
        favourite_couple: favouriteCouple,
        current_watch: currentWatch,
        mood_tags: selectedMoods,
        looking_for: selectedLookingFor,
      })
      .eq('id', currentUser.id)

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Profile saved.' })
    }
    setSaving(false)
  }

  async function savePrivacy() {
    setSaving(true)
    await supabase
      .from('profiles')
      .update({
        who_can_message: whoCanMessage,
        who_can_follow: whoCanFollow,
        show_online_status: showOnlineStatus,
        show_favourite_anime: showFavouriteAnime,
      })
      .eq('id', currentUser.id)
    setMessage({ type: 'success', text: 'Privacy settings saved.' })
    setSaving(false)
  }

  async function saveNotifications() {
    setSaving(true)
    await supabase
      .from('profiles')
      .update({
        notif_replies: notifReplies,
        notif_reactions: notifReactions,
        notif_follows: notifFollows,
        notif_messages: notifMessages,
      })
      .eq('id', currentUser.id)
    setMessage({ type: 'success', text: 'Notification settings saved.' })
    setSaving(false)
  }

  async function saveSafety() {
    setSaving(true)
    await supabase
      .from('profiles')
      .update({ blur_spoilers: blurSpoilers })
      .eq('id', currentUser.id)
    setMessage({ type: 'success', text: 'Safety settings saved.' })
    setSaving(false)
  }

  async function handleUnblock(blockedId) {
    await supabase
      .from('blocks')
      .delete()
      .eq('blocker_id', currentUser.id)
      .eq('blocked_id', blockedId)
    setBlockedUsers(prev => prev.filter(b => b.blocked_id !== blockedId))
  }

  async function handleUnmute(mutedId) {
    await supabase
      .from('mutes')
      .delete()
      .eq('muter_id', currentUser.id)
      .eq('muted_id', mutedId)
    setMutedUsers(prev => prev.filter(m => m.muted_id !== mutedId))
  }

  async function handlePasswordReset() {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: 'http://localhost:3000/reset-password',
    })
    setMessage({ type: 'success', text: 'Password reset email sent. Check your inbox.' })
    }

  async function handleDeleteAccount() {
    const confirmed = window.confirm('Are you sure you want to delete your account? This cannot be undone and will remove all your posts, messages and data.')
    if (!confirmed) return
    const confirmed2 = window.confirm('This is permanent. Are you absolutely sure?')
    if (!confirmed2) return

    const res = await fetch('/api/delete-account', { method: 'DELETE' })
    const data = await res.json()

    if (data.success) {
        await supabase.auth.signOut()
        router.push('/')
    } else {
        setMessage({ type: 'error', text: 'Failed to delete account. Please try again.' })
    }
    }

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <Navbar />
      <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-soft)' }}>Loading...</div>
    </div>
  )

  const sections = [
    { id: 'profile', label: '👤 Profile' },
    { id: 'privacy', label: '🔒 Privacy' },
    { id: 'safety', label: '🛡️ Safety' },
    { id: 'notifications', label: '🔔 Notifications' },
    { id: 'account', label: '⚙️ Account' },
  ]

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '2px solid var(--border)',
    fontSize: '15px',
    color: 'var(--text)',
    outline: 'none',
    backgroundColor: 'var(--bg)',
  }

  const labelStyle = {
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--text)',
    display: 'block',
    marginBottom: '6px',
  }

  const cardStyle = {
    backgroundColor: 'white',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '16px',
  }

  const tagStyle = (active) => ({
    backgroundColor: active ? 'var(--primary)' : 'white',
    color: active ? 'white' : 'var(--text)',
    border: `2px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
    borderRadius: '20px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  })

  const toggleStyle = (active) => ({
    width: '44px',
    height: '24px',
    borderRadius: '12px',
    backgroundColor: active ? 'var(--primary)' : 'var(--border)',
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    flexShrink: 0,
    transition: 'background-color 0.2s',
  })

  const toggleRow = (label, desc, value, setter) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', marginBottom: '2px' }}>{label}</p>
        {desc && <p style={{ fontSize: '13px', color: 'var(--text-soft)' }}>{desc}</p>}
      </div>
      <button onClick={() => setter(!value)} style={toggleStyle(value)}>
        <div style={{
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          backgroundColor: 'white',
          position: 'absolute',
          top: '3px',
          left: value ? '23px' : '3px',
          transition: 'left 0.2s',
        }} />
      </button>
    </div>
  )

  const selectStyle = {
    padding: '10px 16px',
    borderRadius: '12px',
    border: '2px solid var(--border)',
    fontSize: '14px',
    color: 'var(--text)',
    backgroundColor: 'white',
    outline: 'none',
    cursor: 'pointer',
    width: '100%',
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <Navbar />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px', display: 'flex', gap: '32px' }}>

        {/* Sidebar */}
        <div style={{ width: '200px', flexShrink: 0 }}>
          <h2 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '22px',
            fontWeight: '600',
            color: 'var(--text)',
            marginBottom: '20px',
          }}>
            Settings
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => { setActiveSection(s.id); setMessage(null) }}
                style={{
                  backgroundColor: activeSection === s.id ? 'var(--lavender)' : 'transparent',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  fontSize: '14px',
                  fontWeight: activeSection === s.id ? '600' : '500',
                  color: activeSection === s.id ? 'var(--text)' : 'var(--text-soft)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>

          {message && (
            <div style={{
              backgroundColor: message.type === 'error' ? '#ffe4e4' : 'var(--lavender)',
              border: `1px solid ${message.type === 'error' ? '#e85555' : 'var(--border)'}`,
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
              color: message.type === 'error' ? '#e85555' : 'var(--text)',
              marginBottom: '20px',
            }}>
              {message.text}
            </div>
          )}

          {/* Profile section */}
          {activeSection === 'profile' && (
            <div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', fontWeight: '600', color: 'var(--text)', marginBottom: '24px' }}>
                Profile
              </h3>

              <div style={cardStyle}>
                <h4 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', marginBottom: '20px' }}>Profile Photo</h4>
                <AvatarUpload
                    currentAvatarUrl={profile?.avatar_url}
                    userId={currentUser?.id}
                    onUploadComplete={(url) => {
                    setProfile(prev => ({ ...prev, avatar_url: url }))
                    }}
                />
                </div>
              
              <div style={cardStyle}>
                <h4 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', marginBottom: '20px' }}>Basic Info</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Username</label>
                    <input style={inputStyle} value={username} onChange={e => setUsername(e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Bio</label>
                    <textarea style={{ ...inputStyle, height: '100px', resize: 'vertical' }} value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell people who you are as a romance anime fan..." />
                  </div>
                </div>
              </div>

              <div style={cardStyle}>
                <h4 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', marginBottom: '20px' }}>Your Anime Story</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Favourite romance anime</label>
                    <input style={inputStyle} value={favouriteAnime} onChange={e => setFavouriteAnime(e.target.value)} placeholder="e.g. Horimiya" />
                  </div>
                  <div>
                    <label style={labelStyle}>Anime that broke you</label>
                    <input style={inputStyle} value={animeThatBrokeMe} onChange={e => setAnimeThatBrokeMe(e.target.value)} placeholder="e.g. Your Lie in April" />
                  </div>
                  <div>
                    <label style={labelStyle}>Anime that healed you</label>
                    <input style={inputStyle} value={animeThatHealedMe} onChange={e => setAnimeThatHealedMe(e.target.value)} placeholder="e.g. The Angel Next Door" />
                  </div>
                  <div>
                    <label style={labelStyle}>Favourite couple</label>
                    <input style={inputStyle} value={favouriteCouple} onChange={e => setFavouriteCouple(e.target.value)} placeholder="e.g. Hori and Miyamura" />
                  </div>
                  <div>
                    <label style={labelStyle}>Currently watching</label>
                    <input style={inputStyle} value={currentWatch} onChange={e => setCurrentWatch(e.target.value)} placeholder="e.g. Insomniacs After School" />
                  </div>
                </div>
              </div>

              <div style={cardStyle}>
                <h4 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', marginBottom: '8px' }}>Romance Taste</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-soft)', marginBottom: '16px' }}>Pick tags that describe what you look for.</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {moodTags.map(mood => (
                    <button key={mood} style={tagStyle(selectedMoods.includes(mood))}
                      onClick={() => setSelectedMoods(prev => prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood])}>
                      {mood}
                    </button>
                  ))}
                </div>
              </div>

              <div style={cardStyle}>
                <h4 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', marginBottom: '8px' }}>Looking For</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-soft)', marginBottom: '16px' }}>What do you want from Nagomi?</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {lookingForOptions.map(item => (
                    <button key={item} style={tagStyle(selectedLookingFor.includes(item))}
                      onClick={() => setSelectedLookingFor(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item])}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={saveProfile} disabled={saving} style={{
                backgroundColor: 'var(--primary)', color: 'white', border: 'none',
                borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, width: '100%',
              }}>
                {saving ? 'Saving...' : 'Save profile'}
              </button>
            </div>
          )}

          {/* Privacy section */}
          {activeSection === 'privacy' && (
            <div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', fontWeight: '600', color: 'var(--text)', marginBottom: '24px' }}>
                Privacy
              </h3>

              <div style={cardStyle}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>Who can message me?</label>
                  <select style={selectStyle} value={whoCanMessage} onChange={e => setWhoCanMessage(e.target.value)}>
                    <option value="everyone">Everyone</option>
                    <option value="requests">Message requests only</option>
                    <option value="mutuals">Mutuals only</option>
                    <option value="nobody">Nobody</option>
                  </select>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>Who can follow me?</label>
                  <select style={selectStyle} value={whoCanFollow} onChange={e => setWhoCanFollow(e.target.value)}>
                    <option value="everyone">Everyone</option>
                    <option value="nobody">Nobody</option>
                  </select>
                </div>
                {toggleRow('Show online status', 'Let others see when you are active', showOnlineStatus, setShowOnlineStatus)}
                {toggleRow('Show favourite anime', 'Display your favourite anime on your profile', showFavouriteAnime, setShowFavouriteAnime)}
              </div>

              <button onClick={savePrivacy} disabled={saving} style={{
                backgroundColor: 'var(--primary)', color: 'white', border: 'none',
                borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, width: '100%',
              }}>
                {saving ? 'Saving...' : 'Save privacy settings'}
              </button>
            </div>
          )}

          {/* Safety section */}
          {activeSection === 'safety' && (
            <div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', fontWeight: '600', color: 'var(--text)', marginBottom: '24px' }}>
                Safety
              </h3>

              <div style={cardStyle}>
                <h4 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', marginBottom: '16px' }}>Spoiler Protection</h4>
                {toggleRow('Blur spoilers by default', 'Spoiler posts will be hidden until you click to reveal', blurSpoilers, setBlurSpoilers)}
                <button onClick={saveSafety} disabled={saving} style={{
                  backgroundColor: 'var(--primary)', color: 'white', border: 'none',
                  borderRadius: '12px', padding: '12px', fontSize: '14px', fontWeight: '600',
                  cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, width: '100%', marginTop: '16px',
                }}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>

              <div style={cardStyle}>
                <h4 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', marginBottom: '16px' }}>Blocked Users</h4>
                {blockedUsers.length === 0 ? (
                  <p style={{ fontSize: '14px', color: 'var(--text-soft)' }}>You haven't blocked anyone.</p>
                ) : (
                  blockedUsers.map(b => (
                    <div key={b.blocked_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)' }}>
                        {b.profiles?.username}
                      </p>
                      <button onClick={() => handleUnblock(b.blocked_id)} style={{
                        backgroundColor: 'white', border: '2px solid var(--border)', borderRadius: '8px',
                        padding: '6px 14px', fontSize: '13px', fontWeight: '500', color: 'var(--text)', cursor: 'pointer',
                      }}>
                        Unblock
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div style={cardStyle}>
                <h4 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', marginBottom: '16px' }}>Muted Users</h4>
                {mutedUsers.length === 0 ? (
                  <p style={{ fontSize: '14px', color: 'var(--text-soft)' }}>You haven't muted anyone.</p>
                ) : (
                  mutedUsers.map(m => (
                    <div key={m.muted_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)' }}>
                        {m.profiles?.username}
                      </p>
                      <button onClick={() => handleUnmute(m.muted_id)} style={{
                        backgroundColor: 'white', border: '2px solid var(--border)', borderRadius: '8px',
                        padding: '6px 14px', fontSize: '13px', fontWeight: '500', color: 'var(--text)', cursor: 'pointer',
                      }}>
                        Unmute
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div style={cardStyle}>
                <h4 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', marginBottom: '8px' }}>Community Rules</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-soft)', marginBottom: '12px' }}>
                  Read Nagomi's community rules to understand what's expected.
                </p>
                <Link href="/rules" style={{
                  color: 'var(--primary)', fontWeight: '500', fontSize: '14px', textDecoration: 'none',
                }}>
                  View community rules →
                </Link>
              </div>
            </div>
          )}

          {/* Notifications section */}
          {activeSection === 'notifications' && (
            <div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', fontWeight: '600', color: 'var(--text)', marginBottom: '24px' }}>
                Notifications
              </h3>

              <div style={cardStyle}>
                {toggleRow('Replies to my posts', 'Get notified when someone comments on your post', notifReplies, setNotifReplies)}
                {toggleRow('Reactions to my posts', 'Get notified when someone reacts to your post', notifReactions, setNotifReactions)}
                {toggleRow('New followers', 'Get notified when someone follows you', notifFollows, setNotifFollows)}
                {toggleRow('Message requests', 'Get notified when someone sends you a message request', notifMessages, setNotifMessages)}
              </div>

              <button onClick={saveNotifications} disabled={saving} style={{
                backgroundColor: 'var(--primary)', color: 'white', border: 'none',
                borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, width: '100%',
              }}>
                {saving ? 'Saving...' : 'Save notification settings'}
              </button>
            </div>
          )}

          {/* Account section */}
          {activeSection === 'account' && (
            <div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', fontWeight: '600', color: 'var(--text)', marginBottom: '24px' }}>
                Account
              </h3>

              <div style={cardStyle}>
                <h4 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', marginBottom: '8px' }}>Email</h4>
                <p style={{ fontSize: '14px', color: 'var(--text-soft)' }}>{currentUser?.email}</p>
              </div>

              <div style={cardStyle}>
                <h4 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', marginBottom: '8px' }}>Password</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-soft)', marginBottom: '12px' }}>
                  We'll send a password reset link to your email.
                </p>
                <button onClick={handlePasswordReset} style={{
                  backgroundColor: 'white', border: '2px solid var(--border)', borderRadius: '12px',
                  padding: '10px 20px', fontSize: '14px', fontWeight: '500', color: 'var(--text)', cursor: 'pointer',
                }}>
                  Send password reset email
                </button>
              </div>

              <div style={{ ...cardStyle, border: '1px solid #e85555' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#e85555', marginBottom: '8px' }}>Delete Account</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-soft)', marginBottom: '16px' }}>
                  This will permanently remove your profile, posts, messages and all personal data. This cannot be undone.
                </p>
                <button onClick={handleDeleteAccount} style={{
                  backgroundColor: '#e85555', border: 'none', borderRadius: '12px',
                  padding: '10px 20px', fontSize: '14px', fontWeight: '600', color: 'white', cursor: 'pointer',
                }}>
                  Delete my account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}