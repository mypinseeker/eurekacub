/**
 * Winnability tests for the matrix (PixelArt) levels.
 *
 * These search for a solution using the renderer's OWN applyTransform. That detail is the whole
 * point: an earlier version of this analysis re-implemented rotate90/flipH/flipV/transpose in the
 * test, which would have proved a property of the test's model rather than of the shipped game.
 * If someone changes what "rotate90" means in matrix.utils.ts, these tests must move with it.
 *
 * What went wrong before, and what these guard against:
 *
 *   PUZZLE_CONFIGS.matrix never set initialGrid or targetGrid. parsePuzzle() defaults BOTH to the
 *   same DEFAULT_GRID, so each level shipped with the picture already on its target. L1 allowed
 *   only rotate90 with a 3-move cap, and returning a grid to its own orientation takes 4 rotations
 *   — unsolvable. L2 and L3 were the opposite problem: DEFAULT_GRID is its own left-right mirror,
 *   so one press of flipH "won" instantly.
 */
import { describe, it, expect } from 'vitest'
import { PUZZLE_CONFIGS } from '../src/pages/puzzleConfigs'
import { applyTransform } from '../src/renderers/matrix/matrix.utils'
import type { Grid, Transform } from '../src/renderers/matrix/types'

type Level = 'L1' | 'L2' | 'L3'
const LEVELS: Level[] = ['L1', 'L2', 'L3']

const key = (g: Grid) => g.map((row) => row.join('')).join('/')

interface MatrixConfig {
  initialGrid: number[][]
  targetGrid: number[][]
  allowedTransforms: string[]
  maxSteps: number
}

const configFor = (level: Level): MatrixConfig =>
  PUZZLE_CONFIGS.matrix[level] as unknown as MatrixConfig

/**
 * Breadth-first search for the fewest transforms that turn `initial` into `target`.
 * Returns null when no solution exists within `maxSteps`.
 */
function shortestSolution(cfg: MatrixConfig): number | null {
  const start = cfg.initialGrid as Grid
  const goal = key(cfg.targetGrid as Grid)
  const transforms = cfg.allowedTransforms as Transform[]

  const seen = new Set([key(start)])
  let frontier: Grid[] = [start]

  for (let depth = 1; depth <= cfg.maxSteps; depth++) {
    const next: Grid[] = []
    for (const grid of frontier) {
      for (const t of transforms) {
        const moved = applyTransform(grid, t)
        if (key(moved) === goal) return depth
        if (!seen.has(key(moved))) {
          seen.add(key(moved))
          next.push(moved)
        }
      }
    }
    frontier = next
  }
  return null
}

describe('matrix levels are actually winnable', () => {
  it.each(LEVELS)('%s reaches its target within the move limit', (level) => {
    const cfg = configFor(level)
    const steps = shortestSolution(cfg)
    expect(
      steps,
      `${level} has no solution within maxSteps=${cfg.maxSteps} using [${cfg.allowedTransforms.join(', ')}]`,
    ).not.toBeNull()
    expect(steps!).toBeLessThanOrEqual(cfg.maxSteps)
  })

  it.each(LEVELS)('%s does not start already solved', (level) => {
    const cfg = configFor(level)
    // The renderer only compares grids AFTER a transform is applied, so a level whose start
    // equals its target is not "instantly won" — it is unwinnable unless the child can return
    // to the start, which L1's rotate-only palette cannot do inside three moves.
    expect(key(cfg.initialGrid as Grid)).not.toBe(key(cfg.targetGrid as Grid))
  })

  it.each(LEVELS)('%s cannot be won by mashing one button once', (level) => {
    const cfg = configFor(level)
    // A transform that maps the start onto the target in a single press means the level has a
    // no-thought solution. L1 is exempt: teaching a single rotation is precisely its job.
    if (level === 'L1') return
    expect(shortestSolution(cfg)!).toBeGreaterThan(1)
  })
})

describe('the matrix difficulty ladder is real', () => {
  it('widens the button palette at every level', () => {
    const sizes = LEVELS.map((l) => configFor(l).allowedTransforms.length)
    expect(sizes[0]).toBeLessThan(sizes[1])
    expect(sizes[1]).toBeLessThan(sizes[2])
  })

  it('never grants more spare moves than the level below', () => {
    // The transforms form the dihedral group of order 8, so no target is more than three moves
    // away and difficulty cannot come from longer solutions. It comes from a wider search with
    // less room for a wrong guess, so slack must be non-increasing.
    const slack = LEVELS.map((l) => {
      const cfg = configFor(l)
      return cfg.maxSteps - shortestSolution(cfg)!
    })
    expect(slack[1]).toBeLessThanOrEqual(slack[0])
    expect(slack[2]).toBeLessThanOrEqual(slack[1])
  })

  it('gives every level a distinct target', () => {
    const targets = LEVELS.map((l) => key(configFor(l).targetGrid as Grid))
    expect(new Set(targets).size).toBe(LEVELS.length)
  })

  it('uses a glyph with no symmetry, so no transform is a no-op', () => {
    // If any single transform maps the start onto itself, that button does nothing and the child
    // can press it freely — which is how flipH used to be free on the old symmetric default grid.
    const start = configFor('L1').initialGrid as Grid
    const all: Transform[] = ['rotate90', 'flipH', 'flipV', 'transpose']
    for (const t of all) {
      expect(key(applyTransform(start, t)), `${t} leaves the glyph unchanged`).not.toBe(key(start))
    }
  })
})
