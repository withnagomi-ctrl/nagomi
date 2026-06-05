'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '../../components/Navbar'
import PostCard from '../../components/PostCard'
import { createClient } from '../../lib/supabase-client'
import { containsBannedWord } from '../../lib/wordFilter'
import { checkRateLimit } from '../../lib/rateLimit'

const tabs = [
  'After the Ending',
  'Spoiler-Free',
  'Spoilers',
  'Recommendations',
  'Favourite Moments',
  'People Who Felt This',
]

const moodOptions = [
  'Empty', 'Heartbroken', 'Wholesome', 'Happy',
  'Emotionally Destroyed', 'Healing', 'Bittersweet', 'Warm',
]

const spoilerOptions = [
  { value: 'none', label: 'No spoilers' },
  { value: 'minor', label: 'Minor spoilers' },
  { value: 'major', label: 'Major spoilers' },
  { value: 'ending', label: 'Ending spoilers' },
]

function SynopsisText({ text }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = text.length > 300

  return (
    <div>
      <p style={{
        fontSize: '14px',
        color: 'var(--text-soft)',
        lineHeight: '1.7',
        maxWidth: '600px',
      }}>
        {expanded || !isLong ? text : text.slice(0, 300) + '...'}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            padding: '4px 0',
            marginTop: '4px',
          }}
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  )
}

export default function AnimeRoom() {
  const { slug } = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [anime, setAnime] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [activeTab, setActiveTab] = useState('After the Ending')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [postContent, setPostContent] = useState('')
  const [postMood, setPostMood] = useState('')
  const [spoilerLevel, setSpoilerLevel] = useState('none')
  const [submitting, setSubmitting] = useState(false)
  const [showPostForm, setShowPostForm] = useState(false)
  const [blurSpoilers, setBlurSpoilers] = useState(true)
  const [currentProfile, setCurrentProfile] = useState(null)

  useEffect(() => {
    async function load() {
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user)

        if (user) {
            const { data: cp } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', user.id)
                .single()
            setCurrentProfile(cp)
            }

        if (user) {
        const { data: userPref } = await supabase
            .from('profiles')
            .select('blur_spoilers')
            .eq('id', user.id)
            .single()
        setBlurSpoilers(userPref?.blur_spoilers ?? true)
        }

        // First check database
        const { data: existing } = await supabase
            .from('anime')
            .select('*')
            .eq('slug', slug)
            .maybeSingle()

        if (existing) {
            setAnime(existing)
            await loadPosts(existing.id, 'After the Ending')
            setLoading(false)
            return
        }

        // Not in database — try query params first
        const params = new URLSearchParams(window.location.search)
        const mal_id = params.get('mal_id')
        const title = params.get('title')
        const image_url = params.get('image')
        const year = params.get('year')
        const synopsis = params.get('synopsis')

        if (mal_id && title) {
            const { data: inserted } = await supabase
            .from('anime')
            .insert({
                mal_id: parseInt(mal_id),
                title,
                slug,
                image_url,
                synopsis,
                year: year ? parseInt(year) : null,
            })
            .select()
            .single()

            if (inserted) {
            setAnime(inserted)
            await loadPosts(inserted.id, 'After the Ending')
            setLoading(false)
            return
            }

            // Insert failed — row might already exist with slight slug difference, fetch it
            const { data: fallback } = await supabase
            .from('anime')
            .select('*')
            .eq('mal_id', parseInt(mal_id))
            .maybeSingle()

            if (fallback) {
            setAnime(fallback)
            await loadPosts(fallback.id, 'After the Ending')
            setLoading(false)
            return
            }
        }

        // Last resort — fetch from Jikan
        const searchTitle = slug.replace(/-/g, ' ')
        try {
            const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(searchTitle)}&genres=22&limit=1&sfw=true`)
            const data = await res.json()
            const found = data.data?.[0]
            console.log(found)

            if (found) {
            const newSlug = (found.title_english || found.title)
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')

            const detailsRes = await fetch(
              `https://api.jikan.moe/v4/anime/${found.mal_id}/full`
            )

            const detailsData = await detailsRes.json()
            const animeDetails = detailsData.data
            
            const { data: inserted, error } = await supabase
            .from('anime')
            .insert({
              mal_id: animeDetails.mal_id,
              title: animeDetails.title_english || animeDetails.title,
              slug: newSlug,
              image_url: animeDetails.images?.jpg?.image_url,
              synopsis: animeDetails.synopsis,
              year: animeDetails.year,
              genres: animeDetails.genres?.map(g => g.name) || [],
              status: animeDetails.status || null,
            })
            .select()
            .single()

          console.log('INSERTED:', inserted)
          console.log('ERROR:', error)

              

            if (inserted) {
                setAnime(inserted)
                await loadPosts(inserted.id, 'After the Ending')
                setLoading(false)
                return
            }

            

            // Already exists — fetch by mal_id
            const { data: fallback } = await supabase
                .from('anime')
                .select('*')
                .eq('mal_id', found.mal_id)
                .maybeSingle()

            if (fallback) {
                setAnime(fallback)
                await loadPosts(fallback.id, 'After the Ending')
            }
            }
        } catch (err) {
            console.error('Jikan fetch failed:', err)
        }

        setLoading(false)
        }

    load()
  }, [slug])

  async function loadPosts(animeId, tab) {
    let spoilerFilter = null

    if (tab === 'Spoiler-Free') spoilerFilter = 'none'
    if (tab === 'Spoilers') spoilerFilter = ['minor', 'major', 'ending']
    if (tab === 'Favourite Moments') spoilerFilter = null

    let query = supabase
      .from('posts')
      .select('*, profiles(username, avatar_url), reactions(*)')
      .eq('anime_id', animeId)
      .order('created_at', { ascending: false })

    if (tab === 'Recommendations') {
      query = query.eq('post_type', 'Recommendation Request')
    } else if (tab === 'Favourite Moments') {
      query = query.eq('post_type', 'Favourite Moment')
    } else if (tab === 'People Who Felt This') {
      query = query.not('mood', 'is', null)
    } else if (spoilerFilter === 'none') {
      query = query.eq('spoiler_level', 'none')
    } else if (Array.isArray(spoilerFilter)) {
      query = query.in('spoiler_level', spoilerFilter)
    }

    const { data } = await query.limit(50)
    setPosts(data || [])
  }

  async function handleTabChange(tab) {
    setActiveTab(tab)
    if (anime) await loadPosts(anime.id, tab)
  }

  async function handlePost(e) {
    e.preventDefault()
    if (!currentUser) {
      router.push('/login')
      return
    }
    if (!postContent.trim()) return

    if (containsBannedWord(postContent)) {
    alert('Your post contains inappropriate content.')
    return
    }

    const { allowed, message } = await checkRateLimit(currentUser.id, 'post')
    if (!allowed) {
      alert(message)
      return
    }

    setSubmitting(true)

    let postType = 'Reaction'
    if (activeTab === 'Recommendations') postType = 'Recommendation Request'
    if (activeTab === 'Favourite Moments') postType = 'Favourite Moment'

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: currentUser.id,
        anime_id: anime.id,
        content: postContent,
        mood: postMood || null,
        post_type: postType,
        spoiler_level: spoilerLevel,
      })
      .select('*, profiles(username, avatar_url), reactions(*)')
      .single()

    if (!error && data) {
      setPosts(prev => [data, ...prev])
      setPostContent('')
      setPostMood('')
      setSpoilerLevel('none')
      setShowPostForm(false)
    }

    setSubmitting(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <Navbar />
      <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-soft)' }}>
        Loading room...
      </div>
    </div>
  )

  if (!anime) return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <Navbar />
      <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-soft)' }}>
        <p style={{ fontSize: '40px', marginBottom: '16px' }}>🌸</p>
        <p style={{ fontSize: '16px' }}>Anime not found. Try searching for it first.</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <Navbar />

      {/* Anime header */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid var(--border)',
        padding: '40px 24px',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
          {anime.image_url && (
            <img
              src={anime.image_url}
              alt={anime.title}
              style={{
                width: '120px',
                height: '170px',
                objectFit: 'cover',
                borderRadius: '12px',
                flexShrink: 0,
              }}
            />
          )}
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '36px',
              fontWeight: '600',
              color: 'var(--text)',
              marginBottom: '8px',
            }}>
              {anime.title}
            </h1>
            {anime.year && (
              <p style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: '500', marginBottom: '12px' }}>
                {anime.year}
              </p>
            )}
            {anime.synopsis && (
              <SynopsisText text={anime.synopsis} />
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        overflowX: 'auto',
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          display: 'flex',
          gap: '4px',
        }}>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              style={{
                padding: '16px 20px',
                fontSize: '14px',
                fontWeight: '500',
                color: activeTab === tab ? 'var(--primary)' : 'var(--text-soft)',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>

        {!showPostForm && (
          <button
            onClick={() => currentUser ? setShowPostForm(true) : router.push('/login')}
            style={{
              width: '100%',
              backgroundColor: 'white',
              border: '2px solid var(--border)',
              borderRadius: '16px',
              padding: '16px 20px',
              fontSize: '15px',
              color: 'var(--text-soft)',
              cursor: 'pointer',
              textAlign: 'left',
              marginBottom: '24px',
            }}
          >
            {activeTab === 'Recommendations' ? '🌸 Ask for recommendations...' :
             activeTab === 'Favourite Moments' ? '💕 Share a favourite moment...' :
             '💭 How did this anime make you feel?'}
          </button>
        )}

        {showPostForm && (
          <div style={{
            backgroundColor: 'white',
            border: '2px solid var(--primary)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
          }}>
            <textarea
              value={postContent}
              onChange={e => setPostContent(e.target.value)}
              placeholder={
                activeTab === 'Recommendations' ? 'What are you looking for after this anime?' :
                activeTab === 'Favourite Moments' ? 'What was your favourite moment?' :
                'How did this anime make you feel?'
              }
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                fontSize: '15px',
                color: 'var(--text)',
                outline: 'none',
                resize: 'vertical',
                backgroundColor: 'var(--bg)',
                marginBottom: '16px',
              }}
            />

            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <select
                value={postMood}
                onChange={e => setPostMood(e.target.value)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: '2px solid var(--border)',
                  fontSize: '14px',
                  color: 'var(--text)',
                  backgroundColor: 'white',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">Select mood...</option>
                {moodOptions.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              <select
                value={spoilerLevel}
                onChange={e => setSpoilerLevel(e.target.value)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: '2px solid var(--border)',
                  fontSize: '14px',
                  color: 'var(--text)',
                  backgroundColor: 'white',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {spoilerOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowPostForm(false)}
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
                Cancel
              </button>
              <button
                onClick={handlePost}
                disabled={submitting || !postContent.trim()}
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting || !postContent.trim() ? 0.7 : 1,
                }}
              >
                {submitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        )}

        {posts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            color: 'var(--text-soft)',
          }}>
            <p style={{ fontSize: '32px', marginBottom: '16px' }}>🌸</p>
            <p style={{ fontSize: '16px' }}>No posts yet. Be the first to share how this anime made you feel.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={currentUser?.id}
                currentUsername={currentProfile?.username}
                blurSpoilers={blurSpoilers}
                />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}