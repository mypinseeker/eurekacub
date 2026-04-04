import { useState, useCallback, useRef, useMemo } from 'react'
import type { RendererProps } from '../registry'
import type {
  TangramPiece,
  TangramPuzzleData,
  TargetSlot,
  RotationAngle,
  DragInfo,
  PieceShape,
} from './types'
import {
  U,
  SNAP_TOLERANCE_L1,
  SNAP_TOLERANCE_L2,
  PIECE_SIZES,
  pieceCentroid,
  distToSlot,
  nextRotation,
  trySnap as trySnapUtil,
} from './tangram.utils'

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const VIEW_W = 400
const VIEW_H = 500

/** Vibrant child-friendly palette for pieces. */
const PIECE_COLORS: Record<PieceShape, string> = {
  'large-tri-1': '#FF6B6B',   // coral
  'large-tri-2': '#4ECDC4',   // teal
  'medium-tri': '#FFD93D',    // gold
  'small-tri-1': '#A855F7',   // violet
  'small-tri-2': '#84CC16',   // lime
  'square': '#38BDF8',        // sky
  'parallelogram': '#FB7185', // rose
} as const

/** SVG polygon points for each piece shape (origin at 0,0). */
const PIECE_POLYGONS: Record<PieceShape, string> = {
  'large-tri-1': `0,0 ${U * 4},0 0,${U * 4}`,
  'large-tri-2': `0,0 ${U * 4},0 ${U * 4},${U * 4}`,
  'medium-tri': `0,0 ${U * 2},0 ${U * 2},${U * 2}`,
  'small-tri-1': `0,0 ${U * 2},0 0,${U * 2}`,
  'small-tri-2': `0,0 ${U * 2},0 ${U * 2},${U * 2}`,
  'square': `0,0 ${U * 2},0 ${U * 2},${U * 2} 0,${U * 2}`,
  'parallelogram': `0,0 ${U * 2},0 ${U * 3},${U * 2} ${U},${U * 2}`,
} as const

/** Default target: a simple square silhouette (house-like). */
const DEFAULT_OUTLINE = `M 80 40 L 320 40 L 320 280 L 80 280 Z`

/** Default slots arranged in a square pattern. */
const DEFAULT_SLOTS: TargetSlot[] = [
  { id: 's1', shape: 'large-tri-1', x: 80, y: 40, rotation: 0 },
  { id: 's2', shape: 'large-tri-2', x: 240, y: 40, rotation: 0 },
  { id: 's3', shape: 'medium-tri', x: 80, y: 200, rotation: 0 },
  { id: 's4', shape: 'small-tri-1', x: 160, y: 200, rotation: 0 },
  { id: 's5', shape: 'small-tri-2', x: 240, y: 200, rotation: 0 },
  { id: 's6', shape: 'square', x: 160, y: 120, rotation: 0 },
  { id: 's7', shape: 'parallelogram', x: 160, y: 200, rotation: 0 },
]

/** Drag distance threshold: if pointer moves less than this, it's a tap. */
const TAP_THRESHOLD = 6

/** Long-press time (ms) before entering rotation mode. */
const LONG_PRESS_MS = 400

/* ------------------------------------------------------------------ */
/*  Local helpers                                                     */
/* ------------------------------------------------------------------ */

function parsePuzzle(puzzle: Record<string, unknown>): TangramPuzzleData {
  const data = (puzzle.data ?? puzzle) as Partial<TangramPuzzleData>
  return {
    targetShape: typeof data.targetShape === 'string' ? data.targetShape : 'square',
    targetOutline: typeof data.targetOutline === 'string' ? data.targetOutline : DEFAULT_OUTLINE,
    difficulty: typeof data.difficulty === 'number' ? data.difficulty : 1,
    showOutline: data.showOutline !== false,
    slots: Array.isArray(data.slots) ? data.slots : DEFAULT_SLOTS,
    pieces: Array.isArray(data.pieces) ? data.pieces : undefined,
  }
}

function scatterPieces(shapes: PieceShape[], startY: number): TangramPiece[] {
  const cols = Math.min(shapes.length, 4)
  const colW = VIEW_W / (cols + 1)

  return shapes.map((shape, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    return {
      id: `piece-${i}`,
      shape,
      x: colW * (col + 1) - PIECE_SIZES[shape].w / 2,
      y: startY + row * 100 + Math.random() * 20 - 10,
      rotation: 0 as RotationAngle,
      color: PIECE_COLORS[shape],
      snapped: false,
    }
  })
}

function pointerToSvg(
  e: React.PointerEvent<SVGSVGElement>,
  svgEl: SVGSVGElement,
): { x: number; y: number } {
  const rect = svgEl.getBoundingClientRect()
  const x = ((e.clientX - rect.left) / rect.width) * VIEW_W
  const y = ((e.clientY - rect.top) / rect.height) * VIEW_H
  return { x, y }
}

/* ------------------------------------------------------------------ */
/*  SVG Defs                                                          */
/* ------------------------------------------------------------------ */

function SvgDefs() {
  return (
    <defs>
      <filter id="drag-shadow" x="-20%" y="-20%" width="150%" height="150%">
        <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="rgba(0,0,0,0.3)" />
      </filter>
      <filter id="snap-glow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
        <feFlood floodColor="#FFD700" floodOpacity="0.6" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      {Object.entries(PIECE_COLORS).map(([shape, color]) => (
        <linearGradient key={shape} id={`grad-${shape}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.75" />
        </linearGradient>
      ))}
      <pattern id="paper-texture" width="6" height="6" patternUnits="userSpaceOnUse">
        <rect width="6" height="6" fill="#FFF8EE" />
        <circle cx="1" cy="1" r="0.4" fill="rgba(180,160,120,0.08)" />
        <circle cx="4" cy="4" r="0.3" fill="rgba(180,160,120,0.06)" />
      </pattern>
    </defs>
  )
}

/* ------------------------------------------------------------------ */
/*  Rotate Button (visible overlay)                                   */
/* ------------------------------------------------------------------ */

interface RotateButtonProps {
  x: number
  y: number
  rotation: RotationAngle
  onClick: () => void
}

/** A small circular rotate button that appears near each unsnapped piece. */
function RotateButton({ x, y, rotation, onClick }: RotateButtonProps) {
  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      onPointerDown={(e) => e.stopPropagation()}
      style={{ cursor: 'pointer' }}
    >
      {/* Button circle */}
      <circle r="14" fill="white" stroke="#ddd" strokeWidth="1.5" opacity="0.92" />
      {/* Rotate arrow icon */}
      <g transform={`rotate(${rotation})`}>
        <path
          d="M -5 -2 A 7 7 0 1 1 -5 5"
          fill="none"
          stroke="#666"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <polygon
          points="-8,5 -5,8 -2,5"
          fill="#666"
        />
      </g>
      {/* Rotation degree label */}
      <text
        y="22"
        textAnchor="middle"
        fontSize="8"
        fill="#999"
        fontFamily="system-ui, sans-serif"
        fontWeight="bold"
      >
        {rotation}°
      </text>
    </g>
  )
}

/* ------------------------------------------------------------------ */
/*  Piece Renderer                                                    */
/* ------------------------------------------------------------------ */

interface PieceRendererProps {
  piece: TangramPiece
  isDragging: boolean
  isLongPressRotating: boolean
}

function PieceRenderer({ piece, isDragging, isLongPressRotating }: PieceRendererProps) {
  const size = PIECE_SIZES[piece.shape]
  const cx = size.w / 2
  const cy = size.h / 2

  return (
    <g
      data-piece-id={piece.id}
      transform={`translate(${piece.x}, ${piece.y})`}
      style={{
        cursor: piece.snapped ? 'default' : isDragging ? 'grabbing' : 'grab',
        transition: piece.snapped ? 'transform 0.2s ease-out' : 'none',
      }}
    >
      <g transform={`rotate(${piece.rotation}, ${cx}, ${cy})`}>
        <polygon
          points={PIECE_POLYGONS[piece.shape]}
          fill={`url(#grad-${piece.shape})`}
          stroke={isLongPressRotating ? '#FFB627' : '#333'}
          strokeWidth={isLongPressRotating ? 3 : 1.5}
          strokeLinejoin="round"
          filter={
            piece.snapped
              ? 'url(#snap-glow)'
              : isDragging
                ? 'url(#drag-shadow)'
                : undefined
          }
          transform={isDragging ? `scale(1.08)` : undefined}
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            transition: isLongPressRotating ? 'stroke 0.2s, stroke-width 0.2s' : undefined,
          }}
        />
      </g>

      {/* Long-press rotation indicator: pulsing ring */}
      {isLongPressRotating && (
        <circle
          cx={cx}
          cy={cy}
          r={Math.max(size.w, size.h) / 2 + 8}
          fill="none"
          stroke="#FFB627"
          strokeWidth="2"
          strokeDasharray="6 4"
          opacity="0.6"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from={`0 ${cx} ${cy}`}
            to={`360 ${cx} ${cy}`}
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      )}
    </g>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                    */
/* ------------------------------------------------------------------ */

/**
 * Tangram — Geometry puzzle renderer.
 *
 * Interaction modes:
 * 1. **Drag** — touch/click and move to reposition a piece
 * 2. **Tap rotate button** — each unsnapped piece has a visible ↻ button
 * 3. **Tap the piece** — quick tap (no drag) also rotates the piece 90°
 * 4. **Long-press** — hold 400ms+ to enter rotation mode, then drag to rotate
 *
 * Pieces snap when close enough to their target slot.
 */
export default function Tangram({
  puzzle,
  onCorrect,
  onError,
  onAha,
  onComplete,
}: RendererProps) {
  const config = useMemo(() => parsePuzzle(puzzle), [puzzle])
  const snapTolerance = config.difficulty <= 1 ? SNAP_TOLERANCE_L1 : SNAP_TOLERANCE_L2

  /* ---- Determine which pieces to use ---- */
  const activeShapes = useMemo(() => {
    if (config.pieces && config.pieces.length > 0) return config.pieces
    if (config.difficulty <= 1) {
      return ['large-tri-1', 'medium-tri', 'square', 'small-tri-1'] as PieceShape[]
    }
    return Object.keys(PIECE_COLORS) as PieceShape[]
  }, [config.pieces, config.difficulty])

  /* ---- Active slots filtered by active shapes ---- */
  const activeSlots = useMemo(
    () => config.slots.filter((s) => activeShapes.includes(s.shape)),
    [config.slots, activeShapes],
  )

  /* ---- Piece state ---- */
  const [pieces, setPieces] = useState<TangramPiece[]>(() =>
    scatterPieces(activeShapes, 320),
  )

  /* ---- Drag state ---- */
  const dragRef = useRef<DragInfo | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  /* ---- Long-press & tap detection ---- */
  const pointerStartRef = useRef<{ x: number; y: number; time: number; pieceId: string } | null>(null)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [longPressId, setLongPressId] = useState<string | null>(null)
  const didDragRef = useRef(false)

  /* ---- Completion tracking ---- */
  const hasFiredAha = useRef(false)
  const hasFiredComplete = useRef(false)

  /* ---- Snap check ---- */
  const trySnap = useCallback(
    (piece: TangramPiece): TangramPiece => {
      return trySnapUtil(piece, activeSlots, snapTolerance)
    },
    [activeSlots, snapTolerance],
  )

  /* ---- Check completion ---- */
  const checkCompletion = useCallback(
    (updatedPieces: TangramPiece[]) => {
      const snappedCount = updatedPieces.filter((p) => p.snapped).length

      if (snappedCount >= 1 && !hasFiredAha.current) {
        hasFiredAha.current = true
        onAha()
      }

      if (snappedCount === updatedPieces.length && !hasFiredComplete.current) {
        hasFiredComplete.current = true
        onCorrect()
        setTimeout(() => onComplete(), 1200)
      }
    },
    [onAha, onCorrect, onComplete],
  )

  /* ---- Rotate a specific piece ---- */
  const rotatePiece = useCallback((pieceId: string) => {
    setPieces((prev) =>
      prev.map((p) =>
        p.id === pieceId && !p.snapped
          ? { ...p, rotation: nextRotation(p.rotation) }
          : p,
      ),
    )
  }, [])

  /* ---- Clear long-press timer ---- */
  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    setLongPressId(null)
  }, [])

  /* ---- Pointer handlers ---- */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const svg = svgRef.current
      if (!svg) return

      const { x, y } = pointerToSvg(e, svg)

      // Find topmost piece under pointer
      let hitPiece: TangramPiece | null = null
      for (let i = pieces.length - 1; i >= 0; i--) {
        const p = pieces[i]
        if (p.snapped) continue
        const size = PIECE_SIZES[p.shape]
        if (x >= p.x && x <= p.x + size.w && y >= p.y && y <= p.y + size.h) {
          hitPiece = p
          break
        }
      }

      if (!hitPiece) return

      // Record pointer start for tap vs drag detection
      pointerStartRef.current = { x, y, time: Date.now(), pieceId: hitPiece.id }
      didDragRef.current = false

      // Start long-press timer
      const pid = hitPiece.id
      longPressTimerRef.current = setTimeout(() => {
        if (!didDragRef.current) {
          // Long press detected — rotate and show indicator
          setLongPressId(pid)
          rotatePiece(pid)
        }
      }, LONG_PRESS_MS)

      // Start drag
      ;(e.target as SVGElement).setPointerCapture?.(e.pointerId)
      dragRef.current = {
        pieceId: hitPiece.id,
        offsetX: x - hitPiece.x,
        offsetY: y - hitPiece.y,
      }
      setDraggingId(hitPiece.id)

      // Move dragged piece to top
      setPieces((prev) => {
        const idx = prev.findIndex((p) => p.id === hitPiece!.id)
        if (idx === -1 || idx === prev.length - 1) return prev
        const updated = [...prev]
        const [moved] = updated.splice(idx, 1)
        updated.push(moved)
        return updated
      })
    },
    [pieces, rotatePiece],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const drag = dragRef.current
      const svg = svgRef.current
      const start = pointerStartRef.current
      if (!drag || !svg) return

      const { x, y } = pointerToSvg(e, svg)

      // Check if we've exceeded tap threshold
      if (start) {
        const dx = x - start.x
        const dy = y - start.y
        if (Math.sqrt(dx * dx + dy * dy) > TAP_THRESHOLD) {
          didDragRef.current = true
          // Cancel long-press if we started dragging
          if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current)
            longPressTimerRef.current = null
          }
          setLongPressId(null)
        }
      }

      // If in long-press mode, rotate instead of drag
      if (longPressId === drag.pieceId) {
        // Calculate rotation based on pointer angle from piece center
        const piece = pieces.find((p) => p.id === drag.pieceId)
        if (piece) {
          const size = PIECE_SIZES[piece.shape]
          const cx = piece.x + size.w / 2
          const cy = piece.y + size.h / 2
          const angle = Math.atan2(y - cy, x - cx) * (180 / Math.PI)
          // Snap to nearest 90°
          const snappedAngle = ((Math.round(angle / 90) * 90 % 360) + 360) % 360 as RotationAngle
          setPieces((prev) =>
            prev.map((p) =>
              p.id === drag.pieceId ? { ...p, rotation: snappedAngle } : p,
            ),
          )
        }
        return
      }

      // Normal drag
      setPieces((prev) =>
        prev.map((p) =>
          p.id === drag.pieceId
            ? { ...p, x: x - drag.offsetX, y: y - drag.offsetY }
            : p,
        ),
      )
    },
    [longPressId, pieces],
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const drag = dragRef.current
      const start = pointerStartRef.current
      const wasLongPress = longPressId !== null

      // Clear all state
      clearLongPress()

      if (!drag) return

      dragRef.current = null
      setDraggingId(null)
      pointerStartRef.current = null

      // If it was a long-press rotation, just finalize — don't snap
      if (wasLongPress) {
        return
      }

      // If pointer didn't move much, it's a TAP → rotate
      if (!didDragRef.current && start) {
        rotatePiece(start.pieceId)
        return
      }

      // Normal drag end — try snap
      setPieces((prev) => {
        const updated = prev.map((p) =>
          p.id === drag.pieceId ? trySnap(p) : p,
        )

        const draggedBefore = prev.find((p) => p.id === drag.pieceId)
        const draggedAfter = updated.find((p) => p.id === drag.pieceId)
        if (draggedAfter?.snapped && !draggedBefore?.snapped) {
          setTimeout(() => checkCompletion(updated), 50)
        } else if (!draggedAfter?.snapped) {
          onError()
        }

        return updated
      })
    },
    [trySnap, checkCompletion, onError, rotatePiece, longPressId, clearLongPress],
  )

  /* ---- Compute completion state ---- */
  const snappedCount = pieces.filter((p) => p.snapped).length
  const allSnapped = snappedCount === pieces.length

  /* ---- Render ---- */
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      {/* Interaction hint */}
      <div className="text-center mb-2 px-4">
        <p className="text-[11px] text-gray-400 font-medium">
          {'🔄 点击旋转 · 拖动移动 · 长按自由旋转'}
        </p>
        <p className="text-[10px] text-gray-300">
          {'Tap to rotate · Drag to move · Long-press to free rotate'}
        </p>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-full"
        style={{ touchAction: 'none', maxWidth: 600 }}
        preserveAspectRatio="xMidYMid meet"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <SvgDefs />

        {/* Background */}
        <rect width={VIEW_W} height={VIEW_H} fill="url(#paper-texture)" rx="8" />

        {/* Target silhouette */}
        <path
          d={config.targetOutline}
          fill="#E8E0D0"
          stroke="#BDB5A5"
          strokeWidth={2}
          strokeDasharray="8 4"
          opacity={config.showOutline ? 0.8 : 0.4}
        />

        {/* Slot outlines (guides) */}
        {config.showOutline &&
          activeSlots.map((slot) => {
            const size = PIECE_SIZES[slot.shape]
            const cx = size.w / 2
            const cy = size.h / 2
            return (
              <g key={slot.id} transform={`translate(${slot.x}, ${slot.y})`} opacity={0.25}>
                <g transform={`rotate(${slot.rotation}, ${cx}, ${cy})`}>
                  <polygon
                    points={PIECE_POLYGONS[slot.shape]}
                    fill="none"
                    stroke="#999"
                    strokeWidth={1}
                    strokeDasharray="4 3"
                  />
                </g>
              </g>
            )
          })}

        {/* Tangram pieces */}
        {pieces.map((piece) => (
          <PieceRenderer
            key={piece.id}
            piece={piece}
            isDragging={draggingId === piece.id}
            isLongPressRotating={longPressId === piece.id}
          />
        ))}

        {/* Rotate buttons — shown near each unsnapped piece */}
        {pieces.map((piece) => {
          if (piece.snapped || draggingId === piece.id) return null
          const size = PIECE_SIZES[piece.shape]
          const btnX = piece.x + size.w + 4
          const btnY = piece.y - 4
          // Keep button within SVG bounds
          const clampedX = Math.min(btnX, VIEW_W - 20)
          const clampedY = Math.max(btnY, 20)
          return (
            <RotateButton
              key={`btn-${piece.id}`}
              x={clampedX}
              y={clampedY}
              rotation={piece.rotation}
              onClick={() => rotatePiece(piece.id)}
            />
          )
        })}

        {/* Progress indicator */}
        <text
          x={VIEW_W - 12}
          y={20}
          textAnchor="end"
          fontSize="14"
          fontFamily="system-ui, sans-serif"
          fontWeight="bold"
          fill="rgba(80, 80, 120, 0.7)"
        >
          {snappedCount}/{pieces.length}
        </text>

        {/* Completion celebration */}
        {allSnapped && (
          <g>
            <rect width={VIEW_W} height={VIEW_H} fill="rgba(255,215,0,0.1)" rx="8">
              <animate attributeName="opacity" values="0;0.3;0" dur="1.5s" repeatCount="3" />
            </rect>
            {pieces.map((piece) => {
              const size = PIECE_SIZES[piece.shape]
              const cx = piece.x + size.w / 2
              const cy = piece.y + size.h / 2
              return (
                <circle key={`celebrate-${piece.id}`} cx={cx} cy={cy} r="5" fill="#FFD700" opacity="0">
                  <animate attributeName="r" values="5;25;5" dur="1s" repeatCount="3" />
                  <animate attributeName="opacity" values="0.8;0;0.8" dur="1s" repeatCount="3" />
                </circle>
              )
            })}
          </g>
        )}
      </svg>

      {/* Reset button */}
      <button
        type="button"
        onClick={() => {
          hasFiredAha.current = false
          hasFiredComplete.current = false
          clearLongPress()
          setPieces(scatterPieces(activeShapes, 320))
        }}
        className="absolute bottom-4 right-4 px-4 py-2 rounded-full
                   bg-white/80 hover:bg-white shadow-md
                   text-sm font-semibold text-gray-600 hover:text-red-500
                   transition-colors select-none active:scale-95"
        style={{ touchAction: 'manipulation' }}
      >
        Reset
      </button>
    </div>
  )
}
