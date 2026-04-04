import { useState, useCallback, useRef, useMemo } from 'react'
import CanvasBase from '../common/CanvasBase'
import PuzzleIntro from '../common/PuzzleIntro'
import type { RendererProps } from '../registry'
import type {
  Grid,
  ColorIndex,
  Transform,
  PixelArtPuzzleData,
  TransformButton,
  CelebrationState,
} from './types'
import { PALETTE, TRANSFORMS } from './types'
import {
  GRID_SIZE,
  cloneGrid,
  normalizeGrid,
  gridsMatch,
  applyTransform,
} from './matrix.utils'

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const CELL_ANIM_DURATION = 300 // ms per cell flip animation
const CELEBRATION_DURATION = 1800 // ms total celebration
const RAINBOW_BORDER_COLORS = [
  '#E74C3C', '#E67E22', '#F1C40F', '#2ECC71',
  '#3498DB', '#9B59B6', '#E74C3C',
] as const

const TRANSFORM_BUTTONS: TransformButton[] = [
  { id: 'rotate90', label: 'Rotate', icon: '\u21BB' },
  { id: 'flipH', label: 'Flip H', icon: '\u2194' },
  { id: 'flipV', label: 'Flip V', icon: '\u2195' },
  { id: 'transpose', label: 'Transpose', icon: '\u2921' },
]

/** Default arrow pattern for when puzzle data is missing. */
const DEFAULT_GRID: Grid = [
  [0, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 0, 1, 1, 0, 1, 0],
  [0, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
]

/* ------------------------------------------------------------------ */
/*  Local helpers (not extracted — depend on puzzle types)             */
/* ------------------------------------------------------------------ */

/** Parse puzzle data with sensible defaults. */
function parsePuzzle(puzzle: Record<string, unknown>): PixelArtPuzzleData {
  const data = (puzzle.data ?? puzzle) as Partial<PixelArtPuzzleData>
  return {
    initialGrid: Array.isArray(data.initialGrid)
      ? data.initialGrid
      : DEFAULT_GRID,
    targetGrid: Array.isArray(data.targetGrid)
      ? data.targetGrid
      : DEFAULT_GRID,
    allowedTransforms: Array.isArray(data.allowedTransforms)
      ? data.allowedTransforms
      : [...TRANSFORMS],
    maxSteps: typeof data.maxSteps === 'number' ? data.maxSteps : -1,
  }
}

/* ------------------------------------------------------------------ */
/*  Drawing functions                                                 */
/* ------------------------------------------------------------------ */

/** Compute layout metrics for the main grid given canvas dimensions. */
function computeLayout(w: number, h: number) {
  // Reserve bottom area for buttons (approx 80px)
  const availH = h - 80
  const gridArea = Math.min(w * 0.75, availH * 0.85, 480)
  const cellSize = Math.floor(gridArea / GRID_SIZE)
  const totalSize = cellSize * GRID_SIZE
  const offsetX = Math.floor((w - totalSize) / 2)
  const offsetY = Math.floor((availH - totalSize) / 2)
  return { cellSize, totalSize, offsetX, offsetY }
}

/** Draw rainbow gradient border around the grid. */
function drawRainbowBorder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  time: number,
) {
  const borderWidth = 4
  const radius = 10

  ctx.save()

  // Animated gradient that shifts over time
  const grad = ctx.createLinearGradient(x, y, x + size, y + size)
  const shift = (time * 0.0003) % 1
  for (let i = 0; i < RAINBOW_BORDER_COLORS.length; i++) {
    const stop = ((i / (RAINBOW_BORDER_COLORS.length - 1)) + shift) % 1
    grad.addColorStop(stop, RAINBOW_BORDER_COLORS[i])
  }

  ctx.strokeStyle = grad
  ctx.lineWidth = borderWidth
  ctx.beginPath()
  ctx.roundRect(
    x - borderWidth,
    y - borderWidth,
    size + borderWidth * 2,
    size + borderWidth * 2,
    radius,
  )
  ctx.stroke()
  ctx.restore()
}

/** Draw a single cell of the grid. */
function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  colorIdx: ColorIndex,
  animProgress: number, // 0..1, 1 = fully settled
) {
  const color = PALETTE[colorIdx]

  ctx.save()

  // Cell flip animation: scale Y from 0 to 1
  if (animProgress < 1) {
    const scale = Math.abs(Math.sin(animProgress * Math.PI))
    const cy = y + size / 2
    ctx.translate(0, cy)
    ctx.scale(1, scale || 0.01)
    ctx.translate(0, -cy)
  }

  // Fill
  ctx.fillStyle = color
  ctx.fillRect(x, y, size, size)

  // Subtle inner shadow for non-white cells
  if (colorIdx !== 0) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'
    ctx.fillRect(x, y + size - 2, size, 2)
    ctx.fillRect(x + size - 2, y, 2, size)
  }

  // Cell border
  ctx.strokeStyle = 'rgba(180, 190, 210, 0.5)'
  ctx.lineWidth = 0.5
  ctx.strokeRect(x, y, size, size)

  ctx.restore()
}

/** Draw the main 8x8 grid. */
function drawMainGrid(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  layout: ReturnType<typeof computeLayout>,
  time: number,
  animStartTime: number | null,
) {
  const { cellSize, offsetX, offsetY } = layout

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      // Per-cell animation delay: wave from top-left
      let animProgress = 1
      if (animStartTime !== null) {
        const delay = (r + c) * 25 // 25ms stagger
        const elapsed = time - animStartTime - delay
        animProgress = Math.min(1, Math.max(0, elapsed / CELL_ANIM_DURATION))
      }

      drawCell(
        ctx,
        offsetX + c * cellSize,
        offsetY + r * cellSize,
        cellSize,
        grid[r][c],
        animProgress,
      )
    }
  }
}

/** Draw the target grid (smaller, in top-right corner). */
function drawTargetGrid(
  ctx: CanvasRenderingContext2D,
  target: Grid,
  w: number,
) {
  const miniCellSize = 8
  const miniSize = miniCellSize * GRID_SIZE
  const padding = 12
  const tx = w - miniSize - padding
  const ty = padding

  ctx.save()

  // Semi-transparent background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.beginPath()
  ctx.roundRect(tx - 6, ty - 6, miniSize + 12, miniSize + 26, 6)
  ctx.fill()

  // Border
  ctx.strokeStyle = 'rgba(100, 120, 160, 0.3)'
  ctx.lineWidth = 1
  ctx.stroke()

  // Label
  ctx.fillStyle = 'rgba(80, 90, 120, 0.7)'
  ctx.font = 'bold 9px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText('TARGET', tx + miniSize / 2, ty + miniSize + 2)

  // Grid cells
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      ctx.fillStyle = PALETTE[target[r][c]]
      ctx.fillRect(tx + c * miniCellSize, ty + r * miniCellSize, miniCellSize, miniCellSize)
      ctx.strokeStyle = 'rgba(180, 190, 210, 0.4)'
      ctx.lineWidth = 0.3
      ctx.strokeRect(tx + c * miniCellSize, ty + r * miniCellSize, miniCellSize, miniCellSize)
    }
  }

  ctx.restore()
}

/** Draw celebration wave when grid matches target. */
function drawCelebration(
  ctx: CanvasRenderingContext2D,
  layout: ReturnType<typeof computeLayout>,
  time: number,
  startTime: number,
) {
  const elapsed = time - startTime
  if (elapsed > CELEBRATION_DURATION) return

  const { cellSize, offsetX, offsetY } = layout
  const progress = elapsed / CELEBRATION_DURATION

  ctx.save()

  // Wave pulse: each cell pulses in sequence
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const delay = (r + c) * 60
      const cellElapsed = elapsed - delay
      if (cellElapsed < 0 || cellElapsed > 500) continue

      const cellProgress = cellElapsed / 500
      const scale = 1 + Math.sin(cellProgress * Math.PI) * 0.15
      const alpha = 0.5 * (1 - cellProgress)

      const cx = offsetX + c * cellSize + cellSize / 2
      const cy = offsetY + r * cellSize + cellSize / 2

      ctx.globalAlpha = alpha
      ctx.fillStyle = '#FFD700'
      ctx.beginPath()
      ctx.arc(cx, cy, cellSize * 0.5 * scale, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Central star burst
  ctx.globalAlpha = (1 - progress) * 0.8
  ctx.font = `${20 + progress * 16}px serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const centerX = offsetX + layout.totalSize / 2
  const centerY = offsetY + layout.totalSize / 2
  const starCount = 6
  for (let i = 0; i < starCount; i++) {
    const angle = (i / starCount) * Math.PI * 2 + time * 0.003
    const radius = progress * layout.totalSize * 0.3
    ctx.fillText(
      '\u2B50',
      centerX + Math.cos(angle) * radius,
      centerY + Math.sin(angle) * radius,
    )
  }

  ctx.restore()
}

/** Draw step counter HUD in top-left. */
function drawHUD(
  ctx: CanvasRenderingContext2D,
  steps: number,
  maxSteps: number,
) {
  ctx.save()
  ctx.font = 'bold 13px system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillStyle = 'rgba(80, 80, 120, 0.7)'
  const stepsText =
    maxSteps > 0 ? `Steps: ${steps} / ${maxSteps}` : `Steps: ${steps}`
  ctx.fillText(stepsText, 12, 12)
  ctx.restore()
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

/**
 * PixelArt -- Matrix transformation game for children.
 *
 * An 8x8 pixel grid displays a pattern. The child applies matrix
 * transformations (rotate, flip, transpose) to match a target pattern,
 * building intuition for linear algebra concepts.
 */
export default function PixelArt({
  puzzle,
  onCorrect,
  onError,
  onAha,
  onComplete,
}: RendererProps) {
  const [showIntro, setShowIntro] = useState(true)

  if (showIntro) {
    return (
      <PuzzleIntro
        icon="🧱"
        title={{ zh: '矩阵变换', en: 'Matrix Transform' }}
        goal={{
          zh: '用旋转、翻转等变换操作，把左边的图案变成右上角的目标图案',
          en: 'Use rotate, flip, and other transforms to change the pattern into the target shown in the top-right corner',
        }}
        howTo={[
          { zh: '看右上角的"TARGET"小图——那是你的目标', en: 'Look at the small "TARGET" grid in the top-right — that\'s your goal' },
          { zh: '点击底部按钮来变换图案：旋转(↻)、水平翻转(↔)、垂直翻转(↕)、转置(⤡)', en: 'Use buttons at bottom: Rotate(↻), Flip H(↔), Flip V(↕), Transpose(⤡)' },
          { zh: '也可以点击格子直接换颜色', en: 'You can also tap cells to cycle colors' },
          { zh: '用最少的步骤完成变换！', en: 'Complete the transform in as few steps as possible!' },
        ]}
        insight={{
          zh: '旋转、翻转、转置——这些都是矩阵运算！矩阵是线性代数的基础，用来描述图形的变换和数据的组织。',
          en: 'Rotate, flip, transpose — these are all matrix operations! Matrices are the foundation of linear algebra, used to describe transformations and organize data.',
        }}
        onStart={() => setShowIntro(false)}
      />
    )
  }

  /* ---- Puzzle config ---- */
  const config = useMemo(() => parsePuzzle(puzzle), [puzzle])
  const initialGrid = useMemo(
    () => normalizeGrid(config.initialGrid),
    [config.initialGrid],
  )
  const targetGrid = useMemo(
    () => normalizeGrid(config.targetGrid),
    [config.targetGrid],
  )
  const allowedSet = useMemo(
    () => new Set(config.allowedTransforms),
    [config.allowedTransforms],
  )

  /* ---- State ---- */
  const [grid, setGrid] = useState<Grid>(() => cloneGrid(initialGrid))
  const [history, setHistory] = useState<Grid[]>([])
  const [matched, setMatched] = useState(false)

  // Refs for the rAF draw loop (avoids stale closures)
  const gridRef = useRef<Grid>(grid)
  const animStartRef = useRef<number | null>(null)
  const celebrationRef = useRef<CelebrationState | null>(null)
  const historyLenRef = useRef(0)
  const matchedRef = useRef(false)

  // Keep refs in sync
  gridRef.current = grid
  historyLenRef.current = history.length
  matchedRef.current = matched

  /* ---- Apply transform ---- */
  const handleTransform = useCallback(
    (transform: Transform) => {
      if (matchedRef.current) return
      if (config.maxSteps > 0 && historyLenRef.current >= config.maxSteps) {
        onError()
        return
      }

      setGrid((prev) => {
        const next = applyTransform(prev, transform)
        setHistory((h) => [...h, prev])
        animStartRef.current = performance.now()

        // Check match after transform
        if (gridsMatch(next, targetGrid)) {
          setMatched(true)
          celebrationRef.current = {
            startTime: performance.now(),
            fired: false,
          }
        }
        return next
      })
    },
    [config.maxSteps, targetGrid, onError],
  )

  /* ---- Undo ---- */
  const handleUndo = useCallback(() => {
    if (matchedRef.current) return
    setHistory((h) => {
      if (h.length === 0) return h
      const prev = h[h.length - 1]
      setGrid(prev)
      animStartRef.current = performance.now()
      return h.slice(0, -1)
    })
  }, [])

  /* ---- Reset ---- */
  const handleReset = useCallback(() => {
    setGrid(cloneGrid(initialGrid))
    setHistory([])
    setMatched(false)
    animStartRef.current = null
    celebrationRef.current = null
  }, [initialGrid])

  /* ---- Cell click (free paint / toggle) ---- */
  const handlePointerDown = useCallback(
    (x: number, y: number) => {
      if (matchedRef.current) return

      // Compute which cell was clicked
      // We need layout info; approximate from the canvas container
      const container = document.querySelector('[data-pixelart-canvas]')
      if (!container) return
      const rect = container.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      const layout = computeLayout(w, h)

      const col = Math.floor((x - layout.offsetX) / layout.cellSize)
      const row = Math.floor((y - layout.offsetY) / layout.cellSize)

      if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return

      setGrid((prev) => {
        const next = cloneGrid(prev)
        // Cycle through colors: 0 -> 1 -> 2 -> 3 -> 4 -> 5 -> 0
        next[row][col] = ((prev[row][col] + 1) % 6) as ColorIndex
        setHistory((h) => [...h, prev])

        // Check match after paint
        if (gridsMatch(next, targetGrid)) {
          setMatched(true)
          celebrationRef.current = {
            startTime: performance.now(),
            fired: false,
          }
        }
        return next
      })
    },
    [targetGrid],
  )

  /* ---- Main draw function ---- */
  const drawFn = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      const currentGrid = gridRef.current
      const layout = computeLayout(w, h)

      // 1. Rainbow border
      drawRainbowBorder(
        ctx,
        layout.offsetX,
        layout.offsetY,
        layout.totalSize,
        time,
      )

      // 2. Main grid with cell animations
      drawMainGrid(ctx, currentGrid, layout, time, animStartRef.current)

      // Clear animation after it completes
      if (animStartRef.current !== null) {
        const maxDelay = (GRID_SIZE - 1) * 2 * 25
        if (time - animStartRef.current > CELL_ANIM_DURATION + maxDelay) {
          animStartRef.current = null
        }
      }

      // 3. Target grid (top-right miniature)
      drawTargetGrid(ctx, targetGrid, w)

      // 4. HUD
      drawHUD(ctx, historyLenRef.current, config.maxSteps)

      // 5. Celebration
      const celeb = celebrationRef.current
      if (celeb) {
        drawCelebration(ctx, layout, time, celeb.startTime)

        if (!celeb.fired) {
          celeb.fired = true
          onCorrect()
          onAha()
        }

        if (time - celeb.startTime > CELEBRATION_DURATION) {
          onComplete()
        }
      }
    },
    [targetGrid, config.maxSteps, onCorrect, onAha, onComplete],
  )

  /* ---- Derive allowed buttons ---- */
  const activeButtons = TRANSFORM_BUTTONS.filter((b) => allowedSet.has(b.id))

  /* ---- Render ---- */
  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Canvas area */}
      <div className="flex-1 min-h-0" data-pixelart-canvas>
        <CanvasBase
          draw={drawFn}
          onPointerDown={handlePointerDown}
          className="cursor-pointer"
        />
      </div>

      {/* Transform buttons */}
      <div
        className="flex items-center justify-center gap-2 px-3 py-2 flex-shrink-0"
        style={{ touchAction: 'manipulation' }}
      >
        {activeButtons.map((btn) => (
          <button
            key={btn.id}
            type="button"
            disabled={matched}
            onClick={() => handleTransform(btn.id)}
            className="px-3 py-2 rounded-xl font-bold text-sm
                       bg-gradient-to-b from-blue-400 to-blue-600 text-white
                       shadow-md hover:shadow-lg
                       active:scale-95 disabled:opacity-40
                       transition-all select-none"
            style={{ minWidth: 64 }}
          >
            <span className="text-lg leading-none">{btn.icon}</span>
            <br />
            <span className="text-[10px] opacity-90">{btn.label}</span>
          </button>
        ))}

        {/* Undo */}
        <button
          type="button"
          disabled={matched || history.length === 0}
          onClick={handleUndo}
          className="px-3 py-2 rounded-xl font-bold text-sm
                     bg-gradient-to-b from-amber-400 to-amber-600 text-white
                     shadow-md hover:shadow-lg
                     active:scale-95 disabled:opacity-40
                     transition-all select-none"
          style={{ minWidth: 56 }}
        >
          <span className="text-lg leading-none">{'\u21A9'}</span>
          <br />
          <span className="text-[10px] opacity-90">Undo</span>
        </button>

        {/* Reset */}
        <button
          type="button"
          onClick={handleReset}
          className="px-3 py-2 rounded-xl font-bold text-sm
                     bg-gradient-to-b from-gray-400 to-gray-600 text-white
                     shadow-md hover:shadow-lg
                     active:scale-95
                     transition-all select-none"
          style={{ minWidth: 56 }}
        >
          <span className="text-lg leading-none">{'\u21BA'}</span>
          <br />
          <span className="text-[10px] opacity-90">Reset</span>
        </button>
      </div>
    </div>
  )
}
