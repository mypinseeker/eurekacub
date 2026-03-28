import { describe, it, expect } from 'vitest'
import {
  selectFeedback,
  getRandomVariant,
  type FeedbackMessage,
} from '../../src/engine/feedback'

const messages: FeedbackMessage[] = [
  {
    category: 'correct',
    context: 'first-try',
    message: { zh: '太棒了！', en: 'Awesome!' },
  },
  {
    category: 'correct',
    context: 'first-try',
    message: { zh: '真厉害！', en: 'Amazing!' },
  },
  {
    category: 'correct',
    context: 'after-struggle',
    message: { zh: '坚持就是胜利！', en: 'Persistence pays off!' },
  },
  {
    category: 'correct',
    context: 'streak',
    message: { zh: '连续答对！', en: 'On a streak!' },
  },
  {
    category: 'error',
    context: 'default',
    message: { zh: '没关系，再试一次', en: "That's okay, try again" },
  },
  {
    category: 'hint',
    context: 'default',
    message: { zh: '提示来了', en: 'Here comes a hint' },
  },
  {
    category: 'aha',
    context: 'default',
    message: { zh: '你发现了！', en: 'You got it!' },
  },
  {
    category: 'encourage',
    context: 'default',
    message: { zh: '加油！', en: 'You can do it!' },
  },
]

describe('Feedback Selector', () => {
  it('selectFeedback returns matching message (exact match)', () => {
    const result = selectFeedback(messages, 'correct', 'streak', 'en')
    expect(result).toBe('On a streak!')
  })

  it('selectFeedback returns zh locale', () => {
    const result = selectFeedback(messages, 'correct', 'streak', 'zh')
    expect(result).toBe('连续答对！')
  })

  it('selectFeedback returns en locale', () => {
    const result = selectFeedback(messages, 'error', 'default', 'en')
    expect(result).toBe("That's okay, try again")
  })

  it('locale switching works (zh/en)', () => {
    const zh = selectFeedback(messages, 'correct', 'after-struggle', 'zh')
    const en = selectFeedback(messages, 'correct', 'after-struggle', 'en')
    expect(zh).toBe('坚持就是胜利！')
    expect(en).toBe('Persistence pays off!')
  })

  it('returns fallback (category match) when no exact context match', () => {
    const result = selectFeedback(messages, 'error', 'nonexistent-context', 'en')
    // Should fall back to the only error message
    expect(result).toBe("That's okay, try again")
  })

  it('returns empty string when no match at all', () => {
    const result = selectFeedback(messages, 'nonexistent' as any, 'default', 'en')
    expect(result).toBe('')
  })

  it('getRandomVariant returns a message from category', () => {
    const result = getRandomVariant(messages, 'correct', 'en')
    const validEn = ['Awesome!', 'Amazing!', 'Persistence pays off!', 'On a streak!']
    expect(validEn).toContain(result)
  })

  it('getRandomVariant returns empty string for unknown category', () => {
    const result = getRandomVariant(messages, 'unknown', 'en')
    expect(result).toBe('')
  })

  it('getRandomVariant respects locale', () => {
    const result = getRandomVariant(messages, 'aha', 'zh')
    expect(result).toBe('你发现了！')
  })

  it('selectFeedback picks from multiple exact matches', () => {
    // Run multiple times to verify it returns one of the valid options
    const validEn = ['Awesome!', 'Amazing!']
    for (let i = 0; i < 20; i++) {
      const result = selectFeedback(messages, 'correct', 'first-try', 'en')
      expect(validEn).toContain(result)
    }
  })
})
