import { useState, useCallback, useRef } from 'react'
import type { RendererProps } from '../registry'
import CanvasBase from '../common/CanvasBase'
import type { PositionSample, Phase } from './types'
import {
  MAX_SPEED,
  MATCH_THRESHOLD,
  clamp,
  generateDefaultCurve,
  sampleTarget,
  computeScore,
  parsePuzzleData,
} from './derivative.utils'

/** How often (in seconds) we sample position for the drawn curve. */
const SAMPLE_INTERVAL = 0.05

/** Road section occupies the top portion of the canvas. */
const ROAD_Y_RATIO = 0.08
const ROAD_H_RATIO = 0.22

/** Graph section occupies the middle portion. */
const GRAPH_TOP_RATIO = 0.34
const GRAPH_BOTTOM_RATIO = 0.82

/** Slider at the very bottom. */
const SLIDER_Y_RATIO = 0.88
const SLIDER_H = 40

/** Speed gauge on the right. */
const GAUGE_W = 36
const GAUGE_MARGIN = 16

// ── Colors ──────────────────────────────────────────────────

const COL_ROAD = '#555'
const COL_GRASS = '#4a8c3f'
const COL_LANE_DASH = '#ffffffcc'
const COL_CAR_BODY = '#e84545'
const COL_CAR_WINDOW = '#87ceeb'
const COL_CAR_WHEEL = '#222'
const COL_FLAG_POLE = '#333'
const COL_FLAG_CHECKER_A = '#111'
const COL_FLAG_CHECKER_B = '#fff'
const COL_GRAPH_BG = '#f8f8f8'
const COL_GRID = '#e0e0e0'
const COL_AXIS = '#555'
const COL_TARGET_CURVE = '#3b82f6'
const COL_TARGET_GLOW = 'rgba(59,130,246,0.25)'
const COL_DRAWN_START = '#f97316'
const COL_DRAWN_END = '#ef4444'
const COL_SLIDER_TRACK = '#d1d5db'
const COL_SLIDER_FILL = '#3b82f6'
const COL_SLIDER_THUMB = '#fff'
const COL_SLIDER_THUMB_STROKE = '#3b82f6'

// ── Helpers ─────────────────────────────────────────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
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

// ── Component ───────────────────────────────────────────────

export default function SpeedController({
  puzzle,
  onCorrect,
  onError,
  onAha,
  onComplete,
}: RendererProps) {
  const puzzleData = parsePuzzleData(puzzle)
  const { targetCurve, duration, finishLine } = puzzleData

  // ── State ─────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('ready')
  const [speed, setSpeed] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  // Refs for values accessed in the rAF draw loop
  const phaseRef = useRef<Phase>('ready')
  const speedRef = useRef(0)
  const carPosRef = useRef(0)
  const elapsedRef = useRef(0)
  const historyRef = useRef<PositionSample[]>([])
  const lastSampleTimeRef = useRef(0)
  const lastFrameTimeRef = useRef(0)
  const isDraggingRef = useRef(false)
  const ahaFiredRef = useRef(false)
  const resultFiredRef = useRef(false)
  const wheelAngleRef = useRef(0)

  // Sync React state → refs
  phaseRef.current = phase
  speedRef.current = speed
  isDraggingRef.current = isDragging

  // Hit regions computed during draw, read during pointer events
  const hitRegions = useRef<{
    slider: { x: number; y: number; w: number; h: number } | null
    startBtn: { x: number; y: number; w: number; h: number } | null
    retryBtn: { x: number; y: number; w: number; h: number } | null
  }>({
    slider: null,
    startBtn: null,
    retryBtn: null,
  })

  // ── Game logic helpers ────────────────────────────────────

  const startGame = useCallback(() => {
    carPosRef.current = 0
    elapsedRef.current = 0
    historyRef.current = [{ time: 0, position: 0 }]
    lastSampleTimeRef.current = 0
    lastFrameTimeRef.current = 0
    ahaFiredRef.current = false
    resultFiredRef.current = false
    wheelAngleRef.current = 0
    setSpeed(0)
    speedRef.current = 0
    setPhase('running')
  }, [])

  const resetGame = useCallback(() => {
    carPosRef.current = 0
    elapsedRef.current = 0
    historyRef.current = []
    lastSampleTimeRef.current = 0
    lastFrameTimeRef.current = 0
    ahaFiredRef.current = false
    resultFiredRef.current = false
    wheelAngleRef.current = 0
    setSpeed(0)
    speedRef.current = 0
    setPhase('ready')
  }, [])

  const setSpeedFromSlider = useCallback((sliderFrac: number) => {
    const newSpeed = clamp(sliderFrac * MAX_SPEED, 0, MAX_SPEED)
    setSpeed(newSpeed)
    speedRef.current = newSpeed
  }, [])

  // ── Draw ──────────────────────────────────────────────────

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      const currentPhase = phaseRef.current
      const currentSpeed = speedRef.current

      // ── Physics update ──
      if (currentPhase === 'running') {
        if (lastFrameTimeRef.current === 0) {
          lastFrameTimeRef.current = time
        }
        const dtMs = Math.min(time - lastFrameTimeRef.current, 50) // cap to avoid jumps
        lastFrameTimeRef.current = time
        const dtSec = dtMs / 1000

        elapsedRef.current += dtSec
        const posDelta = (currentSpeed / MAX_SPEED) * (finishLine / duration) * dtSec
        carPosRef.current = clamp(carPosRef.current + posDelta, 0, finishLine)

        // Record sample
        if (elapsedRef.current - lastSampleTimeRef.current >= SAMPLE_INTERVAL) {
          historyRef.current.push({
            time: elapsedRef.current,
            position: carPosRef.current,
          })
          lastSampleTimeRef.current = elapsedRef.current
        }

        // Wheel rotation
        wheelAngleRef.current += (currentSpeed / MAX_SPEED) * dtMs * 0.015

        // Aha: when drawn curve closely matches target for a stretch
        if (!ahaFiredRef.current && elapsedRef.current > duration * 0.4) {
          const midScore = computeScore(
            historyRef.current,
            targetCurve,
            elapsedRef.current,
            finishLine,
          )
          if (midScore < MATCH_THRESHOLD * 0.8) {
            ahaFiredRef.current = true
            onAha()
          }
        }

        // End condition
        if (elapsedRef.current >= duration && !resultFiredRef.current) {
          resultFiredRef.current = true
          // Final sample
          historyRef.current.push({
            time: elapsedRef.current,
            position: carPosRef.current,
          })

          const score = computeScore(historyRef.current, targetCurve, duration, finishLine)
          setPhase('finished')

          if (score < MATCH_THRESHOLD) {
            onCorrect()
            setTimeout(() => onComplete(), 1500)
          } else {
            onError()
          }
        }
      }

      const elapsed = elapsedRef.current
      const carPos = carPosRef.current
      const history = historyRef.current

      // ── Layout constants ──
      const roadY = h * ROAD_Y_RATIO
      const roadH = h * ROAD_H_RATIO
      const roadMid = roadY + roadH / 2

      const graphL = 60
      const graphR = w - GAUGE_W - GAUGE_MARGIN * 2 - 10
      const graphT = h * GRAPH_TOP_RATIO
      const graphB = h * GRAPH_BOTTOM_RATIO
      const graphW = graphR - graphL
      const graphH = graphB - graphT

      const sliderY = h * SLIDER_Y_RATIO
      const sliderX = 40
      const sliderW = w - 80

      const gaugeX = w - GAUGE_MARGIN - GAUGE_W
      const gaugeY = graphT
      const gaugeH = graphH

      // ── Background ──
      ctx.fillStyle = '#e8f5e9'
      ctx.fillRect(0, 0, w, h)

      // ── Road section ──
      // Grass
      ctx.fillStyle = COL_GRASS
      ctx.fillRect(0, roadY - 10, w, roadH + 20)

      // Asphalt
      ctx.fillStyle = COL_ROAD
      ctx.fillRect(0, roadY + 8, w, roadH - 16)

      // Lane dashes
      ctx.setLineDash([20, 15])
      ctx.strokeStyle = COL_LANE_DASH
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, roadMid)
      ctx.lineTo(w, roadMid)
      ctx.stroke()
      ctx.setLineDash([])

      // Road edge lines
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(0, roadY + 8)
      ctx.lineTo(w, roadY + 8)
      ctx.moveTo(0, roadY + roadH - 8)
      ctx.lineTo(w, roadY + roadH - 8)
      ctx.stroke()

      // ── Finish flag ──
      const roadPadL = 40
      const roadPadR = 40
      const roadUsable = w - roadPadL - roadPadR
      const finishX = roadPadL + roadUsable

      // Pole
      ctx.fillStyle = COL_FLAG_POLE
      ctx.fillRect(finishX - 2, roadY - 10, 4, roadH + 28)

      // Checkered flag
      const flagW = 20
      const flagH = 16
      const flagRows = 4
      const flagCols = 5
      const cellW = flagW / flagCols
      const cellH = flagH / flagRows
      for (let r = 0; r < flagRows; r++) {
        for (let c = 0; c < flagCols; c++) {
          ctx.fillStyle = (r + c) % 2 === 0 ? COL_FLAG_CHECKER_A : COL_FLAG_CHECKER_B
          ctx.fillRect(finishX + 2 + c * cellW, roadY - 10 + r * cellH, cellW, cellH)
        }
      }

      // ── Car ──
      const carScreenX = roadPadL + (carPos / finishLine) * roadUsable
      const carW = Math.max(40, w * 0.06)
      const carH = carW * 0.45
      const carY = roadMid - carH / 2 - 3

      // Car body
      const carGrad = ctx.createLinearGradient(carScreenX - carW / 2, carY, carScreenX - carW / 2, carY + carH)
      carGrad.addColorStop(0, '#ff6b6b')
      carGrad.addColorStop(1, COL_CAR_BODY)
      roundRect(ctx, carScreenX - carW / 2, carY, carW, carH, 6)
      ctx.fillStyle = carGrad
      ctx.fill()

      // Car roof / window
      const roofW = carW * 0.45
      const roofH = carH * 0.55
      const roofX = carScreenX - roofW / 2 + carW * 0.05
      const roofY = carY - roofH * 0.6
      roundRect(ctx, roofX, roofY, roofW, roofH, 4)
      ctx.fillStyle = COL_CAR_WINDOW
      ctx.fill()

      // Wheels
      const wheelR = carH * 0.22
      const wAngle = wheelAngleRef.current

      // Front wheel
      ctx.save()
      ctx.translate(carScreenX + carW * 0.25, carY + carH)
      ctx.rotate(wAngle)
      ctx.beginPath()
      ctx.arc(0, 0, wheelR, 0, Math.PI * 2)
      ctx.fillStyle = COL_CAR_WHEEL
      ctx.fill()
      // Spoke
      ctx.strokeStyle = '#666'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(-wheelR * 0.6, 0)
      ctx.lineTo(wheelR * 0.6, 0)
      ctx.moveTo(0, -wheelR * 0.6)
      ctx.lineTo(0, wheelR * 0.6)
      ctx.stroke()
      ctx.restore()

      // Rear wheel
      ctx.save()
      ctx.translate(carScreenX - carW * 0.25, carY + carH)
      ctx.rotate(wAngle)
      ctx.beginPath()
      ctx.arc(0, 0, wheelR, 0, Math.PI * 2)
      ctx.fillStyle = COL_CAR_WHEEL
      ctx.fill()
      ctx.strokeStyle = '#666'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(-wheelR * 0.6, 0)
      ctx.lineTo(wheelR * 0.6, 0)
      ctx.moveTo(0, -wheelR * 0.6)
      ctx.lineTo(0, wheelR * 0.6)
      ctx.stroke()
      ctx.restore()

      // ── Graph section ──

      // Graph background
      roundRect(ctx, graphL - 4, graphT - 4, graphW + 8, graphH + 8, 8)
      ctx.fillStyle = COL_GRAPH_BG
      ctx.fill()
      ctx.strokeStyle = '#ccc'
      ctx.lineWidth = 1
      ctx.stroke()

      // Grid lines
      ctx.strokeStyle = COL_GRID
      ctx.lineWidth = 0.5
      const gridCountX = 10
      const gridCountY = 5
      for (let i = 1; i < gridCountX; i++) {
        const gx = graphL + (i / gridCountX) * graphW
        ctx.beginPath()
        ctx.moveTo(gx, graphT)
        ctx.lineTo(gx, graphB)
        ctx.stroke()
      }
      for (let i = 1; i < gridCountY; i++) {
        const gy = graphT + (i / gridCountY) * graphH
        ctx.beginPath()
        ctx.moveTo(graphL, gy)
        ctx.lineTo(graphR, gy)
        ctx.stroke()
      }

      // Axes
      ctx.strokeStyle = COL_AXIS
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(graphL, graphT)
      ctx.lineTo(graphL, graphB)
      ctx.lineTo(graphR, graphB)
      ctx.stroke()

      // Axis labels
      ctx.fillStyle = COL_AXIS
      ctx.font = `${Math.max(11, w * 0.016)}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText('Time', graphL + graphW / 2, graphB + 6)

      ctx.save()
      ctx.translate(graphL - 30, graphT + graphH / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Position', 0, 0)
      ctx.restore()

      // Tick labels
      ctx.fillStyle = '#888'
      ctx.font = `${Math.max(9, w * 0.012)}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      for (let i = 0; i <= gridCountX; i += 2) {
        const label = ((i / gridCountX) * duration).toFixed(0)
        ctx.fillText(`${label}s`, graphL + (i / gridCountX) * graphW, graphB + 2)
      }
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      for (let i = 0; i <= gridCountY; i++) {
        const val = ((gridCountY - i) / gridCountY) * finishLine
        ctx.fillText(val.toFixed(0), graphL - 6, graphT + (i / gridCountY) * graphH)
      }

      // ── Target curve (dashed blue with glow) ──
      ctx.save()
      ctx.beginPath()
      ctx.rect(graphL, graphT, graphW, graphH)
      ctx.clip()

      // Glow
      ctx.setLineDash([8, 5])
      ctx.lineWidth = 6
      ctx.strokeStyle = COL_TARGET_GLOW
      ctx.beginPath()
      for (let i = 0; i < targetCurve.length; i++) {
        const tNorm = i / (targetCurve.length - 1)
        const px = graphL + tNorm * graphW
        const py = graphB - (targetCurve[i] / finishLine) * graphH
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()

      // Main line
      ctx.lineWidth = 2.5
      ctx.strokeStyle = COL_TARGET_CURVE
      ctx.beginPath()
      for (let i = 0; i < targetCurve.length; i++) {
        const tNorm = i / (targetCurve.length - 1)
        const px = graphL + tNorm * graphW
        const py = graphB - (targetCurve[i] / finishLine) * graphH
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()
      ctx.setLineDash([])

      // ── Drawn curve (solid gradient orange→red) ──
      if (history.length > 1) {
        const drawnGrad = ctx.createLinearGradient(graphL, 0, graphR, 0)
        drawnGrad.addColorStop(0, COL_DRAWN_START)
        drawnGrad.addColorStop(1, COL_DRAWN_END)

        ctx.lineWidth = 3
        ctx.strokeStyle = drawnGrad
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        ctx.beginPath()
        for (let i = 0; i < history.length; i++) {
          const s = history[i]
          const tNorm = s.time / duration
          const px = graphL + clamp(tNorm, 0, 1) * graphW
          const py = graphB - (s.position / finishLine) * graphH
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.stroke()
      }

      // Time progress indicator (vertical line)
      if (currentPhase === 'running') {
        const tNorm = clamp(elapsed / duration, 0, 1)
        const progX = graphL + tNorm * graphW
        ctx.strokeStyle = 'rgba(0,0,0,0.25)'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 3])
        ctx.beginPath()
        ctx.moveTo(progX, graphT)
        ctx.lineTo(progX, graphB)
        ctx.stroke()
        ctx.setLineDash([])

        // Dot at current position on graph
        const dotY = graphB - (carPos / finishLine) * graphH
        ctx.beginPath()
        ctx.arc(progX, dotY, 5, 0, Math.PI * 2)
        ctx.fillStyle = COL_DRAWN_END
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.stroke()
      }

      ctx.restore()

      // ── Speed gauge (right side) ──
      roundRect(ctx, gaugeX, gaugeY, GAUGE_W, gaugeH, 6)
      ctx.fillStyle = '#f0f0f0'
      ctx.fill()
      ctx.strokeStyle = '#ccc'
      ctx.lineWidth = 1
      ctx.stroke()

      // Fill level
      const speedFrac = currentSpeed / MAX_SPEED
      const fillH = speedFrac * (gaugeH - 8)
      const gaugeGrad = ctx.createLinearGradient(0, gaugeY + gaugeH - 4, 0, gaugeY + 4)
      gaugeGrad.addColorStop(0, '#22c55e')
      gaugeGrad.addColorStop(0.5, '#eab308')
      gaugeGrad.addColorStop(1, '#ef4444')
      roundRect(ctx, gaugeX + 4, gaugeY + gaugeH - 4 - fillH, GAUGE_W - 8, fillH, 3)
      ctx.fillStyle = gaugeGrad
      ctx.fill()

      // Gauge label
      ctx.fillStyle = COL_AXIS
      ctx.font = `bold ${Math.max(10, w * 0.013)}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.fillText('SPD', gaugeX + GAUGE_W / 2, gaugeY - 4)

      // Numeric speed
      ctx.fillStyle = '#333'
      ctx.font = `bold ${Math.max(11, w * 0.015)}px sans-serif`
      ctx.textBaseline = 'top'
      ctx.fillText(`${Math.round(currentSpeed)}`, gaugeX + GAUGE_W / 2, gaugeY + gaugeH + 4)

      // ── Slider (bottom) ──
      if (currentPhase === 'running') {
        // Track
        const trackH = 8
        const trackY = sliderY + SLIDER_H / 2 - trackH / 2
        roundRect(ctx, sliderX, trackY, sliderW, trackH, 4)
        ctx.fillStyle = COL_SLIDER_TRACK
        ctx.fill()

        // Filled portion
        const filledW = speedFrac * sliderW
        roundRect(ctx, sliderX, trackY, filledW, trackH, 4)
        ctx.fillStyle = COL_SLIDER_FILL
        ctx.fill()

        // Thumb
        const thumbR = 18
        const thumbX = sliderX + filledW
        const thumbY = sliderY + SLIDER_H / 2
        ctx.beginPath()
        ctx.arc(thumbX, thumbY, thumbR, 0, Math.PI * 2)
        ctx.fillStyle = COL_SLIDER_THUMB
        ctx.fill()
        ctx.strokeStyle = COL_SLIDER_THUMB_STROKE
        ctx.lineWidth = 3
        ctx.stroke()

        // Thumb inner lines (grip)
        ctx.strokeStyle = '#bbb'
        ctx.lineWidth = 1.5
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath()
          ctx.moveTo(thumbX + i * 4, thumbY - 6)
          ctx.lineTo(thumbX + i * 4, thumbY + 6)
          ctx.stroke()
        }

        // Slider label
        ctx.fillStyle = '#555'
        ctx.font = `${Math.max(12, w * 0.016)}px sans-serif`
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        ctx.fillText('Speed', sliderX - 38, sliderY + SLIDER_H / 2)

        hitRegions.current.slider = {
          x: sliderX - 20,
          y: sliderY - 10,
          w: sliderW + 40,
          h: SLIDER_H + 20,
        }
      } else {
        hitRegions.current.slider = null
      }

      // ── Timer display ──
      ctx.fillStyle = '#333'
      ctx.font = `bold ${Math.max(14, w * 0.02)}px sans-serif`
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      const timeRemaining = Math.max(0, duration - elapsed)
      ctx.fillText(
        `Time: ${timeRemaining.toFixed(1)}s`,
        12,
        8,
      )

      // ── Phase-specific overlays ──

      if (currentPhase === 'ready') {
        // "Start" button
        const btnW = Math.max(180, w * 0.25)
        const btnH = 50
        const btnX = (w - btnW) / 2
        const btnY = h * 0.5 - btnH / 2

        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0,0,0,0.15)'
        ctx.fillRect(0, h * 0.32, w, h * 0.4)

        // Instruction text
        ctx.fillStyle = '#333'
        ctx.font = `bold ${Math.max(16, w * 0.024)}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        ctx.fillText('Match the dashed curve!', w / 2, btnY - 16)

        ctx.fillStyle = '#666'
        ctx.font = `${Math.max(13, w * 0.018)}px sans-serif`
        ctx.fillText('Control the car speed with the slider', w / 2, btnY - 0)

        // Button
        const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH)
        btnGrad.addColorStop(0, '#22c55e')
        btnGrad.addColorStop(1, '#16a34a')
        roundRect(ctx, btnX, btnY + 14, btnW, btnH, 12)
        ctx.fillStyle = btnGrad
        ctx.fill()
        ctx.shadowColor = 'rgba(0,0,0,0.2)'
        ctx.shadowBlur = 8
        ctx.shadowOffsetY = 3
        ctx.fill()
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        ctx.shadowOffsetY = 0

        ctx.fillStyle = '#fff'
        ctx.font = `bold ${Math.max(18, w * 0.026)}px sans-serif`
        ctx.textBaseline = 'middle'
        ctx.fillText('START', w / 2, btnY + 14 + btnH / 2)

        hitRegions.current.startBtn = { x: btnX, y: btnY + 14, w: btnW, h: btnH }
        hitRegions.current.retryBtn = null
      } else {
        hitRegions.current.startBtn = null
      }

      if (currentPhase === 'finished') {
        const score = computeScore(history, targetCurve, duration, finishLine)
        const passed = score < MATCH_THRESHOLD

        // Overlay
        ctx.fillStyle = 'rgba(0,0,0,0.35)'
        ctx.fillRect(0, 0, w, h)

        const panelW = Math.min(w * 0.7, 380)
        const panelH = Math.min(h * 0.4, 240)
        const panelX = (w - panelW) / 2
        const panelY = (h - panelH) / 2

        roundRect(ctx, panelX, panelY, panelW, panelH, 16)
        ctx.fillStyle = passed ? '#f0fdf4' : '#fef2f2'
        ctx.fill()
        ctx.strokeStyle = passed ? '#22c55e' : '#ef4444'
        ctx.lineWidth = 3
        ctx.stroke()

        // Result text
        ctx.fillStyle = passed ? '#166534' : '#991b1b'
        ctx.font = `bold ${Math.max(20, w * 0.03)}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillText(
          passed ? 'Great match!' : 'Not quite!',
          w / 2,
          panelY + 24,
        )

        const accuracy = Math.max(0, (1 - score / MATCH_THRESHOLD) * 100)
        ctx.fillStyle = '#555'
        ctx.font = `${Math.max(14, w * 0.02)}px sans-serif`
        ctx.fillText(
          passed
            ? `Accuracy: ${accuracy.toFixed(0)}% -- the curves match!`
            : `The curves were a bit different. Try again!`,
          w / 2,
          panelY + 65,
        )

        ctx.fillStyle = '#888'
        ctx.font = `${Math.max(12, w * 0.016)}px sans-serif`
        ctx.fillText(
          'The slope of the position curve = speed (derivative)!',
          w / 2,
          panelY + 100,
        )

        // Retry button
        if (!passed) {
          const btnW2 = Math.max(140, w * 0.2)
          const btnH2 = 42
          const btnX2 = (w - btnW2) / 2
          const btnY2 = panelY + panelH - btnH2 - 20

          const retryGrad = ctx.createLinearGradient(btnX2, btnY2, btnX2, btnY2 + btnH2)
          retryGrad.addColorStop(0, '#3b82f6')
          retryGrad.addColorStop(1, '#2563eb')
          roundRect(ctx, btnX2, btnY2, btnW2, btnH2, 10)
          ctx.fillStyle = retryGrad
          ctx.fill()

          ctx.fillStyle = '#fff'
          ctx.font = `bold ${Math.max(15, w * 0.022)}px sans-serif`
          ctx.textBaseline = 'middle'
          ctx.fillText('Try Again', w / 2, btnY2 + btnH2 / 2)

          hitRegions.current.retryBtn = { x: btnX2, y: btnY2, w: btnW2, h: btnH2 }
        } else {
          hitRegions.current.retryBtn = null
        }
      } else {
        hitRegions.current.retryBtn = null
      }

      // ── Legend (top right, during running/ready) ──
      if (currentPhase !== 'finished') {
        const legX = graphR - 160
        const legY = graphT + 8
        ctx.fillStyle = 'rgba(255,255,255,0.85)'
        roundRect(ctx, legX, legY, 155, 42, 6)
        ctx.fill()

        // Target legend
        ctx.setLineDash([6, 4])
        ctx.strokeStyle = COL_TARGET_CURVE
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(legX + 8, legY + 12)
        ctx.lineTo(legX + 30, legY + 12)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = '#555'
        ctx.font = `${Math.max(10, w * 0.013)}px sans-serif`
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        ctx.fillText('Target', legX + 34, legY + 12)

        // Drawn legend
        ctx.strokeStyle = COL_DRAWN_START
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(legX + 8, legY + 30)
        ctx.lineTo(legX + 30, legY + 30)
        ctx.stroke()
        ctx.fillStyle = '#555'
        ctx.fillText('Your curve', legX + 34, legY + 30)
      }
    },
    [targetCurve, duration, finishLine, onAha, onCorrect, onError, onComplete],
  )

  // ── Pointer handling ──────────────────────────────────────

  const getSliderFrac = useCallback((x: number) => {
    const slider = hitRegions.current.slider
    if (!slider) return null
    const sliderX = 40
    const sliderW = slider.w - 40 // compensate for padding
    return clamp((x - sliderX) / sliderW, 0, 1)
  }, [])

  const handlePointerDown = useCallback(
    (x: number, y: number) => {
      // Start button
      const startBtn = hitRegions.current.startBtn
      if (startBtn && x >= startBtn.x && x <= startBtn.x + startBtn.w &&
        y >= startBtn.y && y <= startBtn.y + startBtn.h) {
        startGame()
        return
      }

      // Retry button
      const retryBtn = hitRegions.current.retryBtn
      if (retryBtn && x >= retryBtn.x && x <= retryBtn.x + retryBtn.w &&
        y >= retryBtn.y && y <= retryBtn.y + retryBtn.h) {
        resetGame()
        return
      }

      // Slider
      const slider = hitRegions.current.slider
      if (slider && x >= slider.x && x <= slider.x + slider.w &&
        y >= slider.y && y <= slider.y + slider.h) {
        setIsDragging(true)
        isDraggingRef.current = true
        const frac = getSliderFrac(x)
        if (frac !== null) setSpeedFromSlider(frac)
      }
    },
    [startGame, resetGame, getSliderFrac, setSpeedFromSlider],
  )

  const handlePointerMove = useCallback(
    (x: number, _y: number) => {
      if (!isDraggingRef.current) return
      const frac = getSliderFrac(x)
      if (frac !== null) setSpeedFromSlider(frac)
    },
    [getSliderFrac, setSpeedFromSlider],
  )

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
    isDraggingRef.current = false
  }, [])

  return (
    <CanvasBase
      draw={draw}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="cursor-pointer"
    />
  )
}
