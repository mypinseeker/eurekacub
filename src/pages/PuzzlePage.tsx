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
