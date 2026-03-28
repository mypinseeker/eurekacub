import { describe, it, expect } from 'vitest'
import type { FlipResult } from '../../src/renderers/probability/types'
import {
  parsePuzzleData,
  countHeads,
  headRatio,
  spawnConfetti,
  isPredictionAccurate,
  shouldTriggerAha,
  isMilestone,
  isAllExperimentsComplete,
} from '../../src/renderers/probability/probability.utils'

// ─────────────────────────────────────────────────────────────
// FR-8: Probability / Law of Large Numbers — CoinFlip renderer
// ─────────────────────────────────────────────────────────────

describe('Probability (CoinFlip) — parsePuzzleData', () => {
  // FR-8: defaults (20 flips, type='coin')
  it('returns defaults for empty puzzle', () => {
    const result = parsePuzzleData({})
    expect(result.totalFlips).toBe(20)
    expect(result.type).toBe('coin')
    expect(result.question.en).toContain('heads')
  })

  // FR-8: custom totalFlips
  it('parses custom totalFlips from puzzle.data', () => {
    const result = parsePuzzleData({ data: { totalFlips: 50 } })
    expect(result.totalFlips).toBe(50)
  })

  // FR-8: parses top-level fields as fallback
  it('parses top-level fields when .data is absent', () => {
    const result = parsePuzzleData({ totalFlips: 30, type: 'coin' })
    expect(result.totalFlips).toBe(30)
    expect(result.type).toBe('coin')
  })

  // FR-8: preserves custom question
  it('preserves custom question text', () => {
    const q = { zh: '自定义', en: 'Custom question' }
    const result = parsePuzzleData({ data: { question: q } })
    expect(result.question).toEqual(q)
  })
})

describe('Probability (CoinFlip) — countHeads', () => {
  // FR-8: count 'H' results
  it('counts heads in mixed history', () => {
    expect(countHeads(['H', 'T', 'H', 'H', 'T'])).toBe(3)
  })

  // FR-8: edge case — empty history
  it('returns 0 for empty history', () => {
    expect(countHeads([])).toBe(0)
  })

  // FR-8: edge case — all heads
  it('returns length for all heads', () => {
    expect(countHeads(['H', 'H', 'H', 'H'])).toBe(4)
  })

  // FR-8: edge case — all tails
  it('returns 0 for all tails', () => {
    expect(countHeads(['T', 'T', 'T'])).toBe(0)
  })

  // FR-8: single flip
  it('handles single flip', () => {
    expect(countHeads(['H'])).toBe(1)
    expect(countHeads(['T'])).toBe(0)
  })
})

describe('Probability (CoinFlip) — headRatio', () => {
  // FR-8: proportion calculation
  it('calculates ratio for mixed history', () => {
    expect(headRatio(['H', 'T', 'H', 'T'])).toBe(0.5)
  })

  // FR-8: edge case — empty history returns 0
  it('returns 0 for empty history', () => {
    expect(headRatio([])).toBe(0)
  })

  // FR-8: all heads = 1.0
  it('returns 1.0 for all heads', () => {
    expect(headRatio(['H', 'H', 'H'])).toBe(1.0)
  })

  // FR-8: all tails = 0.0
  it('returns 0.0 for all tails', () => {
    expect(headRatio(['T', 'T', 'T'])).toBe(0.0)
  })

  // FR-8: 3 out of 10 = 0.3
  it('calculates non-trivial ratio', () => {
    const history: FlipResult[] = ['H', 'H', 'H', 'T', 'T', 'T', 'T', 'T', 'T', 'T']
    expect(headRatio(history)).toBeCloseTo(0.3)
  })
})

describe('Probability (CoinFlip) — spawnConfetti', () => {
  // FR-8: particle generation
  it('generates the requested number of particles', () => {
    const particles = spawnConfetti(100, 200, 30)
    expect(particles).toHaveLength(30)
  })

  // FR-8: all particles start at the given position
  it('all particles start at (cx, cy)', () => {
    const particles = spawnConfetti(50, 75, 10)
    for (const p of particles) {
      expect(p.x).toBe(50)
      expect(p.y).toBe(75)
    }
  })

  // FR-8: particle properties are valid
  it('particles have valid properties', () => {
    const particles = spawnConfetti(0, 0, 5)
    for (const p of particles) {
      expect(p.size).toBeGreaterThanOrEqual(3)
      expect(p.size).toBeLessThanOrEqual(8)
      expect(p.life).toBe(1)
      expect(p.maxLife).toBeGreaterThanOrEqual(60)
      expect(p.maxLife).toBeLessThanOrEqual(120)
      expect(typeof p.color).toBe('string')
      expect(p.color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })

  // FR-8: zero count
  it('returns empty array for count=0', () => {
    expect(spawnConfetti(0, 0, 0)).toEqual([])
  })
})

describe('Probability (CoinFlip) — prediction accuracy', () => {
  // FR-8: |ratio - prediction| <= 0.10
  it('accurate when difference is within 0.10', () => {
    expect(isPredictionAccurate(0.50, 0.50)).toBe(true) // exact match
    expect(isPredictionAccurate(0.50, 0.55)).toBe(true) // diff = 0.05
    expect(isPredictionAccurate(0.50, 0.60)).toBe(true) // diff = 0.10 (boundary)
  })

  // FR-8: inaccurate when difference > 0.10
  it('inaccurate when difference exceeds 0.10', () => {
    expect(isPredictionAccurate(0.50, 0.65)).toBe(false) // diff = 0.15
    expect(isPredictionAccurate(0.30, 0.50)).toBe(false) // diff = 0.20
  })

  // FR-8: boundary value — exactly 0.10 (note: 0.55-0.45 has floating-point error)
  // Use integer-friendly values to test exact boundary
  it('boundary: diff of exactly 0.10 is accurate', () => {
    expect(isPredictionAccurate(0.50, 0.60)).toBe(true)
    expect(isPredictionAccurate(0.60, 0.50)).toBe(true)
    expect(isPredictionAccurate(0.40, 0.50)).toBe(true)
  })

  // FR-8: boundary value — just over 0.10
  it('boundary: diff of >0.10 is inaccurate', () => {
    expect(isPredictionAccurate(0.50, 0.65)).toBe(false)
    expect(isPredictionAccurate(0.50, 0.35)).toBe(false)
    expect(isPredictionAccurate(0.25, 0.50)).toBe(false)
  })

  // FR-8: edge case — ratio=0 with prediction
  it('ratio=0 with prediction=0.10 is accurate', () => {
    expect(isPredictionAccurate(0.0, 0.10)).toBe(true)
  })

  // FR-8: edge case — ratio=1.0
  it('ratio=1.0 with prediction=0.90 is accurate', () => {
    expect(isPredictionAccurate(1.0, 0.90)).toBe(true)
  })
})

describe('Probability (CoinFlip) — AHA trigger', () => {
  // FR-8: AHA requires >= 10 flips AND ratio in [0.45, 0.55]
  it('triggers when >= 10 flips and ratio in [0.45, 0.55]', () => {
    // 5H + 5T = ratio 0.50
    const history: FlipResult[] = ['H', 'T', 'H', 'T', 'H', 'T', 'H', 'T', 'H', 'T']
    expect(shouldTriggerAha(history, false)).toBe(true)
  })

  // FR-8: does not trigger when < 10 flips
  it('does not trigger with < 10 flips even if ratio is 0.50', () => {
    const history: FlipResult[] = ['H', 'T', 'H', 'T', 'H', 'T', 'H', 'T'] // 8 flips, 0.50
    expect(shouldTriggerAha(history, false)).toBe(false)
  })

  // FR-8: does not trigger when ratio outside range
  it('does not trigger when ratio is outside [0.45, 0.55]', () => {
    // 8H + 2T = ratio 0.80
    const history: FlipResult[] = ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'T', 'T']
    expect(shouldTriggerAha(history, false)).toBe(false)
  })

  // FR-8: does not trigger if already triggered
  it('does not trigger when already triggered', () => {
    const history: FlipResult[] = ['H', 'T', 'H', 'T', 'H', 'T', 'H', 'T', 'H', 'T']
    expect(shouldTriggerAha(history, true)).toBe(false)
  })

  // FR-8: boundary — ratio = 0.45 (exactly at lower bound)
  it('triggers at ratio = 0.45 boundary', () => {
    // 9 heads out of 20 = 0.45
    const history: FlipResult[] = Array(9).fill('H').concat(Array(11).fill('T')) as FlipResult[]
    expect(shouldTriggerAha(history, false)).toBe(true)
  })

  // FR-8: boundary — ratio = 0.55 (exactly at upper bound)
  it('triggers at ratio = 0.55 boundary', () => {
    // 11 heads out of 20 = 0.55
    const history: FlipResult[] = Array(11).fill('H').concat(Array(9).fill('T')) as FlipResult[]
    expect(shouldTriggerAha(history, false)).toBe(true)
  })

  // FR-8: ratio just below 0.45
  it('does not trigger at ratio = 0.44', () => {
    // We need n where heads/n < 0.45 but >= 10 flips
    // 4 heads out of 10 = 0.40
    const history: FlipResult[] = Array(4).fill('H').concat(Array(6).fill('T')) as FlipResult[]
    expect(shouldTriggerAha(history, false)).toBe(false)
  })

  // FR-8: empty history
  it('does not trigger for empty history', () => {
    expect(shouldTriggerAha([], false)).toBe(false)
  })
})

describe('Probability (CoinFlip) — milestones', () => {
  // FR-8: milestones at 10/20/50 flips
  it('10 is a milestone', () => {
    expect(isMilestone(10)).toBe(true)
  })

  it('20 is a milestone', () => {
    expect(isMilestone(20)).toBe(true)
  })

  it('50 is a milestone', () => {
    expect(isMilestone(50)).toBe(true)
  })

  // FR-8: non-milestone values
  it('other counts are not milestones', () => {
    expect(isMilestone(1)).toBe(false)
    expect(isMilestone(5)).toBe(false)
    expect(isMilestone(9)).toBe(false)
    expect(isMilestone(11)).toBe(false)
    expect(isMilestone(15)).toBe(false)
    expect(isMilestone(19)).toBe(false)
    expect(isMilestone(21)).toBe(false)
    expect(isMilestone(49)).toBe(false)
    expect(isMilestone(51)).toBe(false)
    expect(isMilestone(100)).toBe(false)
  })

  // FR-8: zero is not a milestone
  it('0 is not a milestone', () => {
    expect(isMilestone(0)).toBe(false)
  })
})

describe('Probability (CoinFlip) — experiment completion', () => {
  // FR-8: 3 experiments → onComplete
  it('3 experiments is complete', () => {
    expect(isAllExperimentsComplete(3)).toBe(true)
  })

  it('> 3 experiments is still complete', () => {
    expect(isAllExperimentsComplete(5)).toBe(true)
  })

  // FR-8: < 3 not complete
  it('< 3 experiments is not complete', () => {
    expect(isAllExperimentsComplete(0)).toBe(false)
    expect(isAllExperimentsComplete(1)).toBe(false)
    expect(isAllExperimentsComplete(2)).toBe(false)
  })
})
