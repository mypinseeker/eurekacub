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

/* ------------------------------------------------------------------ */
/*  Local helpers (not extracted — depend on React/DOM or puzzle types)*/
/* ------------------------------------------------------------------ */

/** Parse and validate puzzle data with sensible defaults. */
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

/** Create initial scattered positions for pieces below the target area. */
function scatterPieces(
  shapes: PieceShape[],
  startY: number,
): TangramPiece[] {
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

/** Convert pointer event to SVG coordinates. */
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
/*  SVG Defs — gradients & filters                                    */
/* ------------------------------------------------------------------ */

function SvgDefs() {
  return (
    <defs>
      {/* Drop shadow for dragging pieces */}
      <filter id="drag-shadow" x="-20%" y="-20%" width="150%" height="150%">
        <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="rgba(0,0,0,0.3)" />
      </filter>
      {/* Glow for snapped pieces */}
      <filter id="snap-glow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
        <feFlood floodColor="#FFD700" floodOpacity="0.6" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      {/* Subtle gradient for each piece color */}
      {Object.entries(PIECE_COLORS).map(([shape, color]) => (
        <linearGradient
          key={shape}
          id={`grad-${shape}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.75" />
        </linearGradient>
      ))}
      {/* Paper texture pattern */}
      <pattern id="paper-texture" width="6" height="6" patternUnits="userSpaceOnUse">
        <rect width="6" height="6" fill="#FFF8EE" />
        <circle cx="1" cy="1" r="0.4" fill="rgba(180,160,120,0.08)" />
        <circle cx="4" cy="4" r="0.3" fill="rgba(180,160,120,0.06)" />
      </pattern>
    </defs>
  )
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                    */
/* ------------------------------------------------------------------ */

interface PieceRendererProps {
  piece: TangramPiece
  isDragging: boolean
}

/** Render a single tangram piece as an SVG polygon. */
function PieceRenderer({ piece, isDragging }: PieceRendererProps) {
  const size = PIECE_SIZES[piece.shape]
  const cx = size.w / 2
  const cy = size.h / 2

  return (
    <g
      data-piece-id={piece.id}
      transform={`translate(${piece.x}, ${piece.y})`}
      style={{
        cursor: piece.snapped ? 'default' : 'grab',
        transition: piece.snapped ? 'transform 0.2s ease-out' : 'none',
      }}
    >
      <g transform={`rotate(${piece.rotation}, ${cx}, ${cy})`}>
        <polygon
          points={PIECE_POLYGONS[piece.shape]}
          fill={`url(#grad-${piece.shape})`}
          stroke="#333"
          strokeWidth={1.5}
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
          }}
        />
      </g>
    </g>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                    */
/* ------------------------------------------------------------------ */

/**
 * Tangram — Geometry puzzle renderer for children.
 *
 * Children drag and rotate tangram pieces to fill a target silhouette.
 * Pieces snap into place when positioned close enough. Double-tap
 * rotates a piece by 90 degrees.
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
      // L1: fewer pieces
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

  /* ---- Drag state (ref for pointer move perf) ---- */
  const dragRef = useRef<DragInfo | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  /* ---- Double-tap tracking ---- */
  const lastTapRef = useRef<{ id: string; time: number } | null>(null)

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

      // First snap triggers onAha
      if (snappedCount >= 1 && !hasFiredAha.current) {
        hasFiredAha.current = true
        onAha()
      }

      // All pieces snapped
      if (snappedCount === updatedPieces.length && !hasFiredComplete.current) {
        hasFiredComplete.current = true
        onCorrect()
        // Small delay before onComplete for the animation to play
        setTimeout(() => onComplete(), 1200)
      }
    },
    [onAha, onCorrect, onComplete],
  )

  /* ---- Pointer handlers ---- */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const svg = svgRef.current
      if (!svg) return

      const { x, y } = pointerToSvg(e, svg)

      // Find topmost piece under pointer (iterate in reverse for z-order)
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

      // Double-tap detection for rotation
      const now = Date.now()
      const lastTap = lastTapRef.current
      if (lastTap && lastTap.id === hitPiece.id && now - lastTap.time < 400) {
        // Double tap — rotate
        lastTapRef.current = null
        setPieces((prev) =>
          prev.map((p) =>
            p.id === hitPiece!.id
              ? { ...p, rotation: nextRotation(p.rotation) }
              : p,
          ),
        )
        return
      }
      lastTapRef.current = { id: hitPiece.id, time: now }

      // Start drag
      ;(e.target as SVGElement).setPointerCapture?.(e.pointerId)
      dragRef.current = {
        pieceId: hitPiece.id,
        offsetX: x - hitPiece.x,
        offsetY: y - hitPiece.y,
      }
      setDraggingId(hitPiece.id)

      // Move dragged piece to top (end of array)
      setPieces((prev) => {
        const idx = prev.findIndex((p) => p.id === hitPiece!.id)
        if (idx === -1 || idx === prev.length - 1) return prev
        const updated = [...prev]
        const [moved] = updated.splice(idx, 1)
        updated.push(moved)
        return updated
      })
    },
    [pieces],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const drag = dragRef.current
      const svg = svgRef.current
      if (!drag || !svg) return

      const { x, y } = pointerToSvg(e, svg)

      setPieces((prev) =>
        prev.map((p) =>
          p.id === drag.pieceId
            ? { ...p, x: x - drag.offsetX, y: y - drag.offsetY }
            : p,
        ),
      )
    },
    [],
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const drag = dragRef.current
      if (!drag) return

      dragRef.current = null
      setDraggingId(null)

      setPieces((prev) => {
        const updated = prev.map((p) =>
          p.id === drag.pieceId ? trySnap(p) : p,
        )

        // Check if snapped piece was newly snapped
        const draggedBefore = prev.find((p) => p.id === drag.pieceId)
        const draggedAfter = updated.find((p) => p.id === drag.pieceId)
        if (draggedAfter?.snapped && !draggedBefore?.snapped) {
          // Successfully snapped — defer completion check
          setTimeout(() => checkCompletion(updated), 50)
        } else if (!draggedAfter?.snapped) {
          // Missed snap — subtle error feedback
          onError()
        }

        return updated
      })
    },
    [trySnap, checkCompletion, onError],
  )

  /* ---- Compute completion state for visual feedback ---- */
  const snappedCount = pieces.filter((p) => p.snapped).length
  const allSnapped = snappedCount === pieces.length

  /* ---- Render ---- */
  return (
    <div className="relative w-full h-full flex items-center justify-center">
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

        {/* Background with paper texture */}
        <rect
          width={VIEW_W}
          height={VIEW_H}
          fill="url(#paper-texture)"
          rx="8"
        />

        {/* Target silhouette */}
        <path
          d={config.targetOutline}
          fill="#E8E0D0"
          stroke="#BDB5A5"
          strokeWidth={2}
          strokeDasharray="8 4"
          opacity={config.showOutline ? 0.8 : 0.4}
        />

        {/* Slot outlines (guides) — only in L1 or when showOutline is true */}
        {config.showOutline &&
          activeSlots.map((slot) => {
            const size = PIECE_SIZES[slot.shape]
            const cx = size.w / 2
            const cy = size.h / 2
            return (
              <g
                key={slot.id}
                transform={`translate(${slot.x}, ${slot.y})`}
                opacity={0.25}
              >
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
          />
        ))}

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

        {/* Completion celebration overlay */}
        {allSnapped && (
          <g>
            <rect
              width={VIEW_W}
              height={VIEW_H}
              fill="rgba(255,215,0,0.1)"
              rx="8"
            >
              <animate
                attributeName="opacity"
                values="0;0.3;0"
                dur="1.5s"
                repeatCount="3"
              />
            </rect>
            {/* Rainbow pulse on all pieces */}
            {pieces.map((piece) => {
              const size = PIECE_SIZES[piece.shape]
              const cx = piece.x + size.w / 2
              const cy = piece.y + size.h / 2
              return (
                <circle
                  key={`celebrate-${piece.id}`}
                  cx={cx}
                  cy={cy}
                  r="5"
                  fill="#FFD700"
                  opacity="0"
                >
                  <animate
                    attributeName="r"
                    values="5;25;5"
                    dur="1s"
                    repeatCount="3"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.8;0;0.8"
                    dur="1s"
                    repeatCount="3"
                  />
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
