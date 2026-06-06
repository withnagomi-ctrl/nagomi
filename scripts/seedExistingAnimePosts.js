import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
import { generateSeedPosts } from '../app/lib/seedPosts.js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const NAGOMI_USER_ID = '08fbfb03-0e4a-409d-a414-2eb2b34f2799'

async function run() {
  const { data: animeList, error } = await supabase
    .from('anime')
    .select('*')

  if (error) {
    console.log('Failed to fetch anime:', error)
    return
  }

  if (!animeList || animeList.length === 0) {
    console.log('No anime found')
    return
  }

  for (const anime of animeList) {
    try {
      const { count, error: countError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('anime_id', anime.id)
        .eq('is_seeded', true)

      if (countError) {
        console.log(`Count error for ${anime.title}:`, countError)
        continue
      }

      if (count > 0) continue

      const seedPosts = generateSeedPosts(anime)

      const { error: insertError } = await supabase
        .from('posts')
        .insert(
          seedPosts.map(post => ({
            ...post,
            anime_id: anime.id,
            user_id: NAGOMI_USER_ID,
          }))
        )

      if (insertError) {
        console.log(`Insert error for ${anime.title}:`, insertError)
      } else {
        console.log(`Seeded: ${anime.title}`)
      }

      // optional safety delay
      await new Promise(r => setTimeout(r, 200))

    } catch (err) {
      console.log(`Unexpected error for ${anime.title}:`, err)
    }
  }

  console.log('Done seeding')
}

run()