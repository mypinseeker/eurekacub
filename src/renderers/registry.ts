import type { ComponentType } from 'react'

export interface RendererProps {
  puzzle: Record<string, unknown>
  onCorrect: () => void
  onError: () => void
  onAha: () => void
  onComplete: () => void
}

export interface RendererEntry {
  id: string
  name: { zh: string; en: string }
  component: ComponentType<RendererProps>
  puzzleSchema?: Record<string, unknown>
  author: string
  version: string
}

const registry = new Map<string, RendererEntry>()

export function registerRenderer(entry: RendererEntry) {
  registry.set(entry.id, entry)
}

export function getRenderer(id: string): RendererEntry | undefined {
  return registry.get(id)
}

export function getAllRenderers(): RendererEntry[] {
  return Array.from(registry.values())
}
