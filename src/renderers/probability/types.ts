/**
 * Type definitions for the Probability CoinFlip renderer.
 *
 * The puzzle data describes a coin-flip experiment where the child
 * flips coins, tracks results, makes predictions, and discovers
 * the law of large numbers.
 */

/**
 * Puzzle data embedded in `puzzle.data`.
 *
 * - `totalFlips`: number of flips per experiment round (e.g. 10, 20, 50)
 * - `question`: the prediction question shown after reaching totalFlips
 * - `type`: 'coin' for now; 'dice' reserved for future expansion
 */
export interface ProbabilityPuzzleData {
  totalFlips: number
  question: { zh: string; en: string }
  type: 'coin' | 'dice'
}

/** A single flip result. */
export type FlipResult = 'H' | 'T'

/** The current phase of the experiment. */
export type Phase = 'flip' | 'predict' | 'result'

/**
 * Internal game state tracked by the CoinFlip component.
 */
export interface CoinFlipState {
  /** Ordered history of flip results. */
  flipHistory: FlipResult[]
  /** Whether a flip animation is currently playing. */
  isFlipping: boolean
  /** Current game phase. */
  phase: Phase
  /** Child's prediction (number of heads they expect). */
  prediction: number | null
  /** Target number of flips for this experiment round. */
  totalFlips: number
  /** Number of completed experiment rounds (onComplete fires at 3). */
  experimentsCompleted: number
  /** Whether the onAha callback has already fired this session. */
  ahaTriggered: boolean
}

/** Confetti particle for milestone celebrations. */
export interface ConfettiParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  life: number
  maxLife: number
  rotation: number
  rotationSpeed: number
}
