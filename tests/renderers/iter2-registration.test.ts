import { describe, it, expect } from 'vitest'

/**
 * Verify that all Iter 2 module renderers register correctly.
 */

// Import all renderers (Iter 1 + Iter 2)
import '../../src/renderers/symmetry'
import '../../src/renderers/fraction'
import '../../src/renderers/sequence'
import '../../src/renderers/probability'
import '../../src/renderers/derivative'
import '../../src/renderers/equation'
import '../../src/renderers/matrix'
import '../../src/renderers/geometry'

import { getRenderer } from '../../src/renderers/registry'

describe('Iter 2 Renderer Registration', () => {
  it('derivative renderer is registered', () => {
    const entry = getRenderer('derivative')
    expect(entry).toBeDefined()
    expect(entry!.name.zh).toBe('速度控制器')
    expect(entry!.name.en).toContain('Speed')
    expect(entry!.component).toBeDefined()
    expect(entry!.version).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('equation renderer is registered', () => {
    const entry = getRenderer('equation')
    expect(entry).toBeDefined()
    expect(entry!.name.zh).toContain('天平')
    expect(entry!.component).toBeDefined()
  })

  it('matrix renderer is registered', () => {
    const entry = getRenderer('matrix')
    expect(entry).toBeDefined()
    expect(entry!.name.zh).toContain('像素')
    expect(entry!.component).toBeDefined()
  })

  it('geometry renderer is registered', () => {
    const entry = getRenderer('geometry')
    expect(entry).toBeDefined()
    expect(entry!.name.zh).toContain('七巧板')
    expect(entry!.component).toBeDefined()
  })

  it('all 8 modules now registered', () => {
    const ids = ['symmetry', 'fraction', 'sequence', 'probability', 'derivative', 'equation', 'matrix', 'geometry']
    for (const id of ids) {
      const entry = getRenderer(id)
      expect(entry, `${id} should be registered`).toBeDefined()
      expect(typeof entry!.component).toBe('function')
    }
  })
})
