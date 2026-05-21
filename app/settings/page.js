'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../lib/supabase-client'
import Navbar from '../components/Navbar'

export default function Settings() {
  const [profile, setProfile] = useState(null)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [favouriteAnime, setFavouriteAnime] = useState('')
  const [animeThatBrokeMe, setAnimeThatBrokeMe] = useState('')
  const [animeThatHealedMe, setAnimeThatHealedMe] = useState('')
  const [favouriteCouple, setFavouriteCouple] = useState('')
  const [currentWatch, setCurrentWatch] = useState('')
  const [selectedMoods, setSelectedMoods] = useState([])
  const [selectedLookingFor, setSelectedLookingFor] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const router = useRouter()
  const supabase = createClient()

  const moodTags = [
    'Wholesome', 'Happy Ending', 'Actual Dating', 'Slow Burn',
    'No Love Triangle', 'Emotional Damage', 'Healing', 'Bittersweet',
    'Comedy Romance', 'Fantasy Romance', 'School Romance', 'Adult Romance',
  ]

  const lookingForOptions = [
    'Recommendations', 'Friends', 'Discussion', 'Watch Clubs', 'Romance Recovery',
  ]

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

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
      }

      setLoading(false)
    }

    load()
  }, [])

  function toggleMood(mood) {
    setSelectedMoods(prev =>
      prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood]
    )
  }

  function toggleLookingFor(item) {
    setSelectedLookingFor(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    )
  }

  async function handleSave() {
    setSaving(true)
    setMessage(null)

    const { data: { user } } = await supabase.auth.getUser()

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
      .eq('id', user.id)

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Profile saved successfully!' })
      router.push(`/profile/${username}`)
    }

    setSaving(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <Navbar />
      <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-soft)' }}>
        Loading...
      </div>
    </div>
  )

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

  const sectionStyle = {
    backgroundColor: 'white',
    border: '1px solid var(--border)',
    borderRadius: '24px',
    padding: '32px',
    marginBottom: '24px',
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <Navbar />

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '32px',
          fontWeight: '600',
          color: 'var(--text)',
          marginBottom: '8px',
        }}>
          Edit Profile
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-soft)', marginBottom: '32px' }}>
          Update your Nagomi identity 🌸
        </p>

        {/* Basic info */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text)', marginBottom: '24px' }}>
            Basic Info
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Username</label>
              <input style={inputStyle} value={username} onChange={e => setUsername(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Bio</label>
              <textarea
                style={{ ...inputStyle, height: '100px', resize: 'vertical' }}
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell people who you are as a romance anime fan..."
              />
            </div>
          </div>
        </div>

        {/* Anime info */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text)', marginBottom: '24px' }}>
            Your Anime Story
          </h2>
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

        {/* Mood tags */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text)', marginBottom: '8px' }}>
            Your Romance Taste
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-soft)', marginBottom: '20px' }}>
            Pick tags that describe what you look for in romance anime.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {moodTags.map(mood => (
              <button key={mood} style={tagStyle(selectedMoods.includes(mood))} onClick={() => toggleMood(mood)}>
                {mood}
              </button>
            ))}
          </div>
        </div>

        {/* Looking for */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text)', marginBottom: '8px' }}>
            What are you looking for?
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-soft)', marginBottom: '20px' }}>
            This helps people find you.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {lookingForOptions.map(item => (
              <button key={item} style={tagStyle(selectedLookingFor.includes(item))} onClick={() => toggleLookingFor(item)}>
                {item}
              </button>
            ))}
          </div>
        </div>

        {message && (
          <p style={{
            fontSize: '14px',
            color: message.type === 'error' ? '#e85555' : 'var(--primary)',
            textAlign: 'center',
            marginBottom: '16px',
            fontWeight: '500',
          }}>
            {message.text}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            width: '100%',
          }}
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}