import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { haptic, setHapticEnabled } from '../../src/utils/haptic'

describe('Haptic Feedback', () => {
  let vibrateMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vibrateMock = vi.fn()
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateMock,
      writable: true,
      configurable: true,
    })
    setHapticEnabled(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('tap triggers short vibration (10ms)', () => {
    haptic.tap()
    expect(vibrateMock).toHaveBeenCalledWith(10)
  })

  it('click triggers medium vibration (20ms)', () => {
    haptic.click()
    expect(vibrateMock).toHaveBeenCalledWith(20)
  })

  it('success triggers pattern vibration', () => {
    haptic.success()
    expect(vibrateMock).toHaveBeenCalledWith([20, 50, 20])
  })

  it('aha triggers discovery pattern', () => {
    haptic.aha()
    expect(vibrateMock).toHaveBeenCalledWith([50, 30, 30, 30, 20])
  })

  it('celebrate triggers extended pattern', () => {
    haptic.celebrate()
    expect(vibrateMock).toHaveBeenCalledWith([30, 50, 30, 50, 30, 50, 80])
  })

  it('nudge (error) is very gentle (12ms)', () => {
    haptic.nudge()
    expect(vibrateMock).toHaveBeenCalledWith(12)
  })

  it('drag triggers minimal vibration (15ms)', () => {
    haptic.drag()
    expect(vibrateMock).toHaveBeenCalledWith(15)
  })

  it('hint triggers subtle vibration (8ms)', () => {
    haptic.hint()
    expect(vibrateMock).toHaveBeenCalledWith(8)
  })

  it('disabled state suppresses all vibrations', () => {
    setHapticEnabled(false)
    haptic.tap()
    haptic.success()
    haptic.aha()
    haptic.celebrate()
    haptic.nudge()
    expect(vibrateMock).not.toHaveBeenCalled()
  })

  it('re-enable restores vibrations', () => {
    setHapticEnabled(false)
    haptic.tap()
    expect(vibrateMock).not.toHaveBeenCalled()

    setHapticEnabled(true)
    haptic.tap()
    expect(vibrateMock).toHaveBeenCalledWith(10)
  })

  it('gracefully handles missing vibrate API', () => {
    Object.defineProperty(navigator, 'vibrate', {
      value: undefined,
      writable: true,
      configurable: true,
    })
    // Should not throw
    expect(() => haptic.tap()).not.toThrow()
    expect(() => haptic.success()).not.toThrow()
    expect(() => haptic.celebrate()).not.toThrow()
  })
})
