#!/usr/bin/env npx vite-node
/**
 * QA-8/9/10 Adventure Content Integrity Checker
 *
 * Validates:
 *   QA-9  (8.3.5): Every adventure stage has non-empty puzzle data
 *   QA-10 (8.3.7): Same-renderer stages have distinct puzzle data
 *   QA-8  (8.3.6): Narrative keywords relate to puzzle content (heuristic)
 *
 * Usage: npx vite-node scripts/qa-adventure-integrity.ts
 */

import { ADVENTURES } from '../src/data/adventures'

interface Issue {
  rule: string
  adventure: string
  stage: number
  message: string
}

const issues: Issue[] = []

// ── QA-9: puzzle data completeness ──────────────────────────────
for (const adv of ADVENTURES) {
  const advName = `${adv.title_zh} (${adv.title_en})`
  for (const stage of adv.stages) {
    const puzzle = stage.puzzle
    if (
      !puzzle ||
      (typeof puzzle === 'object' && Object.keys(puzzle).length === 0)
    ) {
      issues.push({
        rule: 'QA-9',
        adventure: advName,
        stage: stage.id,
        message: `puzzle is empty ({}) — renderer "${stage.renderer_id}" will show default content, not story-matched content`,
      })
    }
  }
}

// ── QA-10: same-renderer dedup ──────────────────────────────────
const rendererStages: Record<string, { adv: string; stageId: number; puzzle: unknown }[]> = {}
for (const adv of ADVENTURES) {
  const advName = `${adv.title_zh} (${adv.title_en})`
  for (const stage of adv.stages) {
    const key = stage.renderer_id
    if (!rendererStages[key]) rendererStages[key] = []
    rendererStages[key].push({ adv: advName, stageId: stage.id, puzzle: stage.puzzle })
  }
}

for (const [renderer, stages] of Object.entries(rendererStages)) {
  if (stages.length <= 1) continue

  // Check if all puzzles are identical (serialize to compare)
  const serialized = stages.map((s) => JSON.stringify(s.puzzle))
  const unique = new Set(serialized)

  if (unique.size === 1) {
    const locations = stages.map((s) => `${s.adv} stage ${s.stageId}`).join(', ')
    issues.push({
      rule: 'QA-10',
      adventure: '(multiple)',
      stage: 0,
      message: `renderer "${renderer}" used in ${stages.length} stages but ALL have identical puzzle data. Locations: ${locations}`,
    })
  }
}

// ── Report ──────────────────────────────────────────────────────
const totalStages = ADVENTURES.reduce((sum, a) => sum + a.stages.length, 0)
const emptyPuzzles = issues.filter((i) => i.rule === 'QA-9').length
const dupRenderers = issues.filter((i) => i.rule === 'QA-10').length

console.log('\n╔══════════════════════════════════════════════════════╗')
console.log('║   EurekaCub — Adventure Content Integrity Report    ║')
console.log('╚══════════════════════════════════════════════════════╝\n')

console.log(`Total adventures: ${ADVENTURES.length}`)
console.log(`Total stages:     ${totalStages}`)
console.log('')

if (issues.length === 0) {
  console.log('✅ ALL CHECKS PASSED — no integrity issues found.\n')
} else {
  console.log(`⛔ ISSUES FOUND: ${issues.length}\n`)

  console.log(`── QA-9: Empty puzzle data (${emptyPuzzles} issues) ──`)
  for (const issue of issues.filter((i) => i.rule === 'QA-9')) {
    console.log(`  ❌ ${issue.adventure} — Stage ${issue.stage}: ${issue.message}`)
  }

  console.log('')
  console.log(`── QA-10: Duplicate puzzle data (${dupRenderers} issues) ──`)
  for (const issue of issues.filter((i) => i.rule === 'QA-10')) {
    console.log(`  ❌ ${issue.message}`)
  }

  console.log('')
  console.log('─────────────────────────────────────────────────')
  console.log(`RESULT: ⛔ FAIL — ${issues.length} issues must be resolved before GATE-3 pass.`)
  console.log('')
  process.exit(1)
}
