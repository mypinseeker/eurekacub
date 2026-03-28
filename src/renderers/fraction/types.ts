/**
 * Type definitions for the Fraction PizzaCutter renderer.
 *
 * The puzzle data describes how many equal slices the child must cut
 * a pizza into by placing radial cut lines from the center.
 */

/**
 * Puzzle data embedded in `puzzle.data`.
 *
 * - `targetSlices`: the number of equal slices to cut (2, 3, 4, 6, 8).
 * - `showGuides`: if true, faint guide lines are rendered to help younger
 *   children see where cuts should go.
 * - `tolerance`: angular tolerance in degrees for "evenly spaced" validation.
 *   15 is generous for young children; 8 is tighter for older kids.
 */
export interface FractionPuzzleData {
  targetSlices: number
  showGuides: boolean
  tolerance: number
}

/** A single radial cut placed by the child, stored as an angle in radians. */
export interface Cut {
  /** Angle in radians from the positive x-axis (0 = 3-o'clock). */
  angle: number
}

/**
 * Internal game state tracked by the PizzaCutter component.
 */
export interface PizzaCutterState {
  /** All cuts placed so far in the current round. */
  cuts: Cut[]
  /** Whether the current round has been validated as correct. */
  roundCorrect: boolean
  /** Number of successful rounds completed (onComplete fires at 3). */
  successCount: number
  /** The current puzzle parameters. */
  puzzleData: FractionPuzzleData
}

/** Pastel colors used to highlight correct pizza slices. */
export const SLICE_COLORS = [
  '#FFB3BA', // pink
  '#BAE1FF', // blue
  '#BAFFC9', // green
  '#E8BAFF', // purple
  '#FFD4A3', // orange
  '#FFFFBA', // yellow
  '#C9BAFF', // lavender
  '#FFBAE8', // rose
] as const
