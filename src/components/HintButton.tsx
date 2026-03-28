import { useState } from 'react'

interface HintButtonProps {
  hints: Array<{ zh: string; en: string }>
}

export default function HintButton({ hints }: HintButtonProps) {
  const [hintIndex, setHintIndex] = useState(-1)
  const [isAnimating, setIsAnimating] = useState(false)

  const showNextHint = () => {
    if (hintIndex < hints.length - 1) {
      setIsAnimating(true)
      setHintIndex((prev) => prev + 1)
      setTimeout(() => setIsAnimating(false), 300)
    }
  }

  const hasMoreHints = hintIndex < hints.length - 1

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Current hint display */}
      {hintIndex >= 0 && (
        <div
          className={`
            px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800
            transition-all duration-300
            ${isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}
          `}
        >
          <span className="font-medium">
            \ud83d\udca1 {hints[hintIndex]?.zh}
          </span>
        </div>
      )}

      {/* Hint button */}
      {hasMoreHints && (
        <button
          onClick={showNextHint}
          className="
            px-5 py-2 rounded-full bg-gradient-to-r from-yellow-300 to-amber-400
            text-white font-bold text-sm shadow-md
            hover:shadow-lg hover:scale-105 active:scale-95
            transition-all duration-200
          "
        >
          {hintIndex < 0 ? '\ud83d\udca1 \u63d0\u793a / Hint' : `\ud83d\udca1 \u518d\u63d0\u793a (${hintIndex + 1}/${hints.length})`}
        </button>
      )}
    </div>
  )
}
