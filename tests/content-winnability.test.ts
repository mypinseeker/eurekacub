/**
 * Winnability tests for the shipped puzzle content in `content/puzzles/`.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Existing tests check that puzzle JSON matches its *schema* — every required field present,
 * right types. Nothing checked whether a puzzle can actually be SOLVED. On 2026-09-07 an audit
 * found that it frequently could not:
 *
 *   - all 5 `sequence` puzzles stored `-1` at every blank index. NumberTrain uses
 *     `sequence[blankIndex]` as the answer key, so the correct answer was -1, which is never
 *     among the options. A child could tap every option and never clear the level.
 *   - `equation-l2-multiply` asked "3 identical weights = 15" but BalanceScale only sums a side;
 *     with `leftSide: []` the scale read 5 vs 15 and never balanced.
 *   - `equation-l2-two-unknowns` encoded `? + 3 = 2 + ?`, which has no solution at all.
 *
 * A schema is not a specification of playability. These tests assert the latter.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const CONTENT = join(process.cwd(), 'content', 'puzzles')

interface Puzzle { id: string; data: Record<string, unknown> }

function load(module: string): Puzzle[] {
  const dir = join(CONTENT, module)
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .flatMap((f) => {
      const parsed = JSON.parse(readFileSync(join(dir, f), 'utf8'))
      return (Array.isArray(parsed) ? parsed : [parsed]) as Puzzle[]
    })
}

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)

describe('sequence puzzles are winnable', () => {
  const puzzles = load('sequence')

  it('there is content to test', () => expect(puzzles.length).toBeGreaterThan(0))

  for (const p of puzzles) {
    it(`${p.id}: every blank's answer is offered as an option`, () => {
      const { sequence, blanks, options } = p.data as {
        sequence: number[]; blanks: number[]; options: number[]
      }
      for (const i of blanks) {
        expect(i, `${p.id}: blank index ${i} is out of range`).toBeLessThan(sequence.length)
        // NumberTrain renders '?' for indices in `blanks` and compares the tapped option against
        // sequence[i] — so the TRUE value must live there. A -1 sentinel makes it unwinnable.
        expect(sequence[i], `${p.id}: index ${i} holds a placeholder, not the real answer`).not.toBe(-1)
        expect(options, `${p.id}: answer ${sequence[i]} at index ${i} is not among the options`).toContain(sequence[i])
      }
    })
  }
})

describe('equation puzzles are winnable', () => {
  const puzzles = load('equation')

  it('there is content to test', () => expect(puzzles.length).toBeGreaterThan(0))

  for (const p of puzzles) {
    it(`${p.id}: the stated answer balances the scale and is on offer`, () => {
      const { leftSide, rightSide, unknown, unknownSide, options } = p.data as {
        leftSide: number[]; rightSide: number[]; unknown: number
        unknownSide: 'left' | 'right'; options: number[]
      }
      expect(options, `${p.id}: correct answer ${unknown} is not among the options`).toContain(unknown)

      // BalanceScale only SUMS each pan and appends the single unknown to one side. It has no
      // notion of a multiplier or of the same unknown appearing on both sides, so a puzzle whose
      // text implies either of those must still balance under plain addition.
      const left = sum(leftSide) + (unknownSide === 'left' ? unknown : 0)
      const right = sum(rightSide) + (unknownSide === 'right' ? unknown : 0)
      expect(left, `${p.id}: scale does not balance — left ${left} vs right ${right}`).toBe(right)
    })
  }
})
