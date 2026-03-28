import { describe, it, expect } from 'vitest'
import {
  parsePuzzleData,
  isBlank,
  makeBlanksSet,
  isCorrectPlacement,
  addUsedOption,
  isOptionUsed,
  isAllBlanksFilled,
  evaluateCarriageTap,
} from '../../src/renderers/sequence/sequence.utils'

// ─────────────────────────────────────────────────────────────
// FR-7: Sequence / Pattern Recognition — NumberTrain renderer
// ─────────────────────────────────────────────────────────────

describe('Sequence (NumberTrain) — parsePuzzleData', () => {
  // FR-7: puzzle data parsing with defaults
  it('parses puzzle.data when present', () => {
    const puzzle = {
      data: {
        sequence: [2, 4, 6, 8],
        blanks: [1, 3],
        rule: 'add 2',
        options: [4, 8, 5],
      },
    }
    const result = parsePuzzleData(puzzle as Record<string, unknown>)
    expect(result.sequence).toEqual([2, 4, 6, 8])
    expect(result.blanks).toEqual([1, 3])
    expect(result.rule).toBe('add 2')
    expect(result.options).toEqual([4, 8, 5])
  })

  // FR-7: fallback when puzzle.data is absent
  it('falls back to top-level fields when .data is missing', () => {
    const puzzle = {
      sequence: [1, 3, 5],
      blanks: [2],
      rule: 'odd',
      options: [5, 7],
    }
    const result = parsePuzzleData(puzzle as Record<string, unknown>)
    expect(result.sequence).toEqual([1, 3, 5])
    expect(result.blanks).toEqual([2])
  })

  // FR-7: defaults for completely empty puzzle
  it('returns empty defaults for empty puzzle', () => {
    const result = parsePuzzleData({})
    expect(result.sequence).toEqual([])
    expect(result.blanks).toEqual([])
    expect(result.rule).toBe('')
    expect(result.options).toEqual([])
  })
})

describe('Sequence (NumberTrain) — blank detection', () => {
  // FR-7: blanksSet membership check
  it('isBlank returns true for blank indices', () => {
    expect(isBlank([1, 3], 1)).toBe(true)
    expect(isBlank([1, 3], 3)).toBe(true)
  })

  // FR-7: non-blank indices return false
  it('isBlank returns false for non-blank indices', () => {
    expect(isBlank([1, 3], 0)).toBe(false)
    expect(isBlank([1, 3], 2)).toBe(false)
    expect(isBlank([1, 3], 4)).toBe(false)
  })

  // FR-7: empty blanks array
  it('isBlank returns false for empty blanks', () => {
    expect(isBlank([], 0)).toBe(false)
  })

  // FR-7: Set-based O(1) lookup
  it('makeBlanksSet creates a Set from blanks array', () => {
    const s = makeBlanksSet([1, 3, 5])
    expect(s.has(1)).toBe(true)
    expect(s.has(3)).toBe(true)
    expect(s.has(5)).toBe(true)
    expect(s.has(0)).toBe(false)
    expect(s.has(2)).toBe(false)
  })
})

describe('Sequence (NumberTrain) — validation', () => {
  const sequence = [2, 4, 6, 8, 10]

  // FR-7: correct placement — selectedOption === sequence[blankIdx]
  it('isCorrectPlacement returns true when option matches sequence value', () => {
    expect(isCorrectPlacement(sequence, 1, 4)).toBe(true)
    expect(isCorrectPlacement(sequence, 3, 8)).toBe(true)
    expect(isCorrectPlacement(sequence, 0, 2)).toBe(true)
  })

  // FR-7: wrong placement triggers error
  it('isCorrectPlacement returns false for wrong option', () => {
    expect(isCorrectPlacement(sequence, 1, 6)).toBe(false)
    expect(isCorrectPlacement(sequence, 3, 4)).toBe(false)
    expect(isCorrectPlacement(sequence, 0, 99)).toBe(false)
  })
})

describe('Sequence (NumberTrain) — used options tracking', () => {
  // FR-7: Set-based, no reuse
  it('addUsedOption adds option to set', () => {
    const used = new Set<number>()
    const result = addUsedOption(used, 4)
    expect(result).not.toBeNull()
    expect(result!.has(4)).toBe(true)
  })

  // FR-7: reuse returns null
  it('addUsedOption returns null if option already used', () => {
    const used = new Set([4])
    expect(addUsedOption(used, 4)).toBeNull()
  })

  // FR-7: does not mutate original set
  it('addUsedOption does not mutate original set', () => {
    const used = new Set([4])
    addUsedOption(used, 8)
    expect(used.has(8)).toBe(false)
  })

  // FR-7: isOptionUsed check
  it('isOptionUsed correctly checks membership', () => {
    const used = new Set([4, 8])
    expect(isOptionUsed(used, 4)).toBe(true)
    expect(isOptionUsed(used, 6)).toBe(false)
  })
})

describe('Sequence (NumberTrain) — completion', () => {
  // FR-7: all blanks filled → complete
  it('isAllBlanksFilled returns true when count matches total', () => {
    expect(isAllBlanksFilled(3, 3)).toBe(true)
    expect(isAllBlanksFilled(5, 3)).toBe(true) // exceeds is also complete
  })

  // FR-7: not all blanks filled
  it('isAllBlanksFilled returns false when count < total', () => {
    expect(isAllBlanksFilled(2, 3)).toBe(false)
    expect(isAllBlanksFilled(0, 1)).toBe(false)
  })
})

describe('Sequence (NumberTrain) — evaluateCarriageTap', () => {
  const sequence = [2, 4, 6, 8, 10]
  const blanksSet = new Set([1, 3])

  // FR-7: non-blank carriage click ignored
  it('returns ignored for non-blank carriage', () => {
    const result = evaluateCarriageTap({
      idx: 0, // not a blank
      blanksSet,
      filled: new Map(),
      selectedOption: 4,
      sequence,
      correctCount: 0,
      totalBlanks: 2,
      complete: false,
    })
    expect(result.type).toBe('ignored')
  })

  // FR-7: already complete → ignored
  it('returns ignored when puzzle is already complete', () => {
    const result = evaluateCarriageTap({
      idx: 1,
      blanksSet,
      filled: new Map(),
      selectedOption: 4,
      sequence,
      correctCount: 2,
      totalBlanks: 2,
      complete: true,
    })
    expect(result.type).toBe('ignored')
  })

  // FR-7: already filled blank → ignored
  it('returns ignored for already-filled blank', () => {
    const filled = new Map([[1, 4]])
    const result = evaluateCarriageTap({
      idx: 1,
      blanksSet,
      filled,
      selectedOption: 8,
      sequence,
      correctCount: 1,
      totalBlanks: 2,
      complete: false,
    })
    expect(result.type).toBe('ignored')
  })

  // FR-7: no option selected → ignored
  it('returns ignored when no option is selected', () => {
    const result = evaluateCarriageTap({
      idx: 1,
      blanksSet,
      filled: new Map(),
      selectedOption: null,
      sequence,
      correctCount: 0,
      totalBlanks: 2,
      complete: false,
    })
    expect(result.type).toBe('ignored')
  })

  // FR-7: correct placement
  it('returns correct for right answer', () => {
    const result = evaluateCarriageTap({
      idx: 1,
      blanksSet,
      filled: new Map(),
      selectedOption: 4, // sequence[1] === 4
      sequence,
      correctCount: 0,
      totalBlanks: 2,
      complete: false,
    })
    expect(result).toEqual({ type: 'correct', newCorrectCount: 1, allDone: false })
  })

  // FR-7: wrong placement → error (shake + error callback)
  it('returns error for wrong answer', () => {
    const result = evaluateCarriageTap({
      idx: 1,
      blanksSet,
      filled: new Map(),
      selectedOption: 6, // sequence[1] === 4, not 6
      sequence,
      correctCount: 0,
      totalBlanks: 2,
      complete: false,
    })
    expect(result.type).toBe('error')
  })

  // FR-7: all blanks filled → complete after last correct placement
  it('returns allDone=true when last blank is correctly filled', () => {
    const filled = new Map([[1, 4]]) // first blank already filled
    const result = evaluateCarriageTap({
      idx: 3,
      blanksSet,
      filled: new Map(), // second blank not filled yet
      selectedOption: 8, // sequence[3] === 8
      sequence,
      correctCount: 1, // one already correct
      totalBlanks: 2,
      complete: false,
    })
    expect(result).toEqual({ type: 'correct', newCorrectCount: 2, allDone: true })
  })

  // FR-7: edge case — single blank puzzle
  it('single blank: first correct tap completes puzzle', () => {
    const singleBlanksSet = new Set([2])
    const result = evaluateCarriageTap({
      idx: 2,
      blanksSet: singleBlanksSet,
      filled: new Map(),
      selectedOption: 6, // sequence[2] === 6
      sequence,
      correctCount: 0,
      totalBlanks: 1,
      complete: false,
    })
    expect(result).toEqual({ type: 'correct', newCorrectCount: 1, allDone: true })
  })
})
