/**
 * Pre-designed tangram puzzle shapes that kids can recognize.
 *
 * Each puzzle defines:
 * - name: display name (zh/en)
 * - outline: SVG path for the target silhouette
 * - slots: where each piece goes to form the shape
 * - pieces: which pieces are used (L1 uses fewer)
 *
 * Coordinate system: VIEW_W=400, VIEW_H=500
 * Piece unit U=40: large-tri 160×160, medium-tri 80×80,
 * small-tri 80×80, square 80×80, parallelogram 120×80
 */

import type { TargetSlot, PieceShape, RotationAngle } from './types'

export interface TangramPuzzlePreset {
  id: string
  name: { zh: string; en: string }
  icon: string
  outline: string
  slots: TargetSlot[]
  pieces: PieceShape[]
}

/* ================================================================== */
/*  L1 Puzzles — 4 pieces, simple shapes                              */
/* ================================================================== */

/** 小房子 — House: square body + triangle roof */
const HOUSE: TangramPuzzlePreset = {
  id: 'house',
  name: { zh: '小房子', en: 'House' },
  icon: '🏠',
  outline: `
    M 120 100 L 200 30 L 280 100
    L 280 260 L 120 260 Z
  `,
  slots: [
    // Roof: large triangle, tip pointing up
    { id: 's1', shape: 'large-tri-1', x: 120, y: 100, rotation: 0 as RotationAngle },
    // Body left: square
    { id: 's2', shape: 'square', x: 120, y: 180, rotation: 0 as RotationAngle },
    // Body right top: small triangle
    { id: 's3', shape: 'small-tri-1', x: 200, y: 180, rotation: 0 as RotationAngle },
    // Body right bottom: medium triangle
    { id: 's4', shape: 'medium-tri', x: 200, y: 180, rotation: 0 as RotationAngle },
  ],
  pieces: ['large-tri-1', 'square', 'small-tri-1', 'medium-tri'],
}

/** 大箭头 — Arrow pointing right */
const ARROW: TangramPuzzlePreset = {
  id: 'arrow',
  name: { zh: '大箭头', en: 'Arrow' },
  icon: '➡️',
  outline: `
    M 80 140 L 240 140 L 240 80 L 340 200
    L 240 320 L 240 260 L 80 260 Z
  `,
  slots: [
    // Shaft: square
    { id: 's1', shape: 'square', x: 80, y: 140, rotation: 0 as RotationAngle },
    // Shaft extension: small triangle
    { id: 's2', shape: 'small-tri-1', x: 160, y: 140, rotation: 0 as RotationAngle },
    // Arrow head top: large triangle
    { id: 's3', shape: 'large-tri-1', x: 180, y: 80, rotation: 90 as RotationAngle },
    // Arrow head fill: medium triangle
    { id: 's4', shape: 'medium-tri', x: 160, y: 180, rotation: 0 as RotationAngle },
  ],
  pieces: ['square', 'small-tri-1', 'large-tri-1', 'medium-tri'],
}

/** 小船 — Simple boat */
const BOAT: TangramPuzzlePreset = {
  id: 'boat',
  name: { zh: '小船', en: 'Boat' },
  icon: '⛵',
  outline: `
    M 60 200 L 200 200 L 200 120 L 260 200
    L 340 200 L 280 280 L 120 280 Z
  `,
  slots: [
    // Sail: large triangle
    { id: 's1', shape: 'large-tri-1', x: 120, y: 40, rotation: 0 as RotationAngle },
    // Hull left: square
    { id: 's2', shape: 'square', x: 120, y: 200, rotation: 0 as RotationAngle },
    // Hull right: medium triangle
    { id: 's3', shape: 'medium-tri', x: 200, y: 200, rotation: 0 as RotationAngle },
    // Hull tip: small triangle
    { id: 's4', shape: 'small-tri-1', x: 60, y: 200, rotation: 90 as RotationAngle },
  ],
  pieces: ['large-tri-1', 'square', 'medium-tri', 'small-tri-1'],
}

/* ================================================================== */
/*  L2 Puzzles — 5-6 pieces, medium shapes                            */
/* ================================================================== */

/** 小猫 — Cat sitting (side view) */
const CAT: TangramPuzzlePreset = {
  id: 'cat',
  name: { zh: '小猫', en: 'Cat' },
  icon: '🐱',
  outline: `
    M 140 40 L 180 40 L 220 80 L 220 160
    L 300 160 L 300 240 L 220 240 L 220 320
    L 140 320 L 140 240 L 100 240 L 100 160
    L 140 120 Z
  `,
  slots: [
    // Head: medium triangle (ear-like)
    { id: 's1', shape: 'medium-tri', x: 140, y: 40, rotation: 0 as RotationAngle },
    // Body top: large triangle
    { id: 's2', shape: 'large-tri-1', x: 100, y: 80, rotation: 0 as RotationAngle },
    // Body bottom: large triangle 2
    { id: 's3', shape: 'large-tri-2', x: 100, y: 160, rotation: 0 as RotationAngle },
    // Tail: parallelogram
    { id: 's4', shape: 'parallelogram', x: 220, y: 160, rotation: 0 as RotationAngle },
    // Paw: small triangle
    { id: 's5', shape: 'small-tri-1', x: 140, y: 240, rotation: 0 as RotationAngle },
  ],
  pieces: ['medium-tri', 'large-tri-1', 'large-tri-2', 'parallelogram', 'small-tri-1'],
}

/** 天鹅 — Swan */
const SWAN: TangramPuzzlePreset = {
  id: 'swan',
  name: { zh: '天鹅', en: 'Swan' },
  icon: '🦢',
  outline: `
    M 100 60 L 140 60 L 140 140 L 220 140
    L 300 220 L 220 300 L 140 300
    L 60 220 L 60 140 L 100 140 Z
  `,
  slots: [
    // Neck: square (vertical)
    { id: 's1', shape: 'square', x: 100, y: 60, rotation: 0 as RotationAngle },
    // Body left: large triangle
    { id: 's2', shape: 'large-tri-1', x: 60, y: 140, rotation: 0 as RotationAngle },
    // Body right: large triangle 2
    { id: 's3', shape: 'large-tri-2', x: 140, y: 140, rotation: 0 as RotationAngle },
    // Wing: medium triangle
    { id: 's4', shape: 'medium-tri', x: 220, y: 140, rotation: 90 as RotationAngle },
    // Tail: small triangle
    { id: 's5', shape: 'small-tri-1', x: 140, y: 220, rotation: 0 as RotationAngle },
    // Tail 2: small triangle
    { id: 's6', shape: 'small-tri-2', x: 60, y: 220, rotation: 0 as RotationAngle },
  ],
  pieces: ['square', 'large-tri-1', 'large-tri-2', 'medium-tri', 'small-tri-1', 'small-tri-2'],
}

/* ================================================================== */
/*  L3 Puzzles — 7 pieces (full tangram), complex shapes               */
/* ================================================================== */

/** 火箭 — Rocket ship */
const ROCKET: TangramPuzzlePreset = {
  id: 'rocket',
  name: { zh: '火箭', en: 'Rocket' },
  icon: '🚀',
  outline: `
    M 200 20 L 280 120 L 280 200 L 320 280
    L 280 280 L 280 360 L 200 400 L 120 360
    L 120 280 L 80 280 L 120 200 L 120 120 Z
  `,
  slots: [
    // Nose cone: medium triangle
    { id: 's1', shape: 'medium-tri', x: 160, y: 20, rotation: 0 as RotationAngle },
    // Body top left: large triangle 1
    { id: 's2', shape: 'large-tri-1', x: 120, y: 100, rotation: 0 as RotationAngle },
    // Body top right: large triangle 2
    { id: 's3', shape: 'large-tri-2', x: 200, y: 100, rotation: 0 as RotationAngle },
    // Body center: square
    { id: 's4', shape: 'square', x: 160, y: 200, rotation: 0 as RotationAngle },
    // Left fin: small triangle 1
    { id: 's5', shape: 'small-tri-1', x: 80, y: 200, rotation: 270 as RotationAngle },
    // Right fin: small triangle 2
    { id: 's6', shape: 'small-tri-2', x: 280, y: 200, rotation: 90 as RotationAngle },
    // Exhaust: parallelogram
    { id: 's7', shape: 'parallelogram', x: 120, y: 280, rotation: 0 as RotationAngle },
  ],
  pieces: ['medium-tri', 'large-tri-1', 'large-tri-2', 'square', 'small-tri-1', 'small-tri-2', 'parallelogram'],
}

/** 奔跑的人 — Running person */
const RUNNER: TangramPuzzlePreset = {
  id: 'runner',
  name: { zh: '奔跑的人', en: 'Runner' },
  icon: '🏃',
  outline: `
    M 180 20 L 220 20 L 240 60 L 280 60
    L 280 140 L 320 220 L 280 260
    L 220 180 L 200 260 L 160 340
    L 120 300 L 160 220 L 120 140
    L 80 80 L 140 60 Z
  `,
  slots: [
    // Head: small triangle 1
    { id: 's1', shape: 'small-tri-1', x: 160, y: 20, rotation: 0 as RotationAngle },
    // Torso: large triangle 1
    { id: 's2', shape: 'large-tri-1', x: 120, y: 60, rotation: 0 as RotationAngle },
    // Back arm: medium triangle
    { id: 's3', shape: 'medium-tri', x: 80, y: 60, rotation: 270 as RotationAngle },
    // Front arm: parallelogram
    { id: 's4', shape: 'parallelogram', x: 220, y: 60, rotation: 0 as RotationAngle },
    // Hip: square
    { id: 's5', shape: 'square', x: 160, y: 180, rotation: 0 as RotationAngle },
    // Front leg: large triangle 2
    { id: 's6', shape: 'large-tri-2', x: 200, y: 180, rotation: 90 as RotationAngle },
    // Back leg: small triangle 2
    { id: 's7', shape: 'small-tri-2', x: 120, y: 260, rotation: 180 as RotationAngle },
  ],
  pieces: ['small-tri-1', 'large-tri-1', 'medium-tri', 'parallelogram', 'square', 'large-tri-2', 'small-tri-2'],
}

/** 小鱼 — Fish */
const FISH: TangramPuzzlePreset = {
  id: 'fish',
  name: { zh: '小鱼', en: 'Fish' },
  icon: '🐟',
  outline: `
    M 60 200 L 140 120 L 220 120 L 300 60
    L 340 120 L 340 280 L 300 340
    L 220 280 L 140 280 Z
  `,
  slots: [
    // Tail top: small triangle 1
    { id: 's1', shape: 'small-tri-1', x: 60, y: 120, rotation: 0 as RotationAngle },
    // Tail bottom: small triangle 2
    { id: 's2', shape: 'small-tri-2', x: 60, y: 200, rotation: 0 as RotationAngle },
    // Body top: large triangle 1
    { id: 's3', shape: 'large-tri-1', x: 140, y: 120, rotation: 0 as RotationAngle },
    // Body bottom: large triangle 2
    { id: 's4', shape: 'large-tri-2', x: 140, y: 200, rotation: 0 as RotationAngle },
    // Head top: medium triangle
    { id: 's5', shape: 'medium-tri', x: 300, y: 120, rotation: 0 as RotationAngle },
    // Head center: square
    { id: 's6', shape: 'square', x: 260, y: 160, rotation: 0 as RotationAngle },
    // Fin: parallelogram
    { id: 's7', shape: 'parallelogram', x: 220, y: 200, rotation: 0 as RotationAngle },
  ],
  pieces: ['small-tri-1', 'small-tri-2', 'large-tri-1', 'large-tri-2', 'medium-tri', 'square', 'parallelogram'],
}

/* ================================================================== */
/*  Exports                                                            */
/* ================================================================== */

/** All puzzle presets grouped by difficulty level. */
export const PUZZLES_BY_LEVEL: Record<string, TangramPuzzlePreset[]> = {
  L1: [HOUSE, ARROW, BOAT],
  L2: [CAT, SWAN],
  L3: [ROCKET, RUNNER, FISH],
}

/** Get a random puzzle for the given level. */
export function getRandomPuzzle(level: string): TangramPuzzlePreset {
  const puzzles = PUZZLES_BY_LEVEL[level] ?? PUZZLES_BY_LEVEL.L1
  return puzzles[Math.floor(Math.random() * puzzles.length)]
}

/** Get all puzzles flattened. */
export function getAllPuzzles(): TangramPuzzlePreset[] {
  return Object.values(PUZZLES_BY_LEVEL).flat()
}
