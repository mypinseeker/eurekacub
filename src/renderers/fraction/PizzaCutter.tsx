/**
 * PizzaCutter — Fraction learning game renderer for EurekaCub.
 *
 * Children cut a pizza into equal slices by tapping on its edge to place
 * radial cut lines. The game validates that cuts are evenly spaced and
 * rewards correct answers with colorful slice animations.
 *
 * Rounds: complete 3 puzzles to trigger onComplete().
 */
import { useState, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { RendererProps } from '../registry'
import SvgBase from '../common/SvgBase'
import PuzzleIntro from '../common/PuzzleIntro'
import type { FractionPuzzleData, Cut } from './types'
import { SLICE_COLORS } from './types'
import {
  CX,
  CY,
  RADIUS,
  CRUST_WIDTH,
  MIN_CLICK_RADIUS,
  MAX_CLICK_RADIUS,
  ROUNDS_TO_COMPLETE,
  angleFromCenter,
  normaliseAngle,
  validateCuts,
  cutEndpoint,
} from './fraction.utils'

const INNER_RADIUS = RADIUS - CRUST_WIDTH // inner cheese area

/* Default puzzle data for safety. */
const DEFAULT_PUZZLE: FractionPuzzleData = {
  targetSlices: 4,
  showGuides: true,
  tolerance: 15,
}

/* ─── Topping definitions (decorative circles) ────────────── */

interface Topping {
  cx: number
  cy: number
  r: number
  fill: string
}

/**
 * Generate deterministic but visually scattered topping positions.
 * Uses a seeded approach based on index to stay consistent across renders.
 */
function generateToppings(): Topping[] {
  const toppings: Topping[] = []
  const colors = [
    { fill: '#C0392B', r: 9 },  // pepperoni (red)
    { fill: '#C0392B', r: 8 },  // pepperoni (red)
    { fill: '#27AE60', r: 5 },  // olive (green)
    { fill: '#F1C40F', r: 6 },  // pineapple (yellow)
    { fill: '#C0392B', r: 10 }, // pepperoni (red)
    { fill: '#27AE60', r: 5 },  // olive (green)
    { fill: '#C0392B', r: 8 },  // pepperoni (red)
    { fill: '#F1C40F', r: 5 },  // pineapple (yellow)
    { fill: '#27AE60', r: 4 },  // olive (green)
    { fill: '#C0392B', r: 9 },  // pepperoni (red)
    { fill: '#F1C40F', r: 6 },  // pineapple (yellow)
    { fill: '#C0392B', r: 7 },  // pepperoni (red)
  ]

  // Place toppings at fixed positions within the inner pizza area
  const positions = [
    [0.35, 0.25], [0.65, 0.30], [0.50, 0.55], [0.30, 0.60],
    [0.70, 0.60], [0.45, 0.35], [0.55, 0.75], [0.25, 0.45],
    [0.75, 0.45], [0.40, 0.70], [0.60, 0.20], [0.50, 0.45],
  ]

  for (let i = 0; i < positions.length; i++) {
    const [nx, ny] = positions[i]
    const px = CX + (nx - 0.5) * 2 * INNER_RADIUS * 0.85
    const py = CY + (ny - 0.5) * 2 * INNER_RADIUS * 0.85

    // Only place if inside the pizza circle
    const dx = px - CX
    const dy = py - CY
    if (Math.sqrt(dx * dx + dy * dy) < INNER_RADIUS - 12) {
      const { fill, r } = colors[i % colors.length]
      toppings.push({ cx: px, cy: py, r, fill })
    }
  }

  return toppings
}

const TOPPINGS = generateToppings()

/* ─── Component ───────────────────────────────────────────── */

export default function PizzaCutter({
  puzzle,
  onCorrect,
  onError,
  onComplete,
}: RendererProps) {
  const [showIntro, setShowIntro] = useState(true)

  if (showIntro) {
    return (
      <PuzzleIntro
        icon="🍕"
        title={{ zh: '分数切割', en: 'Fraction Cutter' }}
        goal={{ zh: '把披萨切成均匀的几份！在边缘点击来放置切割线，让每块大小一样', en: 'Cut the pizza into equal slices! Tap on the edge to place cut lines so each slice is the same size' }}
        howTo={[
          { zh: '看题目要求切成几份（比如4份）', en: 'Check how many slices are needed (e.g., 4)' },
          { zh: '在披萨边缘点击放置切割线', en: 'Tap on the pizza edge to place cut lines' },
          { zh: '切割线要均匀分布，让每块一样大', en: 'Space cuts evenly so each slice is equal' },
        ]}
        insight={{ zh: '把一个整体分成相等的几份，每份就是一个分数。切成4份，每份就是1/4！', en: 'Dividing a whole into equal parts gives us fractions. Cut into 4 pieces, each piece is 1/4!' }}
        onStart={() => setShowIntro(false)}
      />
    )
  }

  // Parse puzzle data with defaults
  const puzzleData = useMemo<FractionPuzzleData>(() => {
    const raw = (puzzle.data ?? puzzle) as Partial<FractionPuzzleData>
    return {
      targetSlices: raw.targetSlices ?? DEFAULT_PUZZLE.targetSlices,
      showGuides: raw.showGuides ?? DEFAULT_PUZZLE.showGuides,
      tolerance: raw.tolerance ?? DEFAULT_PUZZLE.tolerance,
    }
  }, [puzzle])

  const [cuts, setCuts] = useState<Cut[]>([])
  const [roundCorrect, setRoundCorrect] = useState(false)
  const [successCount, setSuccessCount] = useState(0)
  const [shakeError, setShakeError] = useState(false)

  // Ref to track successCount in callbacks without stale closures
  const successRef = useRef(successCount)
  successRef.current = successCount

  const { targetSlices, showGuides, tolerance } = puzzleData

  /** Handle a tap/click on the SVG canvas. */
  const handlePointerDown = useCallback(
    (x: number, y: number) => {
      if (roundCorrect) return // don't accept cuts after correct answer

      // Check the click is near the pizza edge (not center, not outside)
      const dx = x - CX
      const dy = y - CY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < MIN_CLICK_RADIUS || dist > MAX_CLICK_RADIUS) return

      const angle = angleFromCenter(x, y)

      setCuts((prev) => {
        // Don't exceed target number of cuts
        if (prev.length >= targetSlices) return prev

        const next = [...prev, { angle }]

        // Validate once we have exactly the right number of cuts
        if (next.length === targetSlices) {
          if (validateCuts(next, targetSlices, tolerance)) {
            // Correct! Delay state updates to next tick so React batches properly
            setTimeout(() => {
              setRoundCorrect(true)
              onCorrect()
              const newCount = successRef.current + 1
              setSuccessCount(newCount)
              if (newCount >= ROUNDS_TO_COMPLETE) {
                setTimeout(onComplete, 1200)
              }
            }, 0)
          } else {
            // Incorrect — shake and reset after a brief pause
            setTimeout(() => {
              onError()
              setShakeError(true)
              setTimeout(() => {
                setCuts([])
                setShakeError(false)
              }, 800)
            }, 0)
          }
        }

        return next
      })
    },
    [roundCorrect, targetSlices, tolerance, onCorrect, onError, onComplete],
  )

  /** Reset cuts for current round. */
  const handleReset = useCallback(() => {
    setCuts([])
    setRoundCorrect(false)
  }, [])

  /** Advance to next round after correct answer. */
  const handleNextRound = useCallback(() => {
    setCuts([])
    setRoundCorrect(false)
  }, [])

  // Guide lines for young children (evenly spaced faint lines)
  const guideAngles = useMemo(() => {
    if (!showGuides) return []
    const angles: number[] = []
    for (let i = 0; i < targetSlices; i++) {
      angles.push((i * Math.PI * 2) / targetSlices - Math.PI / 2) // start from top
    }
    return angles
  }, [showGuides, targetSlices])

  // Sorted cuts for slice coloring
  const sortedCutAngles = useMemo(() => {
    if (!roundCorrect) return []
    return cuts
      .map((c) => normaliseAngle(c.angle))
      .sort((a, b) => a - b)
  }, [cuts, roundCorrect])

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {/* Header: instruction + progress */}
      <div className="text-center">
        <p className="text-lg font-bold text-amber-900">
          Cut the pizza into{' '}
          <span className="text-2xl text-red-600">{targetSlices}</span>{' '}
          equal pieces!
        </p>
        <p className="text-sm text-amber-700">
          Tap the pizza edge to place cuts ({cuts.length} / {targetSlices})
        </p>
        <div className="flex justify-center gap-1 mt-1">
          {Array.from({ length: ROUNDS_TO_COMPLETE }).map((_, i) => (
            <span
              key={i}
              className={`w-3 h-3 rounded-full ${
                i < successCount ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* SVG Pizza Canvas */}
      <motion.div
        className="w-full max-w-md aspect-square"
        animate={shakeError ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : {}}
        transition={{ duration: 0.5 }}
      >
        <SvgBase viewWidth={400} viewHeight={400} onPointerDown={handlePointerDown}>
          <defs>
            {/* Pizza base gradient: warm cheese colors */}
            <radialGradient id="pizzaBase" cx="45%" cy="40%">
              <stop offset="0%" stopColor="#FDEBD0" />
              <stop offset="40%" stopColor="#F5CBA7" />
              <stop offset="80%" stopColor="#F0B27A" />
              <stop offset="100%" stopColor="#E59866" />
            </radialGradient>

            {/* Sauce peek gradient */}
            <radialGradient id="sauceLayer" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#E74C3C" stopOpacity="0.15" />
              <stop offset="70%" stopColor="#C0392B" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#C0392B" stopOpacity="0" />
            </radialGradient>

            {/* Crust gradient */}
            <radialGradient id="crustGrad" cx="50%" cy="50%">
              <stop offset="85%" stopColor="#D4A54A" />
              <stop offset="92%" stopColor="#C8943A" />
              <stop offset="100%" stopColor="#B8832E" />
            </radialGradient>

            {/* Shadow filter for depth */}
            <filter id="pizzaShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="2" dy="3" stdDeviation="4" floodColor="#5D4E37" floodOpacity="0.3" />
            </filter>

            {/* Subtle texture noise */}
            <filter id="cheeseTexture">
              <feTurbulence baseFrequency="0.9" numOctaves="3" result="noise" />
              <feColorMatrix type="saturate" values="0" in="noise" result="gray" />
              <feBlend in="SourceGraphic" in2="gray" mode="soft-light" />
            </filter>
          </defs>

          {/* ── Pizza body ─────────────────────────────── */}

          {/* Outer shadow circle */}
          <circle cx={CX} cy={CY} r={RADIUS + 2} fill="none" filter="url(#pizzaShadow)" />

          {/* Crust ring */}
          <circle cx={CX} cy={CY} r={RADIUS} fill="url(#crustGrad)" />

          {/* Crust highlight arc (top-left sheen) */}
          <circle
            cx={CX}
            cy={CY}
            r={RADIUS - 2}
            fill="none"
            stroke="#E8C86A"
            strokeWidth="2"
            strokeDasharray="60 300"
            strokeDashoffset="-30"
            opacity="0.4"
          />

          {/* Cheese base */}
          <circle
            cx={CX}
            cy={CY}
            r={INNER_RADIUS}
            fill="url(#pizzaBase)"
            filter="url(#cheeseTexture)"
          />

          {/* Sauce peek-through */}
          <circle cx={CX} cy={CY} r={INNER_RADIUS} fill="url(#sauceLayer)" />

          {/* ── Toppings ───────────────────────────────── */}
          {TOPPINGS.map((t, i) => (
            <g key={i}>
              {/* Topping shadow */}
              <circle cx={t.cx + 1} cy={t.cy + 1} r={t.r} fill="rgba(0,0,0,0.12)" />
              {/* Topping body */}
              <circle cx={t.cx} cy={t.cy} r={t.r} fill={t.fill} opacity="0.85" />
              {/* Topping highlight */}
              <circle
                cx={t.cx - t.r * 0.25}
                cy={t.cy - t.r * 0.25}
                r={t.r * 0.35}
                fill="white"
                opacity="0.25"
              />
            </g>
          ))}

          {/* ── Correct slice fills (animated wedges) ─── */}
          <AnimatePresence>
            {roundCorrect &&
              sortedCutAngles.map((startAngle, i) => {
                const endAngle =
                  i + 1 < sortedCutAngles.length
                    ? sortedCutAngles[i + 1]
                    : sortedCutAngles[0] + Math.PI * 2

                // Build SVG arc path for this slice
                const startX = CX + Math.cos(startAngle) * INNER_RADIUS
                const startY = CY + Math.sin(startAngle) * INNER_RADIUS
                const endX = CX + Math.cos(endAngle) * INNER_RADIUS
                const endY = CY + Math.sin(endAngle) * INNER_RADIUS
                const largeArc = endAngle - startAngle > Math.PI ? 1 : 0

                const d = [
                  `M ${CX} ${CY}`,
                  `L ${startX} ${startY}`,
                  `A ${INNER_RADIUS} ${INNER_RADIUS} 0 ${largeArc} 1 ${endX} ${endY}`,
                  'Z',
                ].join(' ')

                return (
                  <motion.path
                    key={`slice-${i}`}
                    d={d}
                    fill={SLICE_COLORS[i % SLICE_COLORS.length]}
                    opacity={0}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{
                      opacity: 0.55,
                      scale: 1,
                      transition: { delay: i * 0.1, duration: 0.4 },
                    }}
                    exit={{ opacity: 0 }}
                    style={{ transformOrigin: `${CX}px ${CY}px` }}
                  />
                )
              })}
          </AnimatePresence>

          {/* ── Guide lines (faint, for beginners) ──── */}
          {showGuides &&
            !roundCorrect &&
            guideAngles.map((angle, i) => {
              const end = cutEndpoint(angle)
              return (
                <line
                  key={`guide-${i}`}
                  x1={CX}
                  y1={CY}
                  x2={end.x}
                  y2={end.y}
                  stroke="#D5C4A1"
                  strokeWidth="1"
                  strokeDasharray="4 8"
                  opacity="0.35"
                />
              )
            })}

          {/* ── Cut lines placed by the child ──────── */}
          {cuts.map((cut, i) => {
            const end = cutEndpoint(cut.angle)
            return (
              <g key={`cut-${i}`}>
                {/* Cut line: dark dashed */}
                <motion.line
                  x1={CX}
                  y1={CY}
                  x2={end.x}
                  y2={end.y}
                  stroke="#5D4037"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
                {/* Knife emoji at the edge end */}
                <motion.text
                  x={end.x}
                  y={end.y}
                  fontSize="18"
                  textAnchor="middle"
                  dominantBaseline="central"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  style={{ pointerEvents: 'none' }}
                >
                  🔪
                </motion.text>
              </g>
            )
          })}

          {/* ── Center dot (decorative) ────────────── */}
          <circle cx={CX} cy={CY} r="4" fill="#8B6914" opacity="0.3" />
        </SvgBase>
      </motion.div>

      {/* ── Action buttons ─────────────────────────── */}
      <div className="flex gap-3">
        {!roundCorrect && cuts.length > 0 && (
          <motion.button
            className="px-4 py-2 rounded-full bg-amber-100 text-amber-800 font-semibold
                       border-2 border-amber-300 hover:bg-amber-200 active:scale-95
                       transition-colors"
            onClick={handleReset}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.92 }}
          >
            Start Over
          </motion.button>
        )}

        {roundCorrect && successCount < ROUNDS_TO_COMPLETE && (
          <motion.button
            className="px-5 py-2 rounded-full bg-green-400 text-white font-bold
                       border-2 border-green-500 hover:bg-green-500 active:scale-95
                       transition-colors shadow-md"
            onClick={handleNextRound}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            whileTap={{ scale: 0.92 }}
          >
            Next Pizza!
          </motion.button>
        )}

        {roundCorrect && successCount >= ROUNDS_TO_COMPLETE && (
          <motion.div
            className="text-xl font-bold text-green-600"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 150 }}
          >
            All done! Great cutting!
          </motion.div>
        )}
      </div>
    </div>
  )
}
