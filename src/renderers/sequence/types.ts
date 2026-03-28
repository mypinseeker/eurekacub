/**
 * Type definitions for the Sequence NumberTrain renderer.
 *
 * The puzzle data describes a number sequence with some blanks
 * that the child must fill in by recognising the pattern.
 */

/**
 * Puzzle data embedded in `puzzle.data`.
 *
 * - `sequence`: the full number array including answers
 *   e.g. [2, 4, 6, 8, 10]
 * - `blanks`: indices within `sequence` that are hidden
 *   e.g. [3] means index 3 is the "?" carriage
 * - `rule`: human-readable description of the pattern
 *   e.g. "add 2", "fibonacci", "multiply by 2"
 * - `options`: shuffled number choices shown to the child
 *   (includes correct answers plus distractors)
 */
export interface SequencePuzzleData {
  sequence: number[]
  blanks: number[]
  rule: string
  options: number[]
}

/**
 * Internal state tracked by the NumberTrain component.
 */
export interface TrainState {
  /** Map of blank index to the value the child placed there (or undefined). */
  filled: Map<number, number>
  /** The currently selected option (number tapped from the options panel). */
  selectedOption: number | null
  /** Whether the puzzle is fully complete (all blanks correctly filled). */
  complete: boolean
  /** Count of blanks correctly filled so far. */
  correctCount: number
}
