class AudioManager {
  private cache = new Map<string, HTMLAudioElement>()
  private enabled = true
  private volume = 0.6

  play(id: string) {
    if (!this.enabled) return
    try {
      let el = this.cache.get(id)
      if (!el) {
        el = new Audio(`/audio/${id}.mp3`)
        this.cache.set(id, el)
      }
      el.volume = this.volume
      el.currentTime = 0
      el.play().catch(() => {
        // Ignore autoplay policy errors silently
      })
    } catch {
      // Audio not available (SSR, test env, etc.)
    }
  }

  setEnabled(v: boolean) {
    this.enabled = v
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v))
  }

  // Shortcuts
  tap() { this.play('ui/tap') }
  correct() { this.play(`feedback/correct-${Math.ceil(Math.random() * 3)}`) }
  aha() { this.play('feedback/aha') }
  celebrate() { this.play('feedback/celebrate') }
  hint() { this.play('feedback/hint') }
}

export const audio = new AudioManager()
