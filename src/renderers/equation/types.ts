/**
 * Type definitions for the Equation BalanceScale renderer.
 *
 * The puzzle data describes a balance-scale equation where one side
 * contains a mystery value the child must determine by selecting
 * the correct weight from a set of options.
 */

/** Which side of the scale holds the unknown value. */
export type UnknownSide = 'left' | 'right'

/**
 * Puzzle data embedded in `puzzle.data`.
 *
 * - `leftSide`: array of known weight values on the left pan.
 * - `rightSide`: array of known weight values on the right pan.
 * - `unknown`: the correct value the "?" block represents.
 * - `unknownSide`: which pan the "?" block sits on.
 * - `options`: selectable weight values shown to the child.
 */
export interface EquationPuzzleData {
  leftSide: number[]
  rightSide: number[]
  unknown: number
  unknownSide: UnknownSide
  options: number[]
}

/**
 * A weight block displayed on the scale or in the options area.
 */
export interface WeightBlock {
  value: number
  color: string
  id: string
}

/** Colors for weight blocks — warm, child-friendly palette. */
export const WEIGHT_COLORS = [
  '#E74C3C', // red
  '#3498DB', // blue
  '#2ECC71', // green
  '#9B59B6', // purple
  '#E67E22', // orange
  '#1ABC9C', // teal
  '#F39C12', // amber
  '#E84393', // pink
] as const

/** Color for the mystery "?" block. */
export const MYSTERY_COLOR = '#F1C40F' as const

/** Number of rounds required to trigger onComplete. */
export const ROUNDS_TO_COMPLETE = 3 as const

/** Maximum tilt angle in degrees. */
export const MAX_TILT_DEG = 15 as const

/** Degrees of tilt per unit weight difference. */
export const TILT_PER_UNIT = 3 as const
