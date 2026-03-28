/**
 * Type definitions for the Matrix PixelArt renderer.
 *
 * Children learn matrix transformations (rotate, flip, transpose)
 * by manipulating an 8x8 pixel grid to match a target pattern.
 */

/** Supported matrix transformations. */
export const TRANSFORMS = [
  'rotate90',
  'flipH',
  'flipV',
  'transpose',
] as const

export type Transform = (typeof TRANSFORMS)[number]

/** Color palette indices (0-5). */
export const PALETTE = [
  '#FFFFFF', // 0 = white
  '#1A1A2E', // 1 = black
  '#E74C3C', // 2 = red
  '#3498DB', // 3 = blue
  '#2ECC71', // 4 = green
  '#F1C40F', // 5 = yellow
] as const

export type ColorIndex = 0 | 1 | 2 | 3 | 4 | 5

/** 8x8 grid represented as a 2D array of color indices. */
export type Grid = ColorIndex[][]

/**
 * Puzzle data embedded in `puzzle.data`.
 *
 * - `initialGrid`: the starting 8x8 pixel pattern.
 * - `targetGrid`: the goal pattern the child must reach via transforms.
 * - `allowedTransforms`: which transforms the child may use (subset of TRANSFORMS).
 * - `maxSteps`: maximum number of transforms allowed (-1 for unlimited).
 */
export interface PixelArtPuzzleData {
  initialGrid: number[][]
  targetGrid: number[][]
  allowedTransforms: string[]
  maxSteps: number
}

/** Transform button descriptor for the UI. */
export interface TransformButton {
  id: Transform
  label: string
  icon: string
}

/** Per-cell animation state for flip/slide transitions. */
export interface CellAnimation {
  row: number
  col: number
  startTime: number
  /** Delay offset in ms (for wave effects). */
  delay: number
}

/** Celebration wave state. */
export interface CelebrationState {
  startTime: number
  /** Whether onCorrect has been fired for this celebration. */
  fired: boolean
}
