// localStorage progress manager
// Schema: { [moduleId]: { [levelId]: { completed, stars, bestDifficulty, lastPlayedAt } } }

const STORAGE_KEY = 'eurekacub_progress'

export interface LevelProgress {
  completed: boolean
  stars: number // 0-3
  bestDifficulty: number
  lastPlayedAt: string
}

export type ModuleProgress = Record<string, LevelProgress>
export type AllProgress = Record<string, ModuleProgress>

export function loadProgress(): AllProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as AllProgress
  } catch {
    return {}
  }
}

export function saveProgress(progress: AllProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export function updateLevelProgress(
  moduleId: string,
  levelId: string,
  update: Partial<LevelProgress>
): AllProgress {
  const progress = loadProgress()
  if (!progress[moduleId]) {
    progress[moduleId] = {}
  }
  const existing = progress[moduleId][levelId] || {
    completed: false,
    stars: 0,
    bestDifficulty: 1,
    lastPlayedAt: '',
  }
  progress[moduleId][levelId] = { ...existing, ...update }
  saveProgress(progress)
  return progress
}

export function getModuleCompletion(moduleId: string): number {
  const progress = loadProgress()
  const mod = progress[moduleId]
  if (!mod) return 0
  const levels = Object.values(mod)
  if (levels.length === 0) return 0
  const completed = levels.filter((l) => l.completed).length
  return Math.round((completed / levels.length) * 100)
}
