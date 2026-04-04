import { useState, useCallback, useRef, useMemo } from 'react'
import CanvasBase from '../common/CanvasBase'
import type { RendererProps } from '../registry'
import PuzzleIntro from '../common/PuzzleIntro'
import type { Point, Stroke, MirrorAxis } from './types'
import {
  ROUNDS_TO_COMPLETE,
  parsePuzzle,
  mirrorPoint,
  strokeLength,
  targetToCanvas,
  checkMatch,
} from './symmetry.utils'

/** Grid spacing (px) for the subtle background grid. */
const GRID_SPACING = 28

/** Sparkle emoji positions along the mirror line (normalised 0-1). */
const SPARKLE_POSITIONS = [0.08, 0.25, 0.42, 0.58, 0.75, 0.92]

/* ------------------------------------------------------------------ */
/*  Drawing primitives                                                */
/* ------------------------------------------------------------------ */

/** Draw the subtle background grid. */
function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save()
  ctx.strokeStyle = 'rgba(200, 210, 230, 0.35)'
  ctx.lineWidth = 0.5
  ctx.beginPath()
  for (let x = GRID_SPACING; x < w; x += GRID_SPACING) {
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
  }
  for (let y = GRID_SPACING; y < h; y += GRID_SPACING) {
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
  }
  ctx.stroke()
  ctx.restore()
}

/** Draw the mirror line with a dashed golden style and sparkle indicators. */
function drawMirrorLine(
  ctx: CanvasRenderingContext2D,
  axis: MirrorAxis,
  w: number,
  h: number,
  time: number,
) {
  ctx.save()

  // Golden dashed line
  const grad =
    axis === 'vertical'
      ? ctx.createLinearGradient(w / 2, 0, w / 2, h)
      : ctx.createLinearGradient(0, h / 2, w, h / 2)
  grad.addColorStop(0, '#FFD700')
  grad.addColorStop(0.5, '#FFA500')
  grad.addColorStop(1, '#FFD700')

  ctx.strokeStyle = grad
  ctx.lineWidth = 2.5
  ctx.setLineDash([10, 6])
  ctx.lineDashOffset = -time * 0.02 // Animated dash crawl

  ctx.beginPath()
  if (axis === 'vertical') {
    ctx.moveTo(w / 2, 0)
    ctx.lineTo(w / 2, h)
  } else {
    ctx.moveTo(0, h / 2)
    ctx.lineTo(w, h / 2)
  }
  ctx.stroke()

  // Sparkle emoji along the line
  ctx.setLineDash([])
  ctx.font = '14px serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (const t of SPARKLE_POSITIONS) {
    // Gentle bobbing animation per sparkle
    const bob = Math.sin(time * 0.003 + t * 12) * 3
    if (axis === 'vertical') {
      ctx.fillText('\u2728', w / 2 + bob, t * h)
    } else {
      ctx.fillText('\u2728', t * w, h / 2 + bob)
    }
  }

  ctx.restore()
}

/** Draw a polyline array as the target shape (semi-transparent blue). */
function drawTarget(
  ctx: CanvasRenderingContext2D,
  polylines: Point[][],
) {
  ctx.save()
  ctx.strokeStyle = 'rgba(100, 180, 255, 0.45)'
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.setLineDash([6, 4])

  for (const poly of polylines) {
    if (poly.length < 2) continue
    ctx.beginPath()
    ctx.moveTo(poly[0].x, poly[0].y)
    for (let i = 1; i < poly.length; i++) {
      ctx.lineTo(poly[i].x, poly[i].y)
    }
    ctx.stroke()
  }

  ctx.restore()
}

/** Draw a single stroke with its hue colour. */
function drawStroke(
  ctx: CanvasRenderingContext2D,
  pts: Point[],
  hue: number,
  lineWidth: number,
  alpha: number = 1,
) {
  if (pts.length < 2) return
  ctx.save()
  ctx.strokeStyle = `hsla(${hue}, 85%, 55%, ${alpha})`
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)

  // Use quadratic curves for smoother lines
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2
    const my = (pts[i].y + pts[i + 1].y) / 2
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my)
  }
  // Final segment
  const last = pts[pts.length - 1]
  ctx.lineTo(last.x, last.y)
  ctx.stroke()

  ctx.restore()
}

/** Draw a stroke and its mirror reflection. */
function drawStrokeWithMirror(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  axis: MirrorAxis,
  w: number,
  h: number,
) {
  // Original stroke on the drawing side
  drawStroke(ctx, stroke.points, stroke.hue, 4)

  // Mirrored stroke on the other side (slightly more transparent for magic feel)
  const mirrored = stroke.points.map((p) => mirrorPoint(p, axis, w, h))
  drawStroke(ctx, mirrored, stroke.hue, 4, 0.7)
}

/** Draw a celebratory burst when the child matches correctly. */
function drawCelebration(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  startTime: number,
) {
  const elapsed = time - startTime
  if (elapsed > 1500) return // 1.5s celebration

  const progress = elapsed / 1500
  const alpha = 1 - progress
  const radius = progress * Math.min(w, h) * 0.4

  ctx.save()
  ctx.globalAlpha = alpha * 0.6

  // Expanding ring
  ctx.strokeStyle = '#FFD700'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(w / 2, h / 2, radius, 0, Math.PI * 2)
  ctx.stroke()

  // Star emojis radiating outward
  ctx.globalAlpha = alpha
  ctx.font = `${16 + progress * 12}px serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const starCount = 8
  for (let i = 0; i < starCount; i++) {
    const angle = (i / starCount) * Math.PI * 2 + time * 0.002
    const r = radius * 0.8
    ctx.fillText('\u2B50', w / 2 + Math.cos(angle) * r, h / 2 + Math.sin(angle) * r)
  }

  ctx.restore()
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

/**
 * MirrorCanvas — Symmetry drawing game for children.
 *
 * The child draws on one side of a mirror line and sees their strokes
 * reflected in real-time on the other side, building intuition for
 * line symmetry.
 */
export default function MirrorCanvas({
  puzzle,
  onCorrect,
  onAha,
  onComplete,
}: RendererProps) {
  const [showIntro, setShowIntro] = useState(true)

  if (showIntro) {
    return (
      <PuzzleIntro
        icon="🪞"
        title={{ zh: '镜像对称', en: 'Mirror Symmetry' }}
        goal={{ zh: '在镜像线的一侧画画，另一侧会自动出现对称图形。让两边匹配目标形状！', en: 'Draw on one side of the mirror line — the other side mirrors automatically. Match the target shape!' }}
        howTo={[
          { zh: '金色虚线是镜像轴——它把画布分成两半', en: 'The golden dashed line is the mirror axis — it splits the canvas in half' },
          { zh: '在一侧画线条，另一侧会自动对称出现', en: 'Draw on one side, the mirror appears automatically on the other' },
          { zh: '让你的画匹配目标形状', en: 'Match your drawing to the target shape' },
        ]}
        insight={{ zh: '对称无处不在——蝴蝶的翅膀、人的脸、雪花的图案。对称是数学中"变换不变性"的体现！', en: "Symmetry is everywhere — butterfly wings, faces, snowflakes. Symmetry represents 'invariance under transformation' in mathematics!" }}
        onStart={() => setShowIntro(false)}
      />
    )
  }

  /* ---- Puzzle config ---- */
  const config = useMemo(() => parsePuzzle(puzzle), [puzzle])

  /* ---- Drawing state (refs for perf — avoids re-render every pointer move) ---- */
  const strokesRef = useRef<Stroke[]>([])
  const activeStrokeRef = useRef<Stroke | null>(null)
  const successCountRef = useRef(0)
  const celebrationStartRef = useRef<number | null>(null)
  const hueRef = useRef(0)

  // React state only for things that affect the DOM outside canvas
  const [successCount, setSuccessCount] = useState(0)
  const [isDrawing, setIsDrawing] = useState(false)

  /* ---- Pointer handlers ---- */
  const handlePointerDown = useCallback(
    (x: number, y: number) => {
      // Don't start a new stroke during celebration
      if (celebrationStartRef.current !== null) return

      const stroke: Stroke = { points: [{ x, y }], hue: hueRef.current }
      activeStrokeRef.current = stroke
      setIsDrawing(true)
    },
    [],
  )

  const handlePointerMove = useCallback(
    (x: number, y: number) => {
      const active = activeStrokeRef.current
      if (!active) return
      active.points.push({ x, y })
    },
    [],
  )

  const handlePointerUp = useCallback(
    (_x: number, _y: number) => {
      const active = activeStrokeRef.current
      if (!active) return

      // Commit the stroke
      strokesRef.current = [...strokesRef.current, active]
      activeStrokeRef.current = null
      setIsDrawing(false)

      // Advance hue for next stroke (rainbow effect)
      hueRef.current = (hueRef.current + 45) % 360
    },
    [],
  )

  /* ---- Clear drawing ---- */
  const handleClear = useCallback(() => {
    strokesRef.current = []
    activeStrokeRef.current = null
    celebrationStartRef.current = null
    setIsDrawing(false)
  }, [])

  /* ---- Main draw function (called every rAF frame) ---- */
  const drawFn = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      const { mirrorAxis, targetPoints, tolerance } = config

      // 1. Background grid
      drawGrid(ctx, w, h)

      // 2. Target shape (on the non-drawing half)
      const targetPolys = targetToCanvas(targetPoints, mirrorAxis, w, h)
      if (targetPolys.length > 0) {
        drawTarget(ctx, targetPolys)
      }

      // 3. Mirror line (on top of target, below strokes)
      drawMirrorLine(ctx, mirrorAxis, w, h, time)

      // 4. All committed strokes + their mirrors
      for (const stroke of strokesRef.current) {
        drawStrokeWithMirror(ctx, stroke, mirrorAxis, w, h)
      }

      // 5. Active (in-progress) stroke
      const active = activeStrokeRef.current
      if (active && active.points.length >= 2) {
        drawStrokeWithMirror(ctx, active, mirrorAxis, w, h)
      }

      // 6. Celebration overlay
      if (celebrationStartRef.current !== null) {
        drawCelebration(ctx, w, h, time, celebrationStartRef.current)

        // After celebration ends, either reset for next round or complete
        if (time - celebrationStartRef.current > 1500) {
          celebrationStartRef.current = null
          strokesRef.current = []

          if (successCountRef.current >= ROUNDS_TO_COMPLETE) {
            onComplete()
          }
        }
      }

      // 7. Check for match (only when not celebrating and user has drawn)
      if (
        celebrationStartRef.current === null &&
        strokesRef.current.length > 0
      ) {
        // Only evaluate when user isn't actively drawing
        if (!activeStrokeRef.current) {
          const matched = checkMatch(strokesRef.current, targetPolys, tolerance, w, h)
          if (matched) {
            successCountRef.current++
            setSuccessCount(successCountRef.current)
            celebrationStartRef.current = time
            onCorrect()

            // Fire onAha on first success (the "aha!" moment)
            if (successCountRef.current === 1) {
              onAha()
            }
          }
        }
      }

      // 8. HUD: success counter
      ctx.save()
      ctx.font = 'bold 16px system-ui, sans-serif'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'top'
      ctx.fillStyle = 'rgba(80, 80, 120, 0.7)'
      const stars = '\u2B50'.repeat(successCountRef.current)
      const empty = '\u2606'.repeat(ROUNDS_TO_COMPLETE - successCountRef.current)
      ctx.fillText(`${stars}${empty}`, w - 12, 12)
      ctx.restore()
    },
    [config, onCorrect, onAha, onComplete],
  )

  /* ---- Render ---- */
  return (
    <div className="relative w-full h-full">
      <CanvasBase
        draw={drawFn}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="cursor-crosshair"
      />

      {/* Clear button — fixed bottom-right, child-friendly size */}
      <button
        type="button"
        onClick={handleClear}
        className="absolute bottom-4 right-4 px-4 py-2 rounded-full
                   bg-white/80 hover:bg-white shadow-md
                   text-sm font-semibold text-gray-600 hover:text-red-500
                   transition-colors select-none active:scale-95"
        style={{ touchAction: 'manipulation' }}
      >
        Clear
      </button>
    </div>
  )
}
