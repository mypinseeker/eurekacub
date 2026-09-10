/**
 * Tripwire: content/puzzles/ is not a live content source (PRD-content-gaps A.11, GATE-2 D-3).
 *
 * The 41 JSON files under content/puzzles/ are validated by CI on every push and look like the
 * obvious place to add a puzzle — CONTRIBUTING even walks you through it. But nothing in src/
 * loads them: the module pages play `src/pages/puzzleConfigs.ts`, adventures play
 * `src/data/adventures.ts`. A contributor who adds a JSON puzzle gets a green CI run and a puzzle
 * no child will ever see. (Several of the files also use fields the renderers do not read, e.g.
 * symmetry's `targetShape`.)
 *
 * D-3 decided: do not delete them and do not wire them up in this iteration — just stop them
 * from misleading anyone. If one of these tests goes red, read the "L1" section of
 * CONTRIBUTING.md before doing anything else.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..')
const SRC = join(ROOT, 'src')
const PUZZLES = join(ROOT, 'content', 'puzzles')

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name)
    return e.isDirectory() ? walk(p) : [p]
  })
}

/** Source files under src/ whose text matches `pattern`, as paths relative to the repo root. */
function srcFilesMatching(pattern: RegExp): string[] {
  return walk(SRC)
    .filter((f) => /\.(ts|tsx|js|jsx)$/.test(f))
    .filter((f) => pattern.test(readFileSync(f, 'utf8')))
    .map((f) => f.slice(ROOT.length + 1))
}

describe('content/puzzles/ is not a live content source [CG-D-3]', () => {
  it('positive control: the scanner does find a real import when one exists', () => {
    // Without this, a scanner that silently read zero files would make the next test pass.
    expect(srcFilesMatching(/from '\.\/puzzleConfigs'/)).toContain(join('src', 'pages', 'PuzzlePage.tsx'))
  })

  it('nothing under src/ loads content/puzzles', () => {
    expect(
      srcFilesMatching(/content\/puzzles|import\.meta\.glob\(/),
      'Something in src/ now reads content/puzzles. If that is intentional, a loader is being built: ' +
        'migrate the JSON to the fields the renderers read, then delete this tripwire as part of that work.',
    ).toEqual([])
  })

  it('has not grown new puzzle files that would silently never appear', () => {
    if (!existsSync(PUZZLES)) return
    const count = walk(PUZZLES).filter((f) => f.endsWith('.json')).length
    expect(
      count,
      'A JSON puzzle was added to content/puzzles/. Nothing loads that directory, so it will not ' +
        'appear in the game. See the "L1" section of CONTRIBUTING.md for where puzzles actually live.',
    ).toBe(41)
  })
})
