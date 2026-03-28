export interface Module {
  id: string
  name_zh: string
  name_en: string
  icon: string
  group_tag: 'explorer' | 'challenger' | 'shared'
  sort_order: number
  description_zh?: string
  description_en?: string
  is_active: boolean
}

export interface Level {
  id: string
  module_id: string
  level_num: number
  title_zh: string
  title_en: string
  age_target?: string
  renderer_type: string
  config: Record<string, unknown>
}

export interface Puzzle {
  id: number
  level_id: string
  sort_order: number
  difficulty: number
  puzzle_type: string
  data: Record<string, unknown>
  hints: Array<{ zh: string; en: string }>
  aha_condition?: string
  tags: string[]
  is_active: boolean
}

export interface ContentVersion {
  id: number
  version: number
  updated_at: string
}

// Adventure mode types

export type AdventureCategory = 'life' | 'challenger' | 'ultimate' | 'sports' | 'science'

export interface AdventureStage {
  id: number
  narrative_zh: string
  narrative_en: string
  character: string          // emoji avatar for the narrator
  renderer_id: string        // references a registered renderer (e.g. 'fraction', 'geometry')
  puzzle: Record<string, unknown>
}

export interface Adventure {
  id: number
  category: AdventureCategory
  title_zh: string
  title_en: string
  icon: string
  difficulty: number         // 1-5 stars
  unlocked: boolean
  module_tags: string[]      // renderer IDs used in this adventure
  stages: AdventureStage[]
}
