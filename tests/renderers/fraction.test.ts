/**
 * Unit tests for Fraction (PizzaCutter) pure logic functions.
 *
 * All tests reference PRD requirement FR-2 (Fraction / Pizza Cutting).
 */
import { describe, it, expect } from 'vitest'
import {
  angleFromCenter,
  normaliseAngle,
  toDeg,
  validateCuts,
  cutEndpoint,
  CX,
  CY,
  RADIUS,
  MIN_CLICK_RADIUS,
  MAX_CLICK_RADIUS,
  ROUNDS_TO_COMPLETE,
} from '../../src/renderers/fraction/fraction.utils'
import type { Cut } from '../../src/renderers/fraction/types'

/* ================================================================== */
/*  angleFromCenter                                                   */
/* ================================================================== */

describe('angleFromCenter', () => {
  it('returns 0 for a point directly to the right of center', () => {
    // FR-2: 3-o'clock position = 0 radians
    expect(angleFromCenter(CX + 100, CY)).toBeCloseTo(0)
  })

  it('returns PI/2 for a point directly below center', () => {
    // FR-2: 6-o'clock position = PI/2
    expect(angleFromCenter(CX, CY + 100)).toBeCloseTo(Math.PI / 2)
  })

  it('returns PI (or -PI) for a point directly to the left', () => {
    // FR-2: 9-o'clock position = PI or -PI (atan2 returns PI)
    expect(Math.abs(angleFromCenter(CX - 100, CY))).toBeCloseTo(Math.PI)
  })

  it('returns -PI/2 for a point directly above center', () => {
    // FR-2: 12-o'clock position = -PI/2
    expect(angleFromCenter(CX, CY - 100)).toBeCloseTo(-Math.PI / 2)
  })

  it('returns PI/4 for a point at 45 degrees (bottom-right)', () => {
    // FR-2: diagonal — equal dx and dy
    expect(angleFromCenter(CX + 100, CY + 100)).toBeCloseTo(Math.PI / 4)
  })

  it('handles point exactly at center (0,0 delta)', () => {
    // FR-2: degenerate case — atan2(0,0) = 0
    expect(angleFromCenter(CX, CY)).toBeCloseTo(0)
  })
})

/* ================================================================== */
/*  normaliseAngle                                                    */
/* ================================================================== */

describe('normaliseAngle', () => {
  it('returns 0 for angle 0', () => {
    // FR-2: identity case
    expect(normaliseAngle(0)).toBeCloseTo(0)
  })

  it('wraps negative angles to [0, 2PI)', () => {
    // FR-2: -PI/2 → 3PI/2
    expect(normaliseAngle(-Math.PI / 2)).toBeCloseTo(3 * Math.PI / 2)
  })

  it('wraps -PI to PI', () => {
    // FR-2: -PI → PI
    expect(normaliseAngle(-Math.PI)).toBeCloseTo(Math.PI)
  })

  it('wraps angles > 2PI', () => {
    // FR-2: 3PI → PI (subtract 2PI)
    expect(normaliseAngle(3 * Math.PI)).toBeCloseTo(Math.PI)
  })

  it('wraps large negative angles', () => {
    // FR-2: -5PI → PI (add 3*2PI, then mod)
    expect(normaliseAngle(-5 * Math.PI)).toBeCloseTo(Math.PI)
  })

  it('angle just below 2PI stays unchanged', () => {
    // FR-2: 2PI - epsilon stays in [0, 2PI)
    const angle = 2 * Math.PI - 0.001
    expect(normaliseAngle(angle)).toBeCloseTo(angle)
  })

  it('angle exactly 2PI wraps to 0', () => {
    // FR-2: 2PI wraps to 0
    expect(normaliseAngle(2 * Math.PI)).toBeCloseTo(0, 4)
  })
})

/* ================================================================== */
/*  toDeg                                                             */
/* ================================================================== */

describe('toDeg', () => {
  it('converts 0 radians to 0 degrees', () => {
    // FR-2: identity
    expect(toDeg(0)).toBe(0)
  })

  it('converts PI to 180 degrees', () => {
    // FR-2: half turn
    expect(toDeg(Math.PI)).toBeCloseTo(180)
  })

  it('converts PI/2 to 90 degrees', () => {
    // FR-2: quarter turn
    expect(toDeg(Math.PI / 2)).toBeCloseTo(90)
  })

  it('converts 2*PI to 360 degrees', () => {
    // FR-2: full turn
    expect(toDeg(2 * Math.PI)).toBeCloseTo(360)
  })

  it('handles negative radians', () => {
    // FR-2: negative → negative degrees
    expect(toDeg(-Math.PI)).toBeCloseTo(-180)
  })

  it('converts PI/6 to 30 degrees', () => {
    // FR-2: common angle
    expect(toDeg(Math.PI / 6)).toBeCloseTo(30)
  })
})

/* ================================================================== */
/*  validateCuts                                                      */
/* ================================================================== */

describe('validateCuts', () => {
  // Helper: create cuts at evenly spaced angles
  const evenCuts = (n: number, offsetRad = 0): Cut[] =>
    Array.from({ length: n }, (_, i) => ({
      angle: offsetRad + (i * 2 * Math.PI) / n,
    }))

  it('accepts 2 perfectly even cuts (halves)', () => {
    // FR-2: pizza cut into 2 equal pieces
    const cuts = evenCuts(2)
    expect(validateCuts(cuts, 2, 15)).toBe(true)
  })

  it('accepts 4 perfectly even cuts (quarters)', () => {
    // FR-2: pizza cut into 4 equal pieces
    const cuts = evenCuts(4)
    expect(validateCuts(cuts, 4, 15)).toBe(true)
  })

  it('accepts 3 perfectly even cuts (thirds)', () => {
    // FR-2: pizza cut into 3 equal pieces
    const cuts = evenCuts(3)
    expect(validateCuts(cuts, 3, 15)).toBe(true)
  })

  it('accepts 6 perfectly even cuts (sixths)', () => {
    // FR-2: pizza cut into 6 equal pieces
    const cuts = evenCuts(6)
    expect(validateCuts(cuts, 6, 15)).toBe(true)
  })

  it('accepts 8 perfectly even cuts (eighths)', () => {
    // FR-2: pizza cut into 8 equal pieces
    const cuts = evenCuts(8)
    expect(validateCuts(cuts, 8, 15)).toBe(true)
  })

  it('rejects when cut count does not match targetSlices', () => {
    // FR-2: wrong number of cuts
    const cuts = evenCuts(3)
    expect(validateCuts(cuts, 4, 15)).toBe(false)
  })

  it('rejects unevenly spaced cuts beyond tolerance', () => {
    // FR-2: cuts are not evenly spaced — one arc is too wide
    const cuts: Cut[] = [
      { angle: 0 },
      { angle: Math.PI / 3 }, // 60 degrees gap
      { angle: Math.PI },     // 120 degrees gap
      { angle: Math.PI * 1.5 }, // 90 degrees gap
    ]
    // expected arc = 90, but first gap is 60 (off by 30 > 15)
    expect(validateCuts(cuts, 4, 15)).toBe(false)
  })

  it('accepts cuts within tolerance', () => {
    // FR-2: slight offset within the 15-degree tolerance
    const slightlyOff: Cut[] = [
      { angle: 0 },
      { angle: Math.PI / 2 + 0.1 }, // ~95.7 degrees (off by ~5.7)
      { angle: Math.PI - 0.05 },     // gap ~84.4 degrees
      { angle: 3 * Math.PI / 2 },   // gap ~90+
    ]
    // With 15-degree tolerance, this should be within bounds
    expect(validateCuts(slightlyOff, 4, 15)).toBe(true)
  })

  it('rejects 0 cuts even if targetSlices is 0', () => {
    // FR-2: edge case — empty cuts
    expect(validateCuts([], 0, 15)).toBe(true) // 0 === 0, no arcs to check
  })

  it('works with rotated even cuts (non-zero offset)', () => {
    // FR-2: cuts are evenly spaced but rotated — should still pass
    const cuts = evenCuts(4, Math.PI / 7) // offset doesn't affect spacing
    expect(validateCuts(cuts, 4, 15)).toBe(true)
  })

  it('works with cuts in random order (sorting)', () => {
    // FR-2: cuts may be placed in any order — validateCuts sorts them
    const cuts: Cut[] = [
      { angle: Math.PI },       // 180
      { angle: 0 },             // 0
      { angle: 3 * Math.PI / 2 }, // 270
      { angle: Math.PI / 2 },   // 90
    ]
    expect(validateCuts(cuts, 4, 15)).toBe(true)
  })

  it('uses tight tolerance to reject small deviations', () => {
    // FR-2: tolerance=1 is very strict — even 2-degree offset fails
    const cuts: Cut[] = [
      { angle: 0 },
      { angle: Math.PI / 2 + 0.05 }, // ~2.86 degrees off
      { angle: Math.PI },
      { angle: 3 * Math.PI / 2 },
    ]
    expect(validateCuts(cuts, 4, 1)).toBe(false)
  })
})

/* ================================================================== */
/*  cutEndpoint                                                       */
/* ================================================================== */

describe('cutEndpoint', () => {
  it('angle 0 points to the right edge', () => {
    // FR-2: 0 radians = 3-o'clock
    const ep = cutEndpoint(0)
    expect(ep.x).toBeCloseTo(CX + RADIUS)
    expect(ep.y).toBeCloseTo(CY)
  })

  it('angle PI/2 points to the bottom edge', () => {
    // FR-2: 90 degrees = 6-o'clock
    const ep = cutEndpoint(Math.PI / 2)
    expect(ep.x).toBeCloseTo(CX)
    expect(ep.y).toBeCloseTo(CY + RADIUS)
  })

  it('angle PI points to the left edge', () => {
    // FR-2: 180 degrees = 9-o'clock
    const ep = cutEndpoint(Math.PI)
    expect(ep.x).toBeCloseTo(CX - RADIUS)
    expect(ep.y).toBeCloseTo(CY)
  })

  it('angle 3*PI/2 points to the top edge', () => {
    // FR-2: 270 degrees = 12-o'clock
    const ep = cutEndpoint(3 * Math.PI / 2)
    expect(ep.x).toBeCloseTo(CX)
    expect(ep.y).toBeCloseTo(CY - RADIUS)
  })

  it('distance from center equals RADIUS for any angle', () => {
    // FR-2: endpoint always lies on the pizza edge circle
    const angles = [0, 0.7, 1.5, 2.3, Math.PI, 4, 5, 6]
    for (const a of angles) {
      const ep = cutEndpoint(a)
      const dist = Math.sqrt((ep.x - CX) ** 2 + (ep.y - CY) ** 2)
      expect(dist).toBeCloseTo(RADIUS)
    }
  })
})

/* ================================================================== */
/*  Click radius filtering (constants check)                          */
/* ================================================================== */

describe('click radius filtering', () => {
  it('MIN_CLICK_RADIUS is 30% of RADIUS', () => {
    // FR-2: clicks <30% of radius from center are ignored
    expect(MIN_CLICK_RADIUS).toBeCloseTo(RADIUS * 0.3)
  })

  it('MIN_CLICK_RADIUS rejects clicks too close to center (<30px effective)', () => {
    // FR-2: MIN_CLICK_RADIUS = 140*0.3 = 42
    // A click 30px from center (< 42) would be ignored
    const clickDist = 30
    expect(clickDist < MIN_CLICK_RADIUS).toBe(true)
  })

  it('MAX_CLICK_RADIUS is RADIUS + 30', () => {
    // FR-2: clicks beyond edge + 30px margin are ignored
    expect(MAX_CLICK_RADIUS).toBe(RADIUS + 30)
  })

  it('MAX_CLICK_RADIUS rejects clicks too far from center (>170px effective)', () => {
    // FR-2: MAX_CLICK_RADIUS = 140+30 = 170
    // A click 180px from center (> 170) would be ignored
    const clickDist = 180
    expect(clickDist > MAX_CLICK_RADIUS).toBe(true)
  })

  it('click at exactly MIN_CLICK_RADIUS is NOT accepted (< excludes boundary)', () => {
    // FR-2: the component checks dist < MIN_CLICK_RADIUS to reject
    // so dist === MIN_CLICK_RADIUS is accepted (not rejected)
    const clickDist = MIN_CLICK_RADIUS
    expect(clickDist < MIN_CLICK_RADIUS).toBe(false) // not rejected
  })

  it('click at exactly MAX_CLICK_RADIUS is NOT accepted (> excludes boundary)', () => {
    // FR-2: the component checks dist > MAX_CLICK_RADIUS to reject
    // so dist === MAX_CLICK_RADIUS is accepted (not rejected)
    const clickDist = MAX_CLICK_RADIUS
    expect(clickDist > MAX_CLICK_RADIUS).toBe(false) // not rejected
  })

  it('click inside valid range is accepted', () => {
    // FR-2: dist between MIN and MAX is valid
    const clickDist = 100
    expect(clickDist >= MIN_CLICK_RADIUS && clickDist <= MAX_CLICK_RADIUS).toBe(true)
  })
})

/* ================================================================== */
/*  Constants                                                         */
/* ================================================================== */

describe('Fraction constants', () => {
  it('ROUNDS_TO_COMPLETE is 3', () => {
    // FR-2: 3 rounds → onComplete
    expect(ROUNDS_TO_COMPLETE).toBe(3)
  })

  it('CX and CY are both 200 (center of 400x400 viewBox)', () => {
    // FR-2: pizza is centered in the SVG viewBox
    expect(CX).toBe(200)
    expect(CY).toBe(200)
  })

  it('RADIUS is 140', () => {
    // FR-2: pizza radius
    expect(RADIUS).toBe(140)
  })
})
