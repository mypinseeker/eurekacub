/**
 * Unit tests for Symmetry (MirrorCanvas) pure logic functions.
 *
 * All tests reference PRD requirement FR-1 (Symmetry / Mirror Drawing).
 */
import { describe, it, expect } from 'vitest'
import {
  mirrorPoint,
  strokeLength,
  checkMatch,
  parsePuzzle,
  targetToCanvas,
  MIN_DRAW_LENGTH,
  ROUNDS_TO_COMPLETE,
  DEFAULT_TOLERANCE,
} from '../../src/renderers/symmetry/symmetry.utils'
import type { Point, Stroke } from '../../src/renderers/symmetry/types'

/* ================================================================== */
/*  mirrorPoint                                                       */
/* ================================================================== */

describe('mirrorPoint', () => {
  // FR-1: child draws on one side, reflection appears on the other
  it('reflects vertically across the center (x-axis mirror)', () => {
    // FR-1: vertical mirror axis — x is reflected, y stays the same
    const p: Point = { x: 50, y: 80 }
    const result = mirrorPoint(p, 'vertical', 400, 300)
    expect(result).toEqual({ x: 350, y: 80 })
  })

  it('reflects horizontally across the center (y-axis mirror)', () => {
    // FR-1: horizontal mirror axis — y is reflected, x stays the same
    const p: Point = { x: 50, y: 80 }
    const result = mirrorPoint(p, 'horizontal', 400, 300)
    expect(result).toEqual({ x: 50, y: 220 })
  })

  it('point on the vertical mirror line maps to itself', () => {
    // FR-1: edge case — point exactly on the axis
    const p: Point = { x: 200, y: 100 }
    const result = mirrorPoint(p, 'vertical', 400, 300)
    expect(result).toEqual({ x: 200, y: 100 })
  })

  it('point on the horizontal mirror line maps to itself', () => {
    // FR-1: edge case — point exactly on the axis
    const p: Point = { x: 100, y: 150 }
    const result = mirrorPoint(p, 'horizontal', 400, 300)
    expect(result).toEqual({ x: 100, y: 150 })
  })

  it('point at origin reflects correctly (vertical)', () => {
    // FR-1: boundary — top-left corner
    const p: Point = { x: 0, y: 0 }
    const result = mirrorPoint(p, 'vertical', 400, 300)
    expect(result).toEqual({ x: 400, y: 0 })
  })

  it('point at origin reflects correctly (horizontal)', () => {
    // FR-1: boundary — top-left corner
    const p: Point = { x: 0, y: 0 }
    const result = mirrorPoint(p, 'horizontal', 400, 300)
    expect(result).toEqual({ x: 0, y: 300 })
  })

  it('double mirror returns the original point (vertical)', () => {
    // FR-1: mathematical property — mirror(mirror(p)) === p
    const p: Point = { x: 73, y: 42 }
    const once = mirrorPoint(p, 'vertical', 400, 300)
    const twice = mirrorPoint(once, 'vertical', 400, 300)
    expect(twice).toEqual(p)
  })

  it('double mirror returns the original point (horizontal)', () => {
    // FR-1: mathematical property — mirror(mirror(p)) === p
    const p: Point = { x: 73, y: 42 }
    const once = mirrorPoint(p, 'horizontal', 400, 300)
    const twice = mirrorPoint(once, 'horizontal', 400, 300)
    expect(twice).toEqual(p)
  })
})

/* ================================================================== */
/*  strokeLength                                                      */
/* ================================================================== */

describe('strokeLength', () => {
  it('returns 0 for a single point', () => {
    // FR-1: no distance if only one point
    expect(strokeLength([{ x: 0, y: 0 }])).toBe(0)
  })

  it('returns 0 for an empty array', () => {
    // FR-1: edge case — no points at all
    expect(strokeLength([])).toBe(0)
  })

  it('computes distance for a horizontal segment', () => {
    // FR-1: stroke measurement — simple horizontal line
    const pts: Point[] = [{ x: 0, y: 0 }, { x: 100, y: 0 }]
    expect(strokeLength(pts)).toBe(100)
  })

  it('computes distance for a vertical segment', () => {
    // FR-1: stroke measurement — simple vertical line
    const pts: Point[] = [{ x: 0, y: 0 }, { x: 0, y: 50 }]
    expect(strokeLength(pts)).toBe(50)
  })

  it('computes distance for a diagonal (3-4-5 triangle)', () => {
    // FR-1: Pythagorean triple sanity check
    const pts: Point[] = [{ x: 0, y: 0 }, { x: 3, y: 4 }]
    expect(strokeLength(pts)).toBe(5)
  })

  it('sums multi-segment strokes', () => {
    // FR-1: polyline length = sum of segment lengths
    const pts: Point[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 }, // +10
      { x: 10, y: 10 }, // +10
      { x: 20, y: 10 }, // +10
    ]
    expect(strokeLength(pts)).toBe(30)
  })

  it('all-same points gives 0 length', () => {
    // FR-1: degenerate stroke — user didn't move
    const pts: Point[] = [
      { x: 5, y: 5 },
      { x: 5, y: 5 },
      { x: 5, y: 5 },
    ]
    expect(strokeLength(pts)).toBe(0)
  })
})

/* ================================================================== */
/*  checkMatch                                                        */
/* ================================================================== */

describe('checkMatch', () => {
  const w = 400
  const h = 300

  // Helper to make a stroke
  const mkStroke = (pts: Point[]): Stroke => ({ points: pts, hue: 0 })

  describe('L1 mode (no target)', () => {
    it('returns true when total stroke length exceeds MIN_DRAW_LENGTH', () => {
      // FR-1: L1 mode — just draw enough to pass (MIN_DRAW_LENGTH=60)
      const strokes: Stroke[] = [
        mkStroke([{ x: 0, y: 0 }, { x: 70, y: 0 }]), // length=70 > 60
      ]
      expect(checkMatch(strokes, [], 0.18, w, h)).toBe(true)
    })

    it('returns false when total stroke length is below MIN_DRAW_LENGTH', () => {
      // FR-1: MIN_DRAW_LENGTH enforcement — strokes too short
      const strokes: Stroke[] = [
        mkStroke([{ x: 0, y: 0 }, { x: 50, y: 0 }]), // length=50 < 60
      ]
      expect(checkMatch(strokes, [], 0.18, w, h)).toBe(false)
    })

    it('returns false when stroke length is exactly MIN_DRAW_LENGTH (strict >)', () => {
      // FR-1: boundary — exactly 60 is NOT enough (> not >=)
      const strokes: Stroke[] = [
        mkStroke([{ x: 0, y: 0 }, { x: MIN_DRAW_LENGTH, y: 0 }]),
      ]
      expect(checkMatch(strokes, [], 0.18, w, h)).toBe(false)
    })

    it('accumulates length across multiple strokes', () => {
      // FR-1: total length is summed, not per-stroke
      const strokes: Stroke[] = [
        mkStroke([{ x: 0, y: 0 }, { x: 35, y: 0 }]), // 35
        mkStroke([{ x: 0, y: 0 }, { x: 30, y: 0 }]), // 30 → total 65 > 60
      ]
      expect(checkMatch(strokes, [], 0.18, w, h)).toBe(true)
    })
  })

  describe('targeted mode (with target polylines)', () => {
    it('returns true when strokes fully cover the target', () => {
      // FR-1: user draws on top of the target — 100% coverage
      const target: Point[][] = [[{ x: 10, y: 10 }, { x: 20, y: 20 }]]
      const strokes: Stroke[] = [
        mkStroke([{ x: 10, y: 10 }, { x: 20, y: 20 }]),
      ]
      expect(checkMatch(strokes, target, 0.18, w, h)).toBe(true)
    })

    it('returns false with no strokes', () => {
      // FR-1: nothing drawn — no coverage
      const target: Point[][] = [[{ x: 10, y: 10 }, { x: 20, y: 20 }]]
      expect(checkMatch([], target, 0.18, w, h)).toBe(false)
    })

    it('returns false when coverage is below 55%', () => {
      // FR-1: coverage threshold is 55%
      // 10 target points, user only covers 4 → 40% < 55%
      const target: Point[][] = [
        Array.from({ length: 10 }, (_, i) => ({ x: i * 10, y: 0 })),
      ]
      // Only cover points near x=0..30 (first 4 of 10)
      const strokes: Stroke[] = [
        mkStroke([{ x: 0, y: 0 }, { x: 30, y: 0 }]),
      ]
      // tolerance 0.01 → very tight, about 3px on min(400,300)=300
      expect(checkMatch(strokes, target, 0.01, w, h)).toBe(false)
    })

    it('returns true when coverage is at exactly 55% (>=)', () => {
      // FR-1: boundary — exactly 55% should pass (>= 0.55)
      // 20 target points, cover exactly 11 → 55%
      const target: Point[][] = [
        Array.from({ length: 20 }, (_, i) => ({ x: i * 5, y: 50 })),
      ]
      // Cover the first 11 points (x=0..50), tight tolerance
      const strokes: Stroke[] = [
        mkStroke(
          Array.from({ length: 11 }, (_, i) => ({ x: i * 5, y: 50 })),
        ),
      ]
      expect(checkMatch(strokes, target, 0.01, w, h)).toBe(true)
    })

    it('respects tolerance distance', () => {
      // FR-1: tolerance determines how close stroke points need to be
      const target: Point[][] = [[{ x: 100, y: 100 }]]
      // Stroke point 20px away from target
      const strokes: Stroke[] = [mkStroke([{ x: 120, y: 100 }])]
      // tolerance=0.18 → tolPx = 0.18 * 300 = 54px → 20 < 54 → covered
      expect(checkMatch(strokes, target, 0.18, w, h)).toBe(true)
      // tolerance=0.01 → tolPx = 0.01 * 300 = 3px → 20 > 3 → not covered
      expect(checkMatch(strokes, target, 0.01, w, h)).toBe(false)
    })
  })
})

/* ================================================================== */
/*  parsePuzzle                                                       */
/* ================================================================== */

describe('parsePuzzle', () => {
  it('returns defaults for an empty object', () => {
    // FR-1: graceful handling of missing/invalid puzzle data
    const result = parsePuzzle({})
    expect(result.targetPoints).toEqual([])
    expect(result.mirrorAxis).toBe('vertical')
    expect(result.tolerance).toBe(DEFAULT_TOLERANCE)
  })

  it('reads data from a nested .data property', () => {
    // FR-1: puzzle may have { data: { ... } } wrapper
    const result = parsePuzzle({
      data: {
        targetPoints: [[[0.5, 0.5]]],
        mirrorAxis: 'horizontal',
        tolerance: 0.1,
      },
    })
    expect(result.targetPoints).toEqual([[[0.5, 0.5]]])
    expect(result.mirrorAxis).toBe('horizontal')
    expect(result.tolerance).toBe(0.1)
  })

  it('falls back to vertical when mirrorAxis is invalid', () => {
    // FR-1: unknown axis → default vertical
    const result = parsePuzzle({ mirrorAxis: 'diagonal' })
    expect(result.mirrorAxis).toBe('vertical')
  })

  it('falls back to DEFAULT_TOLERANCE when tolerance is not a number', () => {
    // FR-1: string tolerance → default
    const result = parsePuzzle({ tolerance: 'wide' })
    expect(result.tolerance).toBe(DEFAULT_TOLERANCE)
  })

  it('falls back to empty targetPoints when not an array', () => {
    // FR-1: null/string/number targetPoints → empty
    const result = parsePuzzle({ targetPoints: 'not-an-array' })
    expect(result.targetPoints).toEqual([])
  })

  it('accepts horizontal mirrorAxis', () => {
    // FR-1: horizontal is a valid option
    const result = parsePuzzle({ mirrorAxis: 'horizontal' })
    expect(result.mirrorAxis).toBe('horizontal')
  })

  it('accepts vertical mirrorAxis', () => {
    // FR-1: vertical is a valid option
    const result = parsePuzzle({ mirrorAxis: 'vertical' })
    expect(result.mirrorAxis).toBe('vertical')
  })
})

/* ================================================================== */
/*  targetToCanvas                                                    */
/* ================================================================== */

describe('targetToCanvas', () => {
  it('maps normalised coords to pixel coords (vertical axis)', () => {
    // FR-1: normalised target → pixel space
    const result = targetToCanvas([[[0.5, 0.5]]], 'vertical', 400, 300)
    // halfW = 200, halfH = 300 → x = 0.5*200=100, y = 0.5*300=150
    expect(result).toEqual([[{ x: 100, y: 150 }]])
  })

  it('maps normalised coords to pixel coords (horizontal axis)', () => {
    // FR-1: horizontal axis uses full width, half height
    const result = targetToCanvas([[[0.5, 0.5]]], 'horizontal', 400, 300)
    // halfW = 400, halfH = 150 → x = 0.5*400=200, y = 0.5*150=75
    expect(result).toEqual([[{ x: 200, y: 75 }]])
  })

  it('handles multiple polylines', () => {
    // FR-1: multiple shapes in one puzzle
    const result = targetToCanvas(
      [[[0, 0], [1, 1]], [[0.5, 0.5]]],
      'vertical',
      400,
      300,
    )
    expect(result).toHaveLength(2)
    expect(result[0]).toHaveLength(2)
    expect(result[1]).toHaveLength(1)
  })

  it('returns empty array for empty input', () => {
    // FR-1: no target
    expect(targetToCanvas([], 'vertical', 400, 300)).toEqual([])
  })
})

/* ================================================================== */
/*  Constants                                                         */
/* ================================================================== */

describe('Symmetry constants', () => {
  it('MIN_DRAW_LENGTH is 60', () => {
    // FR-1: minimum stroke length before evaluation
    expect(MIN_DRAW_LENGTH).toBe(60)
  })

  it('ROUNDS_TO_COMPLETE is 3', () => {
    // FR-1: 3 rounds → onComplete
    expect(ROUNDS_TO_COMPLETE).toBe(3)
  })

  it('DEFAULT_TOLERANCE is 0.18', () => {
    // FR-1: default tolerance for coverage check
    expect(DEFAULT_TOLERANCE).toBe(0.18)
  })
})
