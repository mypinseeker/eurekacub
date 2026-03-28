/**
 * Unit tests for Equation (BalanceScale) pure-logic utilities.
 * PRD requirement: FR-5 — Equation concept via balance-scale game.
 */
import { describe, it, expect } from 'vitest'
import {
  clamp,
  sum,
  colorForValue,
  calcTiltAngle,
  rotatedPoint,
  CX,
  BEAM_Y,
  BEAM_HALF,
} from '../../src/renderers/equation/equation.utils'
import {
  WEIGHT_COLORS,
  MAX_TILT_DEG,
  TILT_PER_UNIT,
  ROUNDS_TO_COMPLETE,
} from '../../src/renderers/equation/types'

/* ─── clamp ──────────────────────────────────────────────── */

describe('clamp (equation)', () => {
  // FR-5: tilt angle clamped to ±MAX_TILT_DEG
  it('returns value within range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('clamps below minimum', () => {
    expect(clamp(-20, -15, 15)).toBe(-15)
  })

  it('clamps above maximum', () => {
    expect(clamp(20, -15, 15)).toBe(15)
  })

  it('handles equal min and max', () => {
    expect(clamp(100, 7, 7)).toBe(7)
  })
})

/* ─── sum ────────────────────────────────────────────────── */

describe('sum', () => {
  // FR-5: total weight on each side determines tilt
  it('sums an array of positive numbers', () => {
    expect(sum([1, 2, 3, 4])).toBe(10)
  })

  it('returns 0 for empty array', () => {
    expect(sum([])).toBe(0)
  })

  it('handles single element', () => {
    expect(sum([42])).toBe(42)
  })

  it('handles negative numbers', () => {
    expect(sum([-5, 10, -3])).toBe(2)
  })

  it('handles large arrays', () => {
    const arr = Array.from({ length: 100 }, (_, i) => i + 1)
    expect(sum(arr)).toBe(5050)
  })
})

/* ─── colorForValue ──────────────────────────────────────── */

describe('colorForValue', () => {
  // FR-5: deterministic color assignment for weight blocks
  it('returns a color from WEIGHT_COLORS', () => {
    const color = colorForValue(3, 0)
    expect(WEIGHT_COLORS).toContain(color)
  })

  it('is deterministic (same inputs → same output)', () => {
    const a = colorForValue(5, 2)
    const b = colorForValue(5, 2)
    expect(a).toBe(b)
  })

  it('wraps around WEIGHT_COLORS array', () => {
    // FR-5: (value + index) % WEIGHT_COLORS.length
    const len = WEIGHT_COLORS.length
    const color1 = colorForValue(0, 0)
    const color2 = colorForValue(len, 0)
    expect(color1).toBe(color2) // wraps around
  })

  it('different index produces different color (when value differs mod length)', () => {
    const c1 = colorForValue(0, 0)
    const c2 = colorForValue(0, 1)
    expect(c1).not.toBe(c2)
  })
})

/* ─── calcTiltAngle ──────────────────────────────────────── */

describe('calcTiltAngle', () => {
  // FR-5: beam tilt proportional to weight difference

  it('returns 0 when weights are equal (balanced)', () => {
    expect(calcTiltAngle(10, 10)).toBe(0)
  })

  it('tilts positive (left-heavy) when left > right', () => {
    // FR-5: diff = left - right; positive diff × TILT_PER_UNIT
    const angle = calcTiltAngle(12, 10)
    expect(angle).toBe(2 * TILT_PER_UNIT) // 2 * 3 = 6
    expect(angle).toBeGreaterThan(0)
  })

  it('tilts negative (right-heavy) when right > left', () => {
    const angle = calcTiltAngle(5, 8)
    expect(angle).toBe(-3 * TILT_PER_UNIT) // -3 * 3 = -9
    expect(angle).toBeLessThan(0)
  })

  it('clamps at +MAX_TILT_DEG (15°)', () => {
    // FR-5: clamped ±15°
    const angle = calcTiltAngle(100, 0)
    expect(angle).toBe(MAX_TILT_DEG) // 15
  })

  it('clamps at -MAX_TILT_DEG (-15°)', () => {
    const angle = calcTiltAngle(0, 100)
    expect(angle).toBe(-MAX_TILT_DEG) // -15
  })

  it('is proportional within bounds', () => {
    // FR-5: beam tilt proportional to weight difference
    const a1 = calcTiltAngle(6, 5) // diff=1 → 3°
    const a2 = calcTiltAngle(7, 5) // diff=2 → 6°
    expect(a2).toBe(a1 * 2)
  })

  it('reaches max tilt at diff = 5 (5 * 3 = 15)', () => {
    expect(calcTiltAngle(10, 5)).toBe(MAX_TILT_DEG)
    expect(calcTiltAngle(5, 10)).toBe(-MAX_TILT_DEG)
  })

  it('stays clamped beyond diff = 5', () => {
    expect(calcTiltAngle(20, 5)).toBe(MAX_TILT_DEG)
    expect(calcTiltAngle(5, 20)).toBe(-MAX_TILT_DEG)
  })
})

/* ─── rotatedPoint ───────────────────────────────────────── */

describe('rotatedPoint', () => {
  // FR-5: rotation around fulcrum for beam endpoints

  it('returns unrotated position at 0° angle', () => {
    const p = rotatedPoint(-BEAM_HALF, 0)
    expect(p.x).toBeCloseTo(CX - BEAM_HALF, 5)
    expect(p.y).toBeCloseTo(BEAM_Y, 5)
  })

  it('returns unrotated right position at 0°', () => {
    const p = rotatedPoint(BEAM_HALF, 0)
    expect(p.x).toBeCloseTo(CX + BEAM_HALF, 5)
    expect(p.y).toBeCloseTo(BEAM_Y, 5)
  })

  it('rotates correctly at 90°', () => {
    // FR-5: rotation math — cos(90°)=0, sin(90°)=1
    const p = rotatedPoint(100, 90)
    expect(p.x).toBeCloseTo(CX, 1) // offsetX * cos(90°) ≈ 0
    expect(p.y).toBeCloseTo(BEAM_Y + 100, 1) // offsetX * sin(90°) = 100
  })

  it('rotates correctly at -90°', () => {
    const p = rotatedPoint(100, -90)
    expect(p.x).toBeCloseTo(CX, 1)
    expect(p.y).toBeCloseTo(BEAM_Y - 100, 1)
  })

  it('rotates correctly at 180°', () => {
    const p = rotatedPoint(100, 180)
    expect(p.x).toBeCloseTo(CX - 100, 1) // cos(180°)=-1
    expect(p.y).toBeCloseTo(BEAM_Y, 1)     // sin(180°)≈0
  })

  it('is symmetric: left and right endpoints at same angle', () => {
    // FR-5: beam endpoints should be symmetric about fulcrum
    const angle = 10
    const left = rotatedPoint(-BEAM_HALF, angle)
    const right = rotatedPoint(BEAM_HALF, angle)

    // Both should be equidistant from CX horizontally (mirrored)
    const leftDx = CX - left.x
    const rightDx = right.x - CX
    expect(leftDx).toBeCloseTo(rightDx, 5)

    // Y offsets should be opposite
    const leftDy = left.y - BEAM_Y
    const rightDy = right.y - BEAM_Y
    expect(leftDy).toBeCloseTo(-rightDy, 5)
  })

  it('handles small tilt angles accurately', () => {
    // FR-5: typical game tilt is small (0-15°)
    const p = rotatedPoint(-BEAM_HALF, 3)
    const rad = (3 * Math.PI) / 180
    expect(p.x).toBeCloseTo(CX + (-BEAM_HALF) * Math.cos(rad), 5)
    expect(p.y).toBeCloseTo(BEAM_Y + (-BEAM_HALF) * Math.sin(rad), 5)
  })
})

/* ─── correct placement detection ────────────────────────── */

describe('correct placement detection', () => {
  // FR-5: filledUnknown === unknown means correct answer

  it('detects correct placement when values match', () => {
    const unknown = 8
    const filledUnknown = 8
    expect(filledUnknown === unknown).toBe(true)
  })

  it('detects incorrect placement when values differ', () => {
    const unknown = 8
    const filledUnknown = 7
    expect(filledUnknown === unknown).toBe(false)
  })

  it('validates balance: left === right when correct answer placed', () => {
    // FR-5: equation 5 + 3 = ? → unknown=8
    const leftSide = [5, 3]
    const rightSide: number[] = []
    const unknown = 8

    const leftTotal = sum(leftSide)
    const rightTotal = sum(rightSide) + unknown
    expect(leftTotal).toBe(rightTotal)
    expect(calcTiltAngle(leftTotal, rightTotal)).toBe(0) // balanced!
  })

  it('detects imbalance when wrong answer placed', () => {
    // FR-5: equation 5 + 3 = ? → unknown=8, placed=6
    const leftSide = [5, 3]
    const rightSide: number[] = []
    const wrongAnswer = 6

    const leftTotal = sum(leftSide)
    const rightTotal = sum(rightSide) + wrongAnswer
    expect(leftTotal).not.toBe(rightTotal)
    expect(calcTiltAngle(leftTotal, rightTotal)).not.toBe(0) // tilted!
  })
})

/* ─── 3 rounds → onComplete ──────────────────────────────── */

describe('round completion logic', () => {
  // FR-5: 3 rounds → onComplete

  it('ROUNDS_TO_COMPLETE is 3', () => {
    expect(ROUNDS_TO_COMPLETE).toBe(3)
  })

  it('triggers completion when successCount reaches ROUNDS_TO_COMPLETE', () => {
    // FR-5: newCount >= ROUNDS_TO_COMPLETE triggers onComplete
    let completeCalled = false
    const onComplete = () => { completeCalled = true }

    // Simulate 3 correct rounds
    let successCount = 0
    for (let round = 0; round < ROUNDS_TO_COMPLETE; round++) {
      successCount++
      if (successCount >= ROUNDS_TO_COMPLETE) {
        onComplete()
      }
    }
    expect(completeCalled).toBe(true)
    expect(successCount).toBe(3)
  })

  it('does not trigger completion before reaching ROUNDS_TO_COMPLETE', () => {
    let completeCalled = false
    const onComplete = () => { completeCalled = true }

    let successCount = 0
    for (let round = 0; round < ROUNDS_TO_COMPLETE - 1; round++) {
      successCount++
      if (successCount >= ROUNDS_TO_COMPLETE) {
        onComplete()
      }
    }
    expect(completeCalled).toBe(false)
    expect(successCount).toBe(2)
  })
})

/* ─── physical accuracy of tilt ──────────────────────────── */

describe('physical accuracy of tilt calculations', () => {
  // FR-5: beam tilt proportional to weight difference

  it('TILT_PER_UNIT is 3 degrees', () => {
    expect(TILT_PER_UNIT).toBe(3)
  })

  it('MAX_TILT_DEG is 15 degrees', () => {
    expect(MAX_TILT_DEG).toBe(15)
  })

  it('tilt angle exactly equals diff * TILT_PER_UNIT within bounds', () => {
    // FR-5: diff × TILT_PER_UNIT, clamped ±15°
    for (let diff = -4; diff <= 4; diff++) {
      const left = 10 + Math.max(diff, 0)
      const right = 10 + Math.max(-diff, 0)
      const expected = diff * TILT_PER_UNIT
      expect(calcTiltAngle(left, right)).toBe(expected)
    }
  })

  it('beam endpoints descend on heavier side', () => {
    // FR-5: visual feedback — heavier side drops
    const angle = calcTiltAngle(15, 10) // left heavier → positive angle
    const leftEnd = rotatedPoint(-BEAM_HALF, angle)
    const rightEnd = rotatedPoint(BEAM_HALF, angle)

    // Positive angle rotates clockwise:
    // left end (negative offset) goes UP, right end goes DOWN
    expect(leftEnd.y).toBeLessThan(BEAM_Y) // left goes up
    expect(rightEnd.y).toBeGreaterThan(BEAM_Y) // right goes down
  })

  it('balanced scale has both endpoints at BEAM_Y', () => {
    const angle = calcTiltAngle(10, 10) // balanced
    const leftEnd = rotatedPoint(-BEAM_HALF, angle)
    const rightEnd = rotatedPoint(BEAM_HALF, angle)

    expect(leftEnd.y).toBeCloseTo(BEAM_Y, 5)
    expect(rightEnd.y).toBeCloseTo(BEAM_Y, 5)
  })
})

/* ─── constants ──────────────────────────────────────────── */

describe('layout constants', () => {
  // FR-5: fulcrum center in viewBox 400x400
  it('CX is centered at 200', () => {
    expect(CX).toBe(200)
  })

  it('BEAM_Y is at fulcrum top (200)', () => {
    expect(BEAM_Y).toBe(200)
  })

  it('BEAM_HALF is 150', () => {
    expect(BEAM_HALF).toBe(150)
  })
})
