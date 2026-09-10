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
  matrix: {
    L1: { maxSteps: 3, allowedTransforms: ['rotate90'] },
    L2: { maxSteps: 5, allowedTransforms: ['rotate90', 'flipH'] },
    L3: { maxSteps: 8, allowedTransforms: ['rotate90', 'flipH', 'flipV', 'transpose'] },
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
