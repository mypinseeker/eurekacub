import { useCallback } from 'react'
import { audio } from '../utils/audio'
import { haptic } from '../utils/haptic'

export function useFeedback() {
  const onCorrect = useCallback(() => { audio.correct(); haptic.success() }, [])
  const onAha = useCallback(() => { audio.aha(); haptic.aha() }, [])
  const onCelebrate = useCallback(() => { audio.celebrate(); haptic.celebrate() }, [])
  const onSnap = useCallback(() => { audio.tap(); haptic.click() }, [])
  const onHint = useCallback(() => { audio.hint(); haptic.hint() }, [])
  const onError = useCallback(() => { haptic.nudge() }, []) // NO sound on error!
  const onDrag = useCallback(() => { haptic.drag() }, [])

  return { onCorrect, onAha, onCelebrate, onSnap, onHint, onError, onDrag }
}
