import { motion } from 'framer-motion'

/**
 * PuzzleIntro — Universal intro overlay for all renderers.
 *
 * Shows before the puzzle starts:
 * 1. 🎯 Goal — what the player needs to achieve
 * 2. 🎮 How to play — what gestures/actions to use
 * 3. 💡 Why — educational insight (what math concept this teaches)
 */

export interface PuzzleIntroProps {
  icon: string
  title: { zh: string; en: string }
  goal: { zh: string; en: string }
  howTo: { zh: string; en: string }[]
  insight: { zh: string; en: string }
  onStart: () => void
}

export default function PuzzleIntro({
  icon,
  title,
  goal,
  howTo,
  insight,
  onStart,
}: PuzzleIntroProps) {
  return (
    <motion.div
      className="w-full max-w-md mx-auto px-5 py-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
    >
      {/* Header */}
      <div className="text-center mb-5">
        <motion.span
          className="text-5xl block mb-2"
          animate={{ scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {icon}
        </motion.span>
        <h2 className="text-xl font-extrabold text-gray-800">{title.zh}</h2>
        <p className="text-xs text-gray-400 mt-0.5">{title.en}</p>
      </div>

      {/* Goal */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-4 mb-3 border border-orange-100">
        <div className="flex items-start gap-2.5">
          <span className="text-lg mt-0.5">🎯</span>
          <div>
            <h3 className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">目标 Goal</h3>
            <p className="text-sm text-gray-700 leading-relaxed font-medium">{goal.zh}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{goal.en}</p>
          </div>
        </div>
      </div>

      {/* How to play */}
      <div className="bg-gradient-to-r from-blue-50 to-sky-50 rounded-2xl p-4 mb-3 border border-blue-100">
        <div className="flex items-start gap-2.5">
          <span className="text-lg mt-0.5">🎮</span>
          <div>
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1.5">玩法 How to Play</h3>
            <ul className="space-y-1.5">
              {howTo.map((step, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-xs font-bold text-blue-400 mt-0.5 shrink-0">{i + 1}.</span>
                  <div>
                    <p className="text-sm text-gray-700 font-medium">{step.zh}</p>
                    <p className="text-[11px] text-gray-400">{step.en}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Educational insight */}
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl p-4 mb-5 border border-violet-100">
        <div className="flex items-start gap-2.5">
          <span className="text-lg mt-0.5">💡</span>
          <div>
            <h3 className="text-xs font-bold text-violet-600 uppercase tracking-wider mb-1">启发 Insight</h3>
            <p className="text-sm text-gray-700 leading-relaxed font-medium">{insight.zh}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{insight.en}</p>
          </div>
        </div>
      </div>

      {/* Start button */}
      <motion.button
        onClick={onStart}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.03 }}
        className="
          w-full py-3.5 rounded-2xl text-base font-extrabold text-white
          bg-gradient-to-r from-[#FF6B6B] via-[#FF8C42] to-[#FFB627]
          shadow-lg shadow-orange-200/50 hover:shadow-xl
          transition-shadow duration-200
        "
      >
        🚀 开始挑战！Start!
      </motion.button>
    </motion.div>
  )
}
