/**
 * Unit tests for Geometry (Tangram) pure-logic utilities.
 * FR-3: Geometry tangram operations.
 */

import { describe, it, expect } from 'vitest'
import type { TangramPiece, TargetSlot, RotationAngle, PieceShape } from '../../src/renderers/geometry/types'
import {
  U,
  SNAP_TOLERANCE_L1,
  SNAP_TOLERANCE_L2,
  PIECE_SIZES,
  L1_PIECES,
  L2_PIECES,
  pieceCentroid,
  distToSlot,
  nextRotation,
  getSnapTolerance,
  getActiveShapes,
  trySnap,
} from '../../src/renderers/geometry/tangram.utils'

/* ------------------------------------------------------------------ */
/*  Test helpers                                                      */
/* ------------------------------------------------------------------ */

function makePiece(overrides: Partial<TangramPiece> & { shape: PieceShape }): TangramPiece {
  return {
    id: 'test-piece',
    x: 0,
    y: 0,
    rotation: 0,
    color: '#FF0000',
    snapped: false,
    ...overrides,
  }
}

function makeSlot(overrides: Partial<TargetSlot> & { shape: PieceShape }): TargetSlot {
  return {
    id: 'test-slot',
    x: 0,
    y: 0,
    rotation: 0,
    ...overrides,
  }
}

/* ------------------------------------------------------------------ */
/*  pieceCentroid                                                     */
/* ------------------------------------------------------------------ */

describe('pieceCentroid', () => {
  // FR-3: bounding box center calculation

  it('returns center of large triangle at origin', () => {
    // FR-3: centroid = position + half bounding box
    const piece = makePiece({ shape: 'large-tri-1', x: 0, y: 0 })
    const c = pieceCentroid(piece)
    expect(c.cx).toBe(U * 4 / 2) // 80
    expect(c.cy).toBe(U * 4 / 2) // 80
  })

  it('accounts for piece position offset', () => {
    // FR-3: centroid shifts with position
    const piece = makePiece({ shape: 'square', x: 100, y: 50 })
    const size = PIECE_SIZES['square']
    const c = pieceCentroid(piece)
    expect(c.cx).toBe(100 + size.w / 2)
    expect(c.cy).toBe(50 + size.h / 2)
  })

  it('handles parallelogram (non-square bounding box)', () => {
    // FR-3: asymmetric piece bounding box
    const piece = makePiece({ shape: 'parallelogram', x: 10, y: 20 })
    const size = PIECE_SIZES['parallelogram']
    const c = pieceCentroid(piece)
    expect(c.cx).toBe(10 + size.w / 2) // 10 + 60 = 70
    expect(c.cy).toBe(20 + size.h / 2) // 20 + 40 = 60
    // w != h for parallelogram
    expect(size.w).not.toBe(size.h)
  })

  it('returns correct values for all piece shapes', () => {
    // FR-3: exhaustive shape coverage
    const shapes: PieceShape[] = [
      'large-tri-1', 'large-tri-2', 'medium-tri',
      'small-tri-1', 'small-tri-2', 'square', 'parallelogram',
    ]
    for (const shape of shapes) {
      const piece = makePiece({ shape, x: 50, y: 50 })
      const c = pieceCentroid(piece)
      const size = PIECE_SIZES[shape]
      expect(c.cx).toBe(50 + size.w / 2)
      expect(c.cy).toBe(50 + size.h / 2)
    }
  })
})

/* ------------------------------------------------------------------ */
/*  distToSlot                                                        */
/* ------------------------------------------------------------------ */

describe('distToSlot', () => {
  // FR-3: Euclidean distance between piece centroid and slot centroid

  it('returns 0 when piece is exactly on its slot', () => {
    // FR-3: perfect alignment
    const piece = makePiece({ shape: 'square', x: 100, y: 100 })
    const slot = makeSlot({ shape: 'square', x: 100, y: 100 })
    expect(distToSlot(piece, slot)).toBe(0)
  })

  it('computes correct Euclidean distance for offset piece', () => {
    // FR-3: distance calculation
    const piece = makePiece({ shape: 'square', x: 100, y: 100 })
    const slot = makeSlot({ shape: 'square', x: 130, y: 140 })
    // Centroids: piece=(100+40, 100+40)=(140,140), slot=(130+40, 140+40)=(170,180)
    // dx=30, dy=40 => dist=50
    const d = distToSlot(piece, slot)
    expect(d).toBe(50)
  })

  it('handles pieces with different shapes (uses each shape bounding box)', () => {
    // FR-3: cross-shape distance (shapes can differ between piece and slot)
    const piece = makePiece({ shape: 'large-tri-1', x: 0, y: 0 })
    const slot = makeSlot({ shape: 'small-tri-1', x: 0, y: 0 })
    // Centroids differ because bounding boxes differ
    const pSize = PIECE_SIZES['large-tri-1'] // 160x160
    const sSize = PIECE_SIZES['small-tri-1'] // 80x80
    const expectedDx = pSize.w / 2 - sSize.w / 2 // 40
    const expectedDy = pSize.h / 2 - sSize.h / 2 // 40
    const expected = Math.sqrt(expectedDx ** 2 + expectedDy ** 2)
    expect(distToSlot(piece, slot)).toBeCloseTo(expected)
  })

  it('is symmetric when piece and slot have same shape', () => {
    // FR-3: distance symmetry
    const piece = makePiece({ shape: 'medium-tri', x: 50, y: 60 })
    const slot = makeSlot({ shape: 'medium-tri', x: 90, y: 100 })
    // Swap positions
    const piece2 = makePiece({ shape: 'medium-tri', x: 90, y: 100 })
    const slot2 = makeSlot({ shape: 'medium-tri', x: 50, y: 60 })
    expect(distToSlot(piece, slot)).toBeCloseTo(distToSlot(piece2, slot2))
  })
})

/* ------------------------------------------------------------------ */
/*  nextRotation                                                      */
/* ------------------------------------------------------------------ */

describe('nextRotation', () => {
  // FR-3: 0 -> 90 -> 180 -> 270 -> 0 cycle

  it('cycles through all rotation angles', () => {
    expect(nextRotation(0)).toBe(90)
    expect(nextRotation(90)).toBe(180)
    expect(nextRotation(180)).toBe(270)
    expect(nextRotation(270)).toBe(0)
  })

  it('wraps from 270 back to 0', () => {
    // FR-3: wrap-around boundary
    expect(nextRotation(270)).toBe(0)
  })

  it('four rotations return to original', () => {
    // FR-3: full cycle identity
    let r: RotationAngle = 0
    for (let i = 0; i < 4; i++) r = nextRotation(r)
    expect(r).toBe(0)
  })

  it('four rotations from any starting point return to start', () => {
    // FR-3: identity from any start
    const starts: RotationAngle[] = [0, 90, 180, 270]
    for (const start of starts) {
      let r: RotationAngle = start
      for (let i = 0; i < 4; i++) r = nextRotation(r)
      expect(r).toBe(start)
    }
  })
})

/* ------------------------------------------------------------------ */
/*  Snap tolerance: L1=30 vs L2=20                                    */
/* ------------------------------------------------------------------ */

describe('snap tolerance', () => {
  // FR-3: snap tolerance L1=30 vs L2=20

  it('L1 tolerance is 30', () => {
    expect(SNAP_TOLERANCE_L1).toBe(30)
  })

  it('L2 tolerance is 20', () => {
    expect(SNAP_TOLERANCE_L2).toBe(20)
  })

  it('getSnapTolerance returns L1 for difficulty <= 1', () => {
    // FR-3: generous snap for beginners
    expect(getSnapTolerance(0)).toBe(30)
    expect(getSnapTolerance(1)).toBe(30)
  })

  it('getSnapTolerance returns L2 for difficulty > 1', () => {
    // FR-3: tighter snap for advanced
    expect(getSnapTolerance(2)).toBe(20)
    expect(getSnapTolerance(5)).toBe(20)
  })
})

/* ------------------------------------------------------------------ */
/*  trySnap                                                           */
/* ------------------------------------------------------------------ */

describe('trySnap', () => {
  // FR-3: piece snapping logic

  it('snaps when piece is within tolerance of matching slot', () => {
    // FR-3: successful snap
    const slot = makeSlot({ shape: 'square', x: 100, y: 100, rotation: 90 })
    // Place piece close to slot (within L1 tolerance)
    const piece = makePiece({ shape: 'square', x: 110, y: 110 })
    // Distance: centroids differ by (10, 10) => sqrt(200) ~ 14.14 < 30
    const result = trySnap(piece, [slot], SNAP_TOLERANCE_L1)
    expect(result.snapped).toBe(true)
    expect(result.x).toBe(slot.x)
    expect(result.y).toBe(slot.y)
    expect(result.rotation).toBe(slot.rotation)
  })

  it('does not snap when piece is outside tolerance', () => {
    // FR-3: failed snap
    const slot = makeSlot({ shape: 'square', x: 100, y: 100 })
    const piece = makePiece({ shape: 'square', x: 200, y: 200 })
    const result = trySnap(piece, [slot], SNAP_TOLERANCE_L1)
    expect(result.snapped).toBe(false)
    expect(result.x).toBe(200) // unchanged
    expect(result.y).toBe(200) // unchanged
  })

  it('does not snap when shapes do not match', () => {
    // FR-3: shape mismatch prevents snap
    const slot = makeSlot({ shape: 'square', x: 100, y: 100 })
    const piece = makePiece({ shape: 'large-tri-1', x: 100, y: 100 })
    const result = trySnap(piece, [slot], SNAP_TOLERANCE_L1)
    expect(result.snapped).toBe(false)
  })

  it('L2 tolerance is stricter than L1', () => {
    // FR-3: L2 is tighter — piece at boundary distance
    const slot = makeSlot({ shape: 'square', x: 100, y: 100 })
    // Place piece so centroid dist is ~25 (between L2=20 and L1=30)
    const piece = makePiece({ shape: 'square', x: 125, y: 100 })
    // dx=25, dy=0 => dist=25

    const resultL1 = trySnap(piece, [slot], SNAP_TOLERANCE_L1)
    expect(resultL1.snapped).toBe(true)

    const resultL2 = trySnap(piece, [slot], SNAP_TOLERANCE_L2)
    expect(resultL2.snapped).toBe(false)
  })

  it('snaps to first matching slot when multiple exist', () => {
    // FR-3: first-match priority
    const slot1 = makeSlot({ id: 's1', shape: 'square', x: 100, y: 100, rotation: 0 })
    const slot2 = makeSlot({ id: 's2', shape: 'square', x: 105, y: 105, rotation: 90 })
    const piece = makePiece({ shape: 'square', x: 100, y: 100 })
    const result = trySnap(piece, [slot1, slot2], SNAP_TOLERANCE_L1)
    expect(result.snapped).toBe(true)
    expect(result.x).toBe(100) // snapped to slot1
    expect(result.rotation).toBe(0)
  })

  it('returns unmodified piece when no slots provided', () => {
    // FR-3: edge case — empty slots
    const piece = makePiece({ shape: 'square', x: 50, y: 50 })
    const result = trySnap(piece, [], SNAP_TOLERANCE_L1)
    expect(result.snapped).toBe(false)
    expect(result.x).toBe(50)
    expect(result.y).toBe(50)
  })

  it('snaps exactly at tolerance boundary', () => {
    // FR-3: boundary — distance exactly equals tolerance
    const slot = makeSlot({ shape: 'square', x: 100, y: 100 })
    // Need piece where centroid distance = exactly 30
    // slot centroid = (100+40, 100+40) = (140, 140)
    // piece centroid needs to be at distance 30: (140+30, 140) => piece.x = 140+30-40 = 130
    const piece = makePiece({ shape: 'square', x: 130, y: 100 })
    const result = trySnap(piece, [slot], SNAP_TOLERANCE_L1)
    expect(result.snapped).toBe(true)
  })
})

/* ------------------------------------------------------------------ */
/*  Snapped pieces can't be re-dragged (logic simulation)             */
/* ------------------------------------------------------------------ */

describe('snapped piece immutability (simulated)', () => {
  // FR-3: snapped pieces can't be re-dragged

  it('piece with snapped=true should be skipped in hit testing', () => {
    // FR-3: simulate the Tangram.tsx hit-test logic
    const pieces: TangramPiece[] = [
      makePiece({ id: 'p1', shape: 'square', x: 100, y: 100, snapped: true }),
      makePiece({ id: 'p2', shape: 'square', x: 100, y: 100, snapped: false }),
    ]
    // Simulate hit test: iterate reverse, skip snapped
    let hitPiece: TangramPiece | null = null
    for (let i = pieces.length - 1; i >= 0; i--) {
      if (pieces[i].snapped) continue
      hitPiece = pieces[i]
      break
    }
    expect(hitPiece).not.toBeNull()
    expect(hitPiece!.id).toBe('p2') // the non-snapped one
  })

  it('all-snapped means no piece is draggable', () => {
    // FR-3: all snapped — no hit
    const pieces: TangramPiece[] = [
      makePiece({ id: 'p1', shape: 'square', snapped: true }),
      makePiece({ id: 'p2', shape: 'large-tri-1', snapped: true }),
    ]
    let hitPiece: TangramPiece | null = null
    for (let i = pieces.length - 1; i >= 0; i--) {
      if (pieces[i].snapped) continue
      hitPiece = pieces[i]
      break
    }
    expect(hitPiece).toBeNull()
  })
})

/* ------------------------------------------------------------------ */
/*  Piece count: L1=4, L2=7                                           */
/* ------------------------------------------------------------------ */

describe('piece count by difficulty', () => {
  // FR-3: piece count L1=4, L2=7

  it('L1 has 4 pieces', () => {
    expect(L1_PIECES.length).toBe(4)
  })

  it('L2 has 7 pieces (full tangram set)', () => {
    expect(L2_PIECES.length).toBe(7)
  })

  it('getActiveShapes returns 4 pieces for difficulty 1', () => {
    // FR-3: L1 piece selection
    const shapes = getActiveShapes(1)
    expect(shapes.length).toBe(4)
  })

  it('getActiveShapes returns 7 pieces for difficulty 2', () => {
    // FR-3: L2 piece selection
    const shapes = getActiveShapes(2)
    expect(shapes.length).toBe(7)
  })

  it('getActiveShapes respects custom pieces override', () => {
    // FR-3: custom piece set takes priority
    const custom: PieceShape[] = ['square', 'medium-tri']
    const shapes = getActiveShapes(1, custom)
    expect(shapes.length).toBe(2)
    expect(shapes).toEqual(custom)
  })

  it('getActiveShapes ignores empty custom pieces array', () => {
    // FR-3: empty array falls back to default
    const shapes = getActiveShapes(1, [])
    expect(shapes.length).toBe(4)
  })
})

/* ------------------------------------------------------------------ */
/*  PIECE_SIZES consistency                                           */
/* ------------------------------------------------------------------ */

describe('PIECE_SIZES', () => {
  // FR-3: bounding box sizes based on unit U=40

  it('U constant is 40', () => {
    expect(U).toBe(40)
  })

  it('large triangles are 4U x 4U', () => {
    // FR-3: large triangle bounding box
    expect(PIECE_SIZES['large-tri-1']).toEqual({ w: 160, h: 160 })
    expect(PIECE_SIZES['large-tri-2']).toEqual({ w: 160, h: 160 })
  })

  it('small pieces are 2U x 2U', () => {
    // FR-3: small piece bounding boxes
    expect(PIECE_SIZES['medium-tri']).toEqual({ w: 80, h: 80 })
    expect(PIECE_SIZES['small-tri-1']).toEqual({ w: 80, h: 80 })
    expect(PIECE_SIZES['small-tri-2']).toEqual({ w: 80, h: 80 })
    expect(PIECE_SIZES['square']).toEqual({ w: 80, h: 80 })
  })

  it('parallelogram is 3U x 2U', () => {
    // FR-3: parallelogram has asymmetric bounding box
    expect(PIECE_SIZES['parallelogram']).toEqual({ w: 120, h: 80 })
  })

  it('all 7 standard shapes are defined', () => {
    // FR-3: completeness check
    const keys = Object.keys(PIECE_SIZES)
    expect(keys.length).toBe(7)
  })
})
