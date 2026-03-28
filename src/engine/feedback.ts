// Growth-mindset feedback selector
// Categories: correct, error, hint, aha, encourage
// Context: first-try, after-struggle, streak, etc.

export interface FeedbackMessage {
  category: 'correct' | 'error' | 'hint' | 'aha' | 'encourage'
  context: string
  message: { zh: string; en: string }
}

export function selectFeedback(
  messages: FeedbackMessage[],
  category: string,
  context: string,
  locale: 'zh' | 'en'
): string {
  // Try exact match first
  const exactMatches = messages.filter(
    (m) => m.category === category && m.context === context
  )
  if (exactMatches.length > 0) {
    const picked = exactMatches[Math.floor(Math.random() * exactMatches.length)]
    return picked.message[locale]
  }

  // Fallback: match category only
  const categoryMatches = messages.filter((m) => m.category === category)
  if (categoryMatches.length > 0) {
    const picked = categoryMatches[Math.floor(Math.random() * categoryMatches.length)]
    return picked.message[locale]
  }

  return ''
}

export function getRandomVariant(
  messages: FeedbackMessage[],
  category: string,
  locale: 'zh' | 'en'
): string {
  const matches = messages.filter((m) => m.category === category)
  if (matches.length === 0) return ''
  const picked = matches[Math.floor(Math.random() * matches.length)]
  return picked.message[locale]
}
