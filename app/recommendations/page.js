'use client'

import { useState } from 'react'
import Navbar from '../components/Navbar'
import Link from 'next/link'

const steps = [
  {
    id: 'finished',
    question: 'What did you just finish?',
    subtext: 'Type the anime that left you with that feeling.',
    type: 'input',
    placeholder: 'e.g. Our Dating Story',
  },
  {
    id: 'feeling',
    question: 'How did it make you feel?',
    subtext: 'Pick everything that applies.',
    type: 'multi',
    options: [
      { label: 'Empty', emoji: '🕳️' },
      { label: 'Heartbroken', emoji: '💔' },
      { label: 'Warm and happy', emoji: '☀️' },
      { label: 'Wholesome', emoji: '🌸' },
      { label: 'Emotionally destroyed', emoji: '😭' },
      { label: 'Healed', emoji: '🌿' },
      { label: 'Wanting more', emoji: '📺' },
      { label: 'Bittersweet', emoji: '🌙' },
    ],
  },
  {
    id: 'want',
    question: 'What do you want next?',
    subtext: 'What kind of feeling are you looking for?',
    type: 'multi',
    options: [
      { label: 'Something happier', emoji: '☀️' },
      { label: 'Something sadder', emoji: '💔' },
      { label: 'Actual couple progress', emoji: '💑' },
      { label: 'Wholesome and soft', emoji: '🌸' },
      { label: 'Something healing', emoji: '🌿' },
      { label: 'Emotional damage', emoji: '😭' },
      { label: 'No love triangles', emoji: '🚫' },
      { label: 'Happy ending guaranteed', emoji: '💕' },
      { label: 'Slow burn', emoji: '🕯️' },
      { label: 'School romance', emoji: '🏫' },
      { label: 'Adult romance', emoji: '🌆' },
      { label: 'Something similar', emoji: '🔁' },
    ],
  },
]

// Maps user selections to Jikan API parameters
function buildJikanParams(finished, feeling, want) {
  const all = [...feeling, ...want]
  
  let genres = ['22']
  let orderBy = 'score'
  let keyword = finished || ''

  if (all.some(s => ['Something sadder', 'Heartbroken', 'Emotionally destroyed', 'Emotional damage', 'Bittersweet'].includes(s))) {
    genres.push('8')
  }

  if (all.some(s => ['Something happier', 'Wholesome and soft', 'Something healing', 'Warm and happy', 'Wholesome'].includes(s))) {
    genres.push('4')
  }

  if (all.some(s => ['Something healing', 'Wholesome and soft'].includes(s))) {
    genres.push('36')
  }

  if (all.includes('School romance')) {
    keyword = keyword || 'school romance'
  } else if (all.includes('Adult romance')) {
    keyword = keyword || 'adult romance'
  } else if (all.some(s => ['Slow burn', 'Bittersweet', 'Empty'].includes(s))) {
    keyword = keyword || 'slow burn romance'
  } else if (all.some(s => ['Wholesome and soft', 'Something healing'].includes(s))) {
    keyword = keyword || 'wholesome romance'
  } else if (all.some(s => ['Emotional damage', 'Emotionally destroyed'].includes(s))) {
    keyword = keyword || 'emotional romance'
  }

  return {
    genres: [...new Set(genres)].join(','),
    keyword,
    orderBy,
  }
}

export default function Recommendations() {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState({ finished: '', feeling: [], want: [] })
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)

  function handleInput(value) {
    setAnswers(prev => ({ ...prev, finished: value }))
  }

  function toggleMulti(stepId, value) {
    setAnswers(prev => ({
      ...prev,
      [stepId]: prev[stepId].includes(value)
        ? prev[stepId].filter(v => v !== value)
        : [...prev[stepId], value],
    }))
  }

  async function handleNext() {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      setLoading(true)
      setSearching(true)

      try {
        const { genres, keyword, orderBy } = buildJikanParams(answers.finished, answers.feeling, answers.want)
        
        // Try with keyword first
        let url = `https://api.jikan.moe/v4/anime?genres=${genres}&q=${encodeURIComponent(keyword)}&order_by=${orderBy}&sort=desc&limit=12&sfw=true`
        let res = await fetch(url)
        
        // If rate limited or too few results, try without keyword
        if (res.status === 429) {
            await new Promise(r => setTimeout(r, 1000))
            res = await fetch(url)
        }
        
        let data = await res.json()
        let results = data.data || []
        
        // If less than 4 results, try again with just genre and no keyword
        if (results.length < 4) {
            await new Promise(r => setTimeout(r, 500))
            const fallbackUrl = `https://api.jikan.moe/v4/anime?genres=${genres}&order_by=score&sort=desc&limit=12&sfw=true`
            const fallbackRes = await fetch(fallbackUrl)
            const fallbackData = await fallbackRes.json()
            results = fallbackData.data || []
        }

        const mapped = results.map(anime => ({
            mal_id: anime.mal_id,
            title: anime.title_english || anime.title,
            image: anime.images?.jpg?.image_url,
            year: anime.year,
            score: anime.score,
            synopsis: anime.synopsis,
            slug: (anime.title_english || anime.title)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, ''),
        }))

        setResults(mapped)
        } catch (err) {
        console.error(err)
        setResults([])
        setSearching(false)
        }

      setLoading(false)
      setSearching(false)
    }
  }

  function handleReset() {
    setAnswers({ finished: '', feeling: [], want: [] })
    setCurrentStep(0)
    setResults(null)
  }

  const step = steps[currentStep]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <Navbar />

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '36px',
          fontWeight: '600',
          color: 'var(--text)',
          marginBottom: '8px',
        }}>
          Find your next anime
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-soft)', marginBottom: '40px' }}>
          Based on how you feel, not just what you watched.
        </p>

        {/* Questions */}
        {!results && !loading && (
          <div style={{
            backgroundColor: 'white',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            padding: '40px',
          }}>
            {/* Progress */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
              {steps.map((s, i) => (
                <div key={s.id} style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: '2px',
                  backgroundColor: i <= currentStep ? 'var(--primary)' : 'var(--border)',
                }} />
              ))}
            </div>

            <h2 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '24px',
              fontWeight: '600',
              color: 'var(--text)',
              marginBottom: '8px',
            }}>
              {step.question}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-soft)', marginBottom: '28px' }}>
              {step.subtext}
            </p>

            {step.type === 'input' && (
              <input
                type="text"
                value={answers.finished}
                onChange={e => handleInput(e.target.value)}
                placeholder={step.placeholder}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: '12px',
                  border: '2px solid var(--border)',
                  fontSize: '15px',
                  color: 'var(--text)',
                  outline: 'none',
                  backgroundColor: 'var(--bg)',
                  marginBottom: '24px',
                }}
              />
            )}

            {step.type === 'multi' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '28px' }}>
                {step.options.map(opt => {
                  const selected = answers[step.id].includes(opt.label)
                  return (
                    <button
                      key={opt.label}
                      onClick={() => toggleMulti(step.id, opt.label)}
                      style={{
                        backgroundColor: selected ? 'var(--primary)' : 'white',
                        color: selected ? 'white' : 'var(--text)',
                        border: `2px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                        borderRadius: '20px',
                        padding: '10px 18px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {opt.emoji} {opt.label}
                    </button>
                  )
                })}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  style={{
                    backgroundColor: 'white',
                    border: '2px solid var(--border)',
                    borderRadius: '12px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'var(--text)',
                    cursor: 'pointer',
                  }}
                >
                  ← Back
                </button>
              )}
              <button
                onClick={handleNext}
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 28px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {currentStep === steps.length - 1 ? 'Find anime 🌸' : 'Next →'}
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
            <div style={{
                backgroundColor: 'white',
                border: '1px solid var(--border)',
                borderRadius: '24px',
                padding: '80px 40px',
                textAlign: 'center',
            }}>
                <p style={{ fontSize: '40px', marginBottom: '16px' }}>🌸</p>
                <p style={{ fontSize: '16px', color: 'var(--text-soft)' }}>
                {searching ? 'Searching for anime that matches how you feel...' : 'Finding anime that matches how you feel...'}
                </p>
            </div>
            )}

        {/* Results */}
        {results && !loading && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: '24px',
                  fontWeight: '600',
                  color: 'var(--text)',
                  marginBottom: '4px',
                }}>
                  Your recommendations
                </h2>
                {answers.finished && (
                  <p style={{ fontSize: '14px', color: 'var(--text-soft)' }}>
                    Based on finishing {answers.finished}
                  </p>
                )}
              </div>
              <button
                onClick={handleReset}
                style={{
                  backgroundColor: 'white',
                  border: '2px solid var(--border)',
                  borderRadius: '12px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'var(--text)',
                  cursor: 'pointer',
                }}
              >
                Start over
              </button>
            </div>

            {results.length === 0 ? (
              <div style={{
                backgroundColor: 'white',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '40px',
                textAlign: 'center',
                color: 'var(--text-soft)',
                }}>
                <p style={{ fontSize: '32px', marginBottom: '12px' }}>🌸</p>
                <p>No anime found for those selections. Try different options.</p>
                </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {results.map(rec => (
                  <div key={rec.mal_id} style={{
                    backgroundColor: 'white',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '24px',
                    display: 'flex',
                    gap: '20px',
                  }}>
                    {rec.image && (
                      <img
                        src={rec.image}
                        alt={rec.title}
                        style={{
                          width: '70px',
                          height: '100px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: 'var(--text)',
                        marginBottom: '6px',
                      }}>
                        {rec.title}
                      </h3>
                      <div style={{ display: 'flex', gap: '16px', marginBottom: '10px' }}>
                        {rec.year && (
                          <p style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '500' }}>
                            {rec.year}
                          </p>
                        )}
                        {rec.score && (
                          <p style={{ fontSize: '13px', color: 'var(--text-soft)', fontWeight: '500' }}>
                            ⭐ {rec.score}
                          </p>
                        )}
                      </div>
                      {rec.synopsis && (
                        <p style={{
                          fontSize: '14px',
                          color: 'var(--text-soft)',
                          lineHeight: '1.6',
                          marginBottom: '14px',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}>
                          {rec.synopsis}
                        </p>
                      )}
                      <Link
                        href={`/anime/${rec.slug}?mal_id=${rec.mal_id}&title=${encodeURIComponent(rec.title)}&image=${encodeURIComponent(rec.image || '')}&year=${rec.year || ''}&synopsis=${encodeURIComponent(rec.synopsis || '')}`}
                        style={{
                          backgroundColor: 'var(--primary)',
                          color: 'white',
                          textDecoration: 'none',
                          borderRadius: '20px',
                          padding: '8px 20px',
                          fontSize: '13px',
                          fontWeight: '600',
                          display: 'inline-block',
                        }}
                      >
                        Go to room →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}