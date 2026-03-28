/**
 * Pure logic functions extracted from MirrorCanvas for testability.
 *
 * These functions handle symmetry geometry, stroke measurement, and
 * match validation — all without any React or canvas dependency.
 */
import type { Point, Stroke, SymmetryPuzzleData, MirrorAxis } from './types'

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

/** How many successful rounds before onComplete fires. */
export const ROUNDS_TO_COMPLETE = 3

/** Minimum total stroke length (in px) before we evaluate correctness. */
export const MIN_DRAW_LENGTH = 60

/** Default tolerance when puzzle doesn't specify one. */
export const DEFAULT_TOLERANCE = 0.18

/* ------------------------------------------------------------------ */
/*  Pure helpers                                                      */
/* ------------------------------------------------------------------ */

/** Parse and validate puzzle data with sensible defaults. */
export function parsePuzzle(puzzle: Record<string, unknown>): SymmetryPuzzleData {
  const data = (puzzle.data ?? puzzle) as Partial<SymmetryPuzzleData>
  return {
    targetPoints: Array.isArray(data.targetPoints) ? data.targetPoints : [],
    mirrorAxis: data.mirrorAxis === 'horizontal' ? 'horizontal' : 'vertical',
    tolerance: typeof data.tolerance === 'number' ? data.tolerance : DEFAULT_TOLERANCE,
  }
}

/** Mirror a point across the given axis (in canvas-pixel space). */
export function mirrorPoint(p: Point, axis: MirrorAxis, w: number, h: number): Point {
  if (axis === 'vertical') return { x: w - p.x, y: p.y }
  return { x: p.x, y: h - p.y }
}

/** Total Euclidean length of a stroke. */
export function strokeLength(pts: Point[]): number {
  let len = 0
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x
    const dy = pts[i].y - pts[i - 1].y
    len += Math.sqrt(dx * dx + dy * dy)
  }
  return len
}

/**
 * Convert normalised target polylines (0-1 space, relative to the target
 * half) into canvas-pixel polylines placed on the left/top half.
 */
export function targetToCanvas(
  targetPoints: number[][][],
  axis: MirrorAxis,
  w: number,
  h: number,
): Point[][] {
  const halfW = axis === 'vertical' ? w / 2 : w
  const halfH = axis === 'vertical' ? h : h / 2
  return targetPoints.map((polyline) =>
    polyline.map(([nx, ny]) => ({
      x: nx * halfW,
      y: ny * halfH,
    })),
  )
}

/**
 * Rough coverage check: do the user's mirrored strokes cover the target
 * shape within the given tolerance?
 *
 * For L1 (no target), we simply check the user drew enough.
 */
export function checkMatch(
  strokes: Stroke[],
  targetPolylines: Point[][],
  tolerance: number,
  w: number,
  h: number,
): boolean {
  // L1 mode: no target — just check user drew a minimum amount
  if (targetPolylines.length === 0) {
    const totalLen = strokes.reduce((s, st) => s + strokeLength(st.points), 0)
    return totalLen > MIN_DRAW_LENGTH
  }

  // Sample points along each target polyline and check proximity to any user
  // stroke point.
  const tolPx = tolerance * Math.min(w, h)
  const tolSq = tolPx * tolPx

  // Collect all user stroke points into a flat array for proximity search
  const allPts: Point[] = strokes.flatMap((s) => s.points)
  if (allPts.length === 0) return false

  let coveredSamples = 0
  let totalSamples = 0

  for (const poly of targetPolylines) {
    for (let i = 0; i < poly.length; i++) {
      totalSamples++
      const tp = poly[i]
      for (const up of allPts) {
        const dx = up.x - tp.x
        const dy = up.y - tp.y
        if (dx * dx + dy * dy <= tolSq) {
          coveredSamples++
          break
        }
      }
    }
  }

  // Require at least 55% of target sample points to be covered
  return totalSamples > 0 && coveredSamples / totalSamples >= 0.55
}
