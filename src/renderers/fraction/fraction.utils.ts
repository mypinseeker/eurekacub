/**
 * Pure logic functions extracted from PizzaCutter for testability.
 *
 * These functions handle angle geometry, cut validation, and edge-point
 * calculation — all without any React or SVG dependency.
 */
import type { Cut, EquivalenceRound, EquivalencePuzzleData } from './types'

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

/* ─── "Same amount" (equivalence) mode — CG-FR-1 ──────────── */

/** 12 o'clock. Pre-cut slices, guides and shading all start here. */
export const TOP = -Math.PI / 2

/** `n` evenly spaced cut angles, starting at `start` (12 o'clock by default). */
export function evenCutAngles(n: number, start = TOP): number[] {
  return Array.from({ length: n }, (_, i) => start + (i * Math.PI * 2) / n)
}

/**
 * The slices defined by a set of cuts, as [start, end] angle pairs in ascending order.
 * The last slice wraps past 2π back to the first cut, so `end - start` is always the arc.
 */
export function sliceArcs(cutAngles: number[]): Array<[number, number]> {
  const s = cutAngles.map(normaliseAngle).sort((a, b) => a - b)
  return s.map((a, i): [number, number] => [a, i + 1 < s.length ? s[i + 1] : s[0] + Math.PI * 2])
}

/** Index (into `sliceArcs`) of the slice containing `angle`, or -1 when there are no cuts. */
export function sliceIndexAt(angle: number, cutAngles: number[]): number {
  const s = cutAngles.map(normaliseAngle).sort((a, b) => a - b)
  if (s.length === 0) return -1
  let a = normaliseAngle(angle)
  if (a < s[0]) a += Math.PI * 2 // before the first cut = inside the wrapping last slice
  for (let i = s.length - 1; i >= 0; i--) {
    if (a >= s[i]) return i
  }
  return s.length - 1
}

/** SVG path for a pie wedge from `start` to `end` (radians, clockwise on screen). */
export function wedgePath(cx: number, cy: number, r: number, start: number, end: number): string {
  const x1 = cx + Math.cos(start) * r
  const y1 = cy + Math.sin(start) * r
  const x2 = cx + Math.cos(end) * r
  const y2 = cy + Math.sin(end) * r
  const largeArc = end - start > Math.PI ? 1 : 0
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
}

/** How many of the right pizza's slices make the same amount as the left. */
export function answerFor(round: EquivalenceRound): number {
  const [shaded, slices] = round.given
  return (shaded * round.cutInto) / slices
}

/**
 * Is `shaded` out of `pieces` the same amount as `given`? Compared by cross-multiplying, so it
 * is exact — no floating-point area comparison.
 */
export function isSameAmount(shaded: number, pieces: number, given: [number, number]): boolean {
  if (pieces <= 0 || shaded <= 0) return false
  return shaded * given[1] === given[0] * pieces
}

/**
 * A round the child can actually finish: a proper fraction on the left, a right pizza cut
 * differently (otherwise the answer is just "copy the left"), and a whole-number answer
 * (otherwise no number of slices is the same amount and the round is unwinnable).
 */
export function isPlayableRound(r: unknown): r is EquivalenceRound {
  if (typeof r !== 'object' || r === null) return false
  const { given, cutInto } = r as Partial<EquivalenceRound>
  if (!Array.isArray(given) || given.length !== 2 || typeof cutInto !== 'number') return false
  const [a, n] = given
  const ints = [a, n, cutInto].every((v) => Number.isInteger(v))
  return ints && a > 0 && a < n && cutInto >= 2 && cutInto <= 12 && cutInto !== n && (a * cutInto) % n === 0
}

const DEFAULT_EQUIVALENCE_ROUNDS: EquivalenceRound[] = [{ given: [1, 2], cutInto: 4 }]

/** Parse `mode: 'equivalence'` puzzle data, dropping rounds that could not be won. */
export function parseEquivalence(puzzle: Record<string, unknown>): EquivalencePuzzleData {
  const raw = (puzzle.data ?? puzzle) as Partial<EquivalencePuzzleData>
  const rounds = Array.isArray(raw.rounds) ? raw.rounds.filter(isPlayableRound) : []
  return {
    rounds: rounds.length > 0 ? rounds : DEFAULT_EQUIVALENCE_ROUNDS,
    showGuides: raw.showGuides ?? true,
    tolerance: raw.tolerance ?? 15,
  }
}
