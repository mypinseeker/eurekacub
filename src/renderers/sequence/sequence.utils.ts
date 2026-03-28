/**
 * Pure-logic utilities extracted from NumberTrain renderer.
 * Supports FR-7 (Sequence / Pattern Recognition).
 */
import type { SequencePuzzleData } from './types'

/**
 * Parse raw puzzle object into typed SequencePuzzleData with defaults.
 */
export function parsePuzzleData(puzzle: Record<string, unknown>): SequencePuzzleData {
  const d = (puzzle.data ?? puzzle) as Partial<SequencePuzzleData>
  return {
    sequence: d.sequence ?? [],
    blanks: d.blanks ?? [],
    rule: d.rule ?? '',
    options: d.options ?? [],
  }
}

/**
 * Check whether a carriage index is a blank position.
 */
export function isBlank(blanks: number[], idx: number): boolean {
  return blanks.includes(idx)
}

/**
 * Build a Set of blank indices for O(1) lookup.
 */
export function makeBlanksSet(blanks: number[]): Set<number> {
  return new Set(blanks)
}

/**
 * Validate whether placing `selectedOption` at `blankIdx` is correct.
 * Returns true if the value matches the expected sequence value.
 */
export function isCorrectPlacement(
  sequence: number[],
  blankIdx: number,
  selectedOption: number,
): boolean {
  return sequence[blankIdx] === selectedOption
}

/**
 * Track used options — returns a new Set with the option added.
 * Returns null if the option was already used (no reuse allowed).
 */
export function addUsedOption(usedOptions: Set<number>, option: number): Set<number> | null {
  if (usedOptions.has(option)) return null
  const next = new Set(usedOptions)
  next.add(option)
  return next
}

/**
 * Check if an option has already been used.
 */
export function isOptionUsed(usedOptions: Set<number>, option: number): boolean {
  return usedOptions.has(option)
}

/**
 * Determine if all blanks have been correctly filled.
 */
export function isAllBlanksFilled(correctCount: number, totalBlanks: number): boolean {
  return correctCount >= totalBlanks
}

/**
 * Result of attempting to place an option on a carriage.
 */
export type PlacementResult =
  | { type: 'ignored' }        // non-blank or already filled or no selection
  | { type: 'correct'; newCorrectCount: number; allDone: boolean }
  | { type: 'error' }

/**
 * Pure logic for handling a carriage tap.
 * Returns the result without side effects.
 */
export function evaluateCarriageTap(params: {
  idx: number
  blanksSet: Set<number>
  filled: Map<number, number>
  selectedOption: number | null
  sequence: number[]
  correctCount: number
  totalBlanks: number
  complete: boolean
}): PlacementResult {
  const { idx, blanksSet, filled, selectedOption, sequence, correctCount, totalBlanks, complete } = params

  // Ignored cases: already complete, not a blank, already filled, no selection
  if (complete) return { type: 'ignored' }
  if (!blanksSet.has(idx)) return { type: 'ignored' }
  if (filled.has(idx)) return { type: 'ignored' }
  if (selectedOption === null) return { type: 'ignored' }

  // Check correctness
  if (selectedOption === sequence[idx]) {
    const newCount = correctCount + 1
    return {
      type: 'correct',
      newCorrectCount: newCount,
      allDone: newCount >= totalBlanks,
    }
  }

  return { type: 'error' }
}
