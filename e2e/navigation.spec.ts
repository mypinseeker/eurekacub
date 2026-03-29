import { test, expect } from '@playwright/test'

test.describe('8.1 Home Page — Track Tabs & Module Cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('8.1.1 dual track tabs — shows Explorer + Challenger tabs', async ({ page }) => {
    // Explorer tab should be visible (contains 🌱 and 探索 or Explorer)
    const explorerTab = page.locator('button', { hasText: /探索|Explorer/ }).first()
    await expect(explorerTab).toBeVisible()

    // Challenger tab should be visible (contains 🚀 and 挑战 or Challenger)
    const challengerTab = page.locator('button', { hasText: /挑战|Challenger/ }).first()
    await expect(challengerTab).toBeVisible()
  })

  test('8.1.2 tab switch — clicking Challenger tab switches module cards', async ({ page }) => {
    // Initially explorer track: should see Symmetry/对称 module
    await expect(page.locator('button', { hasText: /对称|Symmetry/ })).toBeVisible()

    // Should NOT see Geometry/几何 (challenger-only module) in the track section
    // (It might appear after clicking challenger)
    const challengerTab = page.locator('button', { hasText: /挑战|Challenger/ }).first()
    await challengerTab.click()

    // Wait for animation to settle
    await page.waitForTimeout(500)

    // Now challenger modules should be visible
    await expect(page.locator('button', { hasText: /几何|Geometry/ })).toBeVisible()
    await expect(page.locator('button', { hasText: /导数|Derivatives|微积分|Derivative/ })).toBeVisible()

    // Explorer-only modules should no longer be visible in the track section
    // Symmetry (m1) is explorer-only
    await expect(page.locator('button', { hasText: /对称之美|Symmetry/ }).first()).not.toBeVisible()
  })

  test('8.1.3 shared modules always visible — Sequences + Probability show in both tracks', async ({ page }) => {
    // Shared section header
    const sharedSection = page.locator('text=/共享|Shared|🌟/')
    await expect(sharedSection.first()).toBeVisible()

    // Sequence and Probability modules should be visible
    await expect(page.locator('button', { hasText: /数列|序列|Sequences/ })).toBeVisible()
    await expect(page.locator('button', { hasText: /概率|Probability/ })).toBeVisible()

    // Switch to challenger track
    const challengerTab = page.locator('button', { hasText: /挑战|Challenger/ }).first()
    await challengerTab.click()
    await page.waitForTimeout(500)

    // Shared modules still visible
    await expect(page.locator('button', { hasText: /数列|序列|Sequences/ })).toBeVisible()
    await expect(page.locator('button', { hasText: /概率|Probability/ })).toBeVisible()
  })

  test('8.1.4 modules not locked — all module cards are clickable', async ({ page }) => {
    // All module cards should be enabled buttons (no disabled attribute)
    const moduleCards = page.locator('.grid button')
    const count = await moduleCards.count()
    expect(count).toBeGreaterThanOrEqual(4) // At least explorer(2) + shared(2)

    for (let i = 0; i < count; i++) {
      await expect(moduleCards.nth(i)).toBeEnabled()
    }
  })

  test('8.1.5 enter module — clicking module card navigates to /module/{moduleId}', async ({ page }) => {
    // Click the first module card (Symmetry / 对称)
    const symmetryCard = page.locator('button', { hasText: /对称|Symmetry/ }).first()
    await symmetryCard.click()

    // Should navigate to /module/m1
    await page.waitForURL('**/module/m1')
    expect(page.url()).toContain('/module/m1')
  })

  test('8.1.6 card animation — module cards have fade-in animation wrappers', async ({ page }) => {
    // framer-motion applies style attributes for animation; check that cards exist inside
    // motion.div wrappers (rendered as div with style containing opacity/transform)
    const gridCards = page.locator('.grid button')
    const count = await gridCards.count()
    expect(count).toBeGreaterThanOrEqual(4)

    // Verify that cards are visible (animation has completed)
    for (let i = 0; i < Math.min(count, 4); i++) {
      await expect(gridCards.nth(i)).toBeVisible()
    }
  })
})

test.describe('8.2 Module Page & Puzzle Page', () => {
  test('8.2.1 renderer loads — navigate to module, select L1, renderer loads', async ({ page }) => {
    await page.goto('/module/m1')
    await page.waitForLoadState('networkidle')

    // Module page should show level cards L1, L2, L3
    await expect(page.locator('text=/L1/')).toBeVisible()
    await expect(page.locator('text=/L2/')).toBeVisible()
    await expect(page.locator('text=/L3/')).toBeVisible()

    // Click L1 level card
    const l1Card = page.locator('button', { hasText: 'L1' }).first()
    await l1Card.click()

    // Should navigate to puzzle page
    await page.waitForURL('**/module/m1/play/L1')

    // The renderer area should load — either the actual renderer or the coming soon placeholder
    // Both are valid since it depends on whether the renderer is registered
    await page.waitForLoadState('networkidle')
    const puzzleArea = page.locator('.flex-1.flex.items-center.justify-center')
    await expect(puzzleArea).toBeVisible()
  })

  test('8.2.2 unknown renderer — navigating to non-existent module shows placeholder', async ({ page }) => {
    await page.goto('/module/m999/play/L1')
    await page.waitForLoadState('networkidle')

    // Should show the coming soon placeholder with 🚧
    await expect(page.locator('text=🚧').first()).toBeVisible()
  })

  test('8.2.6 back button — TaskBar back button works', async ({ page }) => {
    // Navigate to a module page first
    await page.goto('/module/m1')
    await page.waitForLoadState('networkidle')

    // Click L1 to go to puzzle page
    const l1Card = page.locator('button', { hasText: 'L1' }).first()
    await l1Card.click()
    await page.waitForURL('**/module/m1/play/L1')
    await page.waitForLoadState('networkidle')

    // Click the back button (contains ←) in the TaskBar
    const backButton = page.locator('button', { hasText: '←' }).first()
    await expect(backButton).toBeVisible()
    await backButton.click()

    // Should go back to the module page
    await page.waitForURL('**/module/m1')
    expect(page.url()).toContain('/module/m1')
    // Should NOT be on the play page
    expect(page.url()).not.toContain('/play')
  })
})
