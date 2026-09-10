/**
 * Pure logic functions extracted from MirrorCanvas for testability.
 *
 * These functions handle symmetry geometry, stroke measurement, and
 * match validation — all without any React or canvas dependency.
 */
import type {
  Point,
  Stroke,
  SymmetryPuzzleData,
  MirrorAxis,
  TransformType,
  MovingTransform,
  TransformRound,
  TransformPuzzleData,
} from './types'

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

/** How many successful rounds before onComplete fires. */
export const ROUNDS_TO_COMPLETE = 3

/** Minimum total stroke length (in px) before we evaluate correctness. */
export const MIN_DRAW_LENGTH = 60

/** Default tolerance when puzzle doesn't specify one. */
export const DEFAULT_TOLERANCE = 0.18

/* ------------------------------------------------------------------ */
/*  Pure helpers                                                      */
/* ------------------------------------------------------------------ */

/** Parse and validate puzzle data with sensible defaults. */
export function parsePuzzle(puzzle: Record<string, unknown>): SymmetryPuzzleData {
  const data = (puzzle.data ?? puzzle) as Partial<SymmetryPuzzleData>
  return {
    targetPoints: Array.isArray(data.targetPoints) ? data.targetPoints : [],
    mirrorAxis: data.mirrorAxis === 'horizontal' ? 'horizontal' : 'vertical',
    tolerance: typeof data.tolerance === 'number' ? data.tolerance : DEFAULT_TOLERANCE,
  }
}

/** Mirror a point across the given axis (in canvas-pixel space). */
export function mirrorPoint(p: Point, axis: MirrorAxis, w: number, h: number): Point {
  if (axis === 'vertical') return { x: w - p.x, y: p.y }
  return { x: p.x, y: h - p.y }
}

/** Total Euclidean length of a stroke. */
export function strokeLength(pts: Point[]): number {
  let len = 0
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x
    const dy = pts[i].y - pts[i - 1].y
    len += Math.sqrt(dx * dx + dy * dy)
  }
  return len
}

/**
 * Convert normalised target polylines (0-1 space, relative to the target
 * half) into canvas-pixel polylines placed on the left/top half.
 */
export function targetToCanvas(
  targetPoints: number[][][],
  axis: MirrorAxis,
  w: number,
  h: number,
): Point[][] {
  const halfW = axis === 'vertical' ? w / 2 : w
  const halfH = axis === 'vertical' ? h : h / 2
  return targetPoints.map((polyline) =>
    polyline.map(([nx, ny]) => ({
      x: nx * halfW,
      y: ny * halfH,
    })),
  )
}

/**
 * Rough coverage check: do the user's mirrored strokes cover the target
 * shape within the given tolerance?
 *
 * For L1 (no target), we simply check the user drew enough.
 */
export function checkMatch(
  strokes: Stroke[],
  targetPolylines: Point[][],
  tolerance: number,
  w: number,
  h: number,
): boolean {
  // L1 mode: no target — just check user drew a minimum amount
  if (targetPolylines.length === 0) {
    const totalLen = strokes.reduce((s, st) => s + strokeLength(st.points), 0)
    return totalLen > MIN_DRAW_LENGTH
  }

  // Sample points along each target polyline and check proximity to any user
  // stroke point.
  const tolPx = tolerance * Math.min(w, h)
  const tolSq = tolPx * tolPx

  // Collect all user stroke points into a flat array for proximity search
  const allPts: Point[] = strokes.flatMap((s) => s.points)
  if (allPts.length === 0) return false

  let coveredSamples = 0
  let totalSamples = 0

  for (const poly of targetPolylines) {
    for (let i = 0; i < poly.length; i++) {
      totalSamples++
      const tp = poly[i]
      for (const up of allPts) {
        const dx = up.x - tp.x
        const dy = up.y - tp.y
        if (dx * dx + dy * dy <= tolSq) {
          coveredSamples++
          break
        }
      }
    }
  }

  // Require at least 55% of target sample points to be covered
  return totalSamples > 0 && coveredSamples / totalSamples >= 0.55
}

/* ------------------------------------------------------------------ */
/*  Translate / rotate (CG-FR-2)                                      */
/* ------------------------------------------------------------------ */

export const DEFAULT_TRANSFORM_TOLERANCE = 0.12

/** Which game a puzzle plays. Anything other than translate/rotate is the original mirror game. */
export function transformTypeOf(puzzle: Record<string, unknown>): TransformType {
  const t = ((puzzle.data ?? puzzle) as { transformType?: unknown }).transformType
  return t === 'translate' || t === 'rotate' ? t : 'reflect'
}

/**
 * Map a normalised point onto the largest square centred on the canvas. Using a square (not the
 * full width × height) keeps angles and distances honest on a non-square screen — otherwise a
 * "90° turn" of a shape would also squash it.
 */
export function toFrame(nx: number, ny: number, w: number, h: number): Point {
  const s = Math.min(w, h)
  return { x: w / 2 + (nx - 0.5) * s, y: h / 2 + (ny - 0.5) * s }
}

/** Rotate `p` about `c` by `angle` radians (clockwise on screen, since y points down). */
export function rotatePoint(p: Point, c: Point, angle: number): Point {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const dx = p.x - c.x
  const dy = p.y - c.y
  return { x: c.x + dx * cos - dy * sin, y: c.y + dx * sin + dy * cos }
}

/** The other `order - 1` turned copies of each stroke, around the canvas centre. */
export function rotatedCopies(strokes: Stroke[], order: number, w: number, h: number): Stroke[] {
  const c = { x: w / 2, y: h / 2 }
  const out: Stroke[] = []
  for (let k = 1; k < order; k++) {
    const a = (k * Math.PI * 2) / order
    for (const s of strokes) out.push({ hue: s.hue, points: s.points.map((p) => rotatePoint(p, c, a)) })
  }
  return out
}

/**
 * What the canvas shows, and what the child's drawing must cover.
 *
 * - translate: `shown` is the shape where it starts; `target` is the same shape moved by
 *   `vector`. The target is never drawn — the child has to work out where it lands.
 * - rotate: the whole k-fold figure is both shown (dotted) and the target, like the mirror game.
 */
export function transformTargets(
  type: MovingTransform,
  round: TransformRound,
  w: number,
  h: number,
): { shown: Point[][]; target: Point[][] } {
  const base = round.targetPoints.map((poly) => poly.map(([x, y]) => toFrame(x, y, w, h)))
  if (type === 'translate') {
    const [dx, dy] = round.vector ?? [0, 0]
    const target = round.targetPoints.map((poly) => poly.map(([x, y]) => toFrame(x + dx, y + dy, w, h)))
    return { shown: base, target }
  }
  const order = round.rotationalOrder ?? 1
  const c = { x: w / 2, y: h / 2 }
  const target: Point[][] = []
  for (let k = 0; k < order; k++) {
    const a = (k * Math.PI * 2) / order
    for (const poly of base) target.push(poly.map((p) => rotatePoint(p, c, a)))
  }
  return { shown: target, target }
}

/** The child's strokes as the board displays them: rotate adds the live turned copies. */
export function expandStrokes(
  type: MovingTransform,
  strokes: Stroke[],
  round: TransformRound,
  w: number,
  h: number,
): Stroke[] {
  if (type !== 'rotate') return strokes
  return [...strokes, ...rotatedCopies(strokes, round.rotationalOrder ?? 1, w, h)]
}

const inUnit = (v: number) => v >= 0 && v <= 1

/**
 * A round the child can actually finish: every point on the board, and — after moving or
 * turning — still on the board. A translation off the edge would ask the child to draw where
 * they cannot reach.
 */
export function isPlayableTransformRound(type: MovingTransform, r: unknown): r is TransformRound {
  if (typeof r !== 'object' || r === null) return false
  const { targetPoints, vector, rotationalOrder } = r as Partial<TransformRound>
  if (!Array.isArray(targetPoints) || targetPoints.length === 0) return false
  const pointsOk = targetPoints.every(
    (poly) =>
      Array.isArray(poly) &&
      poly.length >= 2 &&
      poly.every((pt) => Array.isArray(pt) && pt.length === 2 && inUnit(pt[0]) && inUnit(pt[1])),
  )
  if (!pointsOk) return false

  if (type === 'translate') {
    if (!Array.isArray(vector) || vector.length !== 2) return false
    const [dx, dy] = vector
    if (dx === 0 && dy === 0) return false
    return targetPoints.every((poly) => poly.every(([x, y]) => inUnit(x + dx) && inUnit(y + dy)))
  }

  if (rotationalOrder !== 2 && rotationalOrder !== 3 && rotationalOrder !== 4) return false
  return targetPoints.every((poly) => poly.every(([x, y]) => Math.hypot(x - 0.5, y - 0.5) <= 0.5))
}

const DEFAULT_TRANSFORM_ROUNDS: Record<MovingTransform, TransformRound[]> = {
  translate: [{ targetPoints: [[[0.1, 0.66], [0.2, 0.46], [0.3, 0.66], [0.1, 0.66]]], vector: [0.55, 0] }],
  rotate: [{ targetPoints: [[[0.5, 0.36], [0.5, 0.16], [0.68, 0.24], [0.6, 0.38]]], rotationalOrder: 4 }],
}

/** Parse a translate/rotate puzzle, dropping rounds that could not be finished. */
export function parseTransform(puzzle: Record<string, unknown>): TransformPuzzleData {
  const raw = (puzzle.data ?? puzzle) as Partial<TransformPuzzleData>
  const detected = transformTypeOf(puzzle)
  const type: MovingTransform = detected === 'reflect' ? 'translate' : detected
  const rounds = Array.isArray(raw.rounds) ? raw.rounds.filter((r) => isPlayableTransformRound(type, r)) : []
  return {
    transformType: type,
    rounds: rounds.length > 0 ? rounds : DEFAULT_TRANSFORM_ROUNDS[type],
    tolerance: typeof raw.tolerance === 'number' ? raw.tolerance : DEFAULT_TRANSFORM_TOLERANCE,
  }
}
