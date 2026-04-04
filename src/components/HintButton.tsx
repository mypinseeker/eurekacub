import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface HintButtonProps {
  hints: Array<{ zh: string; en: string }>
}

export default function HintButton({ hints }: HintButtonProps) {
  const [hintIndex, setHintIndex] = useState(-1)

  const showNextHint = () => {
    if (hintIndex < hints.length - 1) {
      setHintIndex((prev) => prev + 1)
    }
  }

  const hasMoreHints = hintIndex < hints.length - 1

  return (
    <div className="flex flex-col items-center gap-2.5">
      {/* Current hint display */}
      <AnimatePresence mode="wait">
        {hintIndex >= 0 && (
          <motion.div
            key={hintIndex}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="px-5 py-3 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-2xl text-sm text-amber-800 shadow-md shadow-yellow-100/50"
          >
            <span className="font-bold">
              {'\ud83d\udca1'} {hints[hintIndex]?.zh}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint button */}
      {hasMoreHints && (
        <motion.button
          onClick={showNextHint}
          whileTap={{ scale: 0.93 }}
          whileHover={{ scale: 1.05 }}
          className="
            px-6 py-2.5 rounded-full bg-gradient-to-r from-yellow-300 to-amber-400
            text-white font-extrabold text-sm shadow-lg shadow-yellow-200/60
            hover:shadow-xl transition-shadow duration-200
          "
        >
          {hintIndex < 0 ? '\ud83d\udca1 \u63d0\u793a / Hint' : `\ud83d\udca1 \u518d\u63d0\u793a (${hintIndex + 1}/${hints.length})`}
        </motion.button>
      )}
    </div>
  )
}
