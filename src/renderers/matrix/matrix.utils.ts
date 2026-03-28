/**
 * Pure-logic utility functions for the Matrix PixelArt renderer.
 *
 * Extracted from PixelArt.tsx so they can be unit-tested independently.
 * FR-6: Matrix transformation operations.
 */

import type { Grid, ColorIndex, Transform } from './types'

export const GRID_SIZE = 8

/** Deep-clone an 8x8 grid. */
export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => [...row])
}

/** Validate and clamp a raw number[][] into a proper Grid. */
export function normalizeGrid(raw: number[][]): Grid {
  const grid: Grid = []
  for (let r = 0; r < GRID_SIZE; r++) {
    const row: ColorIndex[] = []
    for (let c = 0; c < GRID_SIZE; c++) {
      const v = raw[r]?.[c] ?? 0
      row.push((v >= 0 && v <= 5 ? v : 0) as ColorIndex)
    }
    grid.push(row)
  }
  return grid
}

/** Check if two grids are identical. */
export function gridsMatch(a: Grid, b: Grid): boolean {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (a[r][c] !== b[r][c]) return false
    }
  }
  return true
}

/** Rotate grid 90 degrees clockwise: new[c][N-1-r] = old[r][c]. */
export function rotate90(grid: Grid): Grid {
  const result = cloneGrid(grid)
  const n = GRID_SIZE
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      result[c][n - 1 - r] = grid[r][c]
    }
  }
  return result
}

/** Flip horizontally: reverse each row. */
export function flipH(grid: Grid): Grid {
  return grid.map((row) => [...row].reverse()) as Grid
}

/** Flip vertically: reverse row order. */
export function flipV(grid: Grid): Grid {
  return [...grid].reverse() as Grid
}

/** Transpose: swap rows and columns. */
export function transpose(grid: Grid): Grid {
  const result = cloneGrid(grid)
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      result[c][r] = grid[r][c]
    }
  }
  return result
}

/** Apply a named transform to a grid. */
export function applyTransform(grid: Grid, transform: Transform): Grid {
  switch (transform) {
    case 'rotate90':
      return rotate90(grid)
    case 'flipH':
      return flipH(grid)
    case 'flipV':
      return flipV(grid)
    case 'transpose':
      return transpose(grid)
  }
}

/** Cycle a cell color index: 0 -> 1 -> 2 -> 3 -> 4 -> 5 -> 0. */
export function cycleColor(current: ColorIndex): ColorIndex {
  return ((current + 1) % 6) as ColorIndex
}
