import { createClient } from './supabase-client'

const limits = {
  live_chat: { max: 5, windowSeconds: 15 },
  direct_message: { max: 10, windowSeconds: 60 },
  post: { max: 5, windowSeconds: 3600 },
  comment: { max: 20, windowSeconds: 3600 },
  report: { max: 10, windowSeconds: 86400 },
}

export async function checkRateLimit(userId, action) {
  const supabase = createClient()
  const limit = limits[action]
  if (!limit) return { allowed: true }

  const windowStart = new Date(Date.now() - limit.windowSeconds * 1000).toISOString()

  const { count } = await supabase
    .from('rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action', action)
    .gte('created_at', windowStart)

  if (count >= limit.max) {
    return { allowed: false, message: getRateLimitMessage(action) }
  }

  await supabase
    .from('rate_limits')
    .insert({ user_id: userId, action })

  return { allowed: true }
}

function getRateLimitMessage(action) {
  switch (action) {
    case 'live_chat': return 'You are sending messages too fast. Please slow down.'
    case 'direct_message': return 'You are sending too many messages. Please wait a moment.'
    case 'post': return 'You have posted too many times this hour. Please wait.'
    case 'comment': return 'You have commented too many times this hour. Please wait.'
    case 'report': return 'You have submitted too many reports today.'
    default: return 'You are doing that too fast. Please slow down.'
  }
}