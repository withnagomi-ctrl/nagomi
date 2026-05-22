'use client'

import { useState } from 'react'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import { createClient } from '../lib/supabase-client'

export default function Explore() {
  const [userSearch, setUserSearch] = useState('')
  const [userResults, setUserResults] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleUserSearch(e) {
    e.preventDefault()
    if (!userSearch.trim()) return
    setLoading(true)
    setSearched(true)

    const { data } = await supabase
      .from('profiles')
      .select('username, bio, avatar_url, favourite_anime, mood_tags, anime_that_broke_me, anime_that_healed_me')
      .ilike('username', `%${userSearch}%`)
      .limit(20)

    setUserResults(data || [])
    setLoading(false)
  }

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
          Explore
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-soft)', marginBottom: '40px' }}>
          Find romance anime fans with similar taste.
        </p>

        {/* User search */}
        <form onSubmit={handleUserSearch} style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
          <input
            type="text"
            placeholder="Search for a user..."
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
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
          <p style={{ textAlign: 'center', color: 'var(--text-soft)', padding: '40px' }}>Searching...</p>
        )}

        {!loading && searched && userResults.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-soft)', padding: '40px' }}>
            No users found.
          </p>
        )}

        {!loading && !searched && (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-soft)' }}>
            <p style={{ fontSize: '40px', marginBottom: '16px' }}>🌸</p>
            <p style={{ fontSize: '16px' }}>Search for a username to find people.</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {userResults.map(user => (
            <Link key={user.username} href={`/profile/${user.username}`} style={{ textDecoration: 'none' }}>
              <div style={{
                backgroundColor: 'white',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-start',
                cursor: 'pointer',
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--lavender)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  flexShrink: 0,
                }}>
                  🌸
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>
                    {user.username}
                  </p>
                  {user.bio && (
                    <p style={{ fontSize: '13px', color: 'var(--text-soft)', marginBottom: '8px' }}>
                      {user.bio}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {user.favourite_anime?.length > 0 && (
                      <p style={{ fontSize: '12px', color: 'var(--text-soft)' }}>
                        💕 {user.favourite_anime[0]}
                      </p>
                    )}
                    {user.anime_that_broke_me && (
                      <p style={{ fontSize: '12px', color: 'var(--text-soft)' }}>
                        💔 {user.anime_that_broke_me}
                      </p>
                    )}
                  </div>
                  {user.mood_tags?.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {user.mood_tags.slice(0, 3).map(tag => (
                        <span key={tag} style={{
                          backgroundColor: 'var(--lavender)',
                          color: 'var(--text)',
                          borderRadius: '20px',
                          padding: '3px 10px',
                          fontSize: '11px',
                          fontWeight: '500',
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}