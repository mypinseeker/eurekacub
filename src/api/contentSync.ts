import { supabase } from './supabase'
import type { Module, Level, Puzzle } from './types'
import {
  getCachedVersion,
  setCachedVersion,
  setCachedModules,
  setCachedLevels,
  setCachedPuzzles,
} from '../cache/contentCache'

/**
 * Get the local cached content version number.
 */
export async function getLocalVersion(): Promise<number> {
  return await getCachedVersion()
}

/**
 * Compare local version with Supabase content_version table.
 * Returns true if remote is newer (update available).
 */
export async function checkForUpdates(): Promise<boolean> {
  if (!supabase) return false

  const localVersion = await getLocalVersion()

  const { data, error } = await supabase
    .from('content_version')
    .select('version')
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return false

  return data.version > localVersion
}

/**
 * Sync all modules from Supabase and cache them locally.
 */
export async function syncModules(): Promise<Module[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  if (error || !data) return []

  const modules = data as Module[]
  await setCachedModules(modules)
  return modules
}

/**
 * Sync all levels for a given module.
 */
export async function syncLevels(moduleId: string): Promise<Level[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('levels')
    .select('*')
    .eq('module_id', moduleId)
    .order('level_num')

  if (error || !data) return []

  const levels = data as Level[]
  await setCachedLevels(moduleId, levels)
  return levels
}

/**
 * Sync all puzzles for a given module (via its levels).
 */
export async function syncModule(moduleId: string): Promise<Puzzle[]> {
  if (!supabase) return []

  // First get levels for the module
  const levels = await syncLevels(moduleId)
  const levelIds = levels.map((l) => l.id)

  if (levelIds.length === 0) return []

  const { data, error } = await supabase
    .from('puzzles')
    .select('*')
    .in('level_id', levelIds)
    .eq('is_active', true)
    .order('sort_order')

  if (error || !data) return []

  const puzzles = data as Puzzle[]
  await setCachedPuzzles(moduleId, puzzles)
  return puzzles
}

/**
 * Sync everything: modules, levels, puzzles, then bump cached version.
 */
export async function syncAll(): Promise<void> {
  if (!supabase) return

  const modules = await syncModules()

  for (const mod of modules) {
    await syncModule(mod.id)
  }

  // Update local version to match remote
  const { data } = await supabase
    .from('content_version')
    .select('version')
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (data) {
    await setCachedVersion(data.version)
  }
}
