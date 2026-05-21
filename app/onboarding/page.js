'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../lib/supabase-client'

const moodTags = [
  'Wholesome', 'Happy Ending', 'Actual Dating', 'Slow Burn',
  'No Love Triangle', 'Emotional Damage', 'Healing', 'Bittersweet',
  'Comedy Romance', 'Fantasy Romance', 'School Romance', 'Adult Romance',
]

const lookingFor = [
  'Recommendations', 'Friends', 'Discussion', 'Watch Clubs', 'Romance Recovery',
]

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const [favouriteAnime, setFavouriteAnime] = useState('')
  const [animeThatBrokeMe, setAnimeThatBrokeMe] = useState('')
  const [animeThatHealedMe, setAnimeThatHealedMe] = useState('')
  const [selectedMoods, setSelectedMoods] = useState([])
  const [selectedLookingFor, setSelectedLookingFor] = useState([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

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

  async function handleFinish() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    await supabase
      .from('profiles')
      .update({
        favourite_anime: favouriteAnime ? [favouriteAnime] : [],
        anime_that_broke_me: animeThatBrokeMe,
        anime_that_healed_me: animeThatHealedMe,
        mood_tags: selectedMoods,
        looking_for: selectedLookingFor,
      })
      .eq('id', user.id)

    router.push('/')
  }

  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: 'var(--bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  }

  const cardStyle = {
    backgroundColor: 'white',
    border: '1px solid var(--border)',
    borderRadius: '24px',
    padding: '48px',
    width: '100%',
    maxWidth: '520px',
  }

  const titleStyle = {
    fontFamily: 'Playfair Display, serif',
    fontSize: '28px',
    fontWeight: '600',
    color: 'var(--text)',
    marginBottom: '8px',
  }

  const subtitleStyle = {
    fontSize: '14px',
    color: 'var(--text-soft)',
    marginBottom: '32px',
    lineHeight: '1.6',
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '2px solid var(--border)',
    fontSize: '15px',
    color: 'var(--text)',
    outline: 'none',
    backgroundColor: 'var(--bg)',
    marginBottom: '16px',
  }

  const buttonStyle = {
    backgroundColor: 'var(--primary)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '14px 28px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
    marginTop: '8px',
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
    <div style={containerStyle}>
      <div style={cardStyle}>

        {/* Progress */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
          {[1, 2, 3].map(n => (
            <div key={n} style={{
              flex: 1,
              height: '4px',
              borderRadius: '2px',
              backgroundColor: n <= step ? 'var(--primary)' : 'var(--border)',
            }} />
          ))}
        </div>

        {/* Step 1 — Anime */}
        {step === 1 && (
          <div>
            <h1 style={titleStyle}>Your anime story 🌸</h1>
            <p style={subtitleStyle}>Tell us a little about the romance anime that shaped you.</p>

            <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', display: 'block', marginBottom: '6px' }}>
              Your favourite romance anime
            </label>
            <input
              style={inputStyle}
              placeholder="e.g. Horimiya"
              value={favouriteAnime}
              onChange={e => setFavouriteAnime(e.target.value)}
            />

            <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', display: 'block', marginBottom: '6px' }}>
              The anime that broke you
            </label>
            <input
              style={inputStyle}
              placeholder="e.g. Your Lie in April"
              value={animeThatBrokeMe}
              onChange={e => setAnimeThatBrokeMe(e.target.value)}
            />

            <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', display: 'block', marginBottom: '6px' }}>
              The anime that healed you
            </label>
            <input
              style={inputStyle}
              placeholder="e.g. The Angel Next Door"
              value={animeThatHealedMe}
              onChange={e => setAnimeThatHealedMe(e.target.value)}
            />

            <button style={buttonStyle} onClick={() => setStep(2)}>
              Next →
            </button>
          </div>
        )}

        {/* Step 2 — Mood tags */}
        {step === 2 && (
          <div>
            <h1 style={titleStyle}>Your romance taste 💕</h1>
            <p style={subtitleStyle}>Pick the tags that match what you look for in romance anime.</p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '32px' }}>
              {moodTags.map(mood => (
                <button
                  key={mood}
                  style={tagStyle(selectedMoods.includes(mood))}
                  onClick={() => toggleMood(mood)}
                >
                  {mood}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                style={{ ...buttonStyle, backgroundColor: 'white', color: 'var(--text)', border: '2px solid var(--border)' }}
                onClick={() => setStep(1)}
              >
                ← Back
              </button>
              <button style={buttonStyle} onClick={() => setStep(3)}>
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Looking for */}
        {step === 3 && (
          <div>
            <h1 style={titleStyle}>What are you here for? 🌙</h1>
            <p style={subtitleStyle}>What do you want from Nagomi? Pick everything that applies.</p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '32px' }}>
              {lookingFor.map(item => (
                <button
                  key={item}
                  style={tagStyle(selectedLookingFor.includes(item))}
                  onClick={() => toggleLookingFor(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                style={{ ...buttonStyle, backgroundColor: 'white', color: 'var(--text)', border: '2px solid var(--border)' }}
                onClick={() => setStep(2)}
              >
                ← Back
              </button>
              <button
                style={{ ...buttonStyle, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                onClick={handleFinish}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Enter Nagomi 🌸'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}