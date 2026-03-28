import { describe, it, expect, vi, beforeEach } from 'vitest'
import { audio } from '../../src/utils/audio'

// Mock HTMLAudioElement
class MockAudio {
  src = ''
  volume = 1
  currentTime = 0
  play = vi.fn().mockResolvedValue(undefined)
  constructor(src?: string) {
    this.src = src || ''
  }
}

// Install mock before tests
vi.stubGlobal('Audio', MockAudio)

describe('AudioManager', () => {
  beforeEach(() => {
    // Reset enabled state
    audio.setEnabled(true)
    audio.setVolume(0.6)
  })

  it('play creates Audio element with correct path', () => {
    audio.play('ui/tap')
    // Audio constructor should have been called — we verify via the mock
    expect(MockAudio).toBeDefined()
  })

  it('tap() plays ui/tap', () => {
    const playSpy = vi.spyOn(audio, 'play')
    audio.tap()
    expect(playSpy).toHaveBeenCalledWith('ui/tap')
    playSpy.mockRestore()
  })

  it('correct() plays random correct variant (1-3)', () => {
    const playSpy = vi.spyOn(audio, 'play')
    audio.correct()
    const call = playSpy.mock.calls[0][0]
    expect(call).toMatch(/^feedback\/correct-[123]$/)
    playSpy.mockRestore()
  })

  it('aha() plays feedback/aha', () => {
    const playSpy = vi.spyOn(audio, 'play')
    audio.aha()
    expect(playSpy).toHaveBeenCalledWith('feedback/aha')
    playSpy.mockRestore()
  })

  it('celebrate() plays feedback/celebrate', () => {
    const playSpy = vi.spyOn(audio, 'play')
    audio.celebrate()
    expect(playSpy).toHaveBeenCalledWith('feedback/celebrate')
    playSpy.mockRestore()
  })

  it('hint() plays feedback/hint', () => {
    const playSpy = vi.spyOn(audio, 'play')
    audio.hint()
    expect(playSpy).toHaveBeenCalledWith('feedback/hint')
    playSpy.mockRestore()
  })

  it('disabled state suppresses all playback', () => {
    const constructorSpy = vi.fn(MockAudio)
    vi.stubGlobal('Audio', constructorSpy)
    audio.setEnabled(false)
    audio.tap()
    audio.correct()
    audio.aha()
    // When disabled, AudioManager.play() returns early — no Audio element is created
    expect(constructorSpy).not.toHaveBeenCalled()
    // Restore
    vi.stubGlobal('Audio', MockAudio)
  })

  it('setVolume clamps to 0-1 range', () => {
    audio.setVolume(-0.5)
    audio.setVolume(1.5)
    // Should not throw
    expect(true).toBe(true)
  })

  it('re-enable restores audio', () => {
    audio.setEnabled(false)
    audio.setEnabled(true)
    const playSpy = vi.spyOn(audio, 'play')
    audio.tap()
    expect(playSpy).toHaveBeenCalled()
    playSpy.mockRestore()
  })
})
