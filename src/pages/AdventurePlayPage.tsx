import { useParams, useNavigate } from 'react-router-dom'
import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ADVENTURES } from '../data/adventures'
import { getRenderer } from '../renderers/registry'
import FeedbackToast from '../components/FeedbackToast'

type Direction = 'forward' | 'backward'

const slideVariants = {
  enter: (dir: Direction) => ({
    x: dir === 'forward' ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: Direction) => ({
    x: dir === 'forward' ? -300 : 300,
    opacity: 0,
  }),
}

export default function AdventurePlayPage() {
  const { adventureId, stageId } = useParams<{ adventureId: string; stageId?: string }>()
  const navigate = useNavigate()

  const adventure = useMemo(
    () => ADVENTURES.find((a) => a.id === Number(adventureId)),
    [adventureId],
  )

  const totalStages = adventure?.stages.length ?? 0
  const currentStageIndex = stageId ? Number(stageId) - 1 : 0
  const stage = adventure?.stages[currentStageIndex]

  const [puzzleSolved, setPuzzleSolved] = useState(false)
  const [direction, setDirection] = useState<Direction>('forward')
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error' | 'info'
    visible: boolean
  }>({ message: '', type: 'info', visible: false })

  const rendererEntry = stage ? getRenderer(stage.renderer_id) : undefined
  const RendererComponent = rendererEntry?.component

  const handleCorrect = useCallback(() => {
    setPuzzleSolved(true)
    setToast({ message: '\uD83C\uDF1F \u592A\u68D2\u4E86\uFF01Excellent!', type: 'success', visible: true })
  }, [])

  const handleError = useCallback(() => {
    setToast({ message: '\uD83E\uDD14 \u518D\u8BD5\u8BD5\u770B\uFF01Try again!', type: 'error', visible: true })
  }, [])

  const handleAha = useCallback(() => {
    setToast({ message: '\uD83D\uDCA1 \u539F\u6765\u5982\u6B64\uFF01Aha!', type: 'info', visible: true })
  }, [])

  const handleComplete = useCallback(() => {
    setPuzzleSolved(true)
    setToast({ message: '\u2705 \u8FC7\u5173\u4E86\uFF01Stage complete!', type: 'success', visible: true })
  }, [])

  const goToStage = useCallback(
    (nextIndex: number) => {
      if (!adventure) return
      setDirection(nextIndex > currentStageIndex ? 'forward' : 'backward')
      setPuzzleSolved(false)
      navigate(`/adventure/${adventure.id}/stage/${nextIndex + 1}`, { replace: true })
    },
    [adventure, currentStageIndex, navigate],
  )

  const handleNext = useCallback(() => {
    if (currentStageIndex < totalStages - 1) {
      goToStage(currentStageIndex + 1)
    } else {
      setToast({ message: '\uD83C\uDF89 \u5192\u9669\u5B8C\u6210\uFF01Adventure Complete!', type: 'success', visible: true })
      setTimeout(() => navigate('/adventures'), 2000)
    }
  }, [currentStageIndex, totalStages, goToStage, navigate])

  // Not found state
  if (!adventure || !stage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-red-300 to-orange-400 flex items-center justify-center mb-4 shadow-lg"
        >
          <span className="text-4xl">{'\uD83D\uDE45'}</span>
        </motion.div>
        <h2 className="text-xl font-extrabold text-gray-700 mb-2">{'\u627E\u4E0D\u5230\u8FD9\u4E2A\u5192\u9669'}</h2>
        <p className="text-gray-400 text-sm mb-4">Adventure not found</p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/adventures')}
          className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#FF6B6B] to-[#FF8C42] text-white font-bold shadow-lg shadow-orange-200/50 hover:shadow-xl transition-shadow"
        >
          {'\u8FD4\u56DE\u5192\u9669\u5217\u8868'}
        </motion.button>
      </div>
    )
  }

  const progressPercent = ((currentStageIndex + 1) / totalStages) * 100

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar: adventure title + progress */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{adventure.icon}</span>
            <div>
              <h1 className="text-sm font-extrabold text-gray-800 leading-tight">
                {adventure.title_zh}
              </h1>
              <p className="text-[11px] text-gray-400">{adventure.title_en}</p>
            </div>
          </div>
          <span className="text-xs font-bold text-white bg-gradient-to-r from-[#FF6B6B] to-[#FF8C42] px-2.5 py-1 rounded-full shadow-sm">
            {currentStageIndex + 1}/{totalStages}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 bg-orange-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#FFB627] via-[#FF8C42] to-[#FF6B6B]"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Story narrative — speech bubble */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={`narrative-${currentStageIndex}`}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="px-4 py-3"
        >
          <div className="flex items-start gap-3">
            {/* Character avatar */}
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 shadow-md flex items-center justify-center text-2xl border-3 border-white">
              {stage.character}
            </div>

            {/* Speech bubble */}
            <div className="relative flex-1 bg-white rounded-3xl rounded-tl-lg p-4 shadow-md border-2 border-orange-100">
              {/* Bubble tail */}
              <div className="absolute -left-2 top-3 w-3 h-3 bg-white border-l-2 border-b-2 border-orange-100 rotate-45" />
              <p className="text-sm text-gray-700 leading-relaxed relative z-10 font-medium">
                {stage.narrative_zh}
              </p>
              <p className="text-[11px] text-gray-400 mt-1 relative z-10">
                {stage.narrative_en}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Puzzle area — renderer */}
      <div className="flex-1 flex items-center justify-center px-4 py-2">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`puzzle-${currentStageIndex}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="w-full max-w-lg"
          >
            {RendererComponent ? (
              <div className="bg-white/80 rounded-3xl p-4 border-2 border-orange-100 shadow-md">
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="text-xs font-bold text-gray-400">
                    {rendererEntry?.name.zh}
                  </span>
                  <span className="text-[10px] text-gray-300">|</span>
                  <span className="text-[10px] text-gray-400">
                    {rendererEntry?.name.en}
                  </span>
                </div>
                <RendererComponent
                  puzzle={stage.puzzle}
                  onCorrect={handleCorrect}
                  onError={handleError}
                  onAha={handleAha}
                  onComplete={handleComplete}
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-4xl mb-2"
                >
                  {'\uD83D\uDEA7'}
                </motion.div>
                <p className="text-sm text-gray-400">
                  {'\u6E32\u67D3\u5668'} <code className="text-xs bg-orange-50 px-1.5 py-0.5 rounded-lg border border-orange-100">{stage.renderer_id}</code> {'\u52A0\u8F7D\u4E2D...'}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="px-4 py-4 pb-8">
        <div className="flex justify-between items-center">
          {/* Back button */}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => {
              if (currentStageIndex > 0) {
                goToStage(currentStageIndex - 1)
              } else {
                navigate('/adventures')
              }
            }}
            className="px-4 py-2.5 rounded-2xl bg-white text-gray-600 text-sm font-bold border-2 border-gray-100 shadow-sm hover:shadow-md transition-all"
          >
            {currentStageIndex > 0 ? '\u2190 \u4E0A\u4E00\u5173' : '\u2190 \u8FD4\u56DE'}
          </motion.button>

          {/* Stage dots */}
          <div className="flex gap-1.5">
            {adventure.stages.map((_, i) => (
              <button
                key={i}
                onClick={() => goToStage(i)}
                className={`
                  w-2.5 h-2.5 rounded-full transition-all duration-300
                  ${i === currentStageIndex
                    ? 'bg-[#FF6B6B] scale-125 shadow-sm shadow-red-200'
                    : i < currentStageIndex
                      ? 'bg-[#FFB627]'
                      : 'bg-gray-200'
                  }
                `}
              />
            ))}
          </div>

          {/* Next / Complete button */}
          <motion.button
            onClick={handleNext}
            whileTap={{ scale: 0.93 }}
            whileHover={puzzleSolved ? { scale: 1.05 } : undefined}
            className={`
              px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300
              ${puzzleSolved
                ? 'bg-gradient-to-r from-[#FF6B6B] to-[#FF8C42] text-white shadow-lg shadow-orange-200/50 hover:shadow-xl'
                : 'bg-gray-100 text-gray-300 cursor-default'
              }
            `}
            disabled={!puzzleSolved}
          >
            {currentStageIndex < totalStages - 1
              ? '\u4E0B\u4E00\u5173 \u2192'
              : '\u2705 \u5B8C\u6210\u5192\u9669'
            }
          </motion.button>
        </div>
      </div>

      <FeedbackToast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </div>
  )
}
