import { describe, it, expect } from 'vitest'

/**
 * Verify that all Iter 1 module renderers register correctly
 * when their index.ts files are imported.
 */

// Import all renderer registrations
import '../../src/renderers/symmetry'
import '../../src/renderers/fraction'
import '../../src/renderers/sequence'
import '../../src/renderers/probability'

import { getRenderer, getAllRenderers } from '../../src/renderers/registry'

describe('Iter 1 Renderer Registration', () => {
  it('symmetry renderer is registered', () => {
    const entry = getRenderer('symmetry')
    expect(entry).toBeDefined()
    expect(entry!.name.en).toBe('Mirror Canvas')
    expect(entry!.name.zh).toBe('对称镜像画板')
    expect(entry!.author).toBe('EurekaCub Core')
    expect(entry!.version).toBe('1.0.0')
    expect(entry!.component).toBeDefined()
  })

  it('fraction renderer is registered', () => {
    const entry = getRenderer('fraction')
    expect(entry).toBeDefined()
    expect(entry!.name.en).toContain('Pizza')
    expect(entry!.component).toBeDefined()
  })

  it('sequence renderer is registered', () => {
    const entry = getRenderer('sequence')
    expect(entry).toBeDefined()
    expect(entry!.name.en).toContain('Number Train')
    expect(entry!.component).toBeDefined()
  })

  it('probability renderer is registered', () => {
    const entry = getRenderer('probability')
    expect(entry).toBeDefined()
    expect(entry!.name.en).toContain('Probability')
    expect(entry!.component).toBeDefined()
  })

  it('all 4 iter-1 renderers present in getAllRenderers', () => {
    const all = getAllRenderers()
    const ids = all.map((r) => r.id)
    expect(ids).toContain('symmetry')
    expect(ids).toContain('fraction')
    expect(ids).toContain('sequence')
    expect(ids).toContain('probability')
  })

  it('each renderer has required fields', () => {
    const requiredIds = ['symmetry', 'fraction', 'sequence', 'probability']
    for (const id of requiredIds) {
      const entry = getRenderer(id)
      expect(entry, `${id} should be registered`).toBeDefined()
      expect(entry!.id).toBe(id)
      expect(entry!.name.zh.length).toBeGreaterThan(0)
      expect(entry!.name.en.length).toBeGreaterThan(0)
      expect(typeof entry!.component).toBe('function')
      expect(entry!.author.length).toBeGreaterThan(0)
      expect(entry!.version).toMatch(/^\d+\.\d+\.\d+$/)
    }
  })
})
