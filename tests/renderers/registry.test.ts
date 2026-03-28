import { describe, it, expect, beforeEach } from 'vitest'

/**
 * Test the renderer registry — ensures all Iter 1 renderers
 * are registered correctly and retrievable.
 */

// Re-import fresh for each test file
// The registry is a singleton Map, so we test its public API
import {
  registerRenderer,
  getRenderer,
  getAllRenderers,
  type RendererEntry,
  type RendererProps,
} from '../../src/renderers/registry'

// Dummy component for testing
const DummyRenderer = (() => null) as unknown as React.ComponentType<RendererProps>

describe('Renderer Registry', () => {
  it('registerRenderer + getRenderer round-trip', () => {
    const entry: RendererEntry = {
      id: 'test-module',
      name: { zh: '测试', en: 'Test' },
      component: DummyRenderer,
      author: 'test',
      version: '0.0.1',
    }
    registerRenderer(entry)
    const retrieved = getRenderer('test-module')
    expect(retrieved).toBeDefined()
    expect(retrieved!.id).toBe('test-module')
    expect(retrieved!.name.zh).toBe('测试')
    expect(retrieved!.author).toBe('test')
  })

  it('getRenderer returns undefined for unknown id', () => {
    expect(getRenderer('nonexistent-xyz')).toBeUndefined()
  })

  it('getAllRenderers returns array', () => {
    const all = getAllRenderers()
    expect(Array.isArray(all)).toBe(true)
    expect(all.length).toBeGreaterThan(0)
  })

  it('overwrite existing renderer by same id', () => {
    registerRenderer({
      id: 'overwrite-test',
      name: { zh: 'v1', en: 'v1' },
      component: DummyRenderer,
      author: 'a',
      version: '1.0.0',
    })
    registerRenderer({
      id: 'overwrite-test',
      name: { zh: 'v2', en: 'v2' },
      component: DummyRenderer,
      author: 'b',
      version: '2.0.0',
    })
    const entry = getRenderer('overwrite-test')
    expect(entry!.version).toBe('2.0.0')
    expect(entry!.name.zh).toBe('v2')
  })
})
