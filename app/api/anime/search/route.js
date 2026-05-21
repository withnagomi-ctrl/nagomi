export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return Response.json({ error: 'No query provided' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&genres=22&limit=10&sfw=true`
    )
    const data = await res.json()

    const results = data.data?.map(anime => ({
      mal_id: anime.mal_id,
      title: anime.title_english || anime.title,
      image_url: anime.images?.jpg?.image_url,
      synopsis: anime.synopsis,
      year: anime.year,
      slug: (anime.title_english || anime.title)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, ''),
    })) || []

    return Response.json({ results })
  } catch (error) {
    return Response.json({ error: 'Failed to fetch anime' }, { status: 500 })
  }
}