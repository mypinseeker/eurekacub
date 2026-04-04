import { useParams, useNavigate } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import TaskBar from '../components/TaskBar'
import HintButton from '../components/HintButton'
import FeedbackToast from '../components/FeedbackToast'
import AhaPopup from '../components/AhaPopup'
import { getRenderer } from '../renderers/registry'

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
 * Level-aware puzzle configurations for each renderer.
 * L1 = easy/guided, L2 = standard, L3 = challenge
 */
const PUZZLE_CONFIGS: Record<string, Record<string, Record<string, unknown>>> = {
  symmetry: {
    L1: { complexity: 1, showGrid: true, mirrorAxis: 'vertical' },
    L2: { complexity: 2, showGrid: true, mirrorAxis: 'vertical' },
    L3: { complexity: 3, showGrid: false, mirrorAxis: 'vertical' },
  },
  fraction: {
    L1: { targetSlices: 2, showGuides: true, tolerance: 20 },
    L2: { targetSlices: 4, showGuides: true, tolerance: 15 },
    L3: { targetSlices: 6, showGuides: false, tolerance: 10 },
  },
  geometry: {
    L1: { pieceCount: 4, snapTolerance: 30, showOutline: true },
    L2: { pieceCount: 5, snapTolerance: 20, showOutline: true },
    L3: { pieceCount: 7, snapTolerance: 15, showOutline: false },
  },
  derivative: {
    L1: { maxSpeed: 3, duration: 8, curveType: 'linear' },
    L2: { maxSpeed: 5, duration: 10, curveType: 'quadratic' },
    L3: { maxSpeed: 8, duration: 12, curveType: 'sinusoidal' },
  },
  equation: {
    L1: { leftSide: [3, 2], rightSide: 8, unknown: 3, unknownSide: 'left' },
    L2: { leftSide: [5, 3], rightSide: 12, unknown: 4, unknownSide: 'left' },
    L3: { leftSide: [7, 4, 2], rightSide: 18, unknown: 5, unknownSide: 'left' },
  },
  matrix: {
    L1: { gridSize: 4, maxSteps: 3, operations: ['rotate90'] },
    L2: { gridSize: 6, maxSteps: 5, operations: ['rotate90', 'flipH'] },
    L3: { gridSize: 8, maxSteps: 8, operations: ['rotate90', 'flipH', 'flipV', 'transpose'] },
  },
  sequence: {
    L1: { type: 'arithmetic', length: 5, blanks: 1 },
    L2: { type: 'arithmetic', length: 7, blanks: 2 },
    L3: { type: 'fibonacci', length: 8, blanks: 3 },
  },
  probability: {
    L1: { experiments: 1, flipsPerExperiment: 10 },
    L2: { experiments: 2, flipsPerExperiment: 20 },
    L3: { experiments: 3, flipsPerExperiment: 50 },
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
