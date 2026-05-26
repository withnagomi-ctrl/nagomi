'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../components/Navbar'

export default function AnimePage() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const query = searchParams.get('search')
    if (query) {
      setSearch(query)
      fetchAnime(query)
    }
  }, [searchParams])

  async function fetchAnime(query) {
    setLoading(true)
    try {
      const res = await fetch(`/api/anime/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      const seen = new Set()
        const unique = (data.results || []).filter(anime => {
        if (seen.has(anime.mal_id)) return false
        seen.add(anime.mal_id)
        return true
        })
        setResults(unique)
    } catch (error) {
      console.error(error)
    }
    setLoading(false)
  }

  function handleSearch(e) {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/anime?search=${encodeURIComponent(search)}`)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <Navbar />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '36px',
          fontWeight: '600',
          color: 'var(--text)',
          marginBottom: '8px',
        }}>
          Anime Rooms
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-soft)', marginBottom: '32px' }}>
          Search for the anime you just finished and find people who felt the same.
        </p>

        {/* Search */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', marginBottom: '40px' }}>
          <input
            type="text"
            placeholder="Search romance anime..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: '14px 20px',
              borderRadius: '30px',
              border: '2px solid var(--border)',
              backgroundColor: 'white',
              fontSize: '15px',
              color: 'var(--text)',
              outline: 'none',
            }}
          />
          <button type="submit" style={{
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '30px',
            padding: '14px 28px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
          }}>
            Search
          </button>
        </form>

        {/* Results */}
        {loading && (
          <p style={{ textAlign: 'center', color: 'var(--text-soft)', padding: '40px' }}>
            Searching...
          </p>
        )}

        {!loading && results.length === 0 && search && (
          <p style={{ textAlign: 'center', color: 'var(--text-soft)', padding: '40px' }}>
            No results found. Try a different search.
          </p>
        )}

        {!loading && results.length === 0 && !search && (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-soft)' }}>
            <p style={{ fontSize: '40px', marginBottom: '16px' }}>🌸</p>
            <p style={{ fontSize: '16px', marginBottom: '6px' }}>Search for a romance anime to find its room.</p>
            <p style={{ fontSize: '13px', lineHeight: '1.6' }}>
            Try the anime you just finished, then share how it made you feel.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {results.map(anime => (
            <Link
                key={anime.mal_id}
                href={`/anime/${anime.slug}?mal_id=${anime.mal_id}&title=${encodeURIComponent(anime.title)}&image=${encodeURIComponent(anime.image_url || '')}&year=${anime.year || ''}&synopsis=${encodeURIComponent(anime.synopsis || '')}`}
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
                transition: 'border-color 0.2s',
              }}>
                {anime.image_url && (
                  <img
                    src={anime.image_url}
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
                    fontSize: '18px',
                    fontWeight: '600',
                    color: 'var(--text)',
                    marginBottom: '8px',
                  }}>
                    {anime.title}
                  </h3>
                  {anime.year && (
                    <p style={{ fontSize: '13px', color: 'var(--primary)', marginBottom: '8px', fontWeight: '500' }}>
                      {anime.year}
                    </p>
                  )}
                  {anime.synopsis && (
                    <p style={{
                      fontSize: '14px',
                      color: 'var(--text-soft)',
                      lineHeight: '1.6',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
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
      </div>
    </div>
  )
}