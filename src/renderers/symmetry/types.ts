/**
 * Type definitions for the Symmetry MirrorCanvas renderer.
 *
 * The puzzle data describes a target shape that the child must replicate
 * on the opposite side of a mirror axis.
 */

/** A single 2D point. */
export interface Point {
  x: number
  y: number
}

/** A continuous stroke drawn by the user (series of points). */
export interface Stroke {
  points: Point[]
  /** Hue value (0-360) for rainbow coloring. */
  hue: number
}

/** Mirror axis direction. */
export type MirrorAxis = 'vertical' | 'horizontal'

/**
 * Shape data embedded in `puzzle.data`.
 *
 * - `targetPoints`: array of polylines (each polyline is an array of [x, y]
 *   pairs in normalised 0-1 coordinate space, relative to the target half).
 * - `mirrorAxis`: which axis the mirror line follows.
 * - `tolerance`: how close (in normalised units) the child's drawing must be
 *   to the target to count as a match. Range 0-1; 0.15 is generous for young
 *   children.
 */
export interface SymmetryPuzzleData {
  targetPoints: number[][][]
  mirrorAxis: MirrorAxis
  tolerance: number
}

/**
 * Internal draw-state tracked by the MirrorCanvas component.
 */
export interface DrawState {
  /** All completed strokes. */
  strokes: Stroke[]
  /** The stroke currently being drawn (null when pen is up). */
  activeStroke: Stroke | null
  /** Number of successful matches so far (onComplete fires at 3). */
  successCount: number
  /** Whether the current round has been marked correct. */
  roundCorrect: boolean
}
