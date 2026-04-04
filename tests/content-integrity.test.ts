/**
 * Content Integrity Tests — PRD QA-8 / QA-9 / QA-10
 *
 * QA-8:  Narrative-puzzle semantic match (story matches renderer)
 * QA-9:  Puzzle data completeness (no empty fallback defaults)
 * QA-10: No duplicate puzzle data across stages
 *
 * Also covers TEST_CHECKLIST item 8.3.6 (previously ❌ uncovered).
 */
import { describe, it, expect } from 'vitest'
import { ADVENTURES, CATEGORY_META } from '../src/data/adventures'
import { getRenderer, getAllRenderers } from '../src/renderers/registry'

// Trigger renderer auto-registration
import '../src/renderers'

/* ================================================================== */
/*  QA-8: Narrative-Puzzle Semantic Match                              */
/* ================================================================== */

describe('QA-8: Narrative-puzzle semantic match', () => {
  it('all adventure stages reference a registered renderer_id', () => {
    const registeredIds = new Set(getAllRenderers().map((r) => r.id))
    for (const adv of ADVENTURES) {
      for (const stage of adv.stages) {
        expect(
          registeredIds.has(stage.renderer_id),
          `Adventure "${adv.title_en}" stage ${stage.id}: renderer_id "${stage.renderer_id}" not registered`,
        ).toBe(true)
      }
    }
  })

  it('all derivative stages have a theme field matching narrative context', () => {
    const VALID_THEMES = ['car', 'plant', 'rocket', 'stock', 'ball', 'swim']
    for (const adv of ADVENTURES) {
      for (const stage of adv.stages) {
        if (stage.renderer_id !== 'derivative') continue
        const puzzle = stage.puzzle as Record<string, unknown>
        expect(
          typeof puzzle.theme === 'string' && VALID_THEMES.includes(puzzle.theme as string),
          `Adventure "${adv.title_en}" stage ${stage.id}: derivative puzzle missing valid theme (got: ${puzzle.theme})`,
        ).toBe(true)
      }
    }
  })

  it('derivative theme matches narrative keywords', () => {
    const THEME_KEYWORDS: Record<string, string[]> = {
      plant: ['植物', '生长', '浇水', 'plant', 'grow', 'garden', '动物', 'population'],
      stock: ['股', '证券', 'stock', 'trading', '投资'],
      rocket: ['火箭', '发射', 'rocket', 'launch', '太空'],
      ball: ['球', '落体', 'ball', 'fall', '速度变化', 'speed change', '篮球', 'basketball'],
      car: ['赛车', '弯道', 'car', 'racing', 'braking', '减速'],
      swim: ['游泳', 'swim', '泳池'],
    }

    for (const adv of ADVENTURES) {
      for (const stage of adv.stages) {
        if (stage.renderer_id !== 'derivative') continue
        const puzzle = stage.puzzle as Record<string, unknown>
        const theme = puzzle.theme as string
        if (!theme) continue

        const keywords = THEME_KEYWORDS[theme] ?? []
        const narrative = `${stage.narrative_zh} ${stage.narrative_en}`.toLowerCase()

        // At least one keyword from the theme should appear in the narrative
        const hasMatch = keywords.some((kw) => narrative.includes(kw.toLowerCase()))
        expect(
          hasMatch,
          `Adventure "${adv.title_en}" stage ${stage.id}: theme="${theme}" but narrative has none of [${keywords.join(', ')}]`,
        ).toBe(true)
      }
    }
  })
})

/* ================================================================== */
/*  QA-9: Puzzle Data Completeness                                     */
/* ================================================================== */

describe('QA-9: Puzzle data completeness', () => {
  // Required fields per renderer
  const REQUIRED_FIELDS: Record<string, string[]> = {
    fraction: ['targetSlices'],
    equation: ['leftSide', 'rightSide', 'unknown'],
    sequence: ['sequence', 'blanks'],
    geometry: ['slots'],
    symmetry: [],  // symmetry uses internal defaults
    probability: [],  // probability uses internal defaults
    matrix: [],  // matrix uses internal defaults
    derivative: ['targetCurve', 'duration', 'finishLine'],
  }

  it('all adventure puzzle configs have required fields for their renderer', () => {
    for (const adv of ADVENTURES) {
      for (const stage of adv.stages) {
        const required = REQUIRED_FIELDS[stage.renderer_id] ?? []
        const puzzle = stage.puzzle as Record<string, unknown>

        for (const field of required) {
          expect(
            puzzle[field] !== undefined && puzzle[field] !== null,
            `Adventure "${adv.title_en}" stage ${stage.id} (${stage.renderer_id}): missing required field "${field}"`,
          ).toBe(true)
        }
      }
    }
  })

  it('no adventure puzzle is a completely empty object', () => {
    for (const adv of ADVENTURES) {
      for (const stage of adv.stages) {
        const puzzle = stage.puzzle as Record<string, unknown>
        const keys = Object.keys(puzzle)
        expect(
          keys.length > 0,
          `Adventure "${adv.title_en}" stage ${stage.id}: puzzle is empty {}`,
        ).toBe(true)
      }
    }
  })

  it('derivative puzzles have non-empty targetCurve with ≥ 5 points', () => {
    for (const adv of ADVENTURES) {
      for (const stage of adv.stages) {
        if (stage.renderer_id !== 'derivative') continue
        const puzzle = stage.puzzle as Record<string, unknown>
        const curve = puzzle.targetCurve as number[]
        expect(
          Array.isArray(curve) && curve.length >= 5,
          `Adventure "${adv.title_en}" stage ${stage.id}: targetCurve too short (${curve?.length ?? 0} points)`,
        ).toBe(true)
      }
    }
  })

  it('sequence puzzles have non-empty sequence and blanks arrays', () => {
    for (const adv of ADVENTURES) {
      for (const stage of adv.stages) {
        if (stage.renderer_id !== 'sequence') continue
        const puzzle = stage.puzzle as Record<string, unknown>
        const seq = puzzle.sequence as unknown[]
        const blanks = puzzle.blanks as unknown[]
        expect(
          Array.isArray(seq) && seq.length >= 3,
          `Adventure "${adv.title_en}" stage ${stage.id}: sequence too short`,
        ).toBe(true)
        expect(
          Array.isArray(blanks) && blanks.length >= 1,
          `Adventure "${adv.title_en}" stage ${stage.id}: blanks array empty`,
        ).toBe(true)
      }
    }
  })

  it('equation puzzles have leftSide array and numeric rightSide/unknown', () => {
    for (const adv of ADVENTURES) {
      for (const stage of adv.stages) {
        if (stage.renderer_id !== 'equation') continue
        const puzzle = stage.puzzle as Record<string, unknown>
        expect(
          Array.isArray(puzzle.leftSide) && (puzzle.leftSide as unknown[]).length >= 1,
          `Adventure "${adv.title_en}" stage ${stage.id}: equation leftSide invalid`,
        ).toBe(true)
        expect(
          typeof puzzle.rightSide === 'number' || Array.isArray(puzzle.rightSide),
          `Adventure "${adv.title_en}" stage ${stage.id}: equation rightSide invalid`,
        ).toBe(true)
      }
    }
  })

  it('geometry puzzles with slots also have matching pieces array', () => {
    for (const adv of ADVENTURES) {
      for (const stage of adv.stages) {
        if (stage.renderer_id !== 'geometry') continue
        const puzzle = stage.puzzle as Record<string, unknown>
        const slots = puzzle.slots as { shape: string }[] | undefined
        const pieces = puzzle.pieces as string[] | undefined

        if (slots && slots.length > 0) {
          expect(
            Array.isArray(pieces) && pieces.length > 0,
            `Adventure "${adv.title_en}" stage ${stage.id}: geometry has slots but missing pieces array`,
          ).toBe(true)
        }
      }
    }
  })
})

/* ================================================================== */
/*  QA-10: No Duplicate Puzzle Data                                    */
/* ================================================================== */

describe('QA-10: No duplicate puzzle data across stages', () => {
  it('no two derivative stages have identical targetCurve', () => {
    const curves: { key: string; adv: string; stageId: number }[] = []
    for (const adv of ADVENTURES) {
      for (const stage of adv.stages) {
        if (stage.renderer_id !== 'derivative') continue
        const puzzle = stage.puzzle as Record<string, unknown>
        const curveKey = JSON.stringify(puzzle.targetCurve)
        const existing = curves.find((c) => c.key === curveKey)
        expect(
          existing,
          `Duplicate derivative targetCurve: "${adv.title_en}" stage ${stage.id} same as "${existing?.adv}" stage ${existing?.stageId}`,
        ).toBeUndefined()
        curves.push({ key: curveKey, adv: adv.title_en, stageId: stage.id })
      }
    }
  })

  it('no two equation stages have identical puzzle config', () => {
    const configs: { key: string; adv: string; stageId: number }[] = []
    for (const adv of ADVENTURES) {
      for (const stage of adv.stages) {
        if (stage.renderer_id !== 'equation') continue
        const key = JSON.stringify(stage.puzzle)
        const existing = configs.find((c) => c.key === key)
        expect(
          existing,
          `Duplicate equation puzzle: "${adv.title_en}" stage ${stage.id} same as "${existing?.adv}" stage ${existing?.stageId}`,
        ).toBeUndefined()
        configs.push({ key, adv: adv.title_en, stageId: stage.id })
      }
    }
  })

  it('no two sequence stages have identical sequence array', () => {
    const seqs: { key: string; adv: string; stageId: number }[] = []
    for (const adv of ADVENTURES) {
      for (const stage of adv.stages) {
        if (stage.renderer_id !== 'sequence') continue
        const puzzle = stage.puzzle as Record<string, unknown>
        const key = JSON.stringify(puzzle.sequence)
        const existing = seqs.find((c) => c.key === key)
        expect(
          existing,
          `Duplicate sequence: "${adv.title_en}" stage ${stage.id} same as "${existing?.adv}" stage ${existing?.stageId}`,
        ).toBeUndefined()
        seqs.push({ key, adv: adv.title_en, stageId: stage.id })
      }
    }
  })
})

/* ================================================================== */
/*  Adventure Structure Integrity                                      */
/* ================================================================== */

describe('Adventure structure integrity', () => {
  it('all adventures have valid category', () => {
    const validCategories = Object.keys(CATEGORY_META)
    for (const adv of ADVENTURES) {
      expect(
        validCategories.includes(adv.category),
        `Adventure "${adv.title_en}": invalid category "${adv.category}"`,
      ).toBe(true)
    }
  })

  it('all adventures have unique IDs', () => {
    const ids = ADVENTURES.map((a) => a.id)
    const unique = new Set(ids)
    expect(ids.length).toBe(unique.size)
  })

  it('all adventures have ≥ 1 stage', () => {
    for (const adv of ADVENTURES) {
      expect(
        adv.stages.length >= 1,
        `Adventure "${adv.title_en}": has 0 stages`,
      ).toBe(true)
    }
  })

  it('all stages have bilingual narrative text', () => {
    for (const adv of ADVENTURES) {
      for (const stage of adv.stages) {
        expect(
          stage.narrative_zh.length > 0,
          `Adventure "${adv.title_en}" stage ${stage.id}: empty narrative_zh`,
        ).toBe(true)
        expect(
          stage.narrative_en.length > 0,
          `Adventure "${adv.title_en}" stage ${stage.id}: empty narrative_en`,
        ).toBe(true)
      }
    }
  })

  it('all stages have a character emoji', () => {
    for (const adv of ADVENTURES) {
      for (const stage of adv.stages) {
        expect(
          stage.character.length > 0,
          `Adventure "${adv.title_en}" stage ${stage.id}: missing character`,
        ).toBe(true)
      }
    }
  })

  it('difficulty is between 1-5', () => {
    for (const adv of ADVENTURES) {
      expect(adv.difficulty).toBeGreaterThanOrEqual(1)
      expect(adv.difficulty).toBeLessThanOrEqual(5)
    }
  })

  it('module_tags are non-empty and reference valid renderer IDs', () => {
    const registeredIds = new Set(getAllRenderers().map((r) => r.id))
    for (const adv of ADVENTURES) {
      expect(adv.module_tags.length).toBeGreaterThanOrEqual(1)
      for (const tag of adv.module_tags) {
        expect(
          registeredIds.has(tag),
          `Adventure "${adv.title_en}": module_tag "${tag}" not a registered renderer`,
        ).toBe(true)
      }
    }
  })
})

/* ================================================================== */
/*  Module-Renderer Mapping (PuzzlePage)                               */
/* ================================================================== */

describe('Module-renderer mapping', () => {
  const MODULE_RENDERER_MAP: Record<string, string> = {
    m1: 'symmetry',
    m2: 'fraction',
    m3: 'geometry',
    m4: 'derivative',
    m5: 'equation',
    m6: 'matrix',
    m7: 'sequence',
    m8: 'probability',
  }

  it('all 8 modules map to a registered renderer', () => {
    for (const [moduleId, rendererId] of Object.entries(MODULE_RENDERER_MAP)) {
      const entry = getRenderer(rendererId)
      expect(
        entry,
        `Module ${moduleId} maps to "${rendererId}" but renderer not found`,
      ).toBeDefined()
    }
  })

  it('all 8 renderers are registered', () => {
    const all = getAllRenderers()
    expect(all.length).toBe(8)
    const ids = all.map((r) => r.id).sort()
    expect(ids).toEqual([
      'derivative', 'equation', 'fraction', 'geometry',
      'matrix', 'probability', 'sequence', 'symmetry',
    ])
  })
})

/* ================================================================== */
/*  Renderer Registration Quality                                      */
/* ================================================================== */

describe('Renderer registration quality', () => {
  it('all renderers have bilingual names', () => {
    for (const r of getAllRenderers()) {
      expect(r.name.zh.length).toBeGreaterThan(0)
      expect(r.name.en.length).toBeGreaterThan(0)
    }
  })

  it('all renderers have a component function', () => {
    for (const r of getAllRenderers()) {
      expect(typeof r.component).toBe('function')
    }
  })

  it('all renderers have author and version', () => {
    for (const r of getAllRenderers()) {
      expect(r.author.length).toBeGreaterThan(0)
      expect(r.version.length).toBeGreaterThan(0)
    }
  })
})
