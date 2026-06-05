import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function seedAnimeMetadata() {
  const { data: animeList, error } = await supabase
    .from('anime')
    .select('id, mal_id, title')

  if (error) {
    console.error(error)
    return
  }

  console.log(`Found ${animeList.length} anime`)

  for (const anime of animeList) {
    try {
      console.log(`Updating ${anime.title}`)

      const res = await fetch(
        `https://api.jikan.moe/v4/anime/${anime.mal_id}/full`
      )

      const json = await res.json()

      const details = json.data

      await supabase
        .from('anime')
        .update({
          genres: details.genres?.map(g => g.name) || [],
          status: details.status || null,
        })
        .eq('id', anime.id)

      await sleep(1200)
    } catch (err) {
      console.error(`Failed ${anime.title}`, err)
    }
  }

  console.log('Done')
}

seedAnimeMetadata()