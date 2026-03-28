/**
 * Pure-logic utility functions extracted from BalanceScale.
 *
 * These functions handle tilt calculation, array summation,
 * color assignment, and rotation math for the Equation renderer.
 */
import { WEIGHT_COLORS, MAX_TILT_DEG, TILT_PER_UNIT } from './types'

/** Fulcrum center X (viewBox 400 wide). */
export const CX = 200

/** Beam rests on fulcrum tip Y. */
export const BEAM_Y = 200

/** Half-length of beam. */
export const BEAM_HALF = 150

/** Clamp a value between min and max. */
export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

/** Sum an array of numbers. */
export function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0)
}

/** Assign a color to a weight value deterministically. */
export function colorForValue(value: number, index: number): string {
  return WEIGHT_COLORS[(value + index) % WEIGHT_COLORS.length]
}

/**
 * Calculate beam tilt angle in degrees from weight difference.
 * Positive = tilts right-heavy (clockwise).
 */
export function calcTiltAngle(leftTotal: number, rightTotal: number): number {
  const diff = leftTotal - rightTotal
  return clamp(diff * TILT_PER_UNIT, -MAX_TILT_DEG, MAX_TILT_DEG)
}

/**
 * Compute the position of a point on the beam after rotation.
 * The beam rotates around (CX, BEAM_Y).
 */
export function rotatedPoint(
  offsetX: number,
  angle: number,
): { x: number; y: number } {
  const rad = (angle * Math.PI) / 180
  return {
    x: CX + offsetX * Math.cos(rad),
    y: BEAM_Y + offsetX * Math.sin(rad),
  }
}
