/**
 * E2E for PRD-content-gaps FR-1 (fraction L4 "same amount") and FR-2 (symmetry L4 translate,
 * L5 rotate), in a real browser.
 *
 * Assertions read widget state from data-* attributes (phase / solved / shaded), not styling —
 * see commit 4fbca71 for why. Every "it works" check has a "wrong input does not work" control
 * beside it, so a detector that always says yes would fail here.
 *
 * Level data is imported from the real config, so these tests play whatever the app ships.
 */
import { test, expect, type Page, type Locator } from '@playwright/test'
import { gotoPuzzle } from './helpers'
import { PUZZLE_CONFIGS } from '../src/pages/puzzleConfigs'

type EqRound = { given: [number, number]; cutInto: number }
type TfRound = { targetPoints: number[][][]; vector?: [number, number]; rotationalOrder?: number }

const FRACTION_L4 = PUZZLE_CONFIGS.fraction.L4 as { rounds: EqRound[] }
const SYMMETRY_L4 = PUZZLE_CONFIGS.symmetry.L4 as { rounds: TfRound[] }
const SYMMETRY_L5 = PUZZLE_CONFIGS.symmetry.L5 as { rounds: TfRound[] }

/*
 * Flight recorder: a failing test prints every console.error and main-frame navigation.
 *
 * It found the cause of two flaky failures on 2026-09-10. Each time, the game had unmounted and
 * the intro screen was back, because the page had reloaded. Rewriting an existing repo document
 * while this suite runs against the dev server reloads the page under test, even with the same
 * bytes (reproduced 2/2; 0 with no change; 0 for new files). Both reloads matched a doc write to
 * within ~40 ms. Vite's log shows nothing. So: don't edit repo files while E2E runs. The shipped
 * build has no HMR client and is not affected.
 */
let pageEvents: string[] = []
test.beforeEach(async ({ page }) => {
  pageEvents = []
  const t0 = Date.now()
  const at = () => `+${Date.now() - t0}ms`
  page.on('console', (m) => { if (m.type() === 'error') pageEvents.push(`${at()} console.error: ${m.text()}`) })
  page.on('framenavigated', (f) => { if (f === page.mainFrame()) pageEvents.push(`${at()} navigated: ${f.url()}`) })
})
test.afterEach(async ({ page }, info) => {
  if (info.status !== info.expectedStatus) {
    const lines = [...pageEvents, `final url: ${page.url()}`]
    console.log(`[page events] ${info.title}\n  ${lines.join('\n  ')}`)
  }
})

/** Collect uncaught page errors so each test can assert there were none. */
function watchErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  return errors
}

/* ── Fraction L4 ─────────────────────────────────────────────── */

// Must match PizzaEquivalence.tsx.
const VIEW_W = 840
const VIEW_H = 440
const R = 170
const RIGHT_CX = 630
const CY = 220
const TOP = -Math.PI / 2

async function tapView(page: Page, svg: Locator, vx: number, vy: number) {
  const b = (await svg.boundingBox())!
  await page.mouse.click(b.x + (vx / VIEW_W) * b.width, b.y + (vy / VIEW_H) * b.height)
}

/** Cut the right pizza into `n` even slices, the way the dashed guides suggest. */
async function cutEvenly(page: Page, svg: Locator, n: number) {
  for (let i = 0; i < n; i++) {
    const a = TOP + (i * Math.PI * 2) / n
    await tapView(page, svg, RIGHT_CX + Math.cos(a) * R * 0.9, CY + Math.sin(a) * R * 0.9)
  }
}

/** Tap the middle of slice `i` of an `n`-way cut that starts at 12 o'clock. */
async function tapSlice(page: Page, svg: Locator, n: number, i: number) {
  const mid = TOP + ((i + 0.5) * Math.PI * 2) / n
  await tapView(page, svg, RIGHT_CX + Math.cos(mid) * R * 0.5, CY + Math.sin(mid) * R * 0.5)
}

test.describe('CG-FR-1 fraction L4 — same amount', () => {
  test('the module page shows an L4 card, and only fraction/symmetry gained levels', async ({ page }) => {
    await page.goto('/module/m2')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('button', { hasText: 'L4' })).toBeVisible()
    await expect(page.locator('button', { hasText: 'L5' })).toHaveCount(0)

    // Negative control: a module with no new mode still has exactly three cards.
    await page.goto('/module/m5')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('button', { hasText: 'L3' })).toBeVisible()
    await expect(page.locator('button', { hasText: 'L4' })).toHaveCount(0)
  })

  test('uneven cuts are rejected and the round resets', async ({ page }) => {
    const errors = watchErrors(page)
    await gotoPuzzle(page, '/module/m2/play/L4')
    const game = page.getByTestId('pizza-equivalence')
    const svg = game.locator('svg')
    const n = FRACTION_L4.rounds[0].cutInto

    // All cuts bunched into one quarter of the pizza.
    for (let i = 0; i < n; i++) {
      const a = TOP + i * 0.2
      await tapView(page, svg, RIGHT_CX + Math.cos(a) * R * 0.9, CY + Math.sin(a) * R * 0.9)
    }
    await expect(game).toHaveAttribute('data-phase', 'cut')
    await expect(game.getByText(`0 / ${n}`)).toBeVisible({ timeout: 3000 })
    expect(errors).toEqual([])
  })

  test('the wrong amount is nudged, the right amount wins, and the overlay proves it', async ({ page }) => {
    const errors = watchErrors(page)
    await gotoPuzzle(page, '/module/m2/play/L4')
    const game = page.getByTestId('pizza-equivalence')
    const svg = game.locator('svg')
    const r0 = FRACTION_L4.rounds[0]
    const answer = (r0.given[0] * r0.cutInto) / r0.given[1]

    await cutEvenly(page, svg, r0.cutInto)
    await expect(game).toHaveAttribute('data-phase', 'shade')

    // Negative control: one slice too few.
    for (let i = 0; i < answer - 1; i++) await tapSlice(page, svg, r0.cutInto, i)
    await expect(game).toHaveAttribute('data-shaded', String(answer - 1))
    await page.getByTestId('equivalence-done').click()
    await expect(page.getByTestId('equivalence-nudge')).toBeVisible()
    await expect(game).toHaveAttribute('data-phase', 'shade')
    await expect(game).toHaveAttribute('data-solved', '0')

    // The right amount.
    await tapSlice(page, svg, r0.cutInto, answer - 1)
    await expect(game).toHaveAttribute('data-shaded', String(answer))
    await page.getByTestId('equivalence-done').click()
    await expect(game).toHaveAttribute('data-phase', 'done')
    await expect(game).toHaveAttribute('data-solved', '1')
    await expect(page.getByTestId('equivalence-overlay')).toBeAttached()
    expect(errors).toEqual([])
  })

  test('all three rounds can be played through to completion', async ({ page }) => {
    const errors = watchErrors(page)
    await gotoPuzzle(page, '/module/m2/play/L4')
    const game = page.getByTestId('pizza-equivalence')
    const svg = game.locator('svg')

    for (const [idx, r] of FRACTION_L4.rounds.entries()) {
      await expect(game).toHaveAttribute('data-round', String(idx))
      await cutEvenly(page, svg, r.cutInto)
      await expect(game).toHaveAttribute('data-phase', 'shade')
      const answer = (r.given[0] * r.cutInto) / r.given[1]
      for (let i = 0; i < answer; i++) await tapSlice(page, svg, r.cutInto, i)
      await page.getByTestId('equivalence-done').click()
      await expect(game).toHaveAttribute('data-solved', String(idx + 1))
      if (idx < FRACTION_L4.rounds.length - 1) await page.getByTestId('equivalence-next').click()
      // Regression: the Aha popup from the first success is still over the pizza when round 2
      // starts. It used to swallow those cuts (3 of 6 lost), so assert it is really there.
      if (idx === 0) await expect(page.getByTestId('aha-popup')).toBeVisible()
    }

    // onComplete → PuzzlePage returns to the module page.
    await page.waitForURL('**/module/m2', { timeout: 10_000 })
    expect(errors).toEqual([])
  })
})

/* ── Symmetry L4 / L5 ────────────────────────────────────────── */

/** Map normalised points onto the canvas's largest centred square (must match toFrame). */
async function framePoints(canvas: Locator, pts: number[][]): Promise<Array<{ x: number; y: number }>> {
  const b = (await canvas.boundingBox())!
  const s = Math.min(b.width, b.height)
  return pts.map(([nx, ny]) => ({ x: b.x + b.width / 2 + (nx - 0.5) * s, y: b.y + b.height / 2 + (ny - 0.5) * s }))
}

/** Draw one continuous stroke through the given page points, like a finger would. */
async function drawStroke(page: Page, pts: Array<{ x: number; y: number }>) {
  await page.mouse.move(pts[0].x, pts[0].y)
  await page.mouse.down()
  for (const p of pts.slice(1)) await page.mouse.move(p.x, p.y, { steps: 10 })
  await page.mouse.up()
}

const shift = (poly: number[][], v: [number, number]) => poly.map(([x, y]) => [x + v[0], y + v[1]])

test.describe('CG-FR-2 symmetry L4 (translate) and L5 (rotate)', () => {
  test('the module page shows L4 and L5 cards', async ({ page }) => {
    await page.goto('/module/m1')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('button', { hasText: 'L4' })).toBeVisible()
    await expect(page.locator('button', { hasText: 'L5' })).toBeVisible()
  })

  test('translate: tracing the original does not win; drawing it where the arrow points does', async ({ page }) => {
    const errors = watchErrors(page)
    await gotoPuzzle(page, '/module/m1/play/L4')
    const game = page.getByTestId('transform-canvas')
    await expect(game).toHaveAttribute('data-mode', 'translate')
    const canvas = game.locator('canvas')
    const r0 = SYMMETRY_L4.rounds[0]

    // Negative control: trace the blue shape in place.
    for (const poly of r0.targetPoints) await drawStroke(page, await framePoints(canvas, poly))
    await page.waitForTimeout(600)
    await expect(game).toHaveAttribute('data-solved', '0')
    await game.getByRole('button', { name: /Clear/ }).click()

    // Draw it at the destination.
    for (const poly of r0.targetPoints) await drawStroke(page, await framePoints(canvas, shift(poly, r0.vector!)))
    await expect(game).toHaveAttribute('data-solved', '1', { timeout: 3000 })
    expect(errors).toEqual([])
  })

  test('rotate: a stray scribble does not win; tracing one blade does', async ({ page }) => {
    const errors = watchErrors(page)
    await gotoPuzzle(page, '/module/m1/play/L5')
    const game = page.getByTestId('transform-canvas')
    await expect(game).toHaveAttribute('data-mode', 'rotate')
    const canvas = game.locator('canvas')
    const r0 = SYMMETRY_L5.rounds[0]

    // Negative control: a scribble in a corner, far from every blade.
    await drawStroke(page, await framePoints(canvas, [[0.04, 0.9], [0.14, 0.96], [0.2, 0.9]]))
    await page.waitForTimeout(600)
    await expect(game).toHaveAttribute('data-solved', '0')
    await game.getByRole('button', { name: /Clear/ }).click()

    // One blade; the board supplies the turned copy.
    for (const poly of r0.targetPoints) await drawStroke(page, await framePoints(canvas, poly))
    await expect(game).toHaveAttribute('data-solved', '1', { timeout: 3000 })
    expect(errors).toEqual([])
  })

  /** Play every round of a translate/rotate level, then expect the page to return to m1. */
  async function playWholeLevel(page: Page, url: string, rounds: TfRound[], strokesFor: (r: TfRound) => number[][][]) {
    const errors = watchErrors(page)
    await gotoPuzzle(page, url)
    const game = page.getByTestId('transform-canvas')
    const canvas = game.locator('canvas')
    for (const [idx, r] of rounds.entries()) {
      // Regression: round 2 starts while the first success's Aha popup still covers the middle
      // of the board. Assert it is there, so these strokes prove taps now pass through it.
      if (idx === 1) await expect(page.getByTestId('aha-popup')).toBeVisible()
      for (const poly of strokesFor(r)) await drawStroke(page, await framePoints(canvas, poly))
      await expect(game).toHaveAttribute('data-solved', String(idx + 1), { timeout: 3000 })
      await page.waitForTimeout(1700) // the celebration clears the board before the next round
    }
    await page.waitForURL('**/module/m1', { timeout: 10_000 })
    expect(errors).toEqual([])
  }

  test('translate: every round can be played through to completion', async ({ page }) => {
    await playWholeLevel(page, '/module/m1/play/L4', SYMMETRY_L4.rounds, (r) =>
      r.targetPoints.map((poly) => shift(poly, r.vector!)),
    )
  })

  test('rotate: every round (orders 2, 3, 4) can be played through to completion', async ({ page }) => {
    await playWholeLevel(page, '/module/m1/play/L5', SYMMETRY_L5.rounds, (r) => r.targetPoints)
  })

  test('the mirror levels still mount the mirror game, not the new one', async ({ page }) => {
    await gotoPuzzle(page, '/module/m1/play/L1')
    await expect(page.locator('canvas')).toBeVisible()
    await expect(page.getByTestId('transform-canvas')).toHaveCount(0)
  })
})
