/**
 * Tests for the fraction renderer's "same amount" mode (PRD-content-gaps FR-1, tagged CG-FR-1.x
 * so they don't collide with the original PRD's FR-2 fraction tests).
 *
 * The playability block runs the REAL level config through the REAL judging functions. It does
 * not re-implement them: a proof against a private model proves nothing about the game (see
 * PRD-content-gaps A.7, where exactly that mistake was made and caught).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  TOP,
  evenCutAngles,
  sliceArcs,
  sliceIndexAt,
  wedgePath,
  answerFor,
  isSameAmount,
  isPlayableRound,
  parseEquivalence,
  validateCuts,
  normaliseAngle,
} from '../../src/renderers/fraction/fraction.utils'
import type { EquivalenceRound } from '../../src/renderers/fraction/types'
import { PUZZLE_CONFIGS } from '../../src/pages/puzzleConfigs'

const TWO_PI = Math.PI * 2

describe('geometry helpers [CG-FR-1.1]', () => {
  it('evenCutAngles produces cuts that pass the real cut validator, for every size the level uses', () => {
    for (const n of [2, 3, 4, 6, 8]) {
      const cuts = evenCutAngles(n).map((angle) => ({ angle }))
      expect(validateCuts(cuts, n, 1), `${n} even cuts should validate`).toBe(true)
    }
  })

  it('evenCutAngles starts at 12 o’clock', () => {
    expect(evenCutAngles(4)[0]).toBeCloseTo(TOP)
  })

  it('sliceArcs covers the whole pizza exactly once', () => {
    const arcs = sliceArcs(evenCutAngles(6, 0.4))
    const total = arcs.reduce((s, [a, b]) => s + (b - a), 0)
    expect(total).toBeCloseTo(TWO_PI)
    for (const [a, b] of arcs) expect(b).toBeGreaterThan(a)
  })

  it('sliceIndexAt maps each slice’s midpoint to that slice, and each slice to a different index', () => {
    const cuts = evenCutAngles(8)
    const arcs = sliceArcs(cuts)
    const seen = arcs.map(([a, b]) => sliceIndexAt((a + b) / 2, cuts))
    expect(seen).toEqual(arcs.map((_, i) => i))
  })

  it('sliceIndexAt puts a tap just before the first cut in the last (wrapping) slice', () => {
    const cuts = evenCutAngles(4)
    const firstCut = Math.min(...cuts.map(normaliseAngle))
    expect(sliceIndexAt(firstCut - 0.01, cuts)).toBe(3)
  })

  it('sliceIndexAt returns -1 before any cut exists', () => {
    expect(sliceIndexAt(1, [])).toBe(-1)
  })

  it('wedgePath starts at the centre and sets the large-arc flag only past a half turn', () => {
    expect(wedgePath(10, 20, 5, 0, 1).startsWith('M 10 20')).toBe(true)
    expect(wedgePath(0, 0, 5, 0, 1)).toContain(' 0 0 1 ')
    expect(wedgePath(0, 0, 5, 0, 4)).toContain(' 0 1 1 ')
  })
})

describe('judging "same amount" [CG-FR-1.1]', () => {
  it('accepts exactly the equal amount and nothing else', () => {
    expect(isSameAmount(2, 4, [1, 2])).toBe(true)
    expect(isSameAmount(4, 8, [2, 4])).toBe(true)
    expect(isSameAmount(1, 4, [1, 2])).toBe(false)
    expect(isSameAmount(3, 4, [1, 2])).toBe(false)
  })

  it('never accepts an empty answer', () => {
    expect(isSameAmount(0, 4, [1, 2])).toBe(false)
    expect(isSameAmount(0, 0, [1, 2])).toBe(false)
  })

  it('answerFor is the whole number of right-hand slices', () => {
    expect(answerFor({ given: [1, 2], cutInto: 4 })).toBe(2)
    expect(answerFor({ given: [1, 3], cutInto: 6 })).toBe(2)
    expect(answerFor({ given: [2, 4], cutInto: 8 })).toBe(4)
  })

  it('isPlayableRound rejects rounds a child could not finish', () => {
    expect(isPlayableRound({ given: [1, 2], cutInto: 4 })).toBe(true)
    expect(isPlayableRound({ given: [2, 2], cutInto: 4 }), 'whole pizza is not a fraction').toBe(false)
    expect(isPlayableRound({ given: [0, 2], cutInto: 4 }), 'nothing shaded').toBe(false)
    expect(isPlayableRound({ given: [1, 2], cutInto: 3 }), '1/2 of 3 slices is not a whole number').toBe(false)
    expect(isPlayableRound({ given: [1, 2], cutInto: 2 }), 'same cut = just copy the left').toBe(false)
    expect(isPlayableRound({ given: [1, 2], cutInto: 20 }), 'too many slices to tap').toBe(false)
    expect(isPlayableRound(null)).toBe(false)
  })

  it('parseEquivalence drops unwinnable rounds and keeps the rest in order', () => {
    const parsed = parseEquivalence({
      rounds: [{ given: [1, 2], cutInto: 3 }, { given: [1, 3], cutInto: 6 }, { given: [2, 4], cutInto: 8 }],
    })
    expect(parsed.rounds).toEqual([{ given: [1, 3], cutInto: 6 }, { given: [2, 4], cutInto: 8 }])
  })
})

describe('fraction L4 is playable — real config, real judge [CG-FR-1.2]', () => {
  const cfg = PUZZLE_CONFIGS.fraction.L4 as { mode: string; rounds: EquivalenceRound[]; tolerance: number }
  const parsed = parseEquivalence(cfg)

  it('is an equivalence level', () => {
    expect(cfg.mode).toBe('equivalence')
  })

  it('has at least 3 rounds and parsing keeps all of them (no silent fallback)', () => {
    expect(cfg.rounds.length).toBeGreaterThanOrEqual(3)
    expect(parsed.rounds, 'a round was dropped as unplayable, so the level would quietly shrink').toEqual(cfg.rounds)
  })

  it('covers the three pairs FR-1.2 names: 1/2=2/4, 1/3=2/6, 2/4=4/8', () => {
    const pairs = cfg.rounds.map((r) => `${r.given[0]}/${r.given[1]}=${answerFor(r)}/${r.cutInto}`)
    expect(pairs).toEqual(expect.arrayContaining(['1/2=2/4', '1/3=2/6', '2/4=4/8']))
  })

  it('every round is different (QA-10)', () => {
    expect(new Set(cfg.rounds.map((r) => JSON.stringify(r))).size).toBe(cfg.rounds.length)
  })

  it.each([0, 1, 2])('round %i: cutting along the guides passes the real cut check at this level’s tolerance', (i) => {
    const r = cfg.rounds[i]
    const cuts = evenCutAngles(r.cutInto).map((angle) => ({ angle }))
    expect(validateCuts(cuts, r.cutInto, cfg.tolerance)).toBe(true)
  })

  it.each([0, 1, 2])('round %i: even cuts that do not start at 12 o’clock still work', (i) => {
    const r = cfg.rounds[i]
    const cuts = evenCutAngles(r.cutInto, 0.37).map((angle) => ({ angle }))
    expect(validateCuts(cuts, r.cutInto, cfg.tolerance)).toBe(true)
    expect(sliceArcs(cuts.map((c) => c.angle))).toHaveLength(r.cutInto)
  })

  it.each([0, 1, 2])('round %i: the right answer wins, one more or one fewer does not, and it does not start solved', (i) => {
    const r = cfg.rounds[i]
    const ans = answerFor(r)
    expect(isSameAmount(ans, r.cutInto, r.given)).toBe(true)
    expect(isSameAmount(ans - 1, r.cutInto, r.given)).toBe(false)
    expect(isSameAmount(ans + 1, r.cutInto, r.given)).toBe(false)
    expect(isSameAmount(0, r.cutInto, r.given), 'round would be won before the child does anything').toBe(false)
  })

  it.each([0, 1, 2])('round %i: the reassembled overlay is exactly as big as the left shading (CG-FR-1.3)', (i) => {
    const r = cfg.rounds[i]
    const overlayArc = answerFor(r) * (TWO_PI / r.cutInto)
    const leftArc = r.given[0] * (TWO_PI / r.given[1])
    expect(overlayArc).toBeCloseTo(leftArc, 10)
  })
})

describe('L1–L3 are untouched [CG-FR-1.4] [CG-NFR-1]', () => {
  it('fraction L1–L3 are byte-for-byte what they were at the baseline (1ab196e)', () => {
    expect(PUZZLE_CONFIGS.fraction.L1).toEqual({ targetSlices: 2, showGuides: true, tolerance: 20 })
    expect(PUZZLE_CONFIGS.fraction.L2).toEqual({ targetSlices: 4, showGuides: true, tolerance: 15 })
    expect(PUZZLE_CONFIGS.fraction.L3).toEqual({ targetSlices: 6, showGuides: false, tolerance: 10 })
  })
})

describe('child-safety wording [CG-NFR-2] [CG-FR-1.1]', () => {
  const src = readFileSync(join(__dirname, '../../src/renderers/fraction/PizzaEquivalence.tsx'), 'utf8')

  it('shows no ❌ and never names a formula', () => {
    expect(src).not.toContain('❌')
    expect(src).not.toContain('约分')
  })
})
