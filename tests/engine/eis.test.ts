import { describe, it, expect } from 'vitest'
import { createEIS, advanceEIS, setEISMode, shouldShowSymbols } from '../../src/engine/eis'

describe('EIS Representation Mode', () => {
  it('creates with default enactive mode', () => {
    const eis = createEIS()
    expect(eis.currentMode).toBe('enactive')
    expect(eis.unlockedModes).toEqual(['enactive'])
  })

  it('advances from enactive → iconic → symbolic', () => {
    let eis = createEIS()
    expect(eis.currentMode).toBe('enactive')

    eis = advanceEIS(eis)
    expect(eis.currentMode).toBe('iconic')
    expect(eis.unlockedModes).toContain('iconic')

    eis = advanceEIS(eis)
    expect(eis.currentMode).toBe('symbolic')
    expect(eis.unlockedModes).toContain('symbolic')
  })

  it('stays at symbolic after max advancement', () => {
    let eis = createEIS()
    eis = advanceEIS(eis)
    eis = advanceEIS(eis)
    const before = eis
    eis = advanceEIS(eis)
    expect(eis.currentMode).toBe('symbolic')
    expect(eis).toBe(before) // same reference — no change
  })

  it('setEISMode jumps to specific mode', () => {
    const eis = createEIS()
    const updated = setEISMode(eis, 'symbolic')
    expect(updated.currentMode).toBe('symbolic')
    expect(updated.unlockedModes).toContain('symbolic')
  })

  it('shouldShowSymbols returns true only for symbolic', () => {
    const enactive = createEIS()
    expect(shouldShowSymbols(enactive)).toBe(false)

    const symbolic = advanceEIS(advanceEIS(enactive))
    expect(shouldShowSymbols(symbolic)).toBe(true)
  })
})
