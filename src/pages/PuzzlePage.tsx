import { useParams, useNavigate } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import TaskBar from '../components/TaskBar'
import HintButton from '../components/HintButton'
import FeedbackToast from '../components/FeedbackToast'
import AhaPopup from '../components/AhaPopup'
import { getRenderer } from '../renderers/registry'
import { getRandomPuzzle } from '../renderers/geometry/tangram.puzzles'

/* Map moduleId (m1-m8) → renderer registry id */
const MODULE_RENDERER_MAP: Record<string, string> = {
  m1: 'symmetry',
  m2: 'fraction',
  m3: 'geometry',
  m4: 'derivative',
  m5: 'equation',
  m6: 'matrix',
  m7: 'sequence',
  m8: 'probability',
}

/**
 * Sample a position curve at `n + 1` evenly spaced time steps over t ∈ [0, 1].
 * SpeedController expects the series to start at 0 and end at the finish line.
 */
const curve = (fn: (t: number) => number, n = 40): number[] =>
  Array.from({ length: n + 1 }, (_, i) => fn(i / n))

/**
 * Level-aware puzzle configurations for each renderer.
 * L1 = easy/guided, L2 = standard, L3 = challenge
 *
 * ⚠️ Every key here must match what the target renderer actually reads off `puzzle.data`.
 * Renderers fall back to their own defaults for unknown/missing fields, so a misspelled key
 * does not fail loudly — it silently makes all three levels identical. That is exactly what
 * had happened to symmetry / derivative / matrix / probability before 2026-09-07.
 */
export const PUZZLE_CONFIGS: Record<string, Record<string, Record<string, unknown>>> = {
  // MirrorCanvas reads `{ targetPoints, mirrorAxis, tolerance }`. `complexity`/`showGrid` were
  // never read and `targetPoints` was never supplied, so every level showed an EMPTY target half
  // — there was nothing to mirror at any difficulty. Points are polylines of [x, y] in normalised
  // 0-1 space within the target half; tolerance loosens for younger/earlier levels.
  symmetry: {
    // a plain peak — two strokes, very forgiving
    L1: {
      targetPoints: [[[0.2, 0.85], [0.5, 0.25], [0.8, 0.85]]],
      mirrorAxis: 'vertical',
      tolerance: 0.22,
    },
    // a little house: outline plus a separate door stroke
    L2: {
      targetPoints: [
        [[0.2, 0.85], [0.2, 0.5], [0.5, 0.22], [0.8, 0.5], [0.8, 0.85], [0.2, 0.85]],
        [[0.42, 0.85], [0.42, 0.62], [0.58, 0.62], [0.58, 0.85]],
      ],
      mirrorAxis: 'vertical',
      tolerance: 0.18,
    },
    // a butterfly wing plus antenna — more vertices, tighter tolerance
    L3: {
      targetPoints: [
        [[0.5, 0.8], [0.22, 0.72], [0.14, 0.48], [0.34, 0.38], [0.5, 0.5], [0.5, 0.8]],
        [[0.5, 0.5], [0.3, 0.3], [0.18, 0.16]],
        [[0.5, 0.5], [0.5, 0.2]],
      ],
      mirrorAxis: 'vertical',
      tolerance: 0.14,
    },
  },
  fraction: {
    L1: { targetSlices: 2, showGuides: true, tolerance: 20 },
    L2: { targetSlices: 4, showGuides: true, tolerance: 15 },
    L3: { targetSlices: 6, showGuides: false, tolerance: 10 },
  },
  geometry: {}, // geometry uses tangram.puzzles.ts — handled specially below
  // SpeedController reads `{ targetCurve, duration, finishLine, theme }`. `maxSpeed`/`curveType`
  // were never read and `targetCurve` was never supplied, so all three levels drew the renderer's
  // built-in S-curve — the levels were identical. `targetCurve` is a POSITION series (not speed)
  // sampled at even time steps, and must end at `finishLine`.
  derivative: {
    // constant speed — a straight ramp
    L1: { targetCurve: curve((t) => 100 * t), duration: 8, finishLine: 100, theme: 'car' },
    // steadily accelerating — the classic "speeding up" shape
    L2: { targetCurve: curve((t) => 100 * t * t), duration: 10, finishLine: 100, theme: 'rocket' },
    // fast → slow → fast; still monotonic, so the car never has to go backwards
    L3: { targetCurve: curve((t) => 100 * t + 12 * Math.sin(2 * Math.PI * t)), duration: 12, finishLine: 100, theme: 'swim' },
  },
  // BalanceScale reads `rightSide` as a number[] (it spreads it to weigh the pan), and needs
  // `options` to contain `unknown` — otherwise the right answer is not on screen and the level
  // is unwinnable. Both were wrong here: rightSide was a bare number (crashed on `[...rightSide]`)
  // and options was missing (fell back to a default that never contains the answer).
  // Reads as "leftSide + ? = rightSide" when unknownSide is 'left'.
  equation: {
    L1: { leftSide: [3, 2], rightSide: [8], unknown: 3, unknownSide: 'left', options: [1, 2, 3, 4, 5] },
    L2: { leftSide: [5, 3], rightSide: [12], unknown: 4, unknownSide: 'left', options: [2, 3, 4, 5, 6] },
    L3: { leftSide: [7, 4, 2], rightSide: [18], unknown: 5, unknownSide: 'left', options: [3, 4, 5, 6, 7] },
  },
  // PixelArt reads `allowedTransforms` (not `operations`) and derives the grid size from
  // `initialGrid`/`targetGrid` (it has no `gridSize` knob). With the old key names every level
  // silently fell back to the renderer default, which offers ALL four transforms — so L1 was
  // never actually easier than L3. `initialGrid`/`targetGrid` still use the renderer's built-in
  // artwork; only the transform palette and step budget differ per level.
  matrix: {
    L1: { maxSteps: 3, allowedTransforms: ['rotate90'] },
    L2: { maxSteps: 5, allowedTransforms: ['rotate90', 'flipH'] },
    L3: { maxSteps: 8, allowedTransforms: ['rotate90', 'flipH', 'flipV', 'transpose'] },
  },
  // NumberTrain reads `{ sequence, blanks, options }`. `blanks` is an array of INDICES into
  // `sequence` (it becomes `new Set(blanks)`) — a bare count crashed it. `sequence` must hold the
  // TRUE value at each blank index, because that value is the answer key; the UI renders '?' for
  // any index in `blanks`, so the answer is never revealed. `options` must contain every answer.
  sequence: {
    // 2,4,6,?,10 → 8
    L1: { sequence: [2, 4, 6, 8, 10], blanks: [3], rule: '+2', options: [5, 7, 8, 9] },
    // 3,6,?,12,15,?,21 → 9 and 18
    L2: { sequence: [3, 6, 9, 12, 15, 18, 21], blanks: [2, 5], rule: '+3', options: [7, 9, 11, 18, 20] },
    // 1,1,2,3,?,8,?,? → 5, 13, 21
    L3: { sequence: [1, 1, 2, 3, 5, 8, 13, 21], blanks: [4, 6, 7], rule: 'fibonacci', options: [4, 5, 9, 13, 17, 21] },
  },
  // CoinFlip reads `totalFlips`. `experiments`/`flipsPerExperiment` were never read, so all three
  // levels ran the renderer's default flip count — the "50 flips" challenge level did not exist.
  probability: {
    L1: { totalFlips: 10 },
    L2: { totalFlips: 20 },
    L3: { totalFlips: 50 },
  },
}

export default function PuzzlePage() {
  const { moduleId, levelId } = useParams<{ moduleId: string; levelId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const level = levelId ?? 'L1'

  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error' | 'info'
    visible: boolean
  }>({ message: '', type: 'info', visible: false })
  const [showAha, setShowAha] = useState(false)

  const rendererId = MODULE_RENDERER_MAP[moduleId ?? ''] ?? moduleId ?? ''
  const rendererEntry = getRenderer(rendererId)
  const RendererComponent = rendererEntry?.component

  // Build puzzle config based on renderer + level
  const puzzleConfig = useMemo(() => {
    // Geometry uses pre-designed tangram puzzles
    if (rendererId === 'geometry') {
      const preset = getRandomPuzzle(level)
      return {
        targetOutline: preset.outline,
        slots: preset.slots,
        pieces: preset.pieces,
        difficulty: level === 'L1' ? 1 : level === 'L2' ? 2 : 3,
        showOutline: level !== 'L3',
        puzzleName: preset.name,
        puzzleIcon: preset.icon,
      }
    }
    const configs = PUZZLE_CONFIGS[rendererId]
    return configs?.[level] ?? configs?.L1 ?? {}
  }, [rendererId, level])

  const handleCorrect = () => {
    setToast({ message: `\uD83C\uDF1F ${t('puzzle.correct')}`, type: 'success', visible: true })
  }

  const handleError = () => {
    setToast({ message: `\uD83E\uDD14 ${t('feedback.tryAgain')}`, type: 'error', visible: true })
  }

  const handleAha = () => {
    setShowAha(true)
  }

  const handleComplete = () => {
    setToast({ message: `\uD83C\uDF89 ${t('puzzle.allDone')}`, type: 'success', visible: true })
    setTimeout(() => navigate(`/module/${moduleId}`), 2000)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TaskBar
        title={t('puzzle.stageTitle', { num: level.replace('L', '') })}
        subtitle={`${t('module.label')} ${moduleId} · ${t('level.' + level)}`}
        onBack={() => navigate(`/module/${moduleId}`)}
      />

      {/* Renderer area */}
      <div className="flex-1 flex items-center justify-center p-4">
        {RendererComponent ? (
          <RendererComponent
            puzzle={puzzleConfig}
            onCorrect={handleCorrect}
            onError={handleError}
            onAha={handleAha}
            onComplete={handleComplete}
          />
        ) : (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
          >
            <motion.div
              className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 shadow-lg shadow-orange-200/60 flex items-center justify-center mx-auto mb-6"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="text-5xl">{'\uD83D\uDEA7'}</span>
            </motion.div>
            <h2 className="text-xl font-extrabold text-gray-700 mb-2">
              {t('puzzle.comingSoon')}
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              {t('puzzle.building')}
            </p>
            <div className="inline-flex gap-2 items-center px-4 py-2 bg-white rounded-2xl text-xs text-gray-500 border border-orange-100 shadow-sm">
              <span>{t('module.label')}: {moduleId}</span>
              <span className="text-orange-300">|</span>
              <span>{t('level.' + level)}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Hints */}
      <div className="p-4 pb-8">
        <HintButton
          hints={[
            { zh: t('hint.observe'), en: t('hint.observe') },
            { zh: t('hint.startSimple'), en: t('hint.startSimple') },
            { zh: t('hint.compare'), en: t('hint.compare') },
          ]}
        />
      </div>

      <FeedbackToast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
      />

      <AhaPopup visible={showAha} onClose={() => setShowAha(false)} />
    </div>
  )
}
