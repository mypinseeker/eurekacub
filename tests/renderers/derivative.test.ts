/**
 * Unit tests for Derivative (SpeedController) pure-logic utilities.
 * PRD requirement: FR-4 — Derivative concept via speed-control challenge.
 */
import { describe, it, expect } from 'vitest'
import {
  clamp,
  generateDefaultCurve,
  sampleTarget,
  computeScore,
  parsePuzzleData,
  MAX_SPEED,
  MATCH_THRESHOLD,
} from '../../src/renderers/derivative/derivative.utils'
import type { PositionSample } from '../../src/renderers/derivative/types'

/* ─── clamp ──────────────────────────────────────────────── */

describe('clamp', () => {
  // FR-4: speed clamped to [0, MAX_SPEED=100]
  it('returns value when within bounds', () => {
    expect(clamp(50, 0, 100)).toBe(50)
  })

  it('clamps below minimum', () => {
    expect(clamp(-10, 0, 100)).toBe(0)
  })

  it('clamps above maximum', () => {
    expect(clamp(150, 0, 100)).toBe(100)
  })

  it('handles equal lo and hi', () => {
    expect(clamp(5, 3, 3)).toBe(3)
  })

  it('returns boundary values exactly', () => {
    // FR-4: speed clamped to [0, MAX_SPEED=100]
    expect(clamp(0, 0, MAX_SPEED)).toBe(0)
    expect(clamp(MAX_SPEED, 0, MAX_SPEED)).toBe(MAX_SPEED)
  })

  it('clamps negative range', () => {
    expect(clamp(-50, -100, -10)).toBe(-50)
    expect(clamp(0, -100, -10)).toBe(-10)
    expect(clamp(-200, -100, -10)).toBe(-100)
  })
})

/* ─── generateDefaultCurve ───────────────────────────────── */

describe('generateDefaultCurve', () => {
  // FR-4: smooth S-curve generation for target
  it('generates 101 points (0 to 100 inclusive)', () => {
    const curve = generateDefaultCurve()
    expect(curve).toHaveLength(101)
  })

  it('starts at 0', () => {
    const curve = generateDefaultCurve()
    expect(curve[0]).toBe(0)
  })

  it('ends at 100', () => {
    const curve = generateDefaultCurve()
    expect(curve[100]).toBe(100)
  })

  it('produces monotonically increasing values (S-curve)', () => {
    // FR-4: smooth S-curve — each point should be >= previous
    const curve = generateDefaultCurve()
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i]).toBeGreaterThanOrEqual(curve[i - 1])
    }
  })

  it('has inflection point near midpoint (S-curve shape)', () => {
    // FR-4: S-curve 3t^2 - 2t^3 has inflection at t=0.5
    const curve = generateDefaultCurve()
    expect(curve[50]).toBeCloseTo(50, 0)
  })
})

/* ─── sampleTarget ───────────────────────────────────────── */

describe('sampleTarget', () => {
  // FR-4: linear interpolation on target curve
  it('returns 0 for empty curve', () => {
    expect(sampleTarget([], 0.5)).toBe(0)
  })

  it('returns exact value at integer indices', () => {
    const curve = [0, 25, 50, 75, 100]
    expect(sampleTarget(curve, 0)).toBe(0)
    expect(sampleTarget(curve, 0.25)).toBe(25)
    expect(sampleTarget(curve, 0.5)).toBe(50)
    expect(sampleTarget(curve, 1.0)).toBe(100)
  })

  it('interpolates between points', () => {
    // FR-4: linear interpolation between curve points
    const curve = [0, 100]
    expect(sampleTarget(curve, 0.5)).toBe(50)
    expect(sampleTarget(curve, 0.25)).toBe(25)
    expect(sampleTarget(curve, 0.75)).toBe(75)
  })

  it('handles single-element curve', () => {
    expect(sampleTarget([42], 0)).toBe(42)
    expect(sampleTarget([42], 0.5)).toBe(42)
    expect(sampleTarget([42], 1.0)).toBe(42)
  })

  it('handles tNorm at boundaries', () => {
    const curve = [10, 20, 30]
    expect(sampleTarget(curve, 0)).toBe(10)
    expect(sampleTarget(curve, 1)).toBe(30)
  })
})

/* ─── computeScore ───────────────────────────────────────── */

describe('computeScore', () => {
  const simpleCurve = [0, 50, 100] // linear: 0 → 50 → 100

  // FR-4: area difference scoring with 200 interpolation points
  it('returns 1 for empty history (less than 2 points)', () => {
    expect(computeScore([], simpleCurve, 10, 100)).toBe(1)
    expect(computeScore([{ time: 0, position: 0 }], simpleCurve, 10, 100)).toBe(1)
  })

  it('returns 0 (perfect) when history exactly matches target', () => {
    // FR-4: perfect score = 0 difference
    const curve = [0, 50, 100]
    const history: PositionSample[] = [
      { time: 0, position: 0 },
      { time: 5, position: 50 },
      { time: 10, position: 100 },
    ]
    const score = computeScore(history, curve, 10, 100)
    expect(score).toBeCloseTo(0, 5)
  })

  it('returns high score when history is completely off', () => {
    // FR-4: worst score — drawn curve at 0, target goes to 100
    const curve = [0, 50, 100]
    const history: PositionSample[] = [
      { time: 0, position: 0 },
      { time: 10, position: 0 }, // stays at 0 the whole time
    ]
    const score = computeScore(history, curve, 10, 100)
    expect(score).toBeGreaterThan(MATCH_THRESHOLD)
  })

  it('scores below MATCH_THRESHOLD for close match (pass)', () => {
    // FR-4: MATCH_THRESHOLD = 0.12, score < 0.12 = pass
    const curve = generateDefaultCurve()
    // Build history that closely follows the default curve
    const history: PositionSample[] = []
    for (let i = 0; i <= 100; i++) {
      const t = (i / 100) * 10
      const pos = sampleTarget(curve, i / 100)
      history.push({ time: t, position: pos })
    }
    const score = computeScore(history, curve, 10, 100)
    expect(score).toBeLessThan(MATCH_THRESHOLD)
  })

  it('scores above MATCH_THRESHOLD for poor match (fail)', () => {
    // FR-4: score >= 0.12 = fail
    const curve = generateDefaultCurve()
    // Constant position = 50 (doesn't match S-curve)
    const history: PositionSample[] = [
      { time: 0, position: 50 },
      { time: 10, position: 50 },
    ]
    const score = computeScore(history, curve, 10, 100)
    expect(score).toBeGreaterThanOrEqual(MATCH_THRESHOLD)
  })

  it('uses 200 interpolation points (score granularity)', () => {
    // FR-4: 200 interpolation points — verify via a step function
    // that slight misalignment still produces a non-zero score
    const curve = [0, 100] // jumps from 0 to 100 linearly
    const history: PositionSample[] = [
      { time: 0, position: 1 }, // off by 1
      { time: 10, position: 101 }, // off by 1
    ]
    const score = computeScore(history, curve, 10, 100)
    // Small but non-zero difference
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThan(0.05)
  })
})

/* ─── AHA condition ──────────────────────────────────────── */

describe('AHA condition logic', () => {
  // FR-4: AHA fires when elapsed > 40% duration AND midScore < MATCH_THRESHOLD * 0.8
  it('MATCH_THRESHOLD * 0.8 = 0.096', () => {
    expect(MATCH_THRESHOLD * 0.8).toBeCloseTo(0.096, 6)
  })

  it('a perfect-match score at 40% duration qualifies for AHA', () => {
    // FR-4: AHA condition — score < 0.096 at 40% of duration
    // In the component, computeScore is called with elapsed (not full duration)
    // as the duration param. sampleTarget(curve, tNorm) maps tNorm 0..1 over
    // the full curve. So to perfectly match, the history positions at time
    // tSec must equal sampleTarget(curve, tSec/elapsed) for tSec in [0, elapsed].
    const curve = generateDefaultCurve()
    const elapsed = 10 * 0.4 // 4 seconds
    const history: PositionSample[] = []
    const sampleCount = 100
    for (let i = 0; i <= sampleCount; i++) {
      const tNorm = i / sampleCount
      const t = tNorm * elapsed
      // Position must match sampleTarget(curve, tNorm) since computeScore
      // does: tNorm = i/200, tSec = tNorm * duration, then compares
      // drawnPos (interpolated from history at tSec) vs sampleTarget(curve, tNorm)
      const pos = sampleTarget(curve, tNorm)
      history.push({ time: t, position: pos })
    }
    const midScore = computeScore(history, curve, elapsed, 100)
    expect(midScore).toBeLessThan(MATCH_THRESHOLD * 0.8) // < 0.096
  })
})

/* ─── parsePuzzleData ────────────────────────────────────── */

describe('parsePuzzleData', () => {
  // FR-4: default handling for puzzle data
  it('returns defaults when puzzle is empty', () => {
    const result = parsePuzzleData({})
    expect(result.duration).toBe(10)
    expect(result.finishLine).toBe(100)
    expect(result.targetCurve).toHaveLength(101) // default curve
  })

  it('returns defaults when puzzle.data is empty', () => {
    const result = parsePuzzleData({ data: {} })
    expect(result.duration).toBe(10)
    expect(result.finishLine).toBe(100)
  })

  it('uses provided values', () => {
    const result = parsePuzzleData({
      data: {
        targetCurve: [0, 50, 100],
        duration: 20,
        finishLine: 200,
      },
    })
    expect(result.targetCurve).toEqual([0, 50, 100])
    expect(result.duration).toBe(20)
    expect(result.finishLine).toBe(200)
  })

  it('falls back when targetCurve is not an array', () => {
    const result = parsePuzzleData({ data: { targetCurve: 'invalid' } })
    expect(Array.isArray(result.targetCurve)).toBe(true)
    expect(result.targetCurve).toHaveLength(101)
  })

  it('falls back when duration is not a number', () => {
    const result = parsePuzzleData({ data: { duration: 'fast' } })
    expect(result.duration).toBe(10)
  })

  it('reads from puzzle directly if no data property', () => {
    // FR-4: parsePuzzleData uses puzzle.data ?? puzzle
    const result = parsePuzzleData({
      targetCurve: [0, 25, 75, 100],
      duration: 5,
      finishLine: 50,
    })
    expect(result.targetCurve).toEqual([0, 25, 75, 100])
    expect(result.duration).toBe(5)
    expect(result.finishLine).toBe(50)
  })
})

/* ─── MAX_SPEED constant ─────────────────────────────────── */

describe('constants', () => {
  // FR-4: speed clamped to [0, MAX_SPEED=100]
  it('MAX_SPEED is 100', () => {
    expect(MAX_SPEED).toBe(100)
  })

  // FR-4: MATCH_THRESHOLD = 0.12
  it('MATCH_THRESHOLD is 0.12', () => {
    expect(MATCH_THRESHOLD).toBe(0.12)
  })
})
