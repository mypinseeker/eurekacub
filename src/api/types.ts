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
