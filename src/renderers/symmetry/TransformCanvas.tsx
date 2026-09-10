/**
 * TransformCanvas — the translate and rotate games of the symmetry renderer (CG-FR-2).
 *
 * - translate (CG-FR-2.2): a blue shape and an arrow. The child draws the same shape where the
 *   arrow points, starting at the green dot. The destination is never drawn for them.
 * - rotate (CG-FR-2.3): a dotted pinwheel around a centre dot. Whatever the child draws is
 *   copied, turned, into the other k−1 positions as they draw — the same live "magic" the
 *   mirror game gives, so the child sees rotational symmetry appear under their finger.
 *
 * MirrorCanvasInner (the reflect game, L1–L3) is deliberately left untouched; the wrapper in
 * MirrorCanvas.tsx picks this component instead when a level sets `transformType`. The small
 * drawing helpers below duplicate MirrorCanvas's on purpose, for the same reason.
 */
import { useState, useCallback, useRef, useMemo } from 'react'
import CanvasBase from '../common/CanvasBase'
import type { RendererProps } from '../registry'
import type { Point, Stroke } from './types'
import { checkMatch, parseTransform, transformTargets, expandStrokes } from './symmetry.utils'

const GRID_SPACING = 28
const CELEBRATION_MS = 1500

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

function drawPolylines(
  ctx: CanvasRenderingContext2D,
  polys: Point[][],
  color: string,
  width: number,
  dash: number[] = [],
) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.setLineDash(dash)
  for (const poly of polys) {
    if (poly.length < 2) continue
    ctx.beginPath()
    ctx.moveTo(poly[0].x, poly[0].y)
    for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y)
    ctx.stroke()
  }
  ctx.restore()
}

function drawStroke(ctx: CanvasRenderingContext2D, pts: Point[], hue: number, alpha: number) {
  if (pts.length < 2) return
  ctx.save()
  ctx.strokeStyle = `hsla(${hue}, 85%, 55%, ${alpha})`
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2
    const my = (pts[i].y + pts[i + 1].y) / 2
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my)
  }
  const last = pts[pts.length - 1]
  ctx.lineTo(last.x, last.y)
  ctx.stroke()
  ctx.restore()
}

function drawArrow(ctx: CanvasRenderingContext2D, from: Point, to: Point) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x)
  const head = 16
  ctx.save()
  ctx.strokeStyle = '#F59E0B'
  ctx.fillStyle = '#F59E0B'
  ctx.lineWidth = 3
  ctx.setLineDash([10, 7])
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x - Math.cos(angle) * head, to.y - Math.sin(angle) * head)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.moveTo(to.x, to.y)
  ctx.lineTo(to.x - Math.cos(angle - 0.45) * head, to.y - Math.sin(angle - 0.45) * head)
  ctx.lineTo(to.x - Math.cos(angle + 0.45) * head, to.y - Math.sin(angle + 0.45) * head)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawDot(ctx: CanvasRenderingContext2D, p: Point, r: number, color: string) {
  ctx.save()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawCelebration(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, start: number) {
  const elapsed = time - start
  if (elapsed > CELEBRATION_MS) return
  const progress = elapsed / CELEBRATION_MS
  const alpha = 1 - progress
  const radius = progress * Math.min(w, h) * 0.4
  ctx.save()
  ctx.globalAlpha = alpha * 0.6
  ctx.strokeStyle = '#FFD700'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(w / 2, h / 2, radius, 0, Math.PI * 2)
  ctx.stroke()
  ctx.globalAlpha = alpha
  ctx.font = `${16 + progress * 12}px serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + time * 0.002
    ctx.fillText('⭐', w / 2 + Math.cos(a) * radius * 0.8, h / 2 + Math.sin(a) * radius * 0.8)
  }
  ctx.restore()
}

export default function TransformCanvas({ puzzle, onCorrect, onAha, onComplete }: RendererProps) {
  const config = useMemo(() => parseTransform(puzzle), [puzzle])
  const { transformType, rounds, tolerance } = config
  const total = rounds.length

  const strokesRef = useRef<Stroke[]>([])
  const activeStrokeRef = useRef<Stroke | null>(null)
  const successCountRef = useRef(0)
  const celebrationStartRef = useRef<number | null>(null)
  const completedRef = useRef(false)
  const hueRef = useRef(0)

  const [solved, setSolved] = useState(0)
  const [, setIsDrawing] = useState(false)

  const handlePointerDown = useCallback((x: number, y: number) => {
    if (celebrationStartRef.current !== null || completedRef.current) return
    activeStrokeRef.current = { points: [{ x, y }], hue: hueRef.current }
    setIsDrawing(true)
  }, [])

  const handlePointerMove = useCallback((x: number, y: number) => {
    activeStrokeRef.current?.points.push({ x, y })
  }, [])

  const handlePointerUp = useCallback(() => {
    const active = activeStrokeRef.current
    if (!active) return
    strokesRef.current = [...strokesRef.current, active]
    activeStrokeRef.current = null
    setIsDrawing(false)
    hueRef.current = (hueRef.current + 45) % 360
  }, [])

  const handleClear = useCallback(() => {
    strokesRef.current = []
    activeStrokeRef.current = null
    setIsDrawing(false)
  }, [])

  const drawFn = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      const round = rounds[Math.min(successCountRef.current, total - 1)]
      const { shown, target } = transformTargets(transformType, round, w, h)

      drawGrid(ctx, w, h)

      if (transformType === 'translate') {
        // The shape to move, the arrow saying where, and a dot where its first corner lands.
        drawPolylines(ctx, shown, 'rgba(59, 130, 246, 0.9)', 5)
        const from = shown[0]?.[0]
        const to = target[0]?.[0]
        if (from && to) {
          drawArrow(ctx, from, to)
          drawDot(ctx, to, 8, '#22C55E')
        }
      } else {
        // The dotted pinwheel and its axle.
        drawPolylines(ctx, shown, 'rgba(100, 180, 255, 0.45)', 4, [6, 4])
        drawDot(ctx, { x: w / 2, y: h / 2 }, 6, '#F59E0B')
      }

      // The child's strokes, plus (rotate only) their live turned copies, drawn a little lighter.
      const own = strokesRef.current
      const active = activeStrokeRef.current
      const visible = active && active.points.length >= 2 ? [...own, active] : own
      const expanded = expandStrokes(transformType, visible, round, w, h)
      expanded.forEach((s, i) => drawStroke(ctx, s.points, s.hue, i < visible.length ? 1 : 0.7))

      if (celebrationStartRef.current !== null) {
        drawCelebration(ctx, w, h, time, celebrationStartRef.current)
        if (time - celebrationStartRef.current > CELEBRATION_MS) {
          celebrationStartRef.current = null
          strokesRef.current = [] // next round starts on a clean board
          if (successCountRef.current >= total && !completedRef.current) {
            completedRef.current = true
            onComplete()
          }
        }
      } else if (own.length > 0 && !active && !completedRef.current) {
        const matched = checkMatch(expandStrokes(transformType, own, round, w, h), target, tolerance, w, h)
        if (matched) {
          successCountRef.current++
          setSolved(successCountRef.current)
          celebrationStartRef.current = time
          onCorrect()
          if (successCountRef.current === 1) onAha()
        }
      }

      // HUD: one star per round
      ctx.save()
      ctx.font = 'bold 16px system-ui, sans-serif'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'top'
      ctx.fillStyle = 'rgba(80, 80, 120, 0.7)'
      const done = Math.min(successCountRef.current, total)
      ctx.fillText('⭐'.repeat(done) + '☆'.repeat(total - done), w - 12, 12)
      ctx.restore()
    },
    [rounds, total, transformType, tolerance, onCorrect, onAha, onComplete],
  )

  const prompt =
    transformType === 'translate'
      ? { zh: '从绿点开始，画出搬过去的图形', en: 'Start at the green dot and draw the moved shape' }
      : { zh: '沿着虚线画一片叶子，看它转起来', en: 'Trace one blade and watch it spin' }

  return (
    <div
      className="relative w-full h-full"
      data-testid="transform-canvas"
      data-mode={transformType}
      data-solved={solved}
      data-rounds={total}
    >
      <CanvasBase
        draw={drawFn}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="cursor-crosshair"
      />

      <div className="absolute top-2 left-3 pointer-events-none select-none">
        <p className="text-sm font-bold text-gray-700">{prompt.zh}</p>
        <p className="text-[11px] text-gray-500">{prompt.en}</p>
      </div>

      <button
        type="button"
        onClick={handleClear}
        className="absolute bottom-4 right-4 px-4 py-2 rounded-full bg-white/80 hover:bg-white shadow-md text-sm font-semibold text-gray-600 hover:text-red-500 transition-colors select-none active:scale-95"
        style={{ touchAction: 'manipulation' }}
      >
        清除 Clear
      </button>
    </div>
  )
}
