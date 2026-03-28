import { describe, it, expect, beforeEach } from 'vitest'
import { loadProgress, saveProgress, updateLevelProgress, getModuleCompletion } from '../../src/engine/progress'

// Mock localStorage
const store: Record<string, string> = {}
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value },
  removeItem: (key: string) => { delete store[key] },
  clear: () => { Object.keys(store).forEach(k => delete store[k]) },
  get length() { return Object.keys(store).length },
  key: (i: number) => Object.keys(store)[i] ?? null,
}
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

describe('Progress Engine', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  it('loadProgress returns empty object when no data', () => {
    const progress = loadProgress()
    expect(progress).toEqual({})
  })

  it('updateLevelProgress persists and loads back', () => {
    updateLevelProgress('m1', 'L1', { completed: true, stars: 3, bestDifficulty: 5, lastPlayedAt: '2026-03-28' })
    const progress = loadProgress()
    expect(progress.m1).toBeDefined()
    expect(progress.m1.L1.completed).toBe(true)
    expect(progress.m1.L1.stars).toBe(3)
  })

  it('getModuleCompletion returns 0 for unplayed module', () => {
    expect(getModuleCompletion('m99')).toBe(0)
  })

  it('getModuleCompletion calculates percentage', () => {
    updateLevelProgress('m1', 'L1', { completed: true, stars: 2 })
    updateLevelProgress('m1', 'L2', { completed: false, stars: 0 })
    expect(getModuleCompletion('m1')).toBe(50)
  })

  it('multiple modules coexist', () => {
    updateLevelProgress('m1', 'L1', { completed: true, stars: 2 })
    updateLevelProgress('m2', 'L2', { completed: false, stars: 1 })
    const progress = loadProgress()
    expect(progress.m1.L1.stars).toBe(2)
    expect(progress.m2.L2.stars).toBe(1)
  })

  it('overwrite same module/level merges correctly', () => {
    updateLevelProgress('m1', 'L1', { completed: false, stars: 1 })
    updateLevelProgress('m1', 'L1', { completed: true, stars: 3 })
    const progress = loadProgress()
    expect(progress.m1.L1.stars).toBe(3)
    expect(progress.m1.L1.completed).toBe(true)
  })

  it('saveProgress + loadProgress round-trip', () => {
    const data = { m1: { L1: { completed: true, stars: 3, bestDifficulty: 7, lastPlayedAt: '2026-03-28' } } }
    saveProgress(data)
    expect(loadProgress()).toEqual(data)
  })
})
