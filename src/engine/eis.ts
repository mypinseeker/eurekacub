// EIS representation mode manager
// Manages E→I→S (Enactive→Iconic→Symbolic) progression

export type EISMode = 'enactive' | 'iconic' | 'symbolic'

export interface EISState {
  currentMode: EISMode
  unlockedModes: EISMode[] // which modes the user has seen
}

const MODE_ORDER: EISMode[] = ['enactive', 'iconic', 'symbolic']

export function createEIS(): EISState {
  return {
    currentMode: 'enactive',
    unlockedModes: ['enactive'],
  }
}

export function advanceEIS(state: EISState): EISState {
  const currentIndex = MODE_ORDER.indexOf(state.currentMode)
  if (currentIndex >= MODE_ORDER.length - 1) {
    return state // already at symbolic, no change
  }
  const nextMode = MODE_ORDER[currentIndex + 1]
  const unlockedModes = state.unlockedModes.includes(nextMode)
    ? state.unlockedModes
    : [...state.unlockedModes, nextMode]
  return {
    currentMode: nextMode,
    unlockedModes,
  }
}

export function setEISMode(state: EISState, mode: EISMode): EISState {
  const unlockedModes = state.unlockedModes.includes(mode)
    ? state.unlockedModes
    : [...state.unlockedModes, mode]
  return {
    currentMode: mode,
    unlockedModes,
  }
}

export function shouldShowSymbols(state: EISState): boolean {
  return state.currentMode === 'symbolic'
}
