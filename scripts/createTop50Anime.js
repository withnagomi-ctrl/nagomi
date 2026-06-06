import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('URL:', supabaseUrl)
console.log('KEY exists:', !!supabaseKey)

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase env vars')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Romance genre ID in MAL/Jikan
const ROMANCE_GENRE_ID = 22

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function fetchPage(page) {
  const res = await fetch(
    `https://api.jikan.moe/v4/top/anime?page=${page}&filter=bypopularity`
  )
  return res.json()
}

function isRomance(anime) {
  return anime.genres?.some(g => g.mal_id === ROMANCE_GENRE_ID)
}

async function run() {
  const collected = []
  let page = 1

  console.log('Fetching top romance anime...')

  while (collected.length < 50) {
    console.log(`Fetching page ${page}`)

    const data = await fetchPage(page)

    if (!data.data || data.data.length === 0) break

    for (const anime of data.data) {
      if (isRomance(anime)) {
        collected.push(anime)

        if (collected.length >= 50) break
      }
    }

    page++

    // respect rate limits
    await new Promise(r => setTimeout(r, 1000))
  }

  console.log(`Found ${collected.length} romance anime`)

  for (const anime of collected) {
    try {
      const { error } = await supabase.from('anime').upsert(
        {
          mal_id: anime.mal_id,
          title: anime.title_english || anime.title,
          slug: slugify(anime.title_english || anime.title),
          image_url: anime.images?.jpg?.image_url,
          synopsis: anime.synopsis,
          year: anime.year,
          genres: anime.genres?.map(g => g.name) || [],
          status: anime.status || null,
        },
        {
          onConflict: 'mal_id',
        }
      )

      if (error) {
        console.log(error.message)
      } else {
        console.log(`Added ${anime.title}`)
      }

      await new Promise(r => setTimeout(r, 1000))
    } catch (err) {
      console.log(err)
    }
  }

  console.log('Done')
}

run()