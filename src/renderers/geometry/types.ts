/**
 * Type definitions for the Geometry Tangram renderer.
 *
 * A tangram puzzle where children drag and rotate geometric pieces
 * to fill a target silhouette.
 */

/** A 2D point in SVG coordinate space. */
export interface Point {
  x: number
  y: number
}

/** Rotation angle (degrees), restricted to 90-degree increments. */
export type RotationAngle = 0 | 90 | 180 | 270

/** Standard tangram piece shapes. */
export const PIECE_SHAPES = [
  'large-tri-1',
  'large-tri-2',
  'medium-tri',
  'small-tri-1',
  'small-tri-2',
  'square',
  'parallelogram',
] as const

export type PieceShape = (typeof PIECE_SHAPES)[number]

/** A single tangram piece with position, rotation, and visual properties. */
export interface TangramPiece {
  id: string
  shape: PieceShape
  /** Current position (top-left of bounding box in SVG coords). */
  x: number
  y: number
  /** Rotation in 90-degree increments. */
  rotation: RotationAngle
  /** Fill color for the piece. */
  color: string
  /** Whether this piece has been snapped into its target slot. */
  snapped: boolean
}

/** A target slot where a piece should be placed. */
export interface TargetSlot {
  id: string
  /** Which piece shape belongs here. */
  shape: PieceShape
  /** Target position (SVG coords). */
  x: number
  y: number
  /** Required rotation to fit. */
  rotation: RotationAngle
}

/**
 * Puzzle data embedded in `puzzle.data`.
 *
 * - `targetShape`: identifier for the silhouette (e.g. "cat", "house", "rocket")
 * - `targetOutline`: SVG path string for the combined silhouette
 * - `difficulty`: 1 = fewer pieces + large snap tolerance, 2 = full 7 pieces
 * - `showOutline`: whether to show piece outlines within the silhouette
 * - `slots`: target positions for each piece
 * - `pieces`: optional subset of pieces for L1 difficulty
 */
export interface TangramPuzzleData {
  targetShape: string
  targetOutline: string
  difficulty: number
  showOutline: boolean
  slots: TargetSlot[]
  pieces?: PieceShape[]
}

/** Drag state tracked internally. */
export interface DragInfo {
  pieceId: string
  /** Offset from piece origin to pointer position at drag start. */
  offsetX: number
  offsetY: number
}
