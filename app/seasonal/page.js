'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '../components/Navbar'

const days = ['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function getEpisodesAired(anime) {
  // Jikan returns aired.from as start date
  if (!anime.aired?.from) return null
  const start = new Date(anime.aired.from)
  const now = new Date()
  if (start > now) return 0
  const weeksDiff = Math.floor((now - start) / (7 * 24 * 60 * 60 * 1000)) + 1
  const total = anime.episodes
  if (total) return Math.min(weeksDiff, total)
  return weeksDiff
}

function getBroadcastDay(anime) {
  if (!anime.broadcast?.day) return null
  // Jikan returns "Mondays", "Tuesdays" etc — strip the s
  return anime.broadcast.day.replace(/s$/, '')
}

export default function SeasonalPage() {
  const [current, setCurrent] = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('airing')
  const [activeDay, setActiveDay] = useState('All')

  useEffect(() => {
    async function load() {
      try {
        const [currentRes, upcomingRes] = await Promise.all([
          fetch('https://api.jikan.moe/v4/seasons/now'),
          fetch('https://api.jikan.moe/v4/seasons/upcoming'),
        ])

        const currentData = await currentRes.json()
        const upcomingData = await upcomingRes.json()

        const mapAnime = (list) =>
          (list || [])
            .filter(anime =>
              anime.genres?.some(g => g.mal_id === 22) ||
              anime.themes?.some(t => t.mal_id === 22)
            )
            .map(anime => ({
              mal_id: anime.mal_id,
              title: anime.title_english || anime.title,
              image: anime.images?.jpg?.image_url,
              score: anime.score,
              episodes: anime.episodes,
              episodesAired: getEpisodesAired(anime),
              synopsis: anime.synopsis,
              year: anime.year,
              season: anime.season,
              broadcastDay: getBroadcastDay(anime),
              broadcastTime: anime.broadcast?.time || null,
              slug: (anime.title_english || anime.title)
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, ''),
            }))

        setCurrent(mapAnime(currentData.data))
        setUpcoming(mapAnime(upcomingData.data))
      } catch (err) {
        console.error(err)
      }

      setLoading(false)
    }

    load()
  }, [])

  const baseList = activeTab === 'airing' ? current : upcoming

  const filteredList = activeDay === 'All'
    ? baseList
    : baseList.filter(anime => anime.broadcastDay === activeDay)

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
          Seasonal Romance
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-soft)', marginBottom: '32px' }}>
          Romance anime currently airing and coming soon.
        </p>

        {/* Airing / Upcoming tabs */}
        <div style={{
          display: 'flex',
          gap: '4px',
          borderBottom: '1px solid var(--border)',
          marginBottom: '24px',
        }}>
          {['airing', 'upcoming'].map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setActiveDay('All') }}
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
              {tab === 'airing' ? 'Currently Airing' : 'Coming Soon'}
            </button>
          ))}
        </div>

        {/* Day filter — only show for airing */}
        {activeTab === 'airing' && (
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '32px',
          }}>
            {days.map(day => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                style={{
                  backgroundColor: activeDay === day ? 'var(--primary)' : 'white',
                  color: activeDay === day ? 'white' : 'var(--text)',
                  border: `2px solid ${activeDay === day ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: '20px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                {day}
                {day !== 'All' && (
                  <span style={{ marginLeft: '4px', fontSize: '11px', opacity: 0.7 }}>
                    ({current.filter(a => a.broadcastDay === day).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-soft)' }}>
            <p style={{ fontSize: '32px', marginBottom: '16px' }}>🌸</p>
            <p>Loading seasonal anime...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-soft)' }}>
            <p style={{ fontSize: '32px', marginBottom: '16px' }}>🌸</p>
            <p>No romance anime found{activeDay !== 'All' ? ` airing on ${activeDay}` : ''}.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredList.map(anime => (
              <Link
                key={anime.mal_id}
                href={`/anime/${anime.slug}?mal_id=${anime.mal_id}&title=${encodeURIComponent(anime.title)}&image=${encodeURIComponent(anime.image || '')}&year=${anime.year || ''}&synopsis=${encodeURIComponent(anime.synopsis || '')}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  backgroundColor: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  gap: '20px',
                  cursor: 'pointer',
                }}>
                  {anime.image && (
                    <img
                      src={anime.image}
                      alt={anime.title}
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
                      fontSize: '17px',
                      fontWeight: '600',
                      color: 'var(--text)',
                      marginBottom: '6px',
                    }}>
                      {anime.title}
                    </h3>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {anime.score && (
                        <span style={{ fontSize: '13px', color: 'var(--text-soft)', fontWeight: '500' }}>
                          ⭐ {anime.score}
                        </span>
                      )}
                      {anime.broadcastDay && (
                        <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '500' }}>
                          📅 {anime.broadcastDay}s
                          {anime.broadcastTime ? ` at ${anime.broadcastTime} JST` : ''}
                        </span>
                      )}
                      {activeTab === 'airing' && anime.episodesAired !== null && (
                        <span style={{
                          backgroundColor: 'var(--lavender)',
                          borderRadius: '20px',
                          padding: '3px 10px',
                          fontSize: '12px',
                          fontWeight: '500',
                          color: 'var(--text)',
                        }}>
                          {anime.episodesAired} ep{anime.episodesAired !== 1 ? 's' : ''} out
                          {anime.episodes ? ` / ${anime.episodes}` : ''}
                        </span>
                      )}
                      {anime.season && anime.year && (
                        <span style={{ fontSize: '13px', color: 'var(--text-soft)', textTransform: 'capitalize' }}>
                          {anime.season} {anime.year}
                        </span>
                      )}
                    </div>
                    {anime.synopsis && (
                      <p style={{
                        fontSize: '14px',
                        color: 'var(--text-soft)',
                        lineHeight: '1.6',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {anime.synopsis}
                      </p>
                    )}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    color: 'var(--primary)',
                    fontSize: '20px',
                    flexShrink: 0,
                  }}>
                    →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}