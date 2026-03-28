/**
 * BalanceScale — Equation learning game renderer for EurekaCub.
 *
 * Children solve equations by figuring out what the mystery "?" block
 * weighs. They tap an option, then tap the "?" slot on the scale.
 * The beam tilts based on total weight difference between pans,
 * animated with Framer Motion spring physics.
 *
 * Rounds: complete 3 puzzles to trigger onComplete().
 */
import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { RendererProps } from '../registry'
import SvgBase from '../common/SvgBase'
import type { EquationPuzzleData, UnknownSide } from './types'
import {
  MYSTERY_COLOR,
  ROUNDS_TO_COMPLETE,
} from './types'
import {
  CX,
  BEAM_Y,
  BEAM_HALF,
  sum,
  colorForValue,
  calcTiltAngle,
  rotatedPoint,
} from './equation.utils'

/* ─── Layout constants (viewBox 400x400) ──────────────────── */

const VW = 400
const VH = 400
const FULCRUM_TOP = 200    // top of fulcrum triangle
const FULCRUM_BASE = 280   // bottom of fulcrum triangle
const PAN_WIDTH = 100      // pan width
const PAN_DEPTH = 20       // pan curve depth
const CHAIN_LEN = 50       // chain/string length from beam to pan
const BLOCK_SIZE = 30      // weight block width & height
const BLOCK_GAP = 4        // gap between stacked blocks
const OPTIONS_Y = 340      // Y position of options row

/* Default puzzle for safety. */
const DEFAULT_PUZZLE: EquationPuzzleData = {
  leftSide: [5, 3],
  rightSide: [],
  unknown: 8,
  unknownSide: 'right',
  options: [6, 7, 8, 9, 10],
}

/* ─── Confetti particle ───────────────────────────────────── */

interface Particle {
  id: number
  x: number
  y: number
  color: string
  size: number
  rotation: number
  dx: number
  dy: number
}

function generateConfetti(cx: number, cy: number, count: number): Particle[] {
  const particles: Particle[] = []
  const colors = ['#E74C3C', '#3498DB', '#2ECC71', '#F1C40F', '#9B59B6', '#E67E22']
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5
    const speed = 40 + Math.random() * 60
    particles.push({
      id: i,
      x: cx,
      y: cy,
      color: colors[i % colors.length],
      size: 4 + Math.random() * 4,
      rotation: Math.random() * 360,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed - 30,
    })
  }
  return particles
}

/* ─── Sub-components (pure SVG groups) ────────────────────── */

/** Fulcrum triangle with wooden texture. */
function Fulcrum() {
  return (
    <g>
      <defs>
        <linearGradient id="woodGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D4A54A" />
          <stop offset="50%" stopColor="#B8862D" />
          <stop offset="100%" stopColor="#A0722A" />
        </linearGradient>
      </defs>
      {/* Shadow */}
      <polygon
        points={`${CX},${FULCRUM_TOP + 2} ${CX - 36},${FULCRUM_BASE + 2} ${CX + 36},${FULCRUM_BASE + 2}`}
        fill="rgba(0,0,0,0.12)"
      />
      {/* Triangle body */}
      <polygon
        points={`${CX},${FULCRUM_TOP} ${CX - 34},${FULCRUM_BASE} ${CX + 34},${FULCRUM_BASE}`}
        fill="url(#woodGrad)"
        stroke="#8B6914"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Wood grain lines */}
      <line
        x1={CX - 10} y1={FULCRUM_TOP + 30}
        x2={CX - 20} y2={FULCRUM_BASE - 10}
        stroke="#C8943A" strokeWidth="0.8" opacity="0.5"
      />
      <line
        x1={CX + 8} y1={FULCRUM_TOP + 25}
        x2={CX + 18} y2={FULCRUM_BASE - 12}
        stroke="#C8943A" strokeWidth="0.8" opacity="0.5"
      />
      {/* Base platform */}
      <rect
        x={CX - 60} y={FULCRUM_BASE}
        width={120} height={8}
        rx={3}
        fill="#A0722A"
        stroke="#8B6914"
        strokeWidth="1"
      />
    </g>
  )
}

/** A single weight block on the scale. */
function WeightBlockSvg({
  x,
  y,
  value,
  color,
  isMystery,
  sparkle,
}: {
  x: number
  y: number
  value: number
  color: string
  isMystery?: boolean
  sparkle?: boolean
}) {
  const half = BLOCK_SIZE / 2
  return (
    <motion.g
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      style={{ transformOrigin: `${x}px ${y}px` }}
    >
      {/* Shadow */}
      <rect
        x={x - half + 1.5} y={y - half + 1.5}
        width={BLOCK_SIZE} height={BLOCK_SIZE}
        rx={6}
        fill="rgba(0,0,0,0.15)"
      />
      {/* Block body */}
      <rect
        x={x - half} y={y - half}
        width={BLOCK_SIZE} height={BLOCK_SIZE}
        rx={6}
        fill={color}
      />
      {/* Highlight */}
      <rect
        x={x - half + 3} y={y - half + 3}
        width={BLOCK_SIZE - 6} height={8}
        rx={3}
        fill="white" opacity="0.25"
      />
      {/* Label */}
      <text
        x={x} y={y + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="14"
        fontWeight="bold"
        fill="white"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {isMystery ? '?' : value}
      </text>
      {/* Sparkle effect for mystery block */}
      {sparkle && (
        <>
          <motion.circle
            cx={x - half - 3} cy={y - half - 3} r={2}
            fill="#FFF9C4"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.circle
            cx={x + half + 2} cy={y - half + 2} r={1.5}
            fill="#FFF9C4"
            animate={{ opacity: [1, 0.3, 1], scale: [1.2, 0.8, 1.2] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          <motion.circle
            cx={x + half - 2} cy={y + half + 3} r={1.8}
            fill="#FFF9C4"
            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.3, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
        </>
      )}
    </motion.g>
  )
}

/**
 * Pan with hanging chains and stacked weight blocks.
 * `anchorX/anchorY` is where the chain attaches to the beam.
 */
function Pan({
  anchorX,
  anchorY,
  items,
  unknownSlot,
  filledUnknown,
  onTapPan,
  side,
}: {
  anchorX: number
  anchorY: number
  items: number[]
  unknownSlot: boolean
  filledUnknown: number | null
  onTapPan: (side: UnknownSide) => void
  side: UnknownSide
}) {
  const panY = anchorY + CHAIN_LEN
  const panLeft = anchorX - PAN_WIDTH / 2
  const panRight = anchorX + PAN_WIDTH / 2

  // Build the list of blocks to render (known + mystery)
  const blocks: { value: number; color: string; isMystery: boolean }[] = []

  items.forEach((v, i) => {
    blocks.push({ value: v, color: colorForValue(v, i), isMystery: false })
  })

  if (unknownSlot) {
    blocks.push({
      value: filledUnknown ?? 0,
      color: MYSTERY_COLOR,
      isMystery: filledUnknown === null,
    })
  }

  return (
    <g
      style={{ cursor: unknownSlot && filledUnknown === null ? 'pointer' : 'default' }}
      onClick={() => {
        if (unknownSlot && filledUnknown === null) {
          onTapPan(side)
        }
      }}
    >
      {/* Chain / string lines */}
      <line
        x1={anchorX - 20} y1={anchorY}
        x2={panLeft + 8} y2={panY}
        stroke="#8B7355" strokeWidth="1.5"
      />
      <line
        x1={anchorX + 20} y1={anchorY}
        x2={panRight - 8} y2={panY}
        stroke="#8B7355" strokeWidth="1.5"
      />

      {/* Pan body (curved dish) */}
      <path
        d={`M ${panLeft} ${panY}
            Q ${panLeft} ${panY + PAN_DEPTH} ${anchorX} ${panY + PAN_DEPTH}
            Q ${panRight} ${panY + PAN_DEPTH} ${panRight} ${panY}
            Z`}
        fill="#B0BEC5"
        stroke="#78909C"
        strokeWidth="1.5"
      />
      {/* Pan rim */}
      <line
        x1={panLeft} y1={panY}
        x2={panRight} y2={panY}
        stroke="#90A4AE" strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Pan highlight */}
      <line
        x1={panLeft + 10} y1={panY + 4}
        x2={panRight - 10} y2={panY + 4}
        stroke="white" strokeWidth="1" opacity="0.3"
        strokeLinecap="round"
      />

      {/* Weight blocks stacked above the pan */}
      <AnimatePresence>
        {blocks.map((block, i) => {
          const bx = anchorX
          const by = panY - (BLOCK_SIZE / 2 + 2) - i * (BLOCK_SIZE + BLOCK_GAP)
          return (
            <WeightBlockSvg
              key={`${side}-block-${i}`}
              x={bx}
              y={by}
              value={block.value}
              color={block.color}
              isMystery={block.isMystery}
              sparkle={block.isMystery}
            />
          )
        })}
      </AnimatePresence>
    </g>
  )
}

/* ─── Main component ──────────────────────────────────────── */

export default function BalanceScale({
  puzzle,
  onCorrect,
  onError,
  onComplete,
}: RendererProps) {
  /* ── Parse puzzle data ──────────────────────────────────── */
  const puzzleData = useMemo<EquationPuzzleData>(() => {
    const raw = (puzzle.data ?? puzzle) as Partial<EquationPuzzleData>
    return {
      leftSide: raw.leftSide ?? DEFAULT_PUZZLE.leftSide,
      rightSide: raw.rightSide ?? DEFAULT_PUZZLE.rightSide,
      unknown: raw.unknown ?? DEFAULT_PUZZLE.unknown,
      unknownSide: raw.unknownSide ?? DEFAULT_PUZZLE.unknownSide,
      options: raw.options ?? DEFAULT_PUZZLE.options,
    }
  }, [puzzle])

  /* ── State ──────────────────────────────────────────────── */
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [filledUnknown, setFilledUnknown] = useState<number | null>(null)
  const [roundCorrect, setRoundCorrect] = useState(false)
  const [successCount, setSuccessCount] = useState(0)
  const [shakeError, setShakeError] = useState(false)
  const [confetti, setConfetti] = useState<Particle[]>([])
  const [showGlow, setShowGlow] = useState(false)

  const successRef = useRef(successCount)
  successRef.current = successCount

  const { leftSide, rightSide, unknown, unknownSide, options } = puzzleData

  /* ── Derived values ─────────────────────────────────────── */

  // Compute effective items on each side (including filled unknown)
  const effectiveLeft = useMemo(() => {
    const base = [...leftSide]
    if (unknownSide === 'left' && filledUnknown !== null) {
      base.push(filledUnknown)
    }
    return base
  }, [leftSide, unknownSide, filledUnknown])

  const effectiveRight = useMemo(() => {
    const base = [...rightSide]
    if (unknownSide === 'right' && filledUnknown !== null) {
      base.push(filledUnknown)
    }
    return base
  }, [rightSide, unknownSide, filledUnknown])

  const leftTotal = sum(effectiveLeft)
  const rightTotal = sum(effectiveRight)
  const tiltAngle = calcTiltAngle(leftTotal, rightTotal)

  // Beam endpoint positions (rotated)
  const leftEnd = rotatedPoint(-BEAM_HALF, tiltAngle)
  const rightEnd = rotatedPoint(BEAM_HALF, tiltAngle)

  /* ── Handlers ───────────────────────────────────────────── */

  /** Select an option weight. */
  const handleSelectOption = useCallback(
    (value: number) => {
      if (roundCorrect || filledUnknown !== null) return
      setSelectedOption((prev) => (prev === value ? null : value))
    },
    [roundCorrect, filledUnknown],
  )

  /** Tap a pan to place the selected option. */
  const handleTapPan = useCallback(
    (side: UnknownSide) => {
      if (roundCorrect || selectedOption === null || filledUnknown !== null) return
      if (side !== unknownSide) return // can only place on the unknown side

      setFilledUnknown(selectedOption)

      // Check correctness after a brief delay for the tilt animation to play
      const chosenValue = selectedOption
      setTimeout(() => {
        if (chosenValue === unknown) {
          // Correct answer
          setRoundCorrect(true)
          setShowGlow(true)
          setConfetti(generateConfetti(CX, BEAM_Y - 20, 18))
          onCorrect()

          const newCount = successRef.current + 1
          setSuccessCount(newCount)

          if (newCount >= ROUNDS_TO_COMPLETE) {
            setTimeout(onComplete, 1500)
          }
        } else {
          // Wrong answer
          onError()
          setShakeError(true)
          setTimeout(() => {
            setFilledUnknown(null)
            setSelectedOption(null)
            setShakeError(false)
          }, 900)
        }
      }, 600)
    },
    [
      roundCorrect,
      selectedOption,
      filledUnknown,
      unknownSide,
      unknown,
      onCorrect,
      onError,
      onComplete,
    ],
  )

  /** Advance to next round. */
  const handleNextRound = useCallback(() => {
    setSelectedOption(null)
    setFilledUnknown(null)
    setRoundCorrect(false)
    setShakeError(false)
    setConfetti([])
    setShowGlow(false)
  }, [])

  /* ── Clear confetti after animation ─────────────────────── */
  useEffect(() => {
    if (confetti.length === 0) return
    const timer = setTimeout(() => setConfetti([]), 2000)
    return () => clearTimeout(timer)
  }, [confetti])

  /* ── Build equation display string ──────────────────────── */
  const equationStr = useMemo(() => {
    const leftParts = leftSide.map((v) => String(v))
    const rightParts = rightSide.map((v) => String(v))

    if (unknownSide === 'left') leftParts.push('?')
    else rightParts.push('?')

    const l = leftParts.length > 0 ? leftParts.join(' + ') : '0'
    const r = rightParts.length > 0 ? rightParts.join(' + ') : '0'
    return `${l} = ${r}`
  }, [leftSide, rightSide, unknownSide])

  /* ─── Render ────────────────────────────────────────────── */

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {/* Header */}
      <div className="text-center">
        <p className="text-lg font-bold text-indigo-900">
          Balance the scale!
        </p>
        <p className="text-base font-mono text-indigo-700 tracking-wide">
          {equationStr}
        </p>
        <p className="text-sm text-indigo-500 mt-0.5">
          {selectedOption !== null
            ? `Tap the "?" pan to place your weight (${selectedOption})`
            : 'Tap a weight below, then tap the "?" pan'}
        </p>
        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mt-1">
          {Array.from({ length: ROUNDS_TO_COMPLETE }).map((_, i) => (
            <span
              key={i}
              className={`w-3 h-3 rounded-full transition-colors ${
                i < successCount ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* SVG Canvas */}
      <motion.div
        className="w-full max-w-md aspect-square"
        animate={shakeError ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : {}}
        transition={{ duration: 0.5 }}
      >
        <SvgBase viewWidth={VW} viewHeight={VH}>
          <defs>
            {/* Background gradient */}
            <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EBF5FB" />
              <stop offset="100%" stopColor="#D5E8D4" />
            </linearGradient>

            {/* Beam wood gradient */}
            <linearGradient id="beamGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C8943A" />
              <stop offset="100%" stopColor="#A0722A" />
            </linearGradient>

            {/* Glow filter for balanced state */}
            <filter id="balanceGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feFlood floodColor="#2ECC71" floodOpacity="0.4" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background */}
          <rect x={0} y={0} width={VW} height={VH} rx={12} fill="url(#bgGrad)" />

          {/* Fulcrum */}
          <Fulcrum />

          {/* Beam (tilting bar) */}
          <motion.g
            animate={{ rotate: tiltAngle }}
            transition={{ type: 'spring', stiffness: 120, damping: 14 }}
            style={{ transformOrigin: `${CX}px ${BEAM_Y}px` }}
          >
            {/* Beam bar */}
            <rect
              x={CX - BEAM_HALF}
              y={BEAM_Y - 5}
              width={BEAM_HALF * 2}
              height={10}
              rx={4}
              fill="url(#beamGrad)"
              stroke="#8B6914"
              strokeWidth="1"
            />
            {/* Beam center pivot circle */}
            <circle
              cx={CX} cy={BEAM_Y}
              r={6}
              fill="#B8862D"
              stroke="#8B6914"
              strokeWidth="1"
            />

            {/* Left pan */}
            <Pan
              anchorX={CX - BEAM_HALF + 10}
              anchorY={BEAM_Y + 5}
              items={leftSide}
              unknownSlot={unknownSide === 'left'}
              filledUnknown={unknownSide === 'left' ? filledUnknown : null}
              onTapPan={handleTapPan}
              side="left"
            />

            {/* Right pan */}
            <Pan
              anchorX={CX + BEAM_HALF - 10}
              anchorY={BEAM_Y + 5}
              items={rightSide}
              unknownSlot={unknownSide === 'right'}
              filledUnknown={unknownSide === 'right' ? filledUnknown : null}
              onTapPan={handleTapPan}
              side="right"
            />
          </motion.g>

          {/* Balanced glow effect */}
          {showGlow && (
            <motion.circle
              cx={CX} cy={BEAM_Y}
              r={BEAM_HALF + 30}
              fill="none"
              stroke="#2ECC71"
              strokeWidth="3"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 0.6, 0], scale: [0.8, 1.1, 1.2] }}
              transition={{ duration: 1.2 }}
              style={{ transformOrigin: `${CX}px ${BEAM_Y}px` }}
            />
          )}

          {/* Confetti particles */}
          <AnimatePresence>
            {confetti.map((p) => (
              <motion.rect
                key={p.id}
                x={p.x - p.size / 2}
                y={p.y - p.size / 2}
                width={p.size}
                height={p.size}
                rx={1}
                fill={p.color}
                initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                animate={{
                  x: p.dx,
                  y: p.dy + 80,
                  opacity: 0,
                  rotate: p.rotation,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            ))}
          </AnimatePresence>

          {/* ── Options area (pill buttons at bottom) ──── */}
          <g>
            {/* Background strip */}
            <rect
              x={20} y={OPTIONS_Y - 20}
              width={VW - 40} height={50}
              rx={25}
              fill="white" opacity="0.5"
            />

            {options.map((value, i) => {
              const count = options.length
              const totalWidth = count * 44 + (count - 1) * 8
              const startX = CX - totalWidth / 2
              const bx = startX + i * 52 + 22
              const by = OPTIONS_Y + 5
              const isSelected = selectedOption === value
              const isUsed = filledUnknown === value && roundCorrect

              return (
                <motion.g
                  key={`opt-${i}-${value}`}
                  style={{ cursor: roundCorrect ? 'default' : 'pointer' }}
                  onClick={() => handleSelectOption(value)}
                  whileTap={roundCorrect ? {} : { scale: 0.88 }}
                >
                  {/* Pill background */}
                  <motion.rect
                    x={bx - 20} y={by - 16}
                    width={40} height={32}
                    rx={16}
                    fill={isUsed ? '#BAFFC9' : isSelected ? '#E8DAEF' : '#F5F5F5'}
                    stroke={isSelected ? '#8E44AD' : '#BDBDBD'}
                    strokeWidth={isSelected ? 2.5 : 1}
                    animate={isSelected ? { scale: 1.08 } : { scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    style={{ transformOrigin: `${bx}px ${by}px` }}
                  />
                  {/* Value label */}
                  <text
                    x={bx} y={by}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="15"
                    fontWeight="bold"
                    fill={isSelected ? '#6C3483' : '#555'}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {value}
                  </text>
                </motion.g>
              )
            })}
          </g>
        </SvgBase>
      </motion.div>

      {/* Action buttons */}
      <div className="flex gap-3">
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
            Next Equation!
          </motion.button>
        )}

        {roundCorrect && successCount >= ROUNDS_TO_COMPLETE && (
          <motion.div
            className="text-xl font-bold text-green-600"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 150 }}
          >
            Perfectly balanced! Great job!
          </motion.div>
        )}

        {!roundCorrect && filledUnknown !== null && !shakeError && (
          <motion.button
            className="px-4 py-2 rounded-full bg-amber-100 text-amber-800 font-semibold
                       border-2 border-amber-300 hover:bg-amber-200 active:scale-95
                       transition-colors"
            onClick={() => {
              setFilledUnknown(null)
              setSelectedOption(null)
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.92 }}
          >
            Try Again
          </motion.button>
        )}
      </div>
    </div>
  )
}
