/**
 * Type definitions for the Derivative SpeedController renderer.
 *
 * The puzzle data describes a speed-control challenge where the child
 * adjusts a car's speed in real time to match a target position-vs-time
 * curve, building intuition for rates of change (derivatives).
 */

/**
 * Puzzle data embedded in `puzzle.data`.
 *
 * - `targetCurve`: array of position values sampled at even time intervals
 *   (length determines the number of samples over the duration)
 * - `duration`: total time for the challenge in seconds
 * - `finishLine`: the x-position the car must reach
 */
export interface DerivativePuzzleData {
  targetCurve: number[]
  duration: number
  finishLine: number
}

/** A single sample in the position history. */
export interface PositionSample {
  time: number
  position: number
}

/** Current phase of the challenge. */
export type Phase = 'ready' | 'running' | 'finished'

/** Internal game state tracked by the SpeedController component. */
export interface SpeedControllerState {
  /** Current car position along the road (0 to finishLine). */
  carPosition: number
  /** Current speed (0 to maxSpeed). */
  speed: number
  /** Elapsed time in seconds. */
  time: number
  /** Recorded position history for the drawn curve. */
  positionHistory: PositionSample[]
  /** Target curve data points. */
  targetCurve: number[]
  /** Current game phase. */
  phase: Phase
  /** Whether the slider thumb is being dragged. */
  isDragging: boolean
}
