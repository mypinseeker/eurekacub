import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import TaskBar from '../components/TaskBar'
import HintButton from '../components/HintButton'
import FeedbackToast from '../components/FeedbackToast'
import AhaPopup from '../components/AhaPopup'
import { getRenderer } from '../renderers/registry'

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

  // Try to get renderer from registry
  const rendererEntry = getRenderer(moduleId ?? '')
  const RendererComponent = rendererEntry?.component

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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 flex flex-col">
      <TaskBar
        title={t('puzzle.stageTitle', { num: level.replace('L', '') })}
        subtitle={`${t('module.label')} ${moduleId} - ${t('level.' + level)}`}
        onBack={() => navigate(`/module/${moduleId}`)}
      />

      {/* Renderer area */}
      <div className="flex-1 flex items-center justify-center p-4">
        {RendererComponent ? (
          <RendererComponent
            puzzle={{}}
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
              className="text-7xl mb-4"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              {'\uD83D\uDEA7'}
            </motion.div>
            <h2 className="text-xl font-extrabold text-gray-700 mb-2">
              {t('puzzle.comingSoon')}
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              {t('puzzle.building')}
            </p>
            <div className="inline-flex gap-2 items-center px-4 py-2 bg-white/60 rounded-xl text-xs text-gray-500 border border-gray-200">
              <span>{t('module.label')}: {moduleId}</span>
              <span className="text-gray-300">|</span>
              <span>{t('level.' + level)}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom area: hints + feedback */}
      <div className="p-4 pb-8">
        <HintButton
          hints={[
            { zh: t('hint.observe'), en: t('hint.observe') },
            { zh: t('hint.startSimple'), en: t('hint.startSimple') },
            { zh: t('hint.compare'), en: t('hint.compare') },
          ]}
        />
      </div>

      {/* Feedback toast */}
      <FeedbackToast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
      />

      {/* Aha popup */}
      <AhaPopup visible={showAha} onClose={() => setShowAha(false)} />
    </div>
  )
}
