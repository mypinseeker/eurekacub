import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import Ajv from 'ajv'

/**
 * Programmatic content validation test — ensures all JSON puzzles
 * pass schema validation at test time (same as validate-content script).
 */

const CONTENT_DIR = path.resolve(__dirname, '../../content')
const SCHEMA_DIR = path.join(CONTENT_DIR, 'schema')

function loadJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

function findFiles(dir: string, ext: string): string[] {
  const results: string[] = []
  if (!fs.existsSync(dir)) return results
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...findFiles(full, ext))
    } else if (entry.name.endsWith(ext) && !entry.name.includes('schema')) {
      results.push(full)
    }
  }
  return results
}

describe('Content Schema Validation', () => {
  const ajv = new Ajv({ allErrors: true })
  const puzzleSchema = loadJson(path.join(SCHEMA_DIR, 'puzzle.schema.json'))
  const validate = ajv.compile(puzzleSchema)

  const puzzleFiles = findFiles(path.join(CONTENT_DIR, 'puzzles'), '.json')

  it('finds puzzle content files', () => {
    expect(puzzleFiles.length).toBeGreaterThanOrEqual(20)
  })

  for (const file of puzzleFiles) {
    const rel = path.relative(CONTENT_DIR, file)
    it(`validates ${rel}`, () => {
      const data = loadJson(file)
      const valid = validate(data)
      if (!valid) {
        const errors = validate.errors?.map((e) => `${e.instancePath} ${e.message}`).join('; ')
        expect.fail(`Schema validation failed: ${errors}`)
      }
    })
  }

  it('all puzzles have unique ids', () => {
    const ids = puzzleFiles.map((f) => loadJson(f).id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('all puzzles reference valid modules', () => {
    const validModules = ['symmetry', 'fraction', 'geometry', 'derivative', 'equation', 'matrix', 'sequence', 'probability']
    for (const file of puzzleFiles) {
      const data = loadJson(file)
      expect(validModules).toContain(data.module)
    }
  })

  it('all puzzles have at least 2 hints', () => {
    for (const file of puzzleFiles) {
      const data = loadJson(file)
      expect(data.hints.length, `${data.id} should have ≥2 hints`).toBeGreaterThanOrEqual(2)
    }
  })

  it('no forbidden words in puzzle content', () => {
    const forbidden = ['太笨', 'stupid', '快点', 'hurry', '排名', 'rank']
    for (const file of puzzleFiles) {
      const text = fs.readFileSync(file, 'utf-8')
      for (const word of forbidden) {
        expect(text.includes(word), `${path.basename(file)} contains forbidden word "${word}"`).toBe(false)
      }
    }
  })
})
