import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { motion } from 'framer-motion'
import TaskBar from '../components/TaskBar'
import HintButton from '../components/HintButton'
import FeedbackToast from '../components/FeedbackToast'
import AhaPopup from '../components/AhaPopup'
import { getRenderer } from '../renderers/registry'

export default function PuzzlePage() {
  const { moduleId, levelId } = useParams<{ moduleId: string; levelId: string }>()
  const navigate = useNavigate()
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
    setToast({ message: '\uD83C\uDF1F \u771F\u68D2\uFF01Correct!', type: 'success', visible: true })
  }

  const handleError = () => {
    setToast({ message: '\uD83E\uDD14 \u518D\u60F3\u60F3\u770B... Try again!', type: 'error', visible: true })
  }

  const handleAha = () => {
    setShowAha(true)
  }

  const handleComplete = () => {
    setToast({ message: '\uD83C\uDF89 \u5168\u90E8\u5B8C\u6210\uFF01All done!', type: 'success', visible: true })
    setTimeout(() => navigate(`/module/${moduleId}`), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 flex flex-col">
      <TaskBar
        title={`\u7B2C ${level.replace('L', '')} \u5173`}
        subtitle={`Module ${moduleId} - Level ${level}`}
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
              {'\u5373\u5C06\u5F00\u653E!'} Coming soon!
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              {'\u8FD9\u4E2A\u6A21\u5757\u6B63\u5728\u5EFA\u9020\u4E2D...'} This module is being built...
            </p>
            <div className="inline-flex gap-2 items-center px-4 py-2 bg-white/60 rounded-xl text-xs text-gray-500 border border-gray-200">
              <span>Module: {moduleId}</span>
              <span className="text-gray-300">|</span>
              <span>Level: {level}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom area: hints + feedback */}
      <div className="p-4 pb-8">
        <HintButton
          hints={[
            { zh: '\u4ED4\u7EC6\u89C2\u5BDF\u89C4\u5F8B', en: 'Look for the pattern' },
            { zh: '\u8BD5\u8BD5\u4ECE\u7B80\u5355\u7684\u5F00\u59CB', en: 'Start with something simple' },
            { zh: '\u6BD4\u8F83\u524D\u540E\u7684\u53D8\u5316', en: 'Compare the changes' },
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
