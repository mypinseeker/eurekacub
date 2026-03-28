import { describe, it, expect } from 'vitest'
import { createDDA, recordAnswer, getSuccessRate } from '../../src/engine/dda'

describe('DDA Engine', () => {
  it('createDDA starts at difficulty 1 by default', () => {
    const state = createDDA()
    expect(state.difficulty).toBe(1)
    expect(state.consecutiveCorrect).toBe(0)
    expect(state.consecutiveWrong).toBe(0)
    expect(state.totalAttempts).toBe(0)
    expect(state.totalCorrect).toBe(0)
  })

  it('createDDA accepts initial difficulty', () => {
    const state = createDDA(5)
    expect(state.difficulty).toBe(5)
  })

  it('createDDA clamps difficulty to valid range', () => {
    expect(createDDA(0).difficulty).toBe(1)
    expect(createDDA(15).difficulty).toBe(10)
    expect(createDDA(-3).difficulty).toBe(1)
  })

  it('3 correct in a row increases difficulty', () => {
    let state = createDDA()
    let result = recordAnswer(state, true)
    expect(result.difficultyChanged).toBe('same')
    result = recordAnswer(result.newState, true)
    expect(result.difficultyChanged).toBe('same')
    result = recordAnswer(result.newState, true)
    expect(result.difficultyChanged).toBe('up')
    expect(result.newState.difficulty).toBe(2)
  })

  it('2 wrong in a row decreases difficulty and triggers scaffold', () => {
    let state = createDDA(5)
    let result = recordAnswer(state, false)
    expect(result.shouldScaffold).toBe(false)
    result = recordAnswer(result.newState, false)
    expect(result.shouldScaffold).toBe(true)
    expect(result.difficultyChanged).toBe('down')
    expect(result.newState.difficulty).toBe(4)
  })

  it('difficulty never goes below 1', () => {
    let state = createDDA(1)
    let result = recordAnswer(state, false)
    result = recordAnswer(result.newState, false)
    expect(result.newState.difficulty).toBe(1)
    expect(result.shouldScaffold).toBe(true)
  })

  it('difficulty never goes above 10', () => {
    let state = createDDA(10)
    let result = recordAnswer(state, true)
    result = recordAnswer(result.newState, true)
    result = recordAnswer(result.newState, true)
    expect(result.newState.difficulty).toBe(10)
    expect(result.difficultyChanged).toBe('same')
  })

  it('correct answer resets consecutive wrong count', () => {
    let state = createDDA(5)
    let result = recordAnswer(state, false)
    expect(result.newState.consecutiveWrong).toBe(1)
    result = recordAnswer(result.newState, true)
    expect(result.newState.consecutiveWrong).toBe(0)
    expect(result.newState.consecutiveCorrect).toBe(1)
  })

  it('success rate calculation is correct', () => {
    expect(getSuccessRate(createDDA())).toBe(0)

    let state = createDDA()
    let result = recordAnswer(state, true)
    result = recordAnswer(result.newState, true)
    result = recordAnswer(result.newState, false)
    // 2 correct out of 3
    expect(getSuccessRate(result.newState)).toBeCloseTo(2 / 3)
  })

  it('tracks totalAttempts and totalCorrect', () => {
    let state = createDDA()
    let result = recordAnswer(state, true)
    result = recordAnswer(result.newState, false)
    result = recordAnswer(result.newState, true)
    expect(result.newState.totalAttempts).toBe(3)
    expect(result.newState.totalCorrect).toBe(2)
  })
})
