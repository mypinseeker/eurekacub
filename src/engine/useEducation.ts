import { useState, useCallback, useRef } from 'react'
import { createDDA, recordAnswer, getSuccessRate, type DDAState } from './dda'
import { createScaffold, triggerScaffold, resetScaffold, getCurrentHint, type ScaffoldState } from './scaffold'
import { selectFeedback, type FeedbackMessage } from './feedback'
import { updateLevelProgress } from './progress'
import { createEIS, advanceEIS, setEISMode, type EISState, type EISMode } from './eis'

export function useEducation(
  moduleId: string,
  levelId: string,
  feedbackMessages: FeedbackMessage[]
) {
  const [dda, setDda] = useState<DDAState>(() => createDDA())
  const [scaffold, setScaffold] = useState<ScaffoldState>(() => createScaffold())
  const [eis, setEis] = useState<EISState>(() => createEIS())
  const [feedback, setFeedback] = useState<string>('')
  const [locale, setLocale] = useState<'zh' | 'en'>('zh')
  const streakRef = useRef(0)

  const submitAnswer = useCallback(
    (correct: boolean) => {
      const result = recordAnswer(dda, correct)
      setDda(result.newState)

      if (correct) {
        streakRef.current += 1
      } else {
        streakRef.current = 0
      }

      // Determine feedback context
      let context = 'default'
      if (correct && streakRef.current >= 3) context = 'streak'
      else if (correct && scaffold.level !== 'idle') context = 'after-struggle'
      else if (correct) context = 'first-try'

      // Select feedback message
      const category = correct ? 'correct' : 'error'
      const msg = selectFeedback(feedbackMessages, category, context, locale)
      setFeedback(msg)

      // Scaffold handling
      if (result.shouldScaffold) {
        setScaffold((s) => triggerScaffold(s))
      } else if (correct) {
        setScaffold((s) => resetScaffold(s))
      }

      // Auto-advance EIS on difficulty increase
      if (result.difficultyChanged === 'up') {
        setEis((s) => advanceEIS(s))
      }

      // Save progress
      updateLevelProgress(moduleId, levelId, {
        bestDifficulty: Math.max(dda.difficulty, result.newState.difficulty),
        lastPlayedAt: new Date().toISOString(),
      })

      return result
    },
    [dda, scaffold.level, feedbackMessages, locale, moduleId, levelId]
  )

  const requestHint = useCallback(
    <T>(hints: T[]): T | null => {
      const newScaffold = triggerScaffold(scaffold)
      setScaffold(newScaffold)
      return getCurrentHint(newScaffold, hints)
    },
    [scaffold]
  )

  const switchEIS = useCallback((mode: EISMode) => {
    setEis((s) => setEISMode(s, mode))
  }, [])

  return {
    // DDA
    difficulty: dda.difficulty,
    successRate: getSuccessRate(dda),
    totalAttempts: dda.totalAttempts,

    // Actions
    submitAnswer,
    requestHint,

    // Scaffold
    scaffoldLevel: scaffold.level,

    // Feedback
    feedback,

    // EIS
    eis: eis.currentMode,
    eisState: eis,
    switchEIS,

    // Locale
    setLocale,
  }
}
