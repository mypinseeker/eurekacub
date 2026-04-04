import { useState, useCallback, useRef } from 'react'
import type { RendererProps } from '../registry'
import CanvasBase from '../common/CanvasBase'
import PuzzleIntro from '../common/PuzzleIntro'
import type {
  FlipResult,
  Phase,
  ConfettiParticle,
} from './types'

// ── Constants ───────────────────────────────────────────────
const FLIP_DURATION = 1000 // ms
const COIN_RADIUS_RATIO = 0.12 // relative to min(w,h)
const BAR_WIDTH_RATIO = 0.06
const BAR_MAX_HEIGHT_RATIO = 0.5
const PREDICTION_OPTIONS = [0.25, 0.35, 0.45, 0.50, 0.55, 0.65, 0.75]

// ── Helpers (re-exported from utils for pure-logic testing) ──
import {
  parsePuzzleData,
  countHeads,
  headRatio,
  spawnConfetti,
} from './probability.utils'

// ── Component ───────────────────────────────────────────────

export default function CoinFlip({ puzzle, onCorrect, onError, onAha, onComplete }: RendererProps) {
  const [showIntro, setShowIntro] = useState(true)

  if (showIntro) {
    return (
      <PuzzleIntro
        icon="🎲"
        title={{ zh: '概率实验', en: 'Probability Lab' }}
        goal={{ zh: '多次抛硬币，观察正反面出现的比例，然后预测概率！', en: 'Flip coins many times, observe the ratio of heads vs tails, then predict the probability!' }}
        howTo={[
          { zh: '点击硬币来抛掷', en: 'Tap the coin to flip it' },
          { zh: '观察柱状图——正面和反面各出现了多少次？', en: 'Watch the bar chart — how many heads vs tails?' },
          { zh: '抛够次数后，预测正面出现的概率', en: 'After enough flips, predict the probability of heads' },
        ]}
        insight={{ zh: '抛得越多，正反比例越接近50:50。这就是"大数定律"——大量重复后，概率趋于稳定！', en: "The more you flip, the closer to 50:50. This is the 'Law of Large Numbers' — with many repetitions, probability stabilizes!" }}
        onStart={() => setShowIntro(false)}
      />
    )
  }

  const puzzleData = parsePuzzleData(puzzle)

  const [flipHistory, setFlipHistory] = useState<FlipResult[]>([])
  const [isFlipping, setIsFlipping] = useState(false)
  const [phase, setPhase] = useState<Phase>('flip')
  const [prediction, setPrediction] = useState<number | null>(null)
  const [experimentsCompleted, setExperimentsCompleted] = useState(0)
  const [ahaTriggered, setAhaTriggered] = useState(false)

  // Refs for animation state accessed in draw loop
  const flipStartRef = useRef(0)
  const flipResultRef = useRef<FlipResult>('H')
  const confettiRef = useRef<ConfettiParticle[]>([])
  const lastTimeRef = useRef(0)
  const bouncePhaseRef = useRef(0)

  // Stable refs for values accessed in draw
  const flipHistoryRef = useRef(flipHistory)
  flipHistoryRef.current = flipHistory
  const isFlippingRef = useRef(isFlipping)
  isFlippingRef.current = isFlipping
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const predictionRef = useRef(prediction)
  predictionRef.current = prediction
  const totalFlips = puzzleData.totalFlips
  const experimentsCompletedRef = useRef(experimentsCompleted)
  experimentsCompletedRef.current = experimentsCompleted

  // ── Coin flip logic ─────────────────────────────────────

  const doSingleFlip = useCallback(() => {
    const result: FlipResult = Math.random() < 0.5 ? 'H' : 'T'
    flipResultRef.current = result
    flipStartRef.current = performance.now()
    setIsFlipping(true)

    setTimeout(() => {
      setIsFlipping(false)
      setFlipHistory((prev) => {
        const next = [...prev, result]

        // Check for aha moment: ratio in 45-55% range after 10+ flips
        if (!ahaTriggered && next.length >= 10) {
          const ratio = countHeads(next) / next.length
          if (ratio >= 0.45 && ratio <= 0.55) {
            setAhaTriggered(true)
            onAha()
          }
        }

        // Check milestone confetti
        if (next.length === 10 || next.length === 20 || next.length === 50) {
          confettiRef.current = [
            ...confettiRef.current,
            ...spawnConfetti(0, 0, 30), // positions set in draw
          ]
        }

        // Check if reached target
        if (next.length >= totalFlips && phaseRef.current === 'flip') {
          setPhase('predict')
        }

        return next
      })
    }, FLIP_DURATION)
  }, [totalFlips, ahaTriggered, onAha])

  const doQuickFlip = useCallback((count: number) => {
    if (isFlipping) return
    const results: FlipResult[] = []
    for (let i = 0; i < count; i++) {
      results.push(Math.random() < 0.5 ? 'H' : 'T')
    }

    // Animate briefly
    flipResultRef.current = results[results.length - 1]
    flipStartRef.current = performance.now()
    setIsFlipping(true)

    setTimeout(() => {
      setIsFlipping(false)
      setFlipHistory((prev) => {
        const next = [...prev, ...results]

        if (!ahaTriggered && next.length >= 10) {
          const ratio = countHeads(next) / next.length
          if (ratio >= 0.45 && ratio <= 0.55) {
            setAhaTriggered(true)
            onAha()
          }
        }

        if (next.length >= totalFlips && phaseRef.current === 'flip') {
          setPhase('predict')
        }

        return next
      })
    }, FLIP_DURATION)
  }, [isFlipping, totalFlips, ahaTriggered, onAha])

  const submitPrediction = useCallback((pred: number) => {
    setPrediction(pred)
    setPhase('result')

    const ratio = headRatio(flipHistoryRef.current)
    const close = Math.abs(ratio - pred) <= 0.10
    if (close) {
      onCorrect()
    } else {
      onError()
    }

    // After showing result, prepare next experiment
    setTimeout(() => {
      const nextCompleted = experimentsCompletedRef.current + 1
      setExperimentsCompleted(nextCompleted)

      if (nextCompleted >= 3) {
        onComplete()
      } else {
        // Reset for next round
        setFlipHistory([])
        setPhase('flip')
        setPrediction(null)
      }
    }, 2500)
  }, [onCorrect, onError, onComplete])

  // ── Hit-test regions (set during draw, read on pointer) ──

  const hitRegions = useRef<{
    coin: { cx: number; cy: number; r: number }
    quickFlipBtn: { x: number; y: number; w: number; h: number } | null
    predictionBtns: { x: number; y: number; w: number; h: number; value: number }[]
  }>({
    coin: { cx: 0, cy: 0, r: 0 },
    quickFlipBtn: null,
    predictionBtns: [],
  })

  // ── Draw ──────────────────────────────────────────────────

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
    const dt = time - lastTimeRef.current
    lastTimeRef.current = time
    bouncePhaseRef.current += dt * 0.003

    const history = flipHistoryRef.current
    const flipping = isFlippingRef.current
    const currentPhase = phaseRef.current
    const pred = predictionRef.current
    const heads = countHeads(history)
    const tails = history.length - heads

    // ── Background ──
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h)
    bgGrad.addColorStop(0, '#1a1a2e')
    bgGrad.addColorStop(1, '#16213e')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, w, h)

    // Layout
    const coinAreaX = 0
    const coinAreaW = w * 0.6
    const barAreaX = w * 0.6
    const barAreaW = w * 0.4
    const coinCX = coinAreaX + coinAreaW / 2
    const coinCY = h * 0.38
    const coinR = Math.min(coinAreaW, h) * COIN_RADIUS_RATIO

    hitRegions.current.coin = { cx: coinCX, cy: coinCY, r: coinR }

    // ── Draw coin ──
    let scaleX = 1
    let showSide: FlipResult = history.length > 0 ? history[history.length - 1] : 'H'

    if (flipping) {
      const elapsed = time - flipStartRef.current
      const t = Math.min(elapsed / FLIP_DURATION, 1)
      // Sine-wave spinning: multiple full rotations, slowing down
      const spins = 4
      const angle = t * Math.PI * spins * (1 - t * 0.3)
      scaleX = Math.cos(angle)
      // Show the final side when coin faces forward in last quarter
      if (t > 0.75) {
        showSide = flipResultRef.current
      } else {
        showSide = scaleX > 0 ? 'H' : 'T'
      }
      scaleX = Math.abs(scaleX)
    }

    ctx.save()
    ctx.translate(coinCX, coinCY)
    ctx.scale(scaleX, 1)

    // Coin shadow
    ctx.beginPath()
    ctx.ellipse(4, 6, coinR + 2, coinR * 0.3 + 2, 0, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.fill()

    // Coin body - golden gradient
    const coinGrad = ctx.createRadialGradient(-coinR * 0.3, -coinR * 0.3, 0, 0, 0, coinR)
    coinGrad.addColorStop(0, '#FFE066')
    coinGrad.addColorStop(0.4, '#FFD700')
    coinGrad.addColorStop(0.8, '#DAA520')
    coinGrad.addColorStop(1, '#B8860B')
    ctx.beginPath()
    ctx.arc(0, 0, coinR, 0, Math.PI * 2)
    ctx.fillStyle = coinGrad
    ctx.fill()

    // Raised edge
    ctx.lineWidth = 3
    ctx.strokeStyle = '#B8860B'
    ctx.stroke()

    // Inner ring
    ctx.beginPath()
    ctx.arc(0, 0, coinR * 0.85, 0, Math.PI * 2)
    ctx.lineWidth = 1.5
    ctx.strokeStyle = 'rgba(184, 134, 11, 0.5)'
    ctx.stroke()

    // Face detail
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    if (showSide === 'H') {
      // Bear cub face
      const s = coinR * 0.015
      // Ears
      ctx.fillStyle = '#8B6914'
      ctx.beginPath()
      ctx.arc(-18 * s, -22 * s, 8 * s, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(18 * s, -22 * s, 8 * s, 0, Math.PI * 2)
      ctx.fill()
      // Inner ears
      ctx.fillStyle = '#DEB887'
      ctx.beginPath()
      ctx.arc(-18 * s, -22 * s, 4 * s, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(18 * s, -22 * s, 4 * s, 0, Math.PI * 2)
      ctx.fill()
      // Head
      ctx.fillStyle = '#8B6914'
      ctx.beginPath()
      ctx.arc(0, -5 * s, 20 * s, 0, Math.PI * 2)
      ctx.fill()
      // Muzzle
      ctx.fillStyle = '#DEB887'
      ctx.beginPath()
      ctx.ellipse(0, 4 * s, 10 * s, 8 * s, 0, 0, Math.PI * 2)
      ctx.fill()
      // Eyes
      ctx.fillStyle = '#1a1a1a'
      ctx.beginPath()
      ctx.arc(-8 * s, -8 * s, 2.5 * s, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(8 * s, -8 * s, 2.5 * s, 0, Math.PI * 2)
      ctx.fill()
      // Eye shine
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(-7 * s, -9 * s, 1 * s, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(9 * s, -9 * s, 1 * s, 0, Math.PI * 2)
      ctx.fill()
      // Nose
      ctx.fillStyle = '#1a1a1a'
      ctx.beginPath()
      ctx.ellipse(0, 1 * s, 3 * s, 2 * s, 0, 0, Math.PI * 2)
      ctx.fill()
      // Mouth
      ctx.strokeStyle = '#1a1a1a'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(-3 * s, 4 * s, 3 * s, 0, Math.PI * 0.6)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(3 * s, 4 * s, 3 * s, Math.PI * 0.4, Math.PI)
      ctx.stroke()
      // Label
      ctx.fillStyle = '#B8860B'
      ctx.font = `bold ${coinR * 0.18}px sans-serif`
      ctx.fillText('H', 0, coinR * 0.6)
    } else {
      // Star
      const s = coinR * 0.45
      ctx.fillStyle = '#B8860B'
      ctx.beginPath()
      for (let i = 0; i < 5; i++) {
        const outerAngle = (i * 2 * Math.PI) / 5 - Math.PI / 2
        const innerAngle = outerAngle + Math.PI / 5
        const ox = Math.cos(outerAngle) * s
        const oy = Math.sin(outerAngle) * s
        const ix = Math.cos(innerAngle) * s * 0.4
        const iy = Math.sin(innerAngle) * s * 0.4
        if (i === 0) ctx.moveTo(ox, oy - coinR * 0.05)
        else ctx.lineTo(ox, oy - coinR * 0.05)
        ctx.lineTo(ix, iy - coinR * 0.05)
      }
      ctx.closePath()
      ctx.fill()

      // Star shine
      ctx.fillStyle = '#FFE066'
      ctx.beginPath()
      for (let i = 0; i < 5; i++) {
        const outerAngle = (i * 2 * Math.PI) / 5 - Math.PI / 2
        const innerAngle = outerAngle + Math.PI / 5
        const ox = Math.cos(outerAngle) * s * 0.7
        const oy = Math.sin(outerAngle) * s * 0.7
        const ix = Math.cos(innerAngle) * s * 0.28
        const iy = Math.sin(innerAngle) * s * 0.28
        if (i === 0) ctx.moveTo(ox, oy - coinR * 0.05)
        else ctx.lineTo(ox, oy - coinR * 0.05)
        ctx.lineTo(ix, iy - coinR * 0.05)
      }
      ctx.closePath()
      ctx.fill()

      // Label
      ctx.fillStyle = '#B8860B'
      ctx.font = `bold ${coinR * 0.18}px sans-serif`
      ctx.fillText('T', 0, coinR * 0.6)
    }

    ctx.restore()

    // ── Flip counter ──
    ctx.fillStyle = '#E8E8E8'
    ctx.font = `bold ${Math.max(16, w * 0.025)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(
      `Flip #${history.length} / ${totalFlips}`,
      coinCX,
      coinCY + coinR + 20,
    )

    // ── "Tap to flip" / "Quick flip" ──
    if (currentPhase === 'flip' && !flipping) {
      const bounce = Math.sin(bouncePhaseRef.current * 2) * 4
      ctx.fillStyle = '#FFD700'
      ctx.font = `bold ${Math.max(18, w * 0.028)}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('Tap the coin to flip!', coinCX, coinCY + coinR + 50 + bounce)

      // Quick-flip button
      if (history.length < totalFlips) {
        const remaining = totalFlips - history.length
        const quickCount = Math.min(10, remaining)
        const btnW = Math.max(140, w * 0.18)
        const btnH = 36
        const btnX = coinCX - btnW / 2
        const btnY = coinCY + coinR + 80

        // Button background
        const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH)
        btnGrad.addColorStop(0, '#4ECDC4')
        btnGrad.addColorStop(1, '#45B7D1')
        roundRect(ctx, btnX, btnY, btnW, btnH, 8)
        ctx.fillStyle = btnGrad
        ctx.fill()

        ctx.fillStyle = '#fff'
        ctx.font = `bold ${Math.max(13, w * 0.018)}px sans-serif`
        ctx.fillText(`Flip ${quickCount} at once`, coinCX, btnY + btnH / 2 + 1)
        ctx.textBaseline = 'top'

        hitRegions.current.quickFlipBtn = { x: btnX, y: btnY, w: btnW, h: btnH }
      } else {
        hitRegions.current.quickFlipBtn = null
      }
    } else {
      hitRegions.current.quickFlipBtn = null
    }

    // ── Bar chart (right side) ──
    const barMaxH = h * BAR_MAX_HEIGHT_RATIO
    const barW = Math.min(w * BAR_WIDTH_RATIO, 50)
    const barGap = barW * 1.5
    const barBaseY = h * 0.65
    const barCenterX = barAreaX + barAreaW / 2

    const maxCount = Math.max(heads, tails, 1)
    const hBarH = (heads / maxCount) * barMaxH
    const tBarH = (tails / maxCount) * barMaxH

    // Heads bar (blue)
    const hBarX = barCenterX - barGap / 2 - barW
    const hGrad = ctx.createLinearGradient(hBarX, barBaseY - hBarH, hBarX, barBaseY)
    hGrad.addColorStop(0, '#6BB5FF')
    hGrad.addColorStop(1, '#3498DB')
    roundRect(ctx, hBarX, barBaseY - hBarH, barW, hBarH, 6)
    ctx.fillStyle = hGrad
    ctx.fill()

    // Tails bar (orange)
    const tBarX = barCenterX + barGap / 2
    const tGrad = ctx.createLinearGradient(tBarX, barBaseY - tBarH, tBarX, barBaseY)
    tGrad.addColorStop(0, '#FFB347')
    tGrad.addColorStop(1, '#FF8C00')
    roundRect(ctx, tBarX, barBaseY - tBarH, barW, tBarH, 6)
    ctx.fillStyle = tGrad
    ctx.fill()

    // Bar labels
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    ctx.fillStyle = '#6BB5FF'
    ctx.font = `bold ${Math.max(14, w * 0.02)}px sans-serif`
    ctx.fillText(`${heads}`, hBarX + barW / 2, barBaseY - hBarH - 6)
    ctx.fillStyle = '#FFB347'
    ctx.fillText(`${tails}`, tBarX + barW / 2, barBaseY - tBarH - 6)

    ctx.textBaseline = 'top'
    ctx.fillStyle = '#6BB5FF'
    ctx.font = `${Math.max(12, w * 0.016)}px sans-serif`
    ctx.fillText('Heads', hBarX + barW / 2, barBaseY + 8)
    ctx.fillStyle = '#FFB347'
    ctx.fillText('Tails', tBarX + barW / 2, barBaseY + 8)

    // 50% reference line
    if (history.length > 0) {
      const refY = barBaseY - barMaxH * 0.5
      ctx.setLineDash([6, 4])
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(hBarX - 10, refY)
      ctx.lineTo(tBarX + barW + 10, refY)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.font = `${Math.max(10, w * 0.013)}px sans-serif`
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.fillText('50%', hBarX - 14, refY)

      // Current ratio
      const ratio = history.length > 0 ? (heads / history.length * 100).toFixed(1) : '0'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillStyle = '#E8E8E8'
      ctx.font = `bold ${Math.max(13, w * 0.018)}px sans-serif`
      ctx.fillText(
        `Heads: ${ratio}%`,
        barCenterX,
        barBaseY + 32,
      )
    }

    // ── Experiment counter ──
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = `${Math.max(11, w * 0.014)}px sans-serif`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(
      `Experiment ${experimentsCompletedRef.current + 1} / 3`,
      12,
      12,
    )

    // ── Prediction phase overlay ──
    if (currentPhase === 'predict') {
      // Dim background
      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      ctx.fillRect(0, 0, w, h)

      const panelW = Math.min(w * 0.7, 400)
      const panelH = Math.min(h * 0.5, 300)
      const panelX = (w - panelW) / 2
      const panelY = (h - panelH) / 2

      // Panel
      roundRect(ctx, panelX, panelY, panelW, panelH, 16)
      ctx.fillStyle = '#1e3a5f'
      ctx.fill()
      ctx.strokeStyle = '#FFD700'
      ctx.lineWidth = 2
      ctx.stroke()

      // Question
      ctx.fillStyle = '#FFD700'
      ctx.font = `bold ${Math.max(15, w * 0.022)}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText('What do you predict?', w / 2, panelY + 20)

      ctx.fillStyle = '#E8E8E8'
      ctx.font = `${Math.max(13, w * 0.018)}px sans-serif`
      ctx.fillText(
        `After ${history.length} flips, what fraction is heads?`,
        w / 2,
        panelY + 50,
      )

      // Prediction buttons
      const btnSize = Math.min((panelW - 40) / PREDICTION_OPTIONS.length - 8, 50)
      const btnsY = panelY + panelH / 2 + 10
      const btnsStartX = w / 2 - ((PREDICTION_OPTIONS.length * (btnSize + 8)) - 8) / 2

      const predBtns: typeof hitRegions.current.predictionBtns = []

      for (let i = 0; i < PREDICTION_OPTIONS.length; i++) {
        const opt = PREDICTION_OPTIONS[i]
        const bx = btnsStartX + i * (btnSize + 8)
        const by = btnsY

        const isCenter = opt === 0.50
        roundRect(ctx, bx, by, btnSize, btnSize, 8)
        ctx.fillStyle = isCenter ? '#FFD700' : '#3498DB'
        ctx.fill()

        ctx.fillStyle = isCenter ? '#1a1a2e' : '#fff'
        ctx.font = `bold ${Math.max(11, btnSize * 0.35)}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`${Math.round(opt * 100)}%`, bx + btnSize / 2, by + btnSize / 2)

        predBtns.push({ x: bx, y: by, w: btnSize, h: btnSize, value: opt })
      }

      hitRegions.current.predictionBtns = predBtns
    } else {
      hitRegions.current.predictionBtns = []
    }

    // ── Result phase overlay ──
    if (currentPhase === 'result' && pred !== null) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      ctx.fillRect(0, 0, w, h)

      const actual = history.length > 0 ? heads / history.length : 0
      const close = Math.abs(actual - pred) <= 0.10

      const panelW = Math.min(w * 0.65, 360)
      const panelH = Math.min(h * 0.4, 220)
      const panelX = (w - panelW) / 2
      const panelY = (h - panelH) / 2

      roundRect(ctx, panelX, panelY, panelW, panelH, 16)
      ctx.fillStyle = close ? '#1a5f3a' : '#5f1a1a'
      ctx.fill()
      ctx.strokeStyle = close ? '#4ECDC4' : '#FF6B6B'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.fillStyle = '#fff'
      ctx.font = `bold ${Math.max(18, w * 0.028)}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(
        close ? 'Great prediction!' : 'Interesting!',
        w / 2,
        panelY + 24,
      )

      ctx.font = `${Math.max(14, w * 0.02)}px sans-serif`
      ctx.fillText(
        `Your prediction: ${Math.round(pred * 100)}%`,
        w / 2,
        panelY + 65,
      )
      ctx.fillText(
        `Actual heads: ${(actual * 100).toFixed(1)}%`,
        w / 2,
        panelY + 95,
      )

      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.font = `${Math.max(12, w * 0.016)}px sans-serif`
      ctx.fillText(
        'With more flips, heads gets closer to 50%!',
        w / 2,
        panelY + 135,
      )
    }

    // ── Confetti ──
    const particles = confettiRef.current
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      // Reposition particles spawned at (0,0) to coin center
      if (p.x === 0 && p.y === 0) {
        p.x = coinCX
        p.y = coinCY
      }
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.05 // gravity
      p.rotation += p.rotationSpeed
      p.life += 1

      const alpha = Math.max(0, 1 - p.life / p.maxLife)
      if (alpha <= 0) {
        particles.splice(i, 1)
        continue
      }

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.globalAlpha = alpha
      ctx.fillStyle = p.color
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
      ctx.restore()
    }
    ctx.globalAlpha = 1
  }, [totalFlips])

  // ── Pointer handling ──────────────────────────────────────

  const handlePointerDown = useCallback((x: number, y: number) => {
    const { coin, quickFlipBtn, predictionBtns } = hitRegions.current

    // Check prediction buttons first
    for (const btn of predictionBtns) {
      if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
        submitPrediction(btn.value)
        return
      }
    }

    // Check quick-flip button
    if (quickFlipBtn) {
      const b = quickFlipBtn
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        const remaining = totalFlips - flipHistoryRef.current.length
        doQuickFlip(Math.min(10, remaining))
        return
      }
    }

    // Check coin tap
    if (phaseRef.current === 'flip' && !isFlippingRef.current) {
      const dx = x - coin.cx
      const dy = y - coin.cy
      if (dx * dx + dy * dy <= coin.r * coin.r * 1.5) {
        doSingleFlip()
      }
    }
  }, [doSingleFlip, doQuickFlip, submitPrediction, totalFlips])

  return (
    <CanvasBase
      draw={draw}
      onPointerDown={handlePointerDown}
      className="cursor-pointer"
    />
  )
}

// ── Canvas helpers ────────────────────────────────────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  if (w <= 0 || h <= 0) return
  r = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}
