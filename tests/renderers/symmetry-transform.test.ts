/**
 * Tests for the symmetry renderer's translate and rotate games (PRD-content-gaps FR-2, tagged
 * CG-FR-2.x so they don't collide with the original PRD's FR-1 symmetry tests).
 *
 * The playability blocks run the REAL level configs through the REAL target builder and the REAL
 * match check (`checkMatch`), with a realistically dense "drawing" — not a private re-model.
 * Each positive check has a negative control next to it, so a check that always says yes fails.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  toFrame,
  rotatePoint,
  rotatedCopies,
  transformTargets,
  expandStrokes,
  isPlayableTransformRound,
  parseTransform,
  transformTypeOf,
  checkMatch,
  parsePuzzle,
} from '../../src/renderers/symmetry/symmetry.utils'
import type { Point, Stroke, TransformRound } from '../../src/renderers/symmetry/types'
import { PUZZLE_CONFIGS } from '../../src/pages/puzzleConfigs'
import { ADVENTURES } from '../../src/data/adventures'

/** A landscape laptop, and a portrait phone — the square frame must work on both. */
const SCREENS: Array<[number, number]> = [[800, 500], [360, 640]]

/** Turn a polyline into what a finger actually produces: a point every few pixels. */
function densify(poly: Point[], step = 3): Point[] {
  const out: Point[] = []
  for (let i = 0; i < poly.length - 1; i++) {
    const a = poly[i]
    const b = poly[i + 1]
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / step))
    for (let k = 0; k < n; k++) out.push({ x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n })
  }
  out.push(poly[poly.length - 1])
  return out
}
const draw = (polys: Point[][]): Stroke[] => polys.map((p) => ({ points: densify(p), hue: 0 }))

function distToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

describe('geometry helpers [CG-FR-2.1]', () => {
  it('toFrame maps the unit square onto the largest centred square', () => {
    expect(toFrame(0.5, 0.5, 400, 300)).toEqual({ x: 200, y: 150 })
    expect(toFrame(0, 0, 400, 300)).toEqual({ x: 50, y: 0 })
    expect(toFrame(1, 1, 400, 300)).toEqual({ x: 350, y: 300 })
  })

  it('rotatePoint: a full turn is the identity, a quarter turn is a quarter turn', () => {
    const c = { x: 10, y: 10 }
    const p = { x: 20, y: 10 }
    const full = rotatePoint(p, c, Math.PI * 2)
    expect(full.x).toBeCloseTo(20)
    expect(full.y).toBeCloseTo(10)
    const quarter = rotatePoint(p, c, Math.PI / 2)
    expect(quarter.x).toBeCloseTo(10)
    expect(quarter.y).toBeCloseTo(20)
  })

  it('rotatedCopies makes order − 1 copies of each stroke', () => {
    const strokes: Stroke[] = [{ points: [{ x: 1, y: 2 }], hue: 0 }, { points: [{ x: 3, y: 4 }], hue: 0 }]
    expect(rotatedCopies(strokes, 4, 100, 100)).toHaveLength(6)
    expect(rotatedCopies(strokes, 1, 100, 100)).toHaveLength(0)
  })

  it('translate: the target is the shown shape moved by exactly the vector', () => {
    const round: TransformRound = { targetPoints: [[[0.1, 0.2], [0.3, 0.4]]], vector: [0.5, 0.25] }
    const { shown, target } = transformTargets('translate', round, 400, 400)
    expect(target[0][0].x - shown[0][0].x).toBeCloseTo(200)
    expect(target[0][0].y - shown[0][0].y).toBeCloseTo(100)
  })

  it('rotate: the target holds `order` copies, all the same distance from the centre', () => {
    const round: TransformRound = { targetPoints: [[[0.5, 0.2], [0.7, 0.3]]], rotationalOrder: 3 }
    const { target } = transformTargets('rotate', round, 300, 300)
    expect(target).toHaveLength(3)
    const r = target.map((poly) => Math.hypot(poly[0].x - 150, poly[0].y - 150))
    expect(r[1]).toBeCloseTo(r[0])
    expect(r[2]).toBeCloseTo(r[0])
  })

  it('expandStrokes adds live copies only for rotate', () => {
    const s: Stroke[] = [{ points: [{ x: 1, y: 1 }], hue: 0 }]
    const round: TransformRound = { targetPoints: [[[0, 0], [1, 1]]], rotationalOrder: 4, vector: [0.1, 0] }
    expect(expandStrokes('rotate', s, round, 100, 100)).toHaveLength(4)
    expect(expandStrokes('translate', s, round, 100, 100)).toHaveLength(1)
  })

  it('isPlayableTransformRound rejects rounds a child could not finish', () => {
    const shape = [[[0.1, 0.1], [0.2, 0.2]]]
    expect(isPlayableTransformRound('translate', { targetPoints: shape, vector: [0.5, 0] })).toBe(true)
    expect(isPlayableTransformRound('translate', { targetPoints: shape, vector: [0.95, 0] }), 'moves off the board').toBe(false)
    expect(isPlayableTransformRound('translate', { targetPoints: shape, vector: [0, 0] }), 'does not move').toBe(false)
    expect(isPlayableTransformRound('translate', { targetPoints: shape }), 'no vector').toBe(false)
    expect(isPlayableTransformRound('rotate', { targetPoints: shape, rotationalOrder: 5 }), 'order outside 2–4').toBe(false)
    expect(isPlayableTransformRound('rotate', { targetPoints: [], rotationalOrder: 2 }), 'empty').toBe(false)
    expect(isPlayableTransformRound('rotate', null)).toBe(false)
  })

  it('transformTypeOf defaults to the mirror game', () => {
    expect(transformTypeOf({})).toBe('reflect')
    expect(transformTypeOf({ transformType: 'spin' })).toBe('reflect')
    expect(transformTypeOf({ transformType: 'rotate' })).toBe('rotate')
    expect(transformTypeOf({ data: { transformType: 'translate' } })).toBe('translate')
  })
})

describe('symmetry L4 (translate) is playable — real config, real check [CG-FR-2.2] [CG-FR-2.4]', () => {
  const cfg = PUZZLE_CONFIGS.symmetry.L4 as { transformType: string; rounds: TransformRound[]; tolerance: number }
  const parsed = parseTransform(cfg)

  it('is a translate level with at least 2 rounds, none dropped by the parser', () => {
    expect(cfg.transformType).toBe('translate')
    expect(cfg.rounds.length).toBeGreaterThanOrEqual(2)
    expect(parsed.rounds, 'a round was dropped as unplayable, so the level would quietly shrink').toEqual(cfg.rounds)
  })

  it('every round is different (QA-10)', () => {
    expect(new Set(cfg.rounds.map((r) => JSON.stringify(r))).size).toBe(cfg.rounds.length)
  })

  for (const [w, h] of SCREENS) {
    it(`${w}×${h}: drawing the moved shape wins, every round`, () => {
      for (const round of cfg.rounds) {
        const { target } = transformTargets('translate', round, w, h)
        expect(checkMatch(draw(target), target, cfg.tolerance, w, h)).toBe(true)
      }
    })

    it(`${w}×${h}: tracing the ORIGINAL shape does not win (negative control)`, () => {
      for (const round of cfg.rounds) {
        const { shown, target } = transformTargets('translate', round, w, h)
        expect(checkMatch(draw(shown), target, cfg.tolerance, w, h), 'tracing the blue shape in place would count').toBe(false)
      }
    })

    it(`${w}×${h}: an empty board does not win — no round starts solved`, () => {
      for (const round of cfg.rounds) {
        const { target } = transformTargets('translate', round, w, h)
        expect(checkMatch([], target, cfg.tolerance, w, h)).toBe(false)
      }
    })
  }

  it('the destination is farther than the tolerance from every edge of the original shape', () => {
    const s = 1000 // square board, so normalised units scale exactly
    for (const round of cfg.rounds) {
      const { shown, target } = transformTargets('translate', round, s, s)
      for (const poly of target) {
        for (const p of poly) {
          for (const src of shown) {
            for (let i = 0; i < src.length - 1; i++) {
              expect(distToSegment(p, src[i], src[i + 1]) / s).toBeGreaterThan(cfg.tolerance)
            }
          }
        }
      }
    }
  })
})

describe('symmetry L5 (rotate) is playable — real config, real check [CG-FR-2.3] [CG-FR-2.4]', () => {
  const cfg = PUZZLE_CONFIGS.symmetry.L5 as { transformType: string; rounds: TransformRound[]; tolerance: number }
  const parsed = parseTransform(cfg)

  it('is a rotate level whose rounds cover orders 2, 3 and 4, none dropped by the parser', () => {
    expect(cfg.transformType).toBe('rotate')
    expect(cfg.rounds.map((r) => r.rotationalOrder).sort()).toEqual([2, 3, 4])
    expect(parsed.rounds).toEqual(cfg.rounds)
  })

  it('every round is different (QA-10)', () => {
    expect(new Set(cfg.rounds.map((r) => JSON.stringify(r))).size).toBe(cfg.rounds.length)
  })

  for (const [w, h] of SCREENS) {
    it(`${w}×${h}: tracing ONE blade wins, because the board adds the turned copies`, () => {
      for (const round of cfg.rounds) {
        const { target } = transformTargets('rotate', round, w, h)
        const oneBlade = draw(round.targetPoints.map((poly) => poly.map(([x, y]) => toFrame(x, y, w, h))))
        const withCopies = expandStrokes('rotate', oneBlade, round, w, h)
        expect(checkMatch(withCopies, target, cfg.tolerance, w, h), `order ${round.rotationalOrder}`).toBe(true)
      }
    })

    it(`${w}×${h}: one blade WITHOUT the copies does not win (negative control)`, () => {
      for (const round of cfg.rounds) {
        const { target } = transformTargets('rotate', round, w, h)
        const oneBlade = draw(round.targetPoints.map((poly) => poly.map(([x, y]) => toFrame(x, y, w, h))))
        expect(
          checkMatch(oneBlade, target, cfg.tolerance, w, h),
          `order ${round.rotationalOrder}: a single blade already covers the figure, so the copies prove nothing`,
        ).toBe(false)
      }
    })

    it(`${w}×${h}: an empty board does not win`, () => {
      for (const round of cfg.rounds) {
        const { target } = transformTargets('rotate', round, w, h)
        expect(checkMatch([], target, cfg.tolerance, w, h)).toBe(false)
      }
    })
  }
})

describe('the mirror game is untouched [CG-FR-2.1] [CG-NFR-1]', () => {
  it('symmetry L1–L3 are byte-for-byte what they were at the baseline (1ab196e)', () => {
    expect(PUZZLE_CONFIGS.symmetry.L1).toEqual({
      targetPoints: [[[0.2, 0.85], [0.5, 0.25], [0.8, 0.85]]],
      mirrorAxis: 'vertical',
      tolerance: 0.22,
    })
    expect(PUZZLE_CONFIGS.symmetry.L2).toEqual({
      targetPoints: [
        [[0.2, 0.85], [0.2, 0.5], [0.5, 0.22], [0.8, 0.5], [0.8, 0.85], [0.2, 0.85]],
        [[0.42, 0.85], [0.42, 0.62], [0.58, 0.62], [0.58, 0.85]],
      ],
      mirrorAxis: 'vertical',
      tolerance: 0.18,
    })
    expect(PUZZLE_CONFIGS.symmetry.L3).toEqual({
      targetPoints: [
        [[0.5, 0.8], [0.22, 0.72], [0.14, 0.48], [0.34, 0.38], [0.5, 0.5], [0.5, 0.8]],
        [[0.5, 0.5], [0.3, 0.3], [0.18, 0.16]],
        [[0.5, 0.5], [0.5, 0.2]],
      ],
      mirrorAxis: 'vertical',
      tolerance: 0.14,
    })
  })

  it('L1–L3 and every adventure symmetry stage still route to the mirror game', () => {
    for (const l of ['L1', 'L2', 'L3']) expect(transformTypeOf(PUZZLE_CONFIGS.symmetry[l])).toBe('reflect')
    const stages = ADVENTURES.flatMap((a) => a.stages).filter((s) => s.renderer_id === 'symmetry')
    expect(stages.length).toBeGreaterThan(0)
    for (const s of stages) expect(transformTypeOf(s.puzzle as Record<string, unknown>)).toBe('reflect')
  })

  it('parsePuzzle (the mirror parser) reads L1 exactly as before', () => {
    const p = parsePuzzle(PUZZLE_CONFIGS.symmetry.L1)
    expect(p.mirrorAxis).toBe('vertical')
    expect(p.tolerance).toBe(0.22)
    expect(p.targetPoints).toHaveLength(1)
  })
})

describe('child-safety wording [CG-NFR-2]', () => {
  it('the new game shows no ❌', () => {
    const src = readFileSync(join(__dirname, '../../src/renderers/symmetry/TransformCanvas.tsx'), 'utf8')
    expect(src).not.toContain('❌')
  })
})
