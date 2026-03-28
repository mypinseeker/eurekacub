/**
 * Pure logic functions extracted from PizzaCutter for testability.
 *
 * These functions handle angle geometry, cut validation, and edge-point
 * calculation — all without any React or SVG dependency.
 */
import type { Cut } from './types'

/* ─── Constants ───────────────────────────────────────────── */

export const CX = 200 // pizza center X
export const CY = 200 // pizza center Y
export const RADIUS = 140 // pizza radius
export const CRUST_WIDTH = 14

/** Minimum distance from center to register a click on the edge. */
export const MIN_CLICK_RADIUS = RADIUS * 0.3 // 42

/** Maximum distance from center to register a click. */
export const MAX_CLICK_RADIUS = RADIUS + 30 // 170

export const ROUNDS_TO_COMPLETE = 3

/* ─── Geometry helpers ────────────────────────────────────── */

/** Calculate angle in radians from center to a point. */
export function angleFromCenter(x: number, y: number): number {
  return Math.atan2(y - CY, x - CX)
}

/** Normalise an angle to [0, 2*PI). */
export function normaliseAngle(a: number): number {
  const TWO_PI = Math.PI * 2
  return ((a % TWO_PI) + TWO_PI) % TWO_PI
}

/** Convert radians to degrees. */
export function toDeg(rad: number): number {
  return (rad * 180) / Math.PI
}

/**
 * Validate whether the given cuts evenly divide the pizza into `targetSlices`
 * equal arcs, within the specified tolerance (degrees).
 */
export function validateCuts(cuts: Cut[], targetSlices: number, toleranceDeg: number): boolean {
  if (cuts.length !== targetSlices) return false

  // Sort cuts by normalised angle
  const sorted = cuts
    .map((c) => normaliseAngle(c.angle))
    .sort((a, b) => a - b)

  // Compute arc gaps between consecutive cuts
  const expectedArc = 360 / targetSlices
  for (let i = 0; i < sorted.length; i++) {
    const next = i + 1 < sorted.length ? sorted[i + 1] : sorted[0] + Math.PI * 2
    const arcDeg = toDeg(next - sorted[i])
    if (Math.abs(arcDeg - expectedArc) > toleranceDeg) {
      return false
    }
  }

  return true
}

/**
 * Get the endpoint of a radial cut line at the pizza edge.
 */
export function cutEndpoint(angle: number): { x: number; y: number } {
  return {
    x: CX + Math.cos(angle) * RADIUS,
    y: CY + Math.sin(angle) * RADIUS,
  }
}
