// Scaffold state machine: idle → hint1 → hint2 → demo → (stays at demo)
// Transitions:
//   - trigger() → advance to next hint level
//   - reset() → back to idle
//   - getCurrentHint(hints) → returns appropriate hint based on current level

export type ScaffoldLevel = 'idle' | 'hint1' | 'hint2' | 'demo'

export interface ScaffoldState {
  level: ScaffoldLevel
  triggeredAt: number | null // timestamp
}

const LEVEL_ORDER: ScaffoldLevel[] = ['idle', 'hint1', 'hint2', 'demo']

export function createScaffold(): ScaffoldState {
  return {
    level: 'idle',
    triggeredAt: null,
  }
}

export function triggerScaffold(state: ScaffoldState): ScaffoldState {
  const currentIndex = LEVEL_ORDER.indexOf(state.level)
  const nextIndex = Math.min(currentIndex + 1, LEVEL_ORDER.length - 1)
  return {
    level: LEVEL_ORDER[nextIndex],
    triggeredAt: Date.now(),
  }
}

export function resetScaffold(_state: ScaffoldState): ScaffoldState {
  return {
    level: 'idle',
    triggeredAt: null,
  }
}

export function getCurrentHint<T>(state: ScaffoldState, hints: T[]): T | null {
  if (state.level === 'idle') return null
  const levelIndex = LEVEL_ORDER.indexOf(state.level)
  // hint1 → index 0, hint2 → index 1, demo → index 2
  const hintIndex = levelIndex - 1
  if (hintIndex < 0 || hintIndex >= hints.length) return null
  return hints[hintIndex]
}
