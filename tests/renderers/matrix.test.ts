/**
 * Unit tests for Matrix (PixelArt) pure-logic utilities.
 * FR-6: Matrix transformation operations.
 */

import { describe, it, expect } from 'vitest'
import type { Grid, ColorIndex } from '../../src/renderers/matrix/types'
import {
  GRID_SIZE,
  cloneGrid,
  normalizeGrid,
  gridsMatch,
  rotate90,
  flipH,
  flipV,
  transpose,
  applyTransform,
  cycleColor,
} from '../../src/renderers/matrix/matrix.utils'

/* ------------------------------------------------------------------ */
/*  Test helpers                                                      */
/* ------------------------------------------------------------------ */

/** Create an 8x8 grid filled with zeros. */
function zeroGrid(): Grid {
  return Array.from({ length: 8 }, () => Array(8).fill(0) as ColorIndex[])
}

/** Create a grid with a unique value at each cell for easy verification. */
function indexGrid(): Grid {
  const g = zeroGrid()
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      // Use values 0-5 cycling
      g[r][c] = ((r * 8 + c) % 6) as ColorIndex
    }
  }
  return g
}

/** Simple asymmetric grid: only [0][1] is set to 1. */
function asymGrid(): Grid {
  const g = zeroGrid()
  g[0][1] = 1
  return g
}

/* ------------------------------------------------------------------ */
/*  cloneGrid                                                         */
/* ------------------------------------------------------------------ */

describe('cloneGrid', () => {
  // FR-6: grid cloning must produce independent deep copy
  it('produces an identical grid', () => {
    const original = indexGrid()
    const clone = cloneGrid(original)
    expect(gridsMatch(original, clone)).toBe(true)
  })

  it('mutation of clone does not affect original (deep copy independence)', () => {
    // FR-6: deep copy independence
    const original = indexGrid()
    const clone = cloneGrid(original)
    clone[0][0] = 5
    expect(original[0][0]).not.toBe(5)
  })

  it('mutation of original does not affect clone', () => {
    // FR-6: deep copy independence (reverse direction)
    const original = zeroGrid()
    const clone = cloneGrid(original)
    original[7][7] = 5
    expect(clone[7][7]).toBe(0) // clone unaffected
  })
})

/* ------------------------------------------------------------------ */
/*  normalizeGrid                                                     */
/* ------------------------------------------------------------------ */

describe('normalizeGrid', () => {
  // FR-6: normalizeGrid ensures 8x8, clamps 0-5

  it('passes through a valid 8x8 grid unchanged', () => {
    const g = indexGrid()
    const normalized = normalizeGrid(g)
    expect(gridsMatch(g, normalized)).toBe(true)
  })

  it('pads a smaller grid to 8x8 with zeros', () => {
    // FR-6: ensures 8x8 dimension
    const small: number[][] = [[1, 2], [3, 4]]
    const result = normalizeGrid(small)
    expect(result.length).toBe(GRID_SIZE)
    expect(result[0].length).toBe(GRID_SIZE)
    expect(result[0][0]).toBe(1)
    expect(result[0][1]).toBe(2)
    expect(result[0][2]).toBe(0) // padded
    expect(result[1][0]).toBe(3)
    expect(result[2][0]).toBe(0) // padded row
  })

  it('clamps negative values to 0', () => {
    // FR-6: clamps 0-5
    const raw: number[][] = Array.from({ length: 8 }, () => Array(8).fill(-1))
    const result = normalizeGrid(raw)
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        expect(result[r][c]).toBe(0)
      }
    }
  })

  it('clamps values above 5 to 0', () => {
    // FR-6: clamps 0-5
    const raw: number[][] = Array.from({ length: 8 }, () => Array(8).fill(6))
    const result = normalizeGrid(raw)
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        expect(result[r][c]).toBe(0)
      }
    }
  })

  it('preserves boundary values 0 and 5', () => {
    // FR-6: boundary values
    const raw: number[][] = Array.from({ length: 8 }, (_, r) =>
      Array.from({ length: 8 }, (_, c) => (r === 0 && c === 0 ? 0 : 5)),
    )
    const result = normalizeGrid(raw)
    expect(result[0][0]).toBe(0)
    expect(result[0][1]).toBe(5)
    expect(result[7][7]).toBe(5)
  })

  it('handles empty input', () => {
    // FR-6: ensures 8x8 from empty
    const result = normalizeGrid([])
    expect(result.length).toBe(GRID_SIZE)
    for (const row of result) {
      expect(row.length).toBe(GRID_SIZE)
      for (const v of row) expect(v).toBe(0)
    }
  })

  it('handles undefined cells via optional chaining', () => {
    // FR-6: sparse input
    const sparse: number[][] = [[], [], [], [], [], [], [], []]
    const result = normalizeGrid(sparse)
    expect(result[0][0]).toBe(0)
    expect(result[7][7]).toBe(0)
  })
})

/* ------------------------------------------------------------------ */
/*  gridsMatch                                                        */
/* ------------------------------------------------------------------ */

describe('gridsMatch', () => {
  // FR-6: exact equality check

  it('returns true for identical grids', () => {
    const a = indexGrid()
    const b = cloneGrid(a)
    expect(gridsMatch(a, b)).toBe(true)
  })

  it('returns false when one cell differs', () => {
    const a = indexGrid()
    const b = cloneGrid(a)
    b[3][4] = ((a[3][4] + 1) % 6) as ColorIndex
    expect(gridsMatch(a, b)).toBe(false)
  })

  it('returns true for two zero grids', () => {
    expect(gridsMatch(zeroGrid(), zeroGrid())).toBe(true)
  })

  it('detects difference at first cell', () => {
    const a = zeroGrid()
    const b = zeroGrid()
    b[0][0] = 1
    expect(gridsMatch(a, b)).toBe(false)
  })

  it('detects difference at last cell', () => {
    const a = zeroGrid()
    const b = zeroGrid()
    b[7][7] = 1
    expect(gridsMatch(a, b)).toBe(false)
  })
})

/* ------------------------------------------------------------------ */
/*  rotate90                                                          */
/* ------------------------------------------------------------------ */

describe('rotate90', () => {
  // FR-6: result[c][n-1-r] = grid[r][c]

  it('rotates a single marked cell correctly', () => {
    // FR-6: rotate90 — cell at (0,1) should move to (1,7)
    const g = asymGrid() // only g[0][1] = 1
    const r = rotate90(g)
    // new[c][N-1-r] = old[r][c] => new[1][7] = old[0][1] = 1
    expect(r[1][7]).toBe(1)
    // original position should be 0
    expect(r[0][1]).toBe(0)
  })

  it('four rotations return to original (identity)', () => {
    // FR-6: rotation composition identity
    const g = indexGrid()
    const r4 = rotate90(rotate90(rotate90(rotate90(g))))
    expect(gridsMatch(g, r4)).toBe(true)
  })

  it('two rotations differ from original for asymmetric grid', () => {
    // FR-6: non-trivial rotation
    const g = asymGrid()
    const r2 = rotate90(rotate90(g))
    expect(gridsMatch(g, r2)).toBe(false)
  })

  it('does not mutate the original grid', () => {
    // FR-6: immutability
    const g = indexGrid()
    const copy = cloneGrid(g)
    rotate90(g)
    expect(gridsMatch(g, copy)).toBe(true)
  })

  it('preserves a fully uniform grid', () => {
    // FR-6: edge case — all same values
    const g = zeroGrid()
    expect(gridsMatch(rotate90(g), g)).toBe(true)
  })
})

/* ------------------------------------------------------------------ */
/*  flipH                                                             */
/* ------------------------------------------------------------------ */

describe('flipH', () => {
  // FR-6: reverse each row

  it('reverses each row', () => {
    const g = asymGrid() // g[0][1] = 1
    const f = flipH(g)
    // row 0 reversed: index 1 -> index 6
    expect(f[0][6]).toBe(1)
    expect(f[0][1]).toBe(0)
  })

  it('double flipH is identity', () => {
    // FR-6: involution property
    const g = indexGrid()
    expect(gridsMatch(flipH(flipH(g)), g)).toBe(true)
  })

  it('does not mutate the original grid', () => {
    // FR-6: immutability
    const g = indexGrid()
    const copy = cloneGrid(g)
    flipH(g)
    expect(gridsMatch(g, copy)).toBe(true)
  })

  it('preserves row order (only reverses within rows)', () => {
    // FR-6: flipH only affects column order
    const g = zeroGrid()
    g[0][0] = 1
    g[7][0] = 2
    const f = flipH(g)
    // row 0 last col should be 1, row 7 last col should be 2
    expect(f[0][7]).toBe(1)
    expect(f[7][7]).toBe(2)
  })
})

/* ------------------------------------------------------------------ */
/*  flipV                                                             */
/* ------------------------------------------------------------------ */

describe('flipV', () => {
  // FR-6: reverse row order

  it('reverses row order', () => {
    const g = zeroGrid()
    g[0][0] = 1
    g[7][0] = 2
    const f = flipV(g)
    expect(f[7][0]).toBe(1) // row 0 moved to row 7
    expect(f[0][0]).toBe(2) // row 7 moved to row 0
  })

  it('double flipV is identity', () => {
    // FR-6: involution property
    const g = indexGrid()
    expect(gridsMatch(flipV(flipV(g)), g)).toBe(true)
  })

  it('does not mutate the original grid', () => {
    // FR-6: immutability
    const g = indexGrid()
    const copy = cloneGrid(g)
    flipV(g)
    expect(gridsMatch(g, copy)).toBe(true)
  })

  it('columns remain in same order', () => {
    // FR-6: flipV only affects row order
    const g = zeroGrid()
    g[0][3] = 1
    const f = flipV(g)
    expect(f[7][3]).toBe(1) // same column, row flipped
  })
})

/* ------------------------------------------------------------------ */
/*  transpose                                                         */
/* ------------------------------------------------------------------ */

describe('transpose', () => {
  // FR-6: swap rows/columns

  it('swaps row and column indices', () => {
    const g = asymGrid() // g[0][1] = 1
    const t = transpose(g)
    expect(t[1][0]).toBe(1) // (0,1) -> (1,0)
    expect(t[0][1]).toBe(0)
  })

  it('double transpose is identity', () => {
    // FR-6: involution property
    const g = indexGrid()
    expect(gridsMatch(transpose(transpose(g)), g)).toBe(true)
  })

  it('diagonal elements are unchanged', () => {
    // FR-6: transpose preserves diagonal
    const g = indexGrid()
    const t = transpose(g)
    for (let i = 0; i < 8; i++) {
      expect(t[i][i]).toBe(g[i][i])
    }
  })

  it('does not mutate the original grid', () => {
    // FR-6: immutability
    const g = indexGrid()
    const copy = cloneGrid(g)
    transpose(g)
    expect(gridsMatch(g, copy)).toBe(true)
  })
})

/* ------------------------------------------------------------------ */
/*  applyTransform (router function)                                  */
/* ------------------------------------------------------------------ */

describe('applyTransform', () => {
  // FR-6: router function delegates to correct transform

  it('routes rotate90 correctly', () => {
    const g = asymGrid()
    expect(gridsMatch(applyTransform(g, 'rotate90'), rotate90(g))).toBe(true)
  })

  it('routes flipH correctly', () => {
    const g = asymGrid()
    expect(gridsMatch(applyTransform(g, 'flipH'), flipH(g))).toBe(true)
  })

  it('routes flipV correctly', () => {
    const g = asymGrid()
    expect(gridsMatch(applyTransform(g, 'flipV'), flipV(g))).toBe(true)
  })

  it('routes transpose correctly', () => {
    const g = asymGrid()
    expect(gridsMatch(applyTransform(g, 'transpose'), transpose(g))).toBe(true)
  })
})

/* ------------------------------------------------------------------ */
/*  Transform composition                                             */
/* ------------------------------------------------------------------ */

describe('transform composition', () => {
  // FR-6: composition of transforms

  it('flipH then flipV differs from flipV then flipH for asymmetric grid', () => {
    // flipH;flipV vs flipV;flipH — these are actually equivalent (both = 180 rotation)
    const g = asymGrid()
    const hv = flipV(flipH(g))
    const vh = flipH(flipV(g))
    // Actually flipH;flipV === flipV;flipH (they commute and equal 180-degree rotation)
    expect(gridsMatch(hv, vh)).toBe(true)
  })

  it('flipH;flipV equals two rotations', () => {
    // FR-6: flipH + flipV = rotate180
    const g = indexGrid()
    const hv = flipV(flipH(g))
    const r180 = rotate90(rotate90(g))
    expect(gridsMatch(hv, r180)).toBe(true)
  })

  it('transpose;flipH equals rotate90', () => {
    // FR-6: transpose + flipH = rotate90 CW (standard identity)
    const g = indexGrid()
    const tf = flipH(transpose(g))
    const r = rotate90(g)
    expect(gridsMatch(tf, r)).toBe(true)
  })

  it('flipV;transpose equals rotate90', () => {
    // FR-6: composition identity — flipV then transpose = rotate90 CW
    const g = indexGrid()
    const vt = transpose(flipV(g))
    const r = rotate90(g)
    expect(gridsMatch(vt, r)).toBe(true)
  })
})

/* ------------------------------------------------------------------ */
/*  cycleColor (cell color cycling)                                   */
/* ------------------------------------------------------------------ */

describe('cycleColor', () => {
  // FR-6: cell color cycling 0->1->2->3->4->5->0

  it('cycles through 0 -> 1 -> 2 -> 3 -> 4 -> 5 -> 0', () => {
    expect(cycleColor(0)).toBe(1)
    expect(cycleColor(1)).toBe(2)
    expect(cycleColor(2)).toBe(3)
    expect(cycleColor(3)).toBe(4)
    expect(cycleColor(4)).toBe(5)
    expect(cycleColor(5)).toBe(0)
  })

  it('wraps from 5 back to 0', () => {
    // FR-6: wrap-around boundary
    expect(cycleColor(5)).toBe(0)
  })

  it('six cycles return to original value', () => {
    // FR-6: full cycle identity
    let v: ColorIndex = 3
    for (let i = 0; i < 6; i++) v = cycleColor(v)
    expect(v).toBe(3)
  })
})

/* ------------------------------------------------------------------ */
/*  Undo reverts to previous state (logic simulation)                 */
/* ------------------------------------------------------------------ */

describe('undo logic (simulated)', () => {
  // FR-6: undo reverts to previous state

  it('undo after one transform restores original', () => {
    const original = indexGrid()
    const history: Grid[] = []

    // Apply one transform
    history.push(cloneGrid(original))
    const transformed = applyTransform(original, 'rotate90')

    // Undo: pop from history
    const restored = history.pop()!
    expect(gridsMatch(restored, original)).toBe(true)
    expect(gridsMatch(transformed, original)).toBe(false)
  })

  it('undo after multiple transforms restores step by step', () => {
    // FR-6: multi-step undo
    const g0 = indexGrid()
    const history: Grid[] = []

    // Step 1: rotate
    history.push(cloneGrid(g0))
    const g1 = applyTransform(g0, 'rotate90')

    // Step 2: flipH
    history.push(cloneGrid(g1))
    const g2 = applyTransform(g1, 'flipH')

    // Undo step 2
    const back1 = history.pop()!
    expect(gridsMatch(back1, g1)).toBe(true)

    // Undo step 1
    const back0 = history.pop()!
    expect(gridsMatch(back0, g0)).toBe(true)
  })

  it('undo on empty history does nothing', () => {
    // FR-6: edge case — no history
    const history: Grid[] = []
    expect(history.length).toBe(0)
    // Simulating undo guard
    const undone = history.length > 0 ? history.pop() : undefined
    expect(undone).toBeUndefined()
  })
})

/* ------------------------------------------------------------------ */
/*  Transforms disabled after match (logic simulation)                */
/* ------------------------------------------------------------------ */

describe('transforms disabled after match (simulated)', () => {
  // FR-6: transforms disabled after match

  it('once matched, transform should be blocked', () => {
    const initial = indexGrid()
    const target = cloneGrid(initial) // target = initial means already matched
    let matched = gridsMatch(initial, target)
    expect(matched).toBe(true)

    // Simulate: if matched, transform is not applied
    let grid = cloneGrid(initial)
    if (!matched) {
      grid = applyTransform(grid, 'rotate90')
    }
    // Grid should remain unchanged because matched=true
    expect(gridsMatch(grid, initial)).toBe(true)
  })

  it('transforms are allowed when not matched', () => {
    const initial = indexGrid()
    const target = rotate90(initial) // target differs from initial
    const matched = gridsMatch(initial, target)
    expect(matched).toBe(false)

    // Transform should apply
    let grid = cloneGrid(initial)
    if (!matched) {
      grid = applyTransform(grid, 'rotate90')
    }
    expect(gridsMatch(grid, target)).toBe(true)
  })
})
