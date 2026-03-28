/**
 * Pure-logic utility functions for the Geometry Tangram renderer.
 *
 * Extracted from Tangram.tsx so they can be unit-tested independently.
 * FR-3: Geometry tangram operations.
 */

import type { TangramPiece, TargetSlot, RotationAngle, PieceShape } from './types'

/** Unit size for piece geometry (one tangram grid unit). */
export const U = 40

/** Snap distance in SVG units. L1 = generous, L2 = tight. */
export const SNAP_TOLERANCE_L1 = 30
export const SNAP_TOLERANCE_L2 = 20

/** Bounding box sizes for centroid calculation. */
export const PIECE_SIZES: Record<PieceShape, { w: number; h: number }> = {
  'large-tri-1': { w: U * 4, h: U * 4 },
  'large-tri-2': { w: U * 4, h: U * 4 },
  'medium-tri': { w: U * 2, h: U * 2 },
  'small-tri-1': { w: U * 2, h: U * 2 },
  'small-tri-2': { w: U * 2, h: U * 2 },
  'square': { w: U * 2, h: U * 2 },
  'parallelogram': { w: U * 3, h: U * 2 },
}

/** Default L1 piece set (4 pieces). */
export const L1_PIECES: PieceShape[] = [
  'large-tri-1', 'medium-tri', 'square', 'small-tri-1',
]

/** Full L2 piece set (7 pieces). */
export const L2_PIECES: PieceShape[] = [
  'large-tri-1', 'large-tri-2', 'medium-tri',
  'small-tri-1', 'small-tri-2', 'square', 'parallelogram',
]

/** Get the centroid of a piece given its position and shape. */
export function pieceCentroid(piece: TangramPiece): { cx: number; cy: number } {
  const size = PIECE_SIZES[piece.shape]
  return {
    cx: piece.x + size.w / 2,
    cy: piece.y + size.h / 2,
  }
}

/** Check distance between a piece centroid and a slot position centroid. */
export function distToSlot(piece: TangramPiece, slot: TargetSlot): number {
  const pc = pieceCentroid(piece)
  const slotSize = PIECE_SIZES[slot.shape]
  const scx = slot.x + slotSize.w / 2
  const scy = slot.y + slotSize.h / 2
  const dx = pc.cx - scx
  const dy = pc.cy - scy
  return Math.sqrt(dx * dx + dy * dy)
}

/** Cycle rotation by 90 degrees. */
export function nextRotation(current: RotationAngle): RotationAngle {
  return ((current + 90) % 360) as RotationAngle
}

/** Determine snap tolerance based on difficulty level. */
export function getSnapTolerance(difficulty: number): number {
  return difficulty <= 1 ? SNAP_TOLERANCE_L1 : SNAP_TOLERANCE_L2
}

/** Get active piece shapes based on difficulty. */
export function getActiveShapes(difficulty: number, customPieces?: PieceShape[]): PieceShape[] {
  if (customPieces && customPieces.length > 0) return customPieces
  return difficulty <= 1 ? [...L1_PIECES] : [...L2_PIECES]
}

/** Try to snap a piece to a matching slot within tolerance. */
export function trySnap(
  piece: TangramPiece,
  slots: TargetSlot[],
  tolerance: number,
): TangramPiece {
  for (const slot of slots) {
    if (slot.shape !== piece.shape) continue
    const dist = distToSlot(piece, slot)
    if (dist <= tolerance) {
      return {
        ...piece,
        x: slot.x,
        y: slot.y,
        rotation: slot.rotation,
        snapped: true,
      }
    }
  }
  return piece
}
