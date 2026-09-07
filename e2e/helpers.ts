/**
 * Shared E2E helpers for EurekaCub.
 *
 * Background: commit 05a9878 ("feat: add PuzzleIntro to all 8 renderers") inserted an
 * instructions screen (`src/renderers/common/PuzzleIntro.tsx`) in front of every puzzle's
 * interactive area. The E2E suite was not updated at the time, so every test that expected
 * to land directly on an SVG/canvas began failing with "element not found" even though the
 * page rendered correctly.
 *
 * `dismissPuzzleIntro` clicks through that screen when it is present, and is a no-op
 * otherwise — so it is safe to call unconditionally before asserting on puzzle internals.
 */
import type { Page } from '@playwright/test'

/** Text of the start button rendered by PuzzleIntro (hardcoded, not i18n-driven). */
const START_BUTTON_TEXT = '开始挑战'

/**
 * Dismiss the PuzzleIntro overlay if it is showing.
 *
 * @returns true if an intro screen was dismissed, false if none was present.
 */
export async function dismissPuzzleIntro(page: Page, timeout = 3000): Promise<boolean> {
  const startButton = page.getByRole('button', { name: new RegExp(START_BUTTON_TEXT) })

  try {
    await startButton.waitFor({ state: 'visible', timeout })
  } catch {
    return false // no intro screen on this puzzle — nothing to do
  }

  await startButton.click()
  // The intro unmounts with a Framer Motion transition; wait for it to actually go away
  // instead of racing the animation.
  await startButton.waitFor({ state: 'detached', timeout: 5000 }).catch(() => {})
  return true
}

/**
 * Navigate to a puzzle and get past the intro screen in one step.
 */
export async function gotoPuzzle(page: Page, url: string): Promise<void> {
  await page.goto(url)
  await page.waitForLoadState('networkidle')
  await dismissPuzzleIntro(page)
}
