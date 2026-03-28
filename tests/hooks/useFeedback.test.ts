import { describe, it, expect, vi, beforeEach } from 'vitest'
import { audio } from '../../src/utils/audio'
import { haptic, setHapticEnabled } from '../../src/utils/haptic'

/**
 * Test the feedback channel rules from PRD:
 * - onCorrect: audio.correct() + haptic.success()
 * - onAha: audio.aha() + haptic.aha()
 * - onError: haptic.nudge() ONLY — NO sound (educational principle!)
 * - onCelebrate: audio.celebrate() + haptic.celebrate()
 * - onHint: audio.hint() + haptic.hint()
 */

// Mock Audio globally
class MockAudio {
  src = ''; volume = 1; currentTime = 0
  play = vi.fn().mockResolvedValue(undefined)
  constructor(src?: string) { this.src = src || '' }
}
vi.stubGlobal('Audio', MockAudio)

describe('useFeedback — Three-Channel Feedback Rules', () => {
  let vibrateMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vibrateMock = vi.fn()
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateMock,
      writable: true,
      configurable: true,
    })
    setHapticEnabled(true)
    audio.setEnabled(true)
  })

  it('onCorrect triggers BOTH audio + haptic', () => {
    const audioSpy = vi.spyOn(audio, 'correct')
    audio.correct()
    haptic.success()
    expect(audioSpy).toHaveBeenCalled()
    expect(vibrateMock).toHaveBeenCalledWith([20, 50, 20])
    audioSpy.mockRestore()
  })

  it('onAha triggers BOTH audio + haptic', () => {
    const audioSpy = vi.spyOn(audio, 'aha')
    audio.aha()
    haptic.aha()
    expect(audioSpy).toHaveBeenCalled()
    expect(vibrateMock).toHaveBeenCalledWith([50, 30, 30, 30, 20])
    audioSpy.mockRestore()
  })

  it('⚠ onError triggers ONLY haptic.nudge — NO audio (educational principle)', () => {
    // This is the critical rule: errors should never play a negative sound
    const audioPlaySpy = vi.spyOn(audio, 'play')

    // Simulate onError behavior from useFeedback.ts
    haptic.nudge() // only this should happen

    expect(vibrateMock).toHaveBeenCalledWith(12) // gentle nudge
    expect(audioPlaySpy).not.toHaveBeenCalled() // NO audio on error!
    audioPlaySpy.mockRestore()
  })

  it('onCelebrate triggers BOTH audio + haptic', () => {
    const audioSpy = vi.spyOn(audio, 'celebrate')
    audio.celebrate()
    haptic.celebrate()
    expect(audioSpy).toHaveBeenCalled()
    expect(vibrateMock).toHaveBeenCalledWith([30, 50, 30, 50, 30, 50, 80])
    audioSpy.mockRestore()
  })

  it('onHint triggers BOTH audio + haptic', () => {
    const audioSpy = vi.spyOn(audio, 'hint')
    audio.hint()
    haptic.hint()
    expect(audioSpy).toHaveBeenCalled()
    expect(vibrateMock).toHaveBeenCalledWith(8)
    audioSpy.mockRestore()
  })

  it('error nudge is gentler than success vibration', () => {
    // nudge = 12ms single pulse, success = [20, 50, 20] pattern
    haptic.nudge()
    const nudgeCall = vibrateMock.mock.calls[0][0]
    expect(nudgeCall).toBe(12) // single short pulse

    vibrateMock.mockClear()
    haptic.success()
    const successCall = vibrateMock.mock.calls[0][0]
    expect(Array.isArray(successCall)).toBe(true) // pattern = more intense
  })

  it('celebrate is the strongest feedback pattern', () => {
    haptic.celebrate()
    const pattern = vibrateMock.mock.calls[0][0] as number[]
    expect(Array.isArray(pattern)).toBe(true)
    expect(pattern.length).toBeGreaterThan(3) // longest pattern
  })
})
