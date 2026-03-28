/**
 * Pure-logic utility functions extracted from SpeedController.
 *
 * These functions handle scoring, curve sampling, default curve generation,
 * value clamping, and puzzle data parsing for the Derivative renderer.
 */
import type { DerivativePuzzleData, PositionSample } from './types'

/** Maximum speed the child can set. */
export const MAX_SPEED = 100

/** Threshold for area-difference scoring (normalised 0-1). */
export const MATCH_THRESHOLD = 0.12

/** Clamp a value between min and max. */
export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

/** Generate a pleasant default target curve (smooth acceleration then cruise). */
export function generateDefaultCurve(): number[] {
  const points: number[] = []
  const n = 100
  for (let i = 0; i <= n; i++) {
    const t = i / n
    // Ease-in then ease-out shape: smooth S-curve
    const pos = 100 * (3 * t * t - 2 * t * t * t)
    points.push(pos)
  }
  return points
}

/** Sample the target curve at a given normalised time (0-1). */
export function sampleTarget(curve: number[], tNorm: number): number {
  if (curve.length === 0) return 0
  const idx = tNorm * (curve.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.min(lo + 1, curve.length - 1)
  const frac = idx - lo
  return curve[lo] * (1 - frac) + curve[hi] * frac
}

/** Compute normalised area difference between drawn and target curves (0-1). */
export function computeScore(
  history: PositionSample[],
  targetCurve: number[],
  duration: number,
  finishLine: number,
): number {
  if (history.length < 2) return 1

  let totalDiff = 0
  const steps = 200
  for (let i = 0; i <= steps; i++) {
    const tNorm = i / steps
    const tSec = tNorm * duration

    // Find drawn position at this time via linear interpolation
    let drawnPos = 0
    if (tSec <= history[0].time) {
      drawnPos = history[0].position
    } else if (tSec >= history[history.length - 1].time) {
      drawnPos = history[history.length - 1].position
    } else {
      for (let j = 1; j < history.length; j++) {
        if (history[j].time >= tSec) {
          const prev = history[j - 1]
          const curr = history[j]
          const f = (tSec - prev.time) / (curr.time - prev.time)
          drawnPos = prev.position + f * (curr.position - prev.position)
          break
        }
      }
    }

    const targetPos = sampleTarget(targetCurve, tNorm)
    totalDiff += Math.abs(drawnPos - targetPos) / finishLine
  }

  return totalDiff / (steps + 1)
}

/** Parse raw puzzle record into typed DerivativePuzzleData with defaults. */
export function parsePuzzleData(puzzle: Record<string, unknown>): DerivativePuzzleData {
  const d = (puzzle.data ?? puzzle) as Partial<DerivativePuzzleData>
  return {
    targetCurve: Array.isArray(d.targetCurve) ? d.targetCurve : generateDefaultCurve(),
    duration: typeof d.duration === 'number' ? d.duration : 10,
    finishLine: typeof d.finishLine === 'number' ? d.finishLine : 100,
  }
}
