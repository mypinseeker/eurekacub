# EurekaCub Audio Assets

## Required Sound Files

Place `.mp3` files in these directories. The AudioManager (`src/utils/audio.ts`) loads them by path.

### `ui/` — Interface sounds
- `tap.mp3` — Button tap/click (short, soft)

### `feedback/` — Learning feedback
- `correct-1.mp3` — Correct answer variant 1 (cheerful chime)
- `correct-2.mp3` — Correct answer variant 2 (bell ding)
- `correct-3.mp3` — Correct answer variant 3 (sparkle)
- `aha.mp3` — Aha moment (magical discovery sound)
- `celebrate.mp3` — Level complete celebration (fanfare)
- `hint.mp3` — Hint revealed (gentle notification)

### `module/` — Module-specific (future)
- `cut.mp3` — Pizza cutting sound (fraction module)
- `coin.mp3` — Coin flip sound (probability module)
- `train.mp3` — Train whistle (sequence module)
- `brush.mp3` — Drawing brush (symmetry module)

### `ambient/` — Background (default OFF)
- Reserved for future ambient music

## ⚠ Design Rules
- **NO error/failure sounds** — errors use haptic nudge only (educational principle)
- All sounds should be warm, encouraging, child-friendly
- Keep files small (<100KB each) for fast loading
- Format: MP3, 44.1kHz, mono, 128kbps

## Free Sound Sources
- [Freesound.org](https://freesound.org) (CC0 license)
- [Mixkit.co](https://mixkit.co/free-sound-effects/) (free license)
- [Pixabay Sound Effects](https://pixabay.com/sound-effects/) (Pixabay license)
