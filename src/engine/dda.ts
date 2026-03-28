// DDA engine: maintains current difficulty level per module
// Rules:
//   - 3 consecutive correct answers at same difficulty → difficulty + 1
//   - 2 consecutive wrong answers → difficulty - 1 + trigger scaffold
//   - Target: maintain 70-85% success rate

export interface DDAState {
  difficulty: number // 1-10
  consecutiveCorrect: number
  consecutiveWrong: number
  totalAttempts: number
  totalCorrect: number
}

const MIN_DIFFICULTY = 1
const MAX_DIFFICULTY = 10
const CORRECT_STREAK_THRESHOLD = 3
const WRONG_STREAK_THRESHOLD = 2

export function createDDA(initialDifficulty: number = 1): DDAState {
  const clamped = Math.max(MIN_DIFFICULTY, Math.min(MAX_DIFFICULTY, Math.round(initialDifficulty)))
  return {
    difficulty: clamped,
    consecutiveCorrect: 0,
    consecutiveWrong: 0,
    totalAttempts: 0,
    totalCorrect: 0,
  }
}

export function recordAnswer(
  state: DDAState,
  correct: boolean
): { newState: DDAState; shouldScaffold: boolean; difficultyChanged: 'up' | 'down' | 'same' } {
  const newState: DDAState = {
    ...state,
    totalAttempts: state.totalAttempts + 1,
    totalCorrect: state.totalCorrect + (correct ? 1 : 0),
    consecutiveCorrect: correct ? state.consecutiveCorrect + 1 : 0,
    consecutiveWrong: correct ? 0 : state.consecutiveWrong + 1,
  }

  let difficultyChanged: 'up' | 'down' | 'same' = 'same'
  let shouldScaffold = false

  if (newState.consecutiveCorrect >= CORRECT_STREAK_THRESHOLD) {
    if (newState.difficulty < MAX_DIFFICULTY) {
      newState.difficulty = newState.difficulty + 1
      difficultyChanged = 'up'
    }
    newState.consecutiveCorrect = 0
  } else if (newState.consecutiveWrong >= WRONG_STREAK_THRESHOLD) {
    shouldScaffold = true
    if (newState.difficulty > MIN_DIFFICULTY) {
      newState.difficulty = newState.difficulty - 1
      difficultyChanged = 'down'
    }
    newState.consecutiveWrong = 0
  }

  return { newState, shouldScaffold, difficultyChanged }
}

export function getSuccessRate(state: DDAState): number {
  if (state.totalAttempts === 0) return 0
  return state.totalCorrect / state.totalAttempts
}
