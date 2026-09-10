/**
 * PizzaEquivalence — the "same amount" mode of the fraction renderer (CG-FR-1).
 *
 * Two pizzas side by side. The left one is already cut into N slices with a of them shaded.
 * The child cuts the right one into M slices, then shades slices until it looks like the same
 * amount, and presses Done. On a correct answer the shaded right slices are reassembled and
 * slide across onto the left pizza, where they cover its shading exactly — the picture itself
 * is the proof that the two amounts are equal (CG-FR-1.3). No fraction is ever written out.
 *
 * Why the left pizza comes pre-cut (GATE-2 decision D-2): making the child cut both would mean
 * 12 cuts in one round for 2/4 = 4/8, and one slip resets the round. Cutting is what L1–L3
 * already practise; this level is about "same amount", so the child cuts only one pizza.
 */
import { useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import type { RendererProps } from '../registry'
import SvgBase from '../common/SvgBase'
import type { Cut } from './types'
import { SLICE_COLORS } from './types'
import {
  TOP,
  evenCutAngles,
  sliceArcs,
  sliceIndexAt,
  wedgePath,
  validateCuts,
  isSameAmount,
  answerFor,
  parseEquivalence,
} from './fraction.utils'

const VIEW_W = 840
const VIEW_H = 440
const R = 170
const LEFT_CX = 210
const RIGHT_CX = 630
const CY = 220
const CRUST = 12

type Phase = 'cut' | 'shade' | 'done'

const SHADE = SLICE_COLORS[4] // orange
const OVERLAY = SLICE_COLORS[1] // blue — a different colour so the covering is visible

function PizzaBase({ cx }: { cx: number }) {
  return (
    <>
      <circle cx={cx} cy={CY} r={R} fill="#D4A54A" />
      <circle cx={cx} cy={CY} r={R - CRUST} fill="#F5CBA7" />
    </>
  )
}

function CutLine({ cx, angle, dashed }: { cx: number; angle: number; dashed?: boolean }) {
  return (
    <line
      x1={cx}
      y1={CY}
      x2={cx + Math.cos(angle) * R}
      y2={CY + Math.sin(angle) * R}
      stroke={dashed ? '#D5C4A1' : '#5D4037'}
      strokeWidth={dashed ? 1.5 : 3}
      strokeDasharray={dashed ? '4 8' : undefined}
      strokeLinecap="round"
      opacity={dashed ? 0.6 : 1}
    />
  )
}

export default function PizzaEquivalence({ puzzle, onCorrect, onError, onAha, onComplete }: RendererProps) {
  const { rounds, showGuides, tolerance } = useMemo(() => parseEquivalence(puzzle), [puzzle])

  const [roundIdx, setRoundIdx] = useState(0)
  const [solved, setSolved] = useState(0)
  const [phase, setPhase] = useState<Phase>('cut')
  const [cuts, setCuts] = useState<Cut[]>([])
  const [shaded, setShaded] = useState<Set<number>>(() => new Set())
  const [wrong, setWrong] = useState(false)
  const [shake, setShake] = useState(false)

  const round = rounds[Math.min(roundIdx, rounds.length - 1)]
  const [givenShaded, givenSlices] = round.given
  const pieces = round.cutInto
  const allDone = solved >= rounds.length

  const handlePointerDown = useCallback(
    (x: number, y: number) => {
      const dx = x - RIGHT_CX
      const dy = y - CY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const angle = Math.atan2(dy, dx)

      if (phase === 'cut') {
        if (shake || dist < R * 0.3 || dist > R + 30 || cuts.length >= pieces) return
        const next = [...cuts, { angle }]
        setCuts(next)
        if (next.length === pieces) {
          if (validateCuts(next, pieces, tolerance)) {
            setPhase('shade')
          } else {
            onError()
            setShake(true)
            setTimeout(() => {
              setCuts([])
              setShake(false)
            }, 800)
          }
        }
        return
      }

      if (phase === 'shade') {
        if (dist > R) return
        const i = sliceIndexAt(angle, cuts.map((c) => c.angle))
        setShaded((prev) => {
          const s = new Set(prev)
          if (s.has(i)) s.delete(i)
          else s.add(i)
          return s
        })
        setWrong(false)
      }
    },
    [phase, shake, cuts, pieces, tolerance, onError],
  )

  const handleDone = () => {
    if (isSameAmount(shaded.size, pieces, round.given)) {
      setPhase('done')
      setWrong(false)
      onCorrect()
      const n = solved + 1
      setSolved(n)
      if (n === 1) onAha()
      if (n >= rounds.length) setTimeout(onComplete, 1800)
    } else {
      setWrong(true)
      onError()
    }
  }

  const handleNext = () => {
    setRoundIdx((i) => i + 1)
    setPhase('cut')
    setCuts([])
    setShaded(new Set())
    setWrong(false)
  }

  const handleRestart = () => {
    setPhase('cut')
    setCuts([])
    setShaded(new Set())
    setWrong(false)
  }

  const leftCuts = evenCutAngles(givenSlices)
  const leftArc = (Math.PI * 2) / givenSlices
  const rightArcs = sliceArcs(cuts.map((c) => c.angle))
  const pieceArc = (Math.PI * 2) / pieces
  const answer = answerFor(round)

  const prompt =
    phase === 'cut'
      ? { zh: `把右边的披萨切成 ${pieces} 块一样大的`, en: `Cut the right pizza into ${pieces} equal slices` }
      : phase === 'shade'
        ? { zh: '点一点，涂出和左边一样多的披萨', en: 'Tap slices to shade the same amount as the left pizza' }
        : allDone
          ? { zh: '全部完成！块数不一样，也可以一样多！', en: 'All done! Different slices, same amount!' }
          : { zh: '一样多！看，正好盖住！', en: 'Same amount! See — it covers it exactly!' }

  return (
    <div
      className="flex flex-col items-center gap-3 select-none w-full"
      data-testid="pizza-equivalence"
      data-phase={phase}
      data-round={roundIdx}
      data-shaded={shaded.size}
      data-solved={solved}
    >
      <div className="text-center">
        <p className="text-lg font-bold text-amber-900">{prompt.zh}</p>
        <p className="text-xs text-amber-700">{prompt.en}</p>
        {phase === 'cut' && (
          <p className="text-sm text-amber-700 mt-0.5">
            {cuts.length} / {pieces}
          </p>
        )}
        <div className="flex justify-center gap-1 mt-1">
          {rounds.map((_, i) => (
            <span key={i} className={`w-3 h-3 rounded-full ${i < solved ? 'bg-green-500' : 'bg-gray-300'}`} />
          ))}
        </div>
      </div>

      <motion.div
        className="w-full max-w-2xl"
        style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}` }}
        animate={shake ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : {}}
        transition={{ duration: 0.5 }}
      >
        <SvgBase viewWidth={VIEW_W} viewHeight={VIEW_H} onPointerDown={handlePointerDown}>
          {/* ── Left pizza: pre-cut and pre-shaded ───────────── */}
          <PizzaBase cx={LEFT_CX} />
          {Array.from({ length: givenShaded }, (_, i) => (
            <path
              key={`given-${i}`}
              d={wedgePath(LEFT_CX, CY, R - CRUST, TOP + i * leftArc, TOP + (i + 1) * leftArc)}
              fill={SHADE}
              opacity={0.85}
            />
          ))}
          {leftCuts.map((a, i) => (
            <CutLine key={`lc-${i}`} cx={LEFT_CX} angle={a} />
          ))}

          {/* ── The "=" / "?" between them ───────────────────── */}
          <text
            x={(LEFT_CX + RIGHT_CX) / 2}
            y={CY}
            fontSize="48"
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="central"
            fill={phase === 'done' ? '#16A34A' : '#B45309'}
          >
            {phase === 'done' ? '=' : '?'}
          </text>

          {/* ── Right pizza: the child's ─────────────────────── */}
          <PizzaBase cx={RIGHT_CX} />
          {phase !== 'cut' &&
            rightArcs.map(([s, e], i) => (
              <path
                key={`rs-${i}`}
                d={wedgePath(RIGHT_CX, CY, R - CRUST, s, e)}
                fill={shaded.has(i) ? SHADE : 'transparent'}
                opacity={shaded.has(i) ? 0.85 : 1}
                style={{ cursor: phase === 'shade' ? 'pointer' : 'default' }}
              />
            ))}
          {phase === 'cut' &&
            showGuides &&
            evenCutAngles(pieces).map((a, i) => <CutLine key={`g-${i}`} cx={RIGHT_CX} angle={a} dashed />)}
          {cuts.map((c, i) => (
            <CutLine key={`rc-${i}`} cx={RIGHT_CX} angle={c.angle} />
          ))}

          {/* ── The proof: the child's slices, reassembled, slide over the left pizza ── */}
          {phase === 'done' && (
            <motion.g
              data-testid="equivalence-overlay"
              initial={{ x: RIGHT_CX - LEFT_CX, opacity: 0.9 }}
              animate={{ x: 0, opacity: 0.75 }}
              transition={{ duration: 1.1, ease: 'easeInOut', delay: 0.2 }}
            >
              {Array.from({ length: answer }, (_, i) => (
                <path
                  key={`ov-${i}`}
                  d={wedgePath(LEFT_CX, CY, R - CRUST, TOP + i * pieceArc, TOP + (i + 1) * pieceArc)}
                  fill={OVERLAY}
                  stroke="white"
                  strokeWidth={2}
                />
              ))}
            </motion.g>
          )}
        </SvgBase>
      </motion.div>

      {wrong && (
        <p className="text-sm font-semibold text-amber-700" data-testid="equivalence-nudge">
          再比一比：两边涂的一样多吗？ <span className="text-xs text-amber-600">Look again — is it the same amount?</span>
        </p>
      )}

      <div className="flex gap-3">
        {phase !== 'done' && (cuts.length > 0 || shaded.size > 0) && (
          <button
            type="button"
            onClick={handleRestart}
            className="px-4 py-2 rounded-full bg-amber-100 text-amber-800 font-semibold border-2 border-amber-300 active:scale-95"
          >
            重新切 Start over
          </button>
        )}
        {phase === 'shade' && (
          <button
            type="button"
            data-testid="equivalence-done"
            onClick={handleDone}
            disabled={shaded.size === 0}
            className="px-5 py-2 rounded-full bg-green-400 text-white font-bold border-2 border-green-500 shadow-md active:scale-95 disabled:opacity-40"
          >
            好了 Done
          </button>
        )}
        {phase === 'done' && !allDone && (
          <button
            type="button"
            data-testid="equivalence-next"
            onClick={handleNext}
            className="px-5 py-2 rounded-full bg-green-400 text-white font-bold border-2 border-green-500 shadow-md active:scale-95"
          >
            下一个披萨 Next pizza
          </button>
        )}
      </div>
    </div>
  )
}
