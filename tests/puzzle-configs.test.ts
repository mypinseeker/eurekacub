/**
 * Contract tests for `PUZZLE_CONFIGS` in `src/pages/puzzleConfigs.ts`.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Every renderer parses `puzzle.data` defensively: unknown keys are ignored and missing keys
 * fall back to a built-in default. That is good for content robustness but it makes the
 * level-config table fail SILENTLY — a misspelled key does not throw, it just makes L1, L2 and
 * L3 render the exact same default puzzle.
 *
 * On 2026-09-07 four of the eight modules were in exactly that state:
 *   - symmetry    gave `complexity`/`showGrid`, renderer wanted `targetPoints`  → empty target
 *   - derivative  gave `maxSpeed`/`curveType`,  renderer wanted `targetCurve`   → same curve x3
 *   - matrix      gave `operations`,            renderer wanted `allowedTransforms`
 *   - probability gave `flipsPerExperiment`,    renderer wanted `totalFlips`
 * and two more crashed outright because a scalar was passed where an array was required
 * (`equation.rightSide`, `sequence.blanks`).
 *
 * Unit tests could not catch this because they test renderers against hand-written fixtures,
 * never against the table the app actually ships. These tests close that gap.
 */
import { describe, it, expect } from 'vitest'
import { PUZZLE_CONFIGS, MODULE_RENDERER_MAP, levelIdsFor, levelMetaFor } from '../src/pages/puzzleConfigs'
import zh from '../src/i18n/zh.json'
import en from '../src/i18n/en.json'

/** The three difficulty tiers every module has. The playability checks below are about these. */
const LEVELS = ['L1', 'L2', 'L3'] as const

type Contract = { required: string[]; optional: string[] }

/**
 * The fields each renderer actually reads off `puzzle.data`, transcribed from the renderer
 * source. `required` must be present (otherwise the level silently uses the renderer default);
 * `optional` may be present. Anything else in the config is dead weight and almost always a typo.
 */
const CONTRACTS: Record<string, Contract> = {
  symmetry: { required: ['targetPoints', 'mirrorAxis'], optional: ['tolerance'] },
  fraction: { required: ['targetSlices'], optional: ['showGuides', 'tolerance'] },
  derivative: { required: ['targetCurve', 'duration', 'finishLine'], optional: ['theme', 'xAxisLabel', 'yAxisLabel'] },
  equation: { required: ['leftSide', 'rightSide', 'unknown', 'unknownSide', 'options'], optional: [] },
  matrix: { required: ['allowedTransforms'], optional: ['maxSteps', 'initialGrid', 'targetGrid'] },
  sequence: { required: ['sequence', 'blanks', 'options'], optional: ['rule'] },
  probability: { required: ['totalFlips'], optional: [] },
}

/**
 * New modes read a different set of fields from the same renderer. A level opts into a mode by
 * setting the renderer's mode key; without it the renderer behaves exactly as before.
 */
const MODE_CONTRACTS: Record<string, { modeKey: string; modes: Record<string, Contract> }> = {
  fraction: {
    modeKey: 'mode',
    modes: { equivalence: { required: ['mode', 'rounds'], optional: ['showGuides', 'tolerance'] } },
  },
  symmetry: {
    modeKey: 'transformType',
    modes: {
      translate: { required: ['transformType', 'rounds'], optional: ['tolerance'] },
      rotate: { required: ['transformType', 'rounds'], optional: ['tolerance'] },
    },
  },
}

function contractFor(module: string, cfg: Record<string, unknown> | undefined): Contract | undefined {
  const m = MODE_CONTRACTS[module]
  const mode = m ? cfg?.[m.modeKey] : undefined
  return mode === undefined ? CONTRACTS[module] : m!.modes[String(mode)]
}

describe('PUZZLE_CONFIGS ↔ renderer contract', () => {
  for (const module of Object.keys(CONTRACTS)) {
    describe(module, () => {
      const levels = levelIdsFor(module)
      for (const level of levels) {
        const cfg = PUZZLE_CONFIGS[module]?.[level]
        const contract = contractFor(module, cfg)

        it(`${level} exists`, () => {
          expect(cfg, `${module}.${level} missing from PUZZLE_CONFIGS`).toBeDefined()
        })

        it(`${level} uses a mode the renderer knows`, () => {
          expect(contract, `${module}.${level} sets a mode no contract describes — the renderer would ignore it and fall back`).toBeDefined()
        })

        it(`${level} supplies every field the renderer reads`, () => {
          for (const key of contract?.required ?? []) {
            expect(cfg, `${module}.${level} is missing "${key}" — the renderer will fall back to its default and this level will be identical to the others`).toHaveProperty(key)
          }
        })

        it(`${level} has no keys the renderer ignores`, () => {
          const known = new Set([...(contract?.required ?? []), ...(contract?.optional ?? [])])
          const stray = Object.keys(cfg ?? {}).filter((k) => !known.has(k))
          expect(stray, `${module}.${level} sets ${JSON.stringify(stray)}, which no renderer reads — likely a typo that silently does nothing`).toEqual([])
        })
      }

      it('every level is actually different', () => {
        const seen = levels.map((l) => JSON.stringify(PUZZLE_CONFIGS[module]?.[l]))
        expect(new Set(seen).size, `${module} has byte-identical levels — the ladder is cosmetic`).toBe(levels.length)
      })
    })
  }
})

describe('level list [CG-FR-1.2] [CG-FR-2.4]', () => {
  const locales = { zh, en } as Record<string, { level: Record<string, string> }>
  const renderers = [...new Set(Object.values(MODULE_RENDERER_MAP))]
  const keyExists = (locale: string, key: string) =>
    typeof locales[locale].level[key.replace(/^level\./, '')] === 'string'

  it('every module lists L1..Ln with no gaps, in order', () => {
    for (const r of renderers) {
      const ids = levelIdsFor(r)
      expect(ids, `${r}: level list must be L1..L${ids.length} — a gap would show a card with no puzzle behind it`)
        .toEqual(ids.map((_, i) => `L${i + 1}`))
    }
  })

  it('geometry keeps its three tangram tiers even though it has no config table', () => {
    expect(levelIdsFor('geometry')).toEqual(['L1', 'L2', 'L3'])
  })

  it('modules without a new mode still show exactly L1–L3', () => {
    for (const r of renderers.filter((x) => !(x in MODE_CONTRACTS))) {
      expect(levelIdsFor(r), `${r} unexpectedly grew or lost levels`).toEqual(['L1', 'L2', 'L3'])
    }
  })

  it('every level has a card title and age band, in both languages', () => {
    for (const r of renderers) {
      for (const id of levelIdsFor(r)) {
        const meta = levelMetaFor(r, id)
        expect(meta, `${r}.${id} has no card metadata — its card would silently read "Challenge Master"`).toBeDefined()
        for (const locale of Object.keys(locales)) {
          expect(keyExists(locale, meta!.titleKey), `${locale} is missing ${meta!.titleKey}`).toBe(true)
          expect(keyExists(locale, meta!.ageKey), `${locale} is missing ${meta!.ageKey}`).toBe(true)
          // PuzzlePage's subtitle is t('level.' + id).
          expect(keyExists(locale, `level.${id}`), `${locale} is missing level.${id}`).toBe(true)
        }
      }
    }
  })
})

describe('PUZZLE_CONFIGS playability', () => {
  it('equation: the answer is reachable from the options', () => {
    for (const level of LEVELS) {
      const c = PUZZLE_CONFIGS.equation[level] as {
        leftSide: number[]; rightSide: number[]; unknown: number
        unknownSide: 'left' | 'right'; options: number[]
      }
      expect(Array.isArray(c.rightSide), `${level}.rightSide must be an array — BalanceScale spreads it`).toBe(true)
      expect(c.options, `equation ${level}: correct answer ${c.unknown} is not among the options, so the level cannot be completed`).toContain(c.unknown)

      const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)
      const left = sum(c.leftSide) + (c.unknownSide === 'left' ? c.unknown : 0)
      const right = sum(c.rightSide) + (c.unknownSide === 'right' ? c.unknown : 0)
      expect(left, `equation ${level}: the scale does not balance with the stated answer`).toBe(right)
    }
  })

  it('sequence: blanks are valid indices and every answer is offered', () => {
    for (const level of LEVELS) {
      const c = PUZZLE_CONFIGS.sequence[level] as { sequence: number[]; blanks: number[]; options: number[] }
      expect(Array.isArray(c.blanks), `${level}.blanks must be an array of indices — NumberTrain does new Set(blanks)`).toBe(true)
      for (const i of c.blanks) {
        expect(i, `sequence ${level}: blank index ${i} is outside the sequence`).toBeLessThan(c.sequence.length)
        // NumberTrain uses sequence[i] as the answer key and renders '?' for blank indices,
        // so the true value must be stored there (a placeholder like -1 makes it unwinnable).
        expect(c.options, `sequence ${level}: answer ${c.sequence[i]} at index ${i} is not among the options`).toContain(c.sequence[i])
      }
    }
  })

  it('derivative: the target curve starts at 0, ends at the finish line, and never goes backwards', () => {
    for (const level of LEVELS) {
      const c = PUZZLE_CONFIGS.derivative[level] as { targetCurve: number[]; finishLine: number }
      expect(c.targetCurve.length).toBeGreaterThan(1)
      expect(c.targetCurve[0]).toBeCloseTo(0, 6)
      expect(c.targetCurve.at(-1)).toBeCloseTo(c.finishLine, 6)
      for (let i = 1; i < c.targetCurve.length; i++) {
        expect(c.targetCurve[i], `derivative ${level}: position decreases at sample ${i} — the car would have to reverse`)
          .toBeGreaterThanOrEqual(c.targetCurve[i - 1])
      }
    }
  })

  it('symmetry: every level has a non-empty target to mirror', () => {
    for (const level of LEVELS) {
      const c = PUZZLE_CONFIGS.symmetry[level] as { targetPoints: number[][][]; tolerance: number }
      expect(c.targetPoints.length, `symmetry ${level}: empty target — there is nothing on screen to mirror`).toBeGreaterThan(0)
      for (const poly of c.targetPoints) {
        expect(poly.length).toBeGreaterThan(1)
        for (const [x, y] of poly) {
          // Coordinates are normalised 0-1 within the target half.
          expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThanOrEqual(1)
          expect(y).toBeGreaterThanOrEqual(0); expect(y).toBeLessThanOrEqual(1)
        }
      }
    }
  })

  it('matrix: the transform palette widens as levels get harder', () => {
    const counts = LEVELS.map((l) => (PUZZLE_CONFIGS.matrix[l] as { allowedTransforms: string[] }).allowedTransforms.length)
    expect(counts[0]).toBeLessThan(counts[1])
    expect(counts[1]).toBeLessThan(counts[2])
  })

  it('probability: the flip count grows with difficulty', () => {
    const flips = LEVELS.map((l) => (PUZZLE_CONFIGS.probability[l] as { totalFlips: number }).totalFlips)
    expect(flips[0]).toBeLessThan(flips[1])
    expect(flips[1]).toBeLessThan(flips[2])
  })
})
