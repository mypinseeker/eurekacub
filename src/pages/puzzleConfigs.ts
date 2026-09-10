/**
 * Level configuration for each renderer, keyed by module then level.
 *
 * Lives in its own module (rather than beside the page component) so the page file only exports
 * a component — react-refresh cannot fast-refresh a module that mixes the two — and so the
 * contract tests in tests/puzzle-configs.test.ts can import it without pulling in the router.
 */
/**
 * Sample a position curve at `n + 1` evenly spaced time steps over t ∈ [0, 1].
 * SpeedController expects the series to start at 0 and end at the finish line.
 */
/**
 * The pixel-art starting picture, shared by all three matrix levels.
 *
 * It has no symmetry at all — the four rotations and their four mirrors are eight different
 * pictures. That matters: the level before this one used a left-right symmetric glyph, which
 * turned flipH into a no-op the child could press to "win" without thinking.
 */
const GLYPH: number[][] = [
  [0, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 0, 0, 0, 0, 0, 0],
  [0, 1, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 0, 0, 0],
  [0, 1, 0, 0, 0, 0, 0, 0],
  [0, 1, 0, 0, 0, 0, 0, 0],
  [0, 1, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
]

const curve = (fn: (t: number) => number, n = 40): number[] =>
  Array.from({ length: n + 1 }, (_, i) => fn(i / n))

/**
 * Level-aware puzzle configurations for each renderer.
 * L1 = easy/guided, L2 = standard, L3 = challenge
 *
 * ⚠️ Every key here must match what the target renderer actually reads off `puzzle.data`.
 * Renderers fall back to their own defaults for unknown/missing fields, so a misspelled key
 * does not fail loudly — it silently makes all three levels identical. That is exactly what
 * had happened to symmetry / derivative / matrix / probability before 2026-09-07.
 */
export const PUZZLE_CONFIGS: Record<string, Record<string, Record<string, unknown>>> = {
  // MirrorCanvas reads `{ targetPoints, mirrorAxis, tolerance }`. `complexity`/`showGrid` were
  // never read and `targetPoints` was never supplied, so every level showed an EMPTY target half
  // — there was nothing to mirror at any difficulty. Points are polylines of [x, y] in normalised
  // 0-1 space within the target half; tolerance loosens for younger/earlier levels.
  symmetry: {
    // a plain peak — two strokes, very forgiving
    L1: {
      targetPoints: [[[0.2, 0.85], [0.5, 0.25], [0.8, 0.85]]],
      mirrorAxis: 'vertical',
      tolerance: 0.22,
    },
    // a little house: outline plus a separate door stroke
    L2: {
      targetPoints: [
        [[0.2, 0.85], [0.2, 0.5], [0.5, 0.22], [0.8, 0.5], [0.8, 0.85], [0.2, 0.85]],
        [[0.42, 0.85], [0.42, 0.62], [0.58, 0.62], [0.58, 0.85]],
      ],
      mirrorAxis: 'vertical',
      tolerance: 0.18,
    },
    // a butterfly wing plus antenna — more vertices, tighter tolerance
    L3: {
      targetPoints: [
        [[0.5, 0.8], [0.22, 0.72], [0.14, 0.48], [0.34, 0.38], [0.5, 0.5], [0.5, 0.8]],
        [[0.5, 0.5], [0.3, 0.3], [0.18, 0.16]],
        [[0.5, 0.5], [0.5, 0.2]],
      ],
      mirrorAxis: 'vertical',
      tolerance: 0.14,
    },
  },
  fraction: {
    L1: { targetSlices: 2, showGuides: true, tolerance: 20 },
    L2: { targetSlices: 4, showGuides: true, tolerance: 15 },
    L3: { targetSlices: 6, showGuides: false, tolerance: 10 },
    // "Same amount" (CG-FR-1). The left pizza comes cut and shaded; the child cuts the right one
    // finer and shades as much. Three rounds, three different pairs — the ones FR-1.2 names:
    // 1/2 = 2/4, 1/3 = 2/6, 2/4 = 4/8. The game never writes these out.
    L4: {
      mode: 'equivalence',
      rounds: [
        { given: [1, 2], cutInto: 4 },
        { given: [1, 3], cutInto: 6 },
        { given: [2, 4], cutInto: 8 },
      ],
      showGuides: true,
      tolerance: 15,
    },
  },
  geometry: {}, // geometry uses tangram.puzzles.ts — handled specially below
  // SpeedController reads `{ targetCurve, duration, finishLine, theme }`. `maxSpeed`/`curveType`
  // were never read and `targetCurve` was never supplied, so all three levels drew the renderer's
  // built-in S-curve — the levels were identical. `targetCurve` is a POSITION series (not speed)
  // sampled at even time steps, and must end at `finishLine`.
  derivative: {
    // constant speed — a straight ramp
    L1: { targetCurve: curve((t) => 100 * t), duration: 8, finishLine: 100, theme: 'car' },
    // steadily accelerating — the classic "speeding up" shape
    L2: { targetCurve: curve((t) => 100 * t * t), duration: 10, finishLine: 100, theme: 'rocket' },
    // fast → slow → fast; still monotonic, so the car never has to go backwards
    L3: { targetCurve: curve((t) => 100 * t + 12 * Math.sin(2 * Math.PI * t)), duration: 12, finishLine: 100, theme: 'swim' },
  },
  // BalanceScale reads `rightSide` as a number[] (it spreads it to weigh the pan), and needs
  // `options` to contain `unknown` — otherwise the right answer is not on screen and the level
  // is unwinnable. Both were wrong here: rightSide was a bare number (crashed on `[...rightSide]`)
  // and options was missing (fell back to a default that never contains the answer).
  // Reads as "leftSide + ? = rightSide" when unknownSide is 'left'.
  equation: {
    L1: { leftSide: [3, 2], rightSide: [8], unknown: 3, unknownSide: 'left', options: [1, 2, 3, 4, 5] },
    L2: { leftSide: [5, 3], rightSide: [12], unknown: 4, unknownSide: 'left', options: [2, 3, 4, 5, 6] },
    L3: { leftSide: [7, 4, 2], rightSide: [18], unknown: 5, unknownSide: 'left', options: [3, 4, 5, 6, 7] },
  },
  // PixelArt reads `allowedTransforms` (not `operations`) and derives the grid size from
  // `initialGrid`/`targetGrid` (it has no `gridSize` knob). With the old key names every level
  // silently fell back to the renderer default, which offers ALL four transforms — so L1 was
  // never actually easier than L3. `initialGrid`/`targetGrid` still use the renderer's built-in
  // artwork; only the transform palette and step budget differ per level.
  // PixelArt reads `{ initialGrid, targetGrid, allowedTransforms, maxSteps }`. Both grids used to
  // be omitted, and parsePuzzle() silently defaults BOTH of them to the same DEFAULT_GRID — so
  // every level shipped with the picture already sitting on its own target. That made L1
  // unsolvable (only rotate90 is allowed, returning to the start takes 4 turns, the cap was 3)
  // and L2/L3 winnable by pressing any single button, because DEFAULT_GRID is its own mirror.
  //
  // GLYPH is deliberately asymmetric: its eight rotations and reflections are eight distinct
  // pictures, so no transform is ever a no-op the way flipH was before.
  //
  // The transforms form the dihedral group of order 8, so no target is ever more than 3 moves
  // away — difficulty here cannot come from making the solution longer. It comes from the search
  // instead: the button palette widens (1 -> 2 -> 4 choices per move) while the spare-move budget
  // shrinks (2 -> 1 -> 1). L2 is the interesting one: its goal is GLYPH flipped top-to-bottom,
  // which would be one press of flipV, but flipV is not on the menu yet — the child has to find
  // it as rotate + flipH + rotate. tests/matrix-solvability.test.ts proves each of these against
  // the renderer's own applyTransform, not against a re-implementation.
  matrix: {
    L1: {
      initialGrid: GLYPH,
      targetGrid: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1],
        [0, 0, 0, 0, 1, 0, 0, 1],
        [0, 0, 0, 0, 1, 0, 0, 1],
        [0, 0, 0, 0, 1, 0, 0, 1],
        [0, 0, 0, 0, 0, 0, 0, 1],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
      ],
      allowedTransforms: ['rotate90'],
      maxSteps: 3,
    },
    L2: {
      initialGrid: GLYPH,
      targetGrid: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 0, 0],
      ],
      allowedTransforms: ['rotate90', 'flipH'],
      maxSteps: 4,
    },
    L3: {
      initialGrid: GLYPH,
      targetGrid: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 1],
        [0, 0, 0, 0, 1, 0, 0, 1],
        [0, 0, 0, 0, 1, 0, 0, 1],
        [0, 0, 0, 0, 1, 0, 0, 1],
        [0, 1, 1, 1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0],
      ],
      allowedTransforms: ['rotate90', 'flipH', 'flipV', 'transpose'],
      maxSteps: 3,
    },
  },
  // NumberTrain reads `{ sequence, blanks, options }`. `blanks` is an array of INDICES into
  // `sequence` (it becomes `new Set(blanks)`) — a bare count crashed it. `sequence` must hold the
  // TRUE value at each blank index, because that value is the answer key; the UI renders '?' for
  // any index in `blanks`, so the answer is never revealed. `options` must contain every answer.
  sequence: {
    // 2,4,6,?,10 → 8
    L1: { sequence: [2, 4, 6, 8, 10], blanks: [3], rule: '+2', options: [5, 7, 8, 9] },
    // 3,6,?,12,15,?,21 → 9 and 18
    L2: { sequence: [3, 6, 9, 12, 15, 18, 21], blanks: [2, 5], rule: '+3', options: [7, 9, 11, 18, 20] },
    // 1,1,2,3,?,8,?,? → 5, 13, 21
    L3: { sequence: [1, 1, 2, 3, 5, 8, 13, 21], blanks: [4, 6, 7], rule: 'fibonacci', options: [4, 5, 9, 13, 17, 21] },
  },
  // CoinFlip reads `totalFlips`. `experiments`/`flipsPerExperiment` were never read, so all three
  // levels ran the renderer's default flip count — the "50 flips" challenge level did not exist.
  probability: {
    L1: { totalFlips: 10 },
    L2: { totalFlips: 20 },
    L3: { totalFlips: 50 },
  },
}

/**
 * moduleId (m1–m8) → renderer registry id. Shared by the module page, which needs to know which
 * levels exist, and the puzzle page, which needs to know which renderer to mount.
 */
export const MODULE_RENDERER_MAP: Record<string, string> = {
  m1: 'symmetry',
  m2: 'fraction',
  m3: 'geometry',
  m4: 'derivative',
  m5: 'equation',
  m6: 'matrix',
  m7: 'sequence',
  m8: 'probability',
}

/** Geometry draws its levels from tangram presets rather than this table, so it has no keys here. */
const FIXED_LEVELS = ['L1', 'L2', 'L3']

/**
 * The levels a renderer offers, in play order, derived from PUZZLE_CONFIGS.
 *
 * The module page used to hard-code three cards, so a new mode (fraction L4, symmetry L4/L5) had
 * nowhere to appear. Deriving the list from this table makes adding a level a one-line config
 * change. It also makes rollback trivial: delete the entry and its card disappears.
 */
export function levelIdsFor(rendererId: string): string[] {
  const keys = Object.keys(PUZZLE_CONFIGS[rendererId] ?? {}).filter((k) => /^L\d+$/.test(k))
  if (keys.length === 0) return [...FIXED_LEVELS]
  return keys.sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)))
}

/** i18n keys for a level card's title and age band. */
export type LevelMeta = { titleKey: string; ageKey: string }

/** L1–L3 are the difficulty tiers every module shares. */
const BASE_LEVEL_META: Record<string, LevelMeta> = {
  L1: { titleKey: 'level.explorer', ageKey: 'level.age7' },
  L2: { titleKey: 'level.standard', ageKey: 'level.age8' },
  L3: { titleKey: 'level.challenge', ageKey: 'level.age10' },
}

/** L4+ are new modes, not harder tiers, so their card names the mode instead of a difficulty. */
const MODE_LEVEL_META: Record<string, Record<string, LevelMeta>> = {
  fraction: { L4: { titleKey: 'level.fractionSame', ageKey: 'level.age8' } },
  symmetry: {
    L4: { titleKey: 'level.symmetrySlide', ageKey: 'level.age8' },
    L5: { titleKey: 'level.symmetrySpin', ageKey: 'level.age9' },
  },
}

/**
 * Card title and age band for a level, or undefined when nobody wrote one.
 *
 * Returning undefined rather than a generic default is deliberate. A new level with no entry
 * would otherwise render as "Challenge Master" without complaint — the same silent fallback that
 * hid four broken modules in this file (see the header comment). The tests turn undefined into a
 * failure; the page still falls back so a child never sees a blank card.
 */
export function levelMetaFor(rendererId: string, levelId: string): LevelMeta | undefined {
  return MODE_LEVEL_META[rendererId]?.[levelId] ?? BASE_LEVEL_META[levelId]
}
