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
 * Which symmetry game a level plays (CG-FR-2.1). `reflect` is the original mirror game and the
 * default — a level that does not say otherwise behaves exactly as it did before.
 */
export type TransformType = 'reflect' | 'translate' | 'rotate'

/** The two new games, which MirrorCanvas hands to TransformCanvas. */
export type MovingTransform = Exclude<TransformType, 'reflect'>

/**
 * One round of a translate or rotate level.
 *
 * Unlike reflect, whose points live in one half of the canvas, these points are normalised 0–1
 * over the largest centred square of the whole canvas, so a rotation stays a rotation even on a
 * tall phone screen.
 */
export interface TransformRound {
  targetPoints: number[][][]
  /** translate only: how far the shape moves, in the same normalised units. */
  vector?: [number, number]
  /** rotate only: how many times the shape repeats around the centre (2, 3 or 4). */
  rotationalOrder?: number
}

export interface TransformPuzzleData {
  transformType: MovingTransform
  rounds: TransformRound[]
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
