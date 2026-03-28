/**
 * Pure-logic utilities extracted from CoinFlip renderer.
 * Supports FR-8 (Probability / Law of Large Numbers).
 */
import type { ProbabilityPuzzleData, FlipResult, ConfettiParticle } from './types'

const CONFETTI_COLORS = [
  '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE',
]

/**
 * Parse raw puzzle object into typed ProbabilityPuzzleData with defaults.
 */
export function parsePuzzleData(puzzle: Record<string, unknown>): ProbabilityPuzzleData {
  const d = (puzzle.data ?? puzzle) as Partial<ProbabilityPuzzleData>
  return {
    totalFlips: d.totalFlips ?? 20,
    question: d.question ?? {
      zh: '你觉得正面会刚好占一半吗？',
      en: 'Do you think heads will be exactly half?',
    },
    type: d.type ?? 'coin',
  }
}

/**
 * Count the number of 'H' results in a flip history.
 */
export function countHeads(history: FlipResult[]): number {
  return history.filter((r) => r === 'H').length
}

/**
 * Calculate the ratio of heads to total flips.
 * Returns 0 for empty history.
 */
export function headRatio(history: FlipResult[]): number {
  if (history.length === 0) return 0
  return countHeads(history) / history.length
}

/**
 * Spawn confetti particles at given coordinates.
 * Uses deterministic structure (count, color pool) with random positions.
 */
export function spawnConfetti(cx: number, cy: number, count: number): ConfettiParticle[] {
  const particles: ConfettiParticle[] = []
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 1 + Math.random() * 3
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      size: 3 + Math.random() * 5,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      life: 1,
      maxLife: 60 + Math.random() * 60,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
    })
  }
  return particles
}

/**
 * Check if prediction is accurate (within 10% of actual ratio).
 */
export function isPredictionAccurate(actualRatio: number, prediction: number): boolean {
  return Math.abs(actualRatio - prediction) <= 0.10
}

/**
 * Check if the AHA moment should trigger.
 * Requires >= 10 flips AND heads ratio in [0.45, 0.55].
 */
export function shouldTriggerAha(history: FlipResult[], alreadyTriggered: boolean): boolean {
  if (alreadyTriggered) return false
  if (history.length < 10) return false
  const ratio = countHeads(history) / history.length
  return ratio >= 0.45 && ratio <= 0.55
}

/**
 * Check if the current flip count is a milestone (10, 20, or 50).
 */
export function isMilestone(flipCount: number): boolean {
  return flipCount === 10 || flipCount === 20 || flipCount === 50
}

/**
 * Check if all experiments are complete (>= 3).
 */
export function isAllExperimentsComplete(experimentsCompleted: number): boolean {
  return experimentsCompleted >= 3
}
