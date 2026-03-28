import { describe, it, expect } from 'vitest'
import {
  createScaffold,
  triggerScaffold,
  resetScaffold,
  getCurrentHint,
} from '../../src/engine/scaffold'

describe('Scaffold State Machine', () => {
  it('starts at idle', () => {
    const state = createScaffold()
    expect(state.level).toBe('idle')
    expect(state.triggeredAt).toBeNull()
  })

  it('trigger advances: idle → hint1 → hint2 → demo', () => {
    let state = createScaffold()
    state = triggerScaffold(state)
    expect(state.level).toBe('hint1')
    expect(state.triggeredAt).toBeTypeOf('number')

    state = triggerScaffold(state)
    expect(state.level).toBe('hint2')

    state = triggerScaffold(state)
    expect(state.level).toBe('demo')
  })

  it('trigger at demo stays at demo', () => {
    let state = createScaffold()
    state = triggerScaffold(state) // hint1
    state = triggerScaffold(state) // hint2
    state = triggerScaffold(state) // demo
    state = triggerScaffold(state) // still demo
    expect(state.level).toBe('demo')
  })

  it('reset goes back to idle', () => {
    let state = createScaffold()
    state = triggerScaffold(state) // hint1
    state = triggerScaffold(state) // hint2
    state = resetScaffold(state)
    expect(state.level).toBe('idle')
    expect(state.triggeredAt).toBeNull()
  })

  it('getCurrentHint returns null at idle', () => {
    const state = createScaffold()
    const hints = ['hint A', 'hint B', 'full demo']
    expect(getCurrentHint(state, hints)).toBeNull()
  })

  it('getCurrentHint returns correct hint for each level', () => {
    const hints = ['hint A', 'hint B', 'full demo']

    let state = createScaffold()
    state = triggerScaffold(state) // hint1
    expect(getCurrentHint(state, hints)).toBe('hint A')

    state = triggerScaffold(state) // hint2
    expect(getCurrentHint(state, hints)).toBe('hint B')

    state = triggerScaffold(state) // demo
    expect(getCurrentHint(state, hints)).toBe('full demo')
  })

  it('getCurrentHint returns null if hints array is too short', () => {
    let state = createScaffold()
    state = triggerScaffold(state) // hint1
    state = triggerScaffold(state) // hint2
    state = triggerScaffold(state) // demo
    expect(getCurrentHint(state, ['only one hint'])).toBeNull()
  })

  it('getCurrentHint works with typed objects', () => {
    interface MyHint {
      text: string
      level: number
    }
    const hints: MyHint[] = [
      { text: 'Try counting', level: 1 },
      { text: 'Use your fingers', level: 2 },
      { text: 'Watch the demo', level: 3 },
    ]

    let state = createScaffold()
    state = triggerScaffold(state)
    const hint = getCurrentHint(state, hints)
    expect(hint).toEqual({ text: 'Try counting', level: 1 })
  })
})
