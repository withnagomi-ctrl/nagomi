// Client-side word filter
// Banned words are also checked server-side via the database

const localBannedWords = [
  'nigger', 'nigga', 'faggot', 'retard', 'kys',
  'kill yourself', 'rape', 'pedo', 'groomer',
  'discord gg', 'snap add', 'telegram', 'whatsapp me',
  'send nudes', 'nude', 'onlyfans',
]

export function containsBannedWord(text) {
  if (!text) return false
  const lower = text.toLowerCase()
  return localBannedWords.some(word => lower.includes(word.toLowerCase()))
}

export function filterText(text) {
  if (!text) return text
  let filtered = text
  localBannedWords.forEach(word => {
    const regex = new RegExp(word, 'gi')
    filtered = filtered.replace(regex, '*'.repeat(word.length))
  })
  return filtered
}