import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { RendererProps } from '../registry'
import type { SequencePuzzleData } from './types'
import PuzzleIntro from '../common/PuzzleIntro'
import { parsePuzzleData as _parsePuzzleData } from './sequence.utils'

/* ------------------------------------------------------------------ */
/*  Layout constants (viewBox 800 x 500)                              */
/* ------------------------------------------------------------------ */
const VW = 800
const VH = 500
const TRACK_Y = 380
const CARRIAGE_Y = 270
const CARRIAGE_W = 90
const CARRIAGE_H = 80
const CARRIAGE_R = 12
const WHEEL_R = 14
const ENGINE_W = 120
const GAP = 16

/* ------------------------------------------------------------------ */
/*  Palette                                                           */
/* ------------------------------------------------------------------ */
const CARRIAGE_COLORS = ['#e06050', '#4a90d9', '#e8a735', '#5cb85c', '#9b59b6', '#e67e22', '#1abc9c']
const SKY_TOP = '#87ceeb'
const SKY_BOTTOM = '#d4f1ff'
const TRACK_COLOR = '#8B7355'
const WHEEL_COLOR = '#555'
const SPOKE_COLOR = '#888'
const ENGINE_BODY = '#d9534f'
const ENGINE_ROOF = '#c0392b'
const CHIMNEY_COLOR = '#444'
const OPTION_BG = '#fff'
const OPTION_BORDER = '#ccc'
const OPTION_SELECTED = '#ffd54f'

export default function NumberTrain({ puzzle, onCorrect, onError, onAha, onComplete }: RendererProps) {
  const [showIntro, setShowIntro] = useState(true)

  if (showIntro) {
    return (
      <PuzzleIntro
        icon="🔢"
        title={{ zh: '数列火车', en: 'Number Train' }}
        goal={{ zh: '找出数字规律，填上火车车厢里缺少的数字！', en: 'Find the pattern and fill in the missing numbers on the train!' }}
        howTo={[
          { zh: '观察火车上已有的数字，找出规律', en: 'Look at the numbers on the train and find the pattern' },
          { zh: '空白车厢就是要填的位置', en: 'Empty carriages are where you need to fill in' },
          { zh: '从下方选择正确数字，点击空白车厢放入', en: 'Select the correct number from options below and tap the empty carriage' },
        ]}
        insight={{ zh: '数列就是按规律排列的数字。比如 2,4,6,8... 每次加2！发现规律就能预测下一个数。', en: 'A sequence is numbers arranged by a rule. Like 2,4,6,8... adding 2 each time! Finding the rule lets you predict the next number.' }}
        onStart={() => setShowIntro(false)}
      />
    )
  }

  const data = (puzzle.data ?? puzzle) as unknown as SequencePuzzleData
  const { sequence = [], blanks = [], options = [] } = data ?? {}

  /* ---- state ---- */
  const [filled, setFilled] = useState<Map<number, number>>(new Map())
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [shakeIdx, setShakeIdx] = useState<number | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [complete, setComplete] = useState(false)
  const [usedOptions, setUsedOptions] = useState<Set<number>>(new Set())

  const blanksSet = useMemo(() => new Set(blanks), [blanks])

  /* ---- geometry helpers ---- */
  const totalCarriages = sequence.length
  const trainWidth = ENGINE_W + GAP + totalCarriages * (CARRIAGE_W + GAP)
  const startX = Math.max(20, (VW - trainWidth) / 2)

  const carriageX = (i: number) => startX + ENGINE_W + GAP + i * (CARRIAGE_W + GAP)

  /* ---- handlers ---- */
  const handleOptionTap = useCallback((num: number) => {
    if (complete) return
    if (usedOptions.has(num)) return
    setSelectedOption((prev) => (prev === num ? null : num))
  }, [complete, usedOptions])

  const handleCarriageTap = useCallback(
    (idx: number) => {
      if (complete) return
      if (!blanksSet.has(idx)) return
      if (filled.has(idx)) return
      if (selectedOption === null) return

      const correct = sequence[idx]
      if (selectedOption === correct) {
        const newFilled = new Map(filled)
        newFilled.set(idx, selectedOption)
        setFilled(newFilled)

        const newUsed = new Set(usedOptions)
        newUsed.add(selectedOption)
        setUsedOptions(newUsed)
        setSelectedOption(null)

        const newCount = correctCount + 1
        setCorrectCount(newCount)
        onCorrect()

        if (newCount === 1) {
          onAha()
        }

        if (newCount === blanks.length) {
          setComplete(true)
          setTimeout(onComplete, 1800)
        }
      } else {
        setShakeIdx(idx)
        onError()
        setTimeout(() => setShakeIdx(null), 500)
      }
    },
    [complete, blanksSet, filled, selectedOption, sequence, correctCount, blanks.length, usedOptions, onCorrect, onError, onAha, onComplete],
  )

  // Guard: if puzzle data is missing/malformed, show placeholder (after all hooks)
  if (!sequence.length) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>🚧 Puzzle data not available</p>
      </div>
    )
  }

  /* ---- wheel spin keyframes (CSS) ---- */
  const wheelSpinStyle = `
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes puff {
      0% { opacity: 0.8; transform: translate(0,0) scale(1); }
      100% { opacity: 0; transform: translate(-30px,-40px) scale(2.5); }
    }
    @keyframes pulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
  `

  /* ---- render helpers ---- */
  const renderWheel = (cx: number, cy: number, key: string) => (
    <g key={key}>
      <circle cx={cx} cy={cy} r={WHEEL_R} fill={WHEEL_COLOR} />
      <g style={{ transformOrigin: `${cx}px ${cy}px`, animation: complete ? 'spin 0.5s linear infinite' : 'spin 3s linear infinite' }}>
        {[0, 45, 90, 135].map((angle) => (
          <line
            key={angle}
            x1={cx - WHEEL_R * 0.7 * Math.cos((angle * Math.PI) / 180)}
            y1={cy - WHEEL_R * 0.7 * Math.sin((angle * Math.PI) / 180)}
            x2={cx + WHEEL_R * 0.7 * Math.cos((angle * Math.PI) / 180)}
            y2={cy + WHEEL_R * 0.7 * Math.sin((angle * Math.PI) / 180)}
            stroke={SPOKE_COLOR}
            strokeWidth={2}
          />
        ))}
      </g>
      <circle cx={cx} cy={cy} r={4} fill="#999" />
    </g>
  )

  const renderEngine = () => {
    const ex = startX
    const ey = CARRIAGE_Y - 10
    const eW = ENGINE_W
    const eH = CARRIAGE_H + 10
    return (
      <g>
        {/* body */}
        <rect x={ex} y={ey} width={eW} height={eH} rx={10} fill={ENGINE_BODY} />
        {/* roof */}
        <rect x={ex + 10} y={ey - 15} width={eW - 20} height={20} rx={6} fill={ENGINE_ROOF} />
        {/* chimney */}
        <rect x={ex + 18} y={ey - 50} width={22} height={40} rx={4} fill={CHIMNEY_COLOR} />
        <rect x={ex + 12} y={ey - 55} width={34} height={10} rx={5} fill={CHIMNEY_COLOR} />
        {/* cabin window */}
        <rect x={ex + 65} y={ey + 12} width={35} height={30} rx={4} fill="#ffe8a1" stroke="#c0392b" strokeWidth={2} />
        {/* front headlight */}
        <circle cx={ex + 15} cy={ey + eH - 20} r={8} fill="#ffd54f" />
        {/* wheels */}
        {renderWheel(ex + 28, ey + eH + WHEEL_R - 2, 'ew1')}
        {renderWheel(ex + eW - 28, ey + eH + WHEEL_R - 2, 'ew2')}
        {/* coupler */}
        <rect x={ex + eW - 2} y={ey + eH - 18} width={GAP + 4} height={8} rx={3} fill="#777" />
        {/* steam puffs */}
        {!complete &&
          [0, 1, 2].map((i) => (
            <circle
              key={`steam-${i}`}
              cx={ex + 29}
              cy={ey - 55}
              r={8 + i * 3}
              fill="white"
              opacity={0.6}
              style={{
                animation: `puff 2s ease-out ${i * 0.6}s infinite`,
              }}
            />
          ))}
      </g>
    )
  }

  const renderCarriage = (idx: number) => {
    const cx = carriageX(idx)
    const cy = CARRIAGE_Y
    const isBlank = blanksSet.has(idx)
    const isFilled = filled.has(idx)
    const isShaking = shakeIdx === idx
    const color = CARRIAGE_COLORS[idx % CARRIAGE_COLORS.length]
    const displayValue = isBlank ? (isFilled ? filled.get(idx) : '?') : sequence[idx]

    return (
      <motion.g
        key={`car-${idx}`}
        animate={
          isShaking
            ? { x: [0, -6, 6, -4, 4, 0] }
            : {}
        }
        transition={isShaking ? { duration: 0.4 } : {}}
        style={{ cursor: isBlank && !isFilled ? 'pointer' : 'default' }}
        onClick={() => handleCarriageTap(idx)}
      >
        {/* carriage body */}
        <rect x={cx} y={cy} width={CARRIAGE_W} height={CARRIAGE_H} rx={CARRIAGE_R} fill={color} />
        {/* wood-grain accent */}
        <rect x={cx + 4} y={cy + CARRIAGE_H - 14} width={CARRIAGE_W - 8} height={10} rx={4} fill="rgba(0,0,0,0.1)" />
        {/* window */}
        <rect
          x={cx + 12}
          y={cy + 10}
          width={CARRIAGE_W - 24}
          height={CARRIAGE_H - 30}
          rx={8}
          fill={isBlank && !isFilled ? '#fff8e1' : '#fffde7'}
          stroke={isBlank && !isFilled ? '#ffd54f' : 'rgba(255,255,255,0.4)'}
          strokeWidth={isBlank && !isFilled ? 3 : 2}
        />
        {/* "?" pulse for blanks */}
        {isBlank && !isFilled && (
          <rect
            x={cx + 12}
            y={cy + 10}
            width={CARRIAGE_W - 24}
            height={CARRIAGE_H - 30}
            rx={8}
            fill="none"
            stroke="#ffc107"
            strokeWidth={2}
            style={{ animation: 'pulse 1.5s ease-in-out infinite' }}
          />
        )}
        {/* number or ? */}
        <AnimatePresence mode="wait">
          {isFilled ? (
            <motion.text
              key={`filled-${idx}-${filled.get(idx)}`}
              x={cx + CARRIAGE_W / 2}
              y={cy + CARRIAGE_H / 2 + 2}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={32}
              fontWeight="bold"
              fill="#333"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              {displayValue}
            </motion.text>
          ) : (
            <motion.text
              key={`display-${idx}`}
              x={cx + CARRIAGE_W / 2}
              y={cy + CARRIAGE_H / 2 + 2}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={isBlank ? 36 : 32}
              fontWeight="bold"
              fill={isBlank ? '#ff9800' : '#333'}
              initial={false}
              animate={isBlank ? { opacity: [0.5, 1, 0.5] } : {}}
              transition={isBlank ? { duration: 2, repeat: Infinity } : {}}
            >
              {displayValue}
            </motion.text>
          )}
        </AnimatePresence>
        {/* coupler to next */}
        {idx < sequence.length - 1 && (
          <rect x={cx + CARRIAGE_W - 2} y={cy + CARRIAGE_H - 18} width={GAP + 4} height={8} rx={3} fill="#777" />
        )}
        {/* wheels */}
        {renderWheel(cx + 22, cy + CARRIAGE_H + WHEEL_R - 2, `cw-${idx}-1`)}
        {renderWheel(cx + CARRIAGE_W - 22, cy + CARRIAGE_H + WHEEL_R - 2, `cw-${idx}-2`)}
      </motion.g>
    )
  }

  const renderTrack = () => {
    const y = TRACK_Y
    const tieCount = Math.ceil(VW / 30)
    return (
      <g>
        {/* cross ties */}
        {Array.from({ length: tieCount }, (_, i) => (
          <rect
            key={`tie-${i}`}
            x={i * 30}
            y={y - 4}
            width={20}
            height={8}
            rx={2}
            fill={TRACK_COLOR}
            opacity={0.5}
          />
        ))}
        {/* rails */}
        <line x1={0} y1={y - 6} x2={VW} y2={y - 6} stroke={TRACK_COLOR} strokeWidth={4} />
        <line x1={0} y1={y + 6} x2={VW} y2={y + 6} stroke={TRACK_COLOR} strokeWidth={4} />
      </g>
    )
  }

  const renderClouds = () => (
    <g opacity={0.7}>
      {[
        { cx: 100, cy: 60, r: 30 },
        { cx: 130, cy: 50, r: 25 },
        { cx: 155, cy: 62, r: 22 },
        { cx: 550, cy: 45, r: 28 },
        { cx: 580, cy: 38, r: 22 },
        { cx: 605, cy: 48, r: 20 },
        { cx: 350, cy: 75, r: 20 },
        { cx: 375, cy: 68, r: 18 },
      ].map((c, i) => (
        <circle key={`cloud-${i}`} cx={c.cx} cy={c.cy} r={c.r} fill="white" />
      ))}
    </g>
  )

  const renderOptions = () => {
    const optY = VH - 70
    const optW = 56
    const totalW = options.length * (optW + 12) - 12
    const optStartX = (VW - totalW) / 2

    return (
      <g>
        {/* label */}
        <text x={VW / 2} y={optY - 18} textAnchor="middle" fontSize={14} fill="#666" fontWeight="500">
          Tap a number, then tap a ? carriage
        </text>
        {options.map((num, i) => {
          const ox = optStartX + i * (optW + 12)
          const isUsed = usedOptions.has(num)
          const isSelected = selectedOption === num
          return (
            <motion.g
              key={`opt-${i}-${num}`}
              style={{ cursor: isUsed ? 'default' : 'pointer' }}
              onClick={() => handleOptionTap(num)}
              whileHover={isUsed ? {} : { scale: 1.12 }}
              whileTap={isUsed ? {} : { scale: 0.92 }}
            >
              <rect
                x={ox}
                y={optY}
                width={optW}
                height={44}
                rx={22}
                fill={isUsed ? '#e0e0e0' : isSelected ? OPTION_SELECTED : OPTION_BG}
                stroke={isSelected ? '#ff9800' : OPTION_BORDER}
                strokeWidth={isSelected ? 3 : 1.5}
                opacity={isUsed ? 0.4 : 1}
              />
              <text
                x={ox + optW / 2}
                y={optY + 26}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={22}
                fontWeight="bold"
                fill={isUsed ? '#aaa' : '#333'}
              >
                {num}
              </text>
            </motion.g>
          )
        })}
      </g>
    )
  }

  /* ---- completion: train chugs away ---- */
  const trainVariants = {
    idle: { x: 0 },
    chug: {
      x: VW + 200,
      transition: { duration: 2.5, ease: 'easeIn' as const },
    },
  }

  /* big celebration steam on complete */
  const renderCelebrationSteam = () => {
    if (!complete) return null
    const ex = startX + 29
    const ey = CARRIAGE_Y - 65
    return (
      <>
        {Array.from({ length: 8 }, (_, i) => (
          <circle
            key={`cel-steam-${i}`}
            cx={ex + (i % 3) * 10}
            cy={ey}
            r={10 + i * 4}
            fill="white"
            opacity={0.7}
            style={{
              animation: `puff 1.5s ease-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </>
    )
  }

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      className="w-full h-full"
      style={{ touchAction: 'none', userSelect: 'none' }}
      preserveAspectRatio="xMidYMid meet"
    >
      <style>{wheelSpinStyle}</style>

      {/* sky gradient */}
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={SKY_TOP} />
          <stop offset="100%" stopColor={SKY_BOTTOM} />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={VW} height={VH} fill="url(#sky)" />

      {/* clouds */}
      {renderClouds()}

      {/* track */}
      {renderTrack()}

      {/* train group — slides away on complete */}
      <motion.g
        variants={trainVariants}
        initial="idle"
        animate={complete ? 'chug' : 'idle'}
      >
        {renderEngine()}
        {sequence.map((_, i) => renderCarriage(i))}
        {renderCelebrationSteam()}
      </motion.g>

      {/* options panel */}
      {!complete && renderOptions()}

      {/* completion text */}
      <AnimatePresence>
        {complete && (
          <motion.text
            x={VW / 2}
            y={VH / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={48}
            fontWeight="bold"
            fill="#4caf50"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1.5, type: 'spring', stiffness: 200 }}
          >
            Great job!
          </motion.text>
        )}
      </AnimatePresence>
    </svg>
  )
}
