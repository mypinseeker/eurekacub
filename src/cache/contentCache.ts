import { get, set, del } from 'idb-keyval'
import type { Module, Level, Puzzle } from '../api/types'

const MODULES_KEY = 'eurekacub:modules'
const VERSION_KEY = 'eurekacub:content_version'

function levelsKey(moduleId: string): string {
  return `eurekacub:levels:${moduleId}`
}

function puzzlesKey(moduleId: string): string {
  return `eurekacub:puzzles:${moduleId}`
}

// --- Modules ---

export async function getCachedModules(): Promise<Module[] | undefined> {
  return await get<Module[]>(MODULES_KEY)
}

export async function setCachedModules(modules: Module[]): Promise<void> {
  await set(MODULES_KEY, modules)
}

export async function clearCachedModules(): Promise<void> {
  await del(MODULES_KEY)
}

// --- Levels ---

export async function getCachedLevels(moduleId: string): Promise<Level[] | undefined> {
  return await get<Level[]>(levelsKey(moduleId))
}

export async function setCachedLevels(moduleId: string, levels: Level[]): Promise<void> {
  await set(levelsKey(moduleId), levels)
}

// --- Puzzles ---

export async function getCachedPuzzles(moduleId: string): Promise<Puzzle[] | undefined> {
  return await get<Puzzle[]>(puzzlesKey(moduleId))
}

export async function setCachedPuzzles(moduleId: string, puzzles: Puzzle[]): Promise<void> {
  await set(puzzlesKey(moduleId), puzzles)
}

// --- Version ---

export async function getCachedVersion(): Promise<number> {
  const v = await get<number>(VERSION_KEY)
  return v ?? 0
}

export async function setCachedVersion(version: number): Promise<void> {
  await set(VERSION_KEY, version)
}
