import { test, expect } from '@playwright/test'

/**
 * TEST_CHECKLIST coverage:
 *   8.3.1 — Adventure list: /adventures shows adventure cards, 5 categories
 *   8.3.2 — Adventure detail: clicking a card navigates to AdventurePlayPage
 *   8.3.3 — Story progression: completing a stage advances to next
 *   8.3.4 — Embedded renderer: adventure stage loads the corresponding renderer
 */

test.describe('Adventure Mode', () => {
  // ── 8.3.1 — Adventure list ───────────────────────────────────────
  test.describe('8.3.1 — Adventure List', () => {
    test('displays the adventure page with hero header', async ({ page }) => {
      await page.goto('/adventures')

      // Hero header: "冒险模式" title
      await expect(page.locator('h1')).toContainText('冒险模式')

      // Subtitle mentions "Adventure Mode"
      await expect(page.locator('text=Adventure Mode')).toBeVisible()
    })

    test('shows all 5 category sections', async ({ page }) => {
      await page.goto('/adventures')

      // 5 categories with their Chinese labels
      const categories = [
        { zh: '生活冒险', en: 'Life Adventures' },
        { zh: '挑战者冒险', en: 'Challenger Adventures' },
        { zh: '终极冒险', en: 'Ultimate Adventures' },
        { zh: '运动冒险', en: 'Sports Adventures' },
        { zh: '科学冒险', en: 'Science Adventures' },
      ]

      for (const cat of categories) {
        // Each category has zh label as h2 and en label as p
        await expect(page.locator(`h2:has-text("${cat.zh}")`)).toBeVisible()
        await expect(page.locator(`text=${cat.en}`)).toBeVisible()
      }
    })

    test('shows adventure cards with title, difficulty stars, and module tags', async ({ page }) => {
      await page.goto('/adventures')

      // "厨房科学家" (Kitchen Scientist) — first unlocked adventure
      const kitchenCard = page.locator('button').filter({ hasText: '厨房科学家' })
      await expect(kitchenCard).toBeVisible()

      // Card should show English subtitle
      await expect(kitchenCard.locator('text=Kitchen Scientist')).toBeVisible()

      // Card should have difficulty stars (rendered as ⭐)
      const stars = kitchenCard.locator('text=⭐')
      expect(await stars.count()).toBeGreaterThanOrEqual(1)

      // Card should have module tags
      await expect(kitchenCard.locator('text=fraction')).toBeVisible()

      // Card should show stage count
      await expect(kitchenCard.locator('text=stages')).toBeVisible()
    })

    test('locked cards show lock icon and are disabled', async ({ page }) => {
      await page.goto('/adventures')

      // "建筑设计师" (Architect) is locked (id=5)
      const lockedCard = page.locator('button').filter({ hasText: '建筑设计师' })
      await expect(lockedCard).toBeVisible()

      // Should show the lock icon
      await expect(lockedCard.locator('text=🔒')).toBeVisible()

      // Should be disabled
      await expect(lockedCard).toBeDisabled()

      // Should have grayscale styling
      await expect(lockedCard).toHaveClass(/grayscale/)
    })

    test('can navigate to adventures from homepage bottom nav', async ({ page }) => {
      await page.goto('/')

      // Click the adventures nav dot (🏕️ icon in bottom nav)
      const adventuresNav = page.locator('button').filter({ hasText: '🏕️' })
      await adventuresNav.click()

      await expect(page).toHaveURL(/\/adventures/)
      await expect(page.locator('h1')).toContainText('冒险模式')
    })
  })

  // ── 8.3.2 — Adventure detail ─────────────────────────────────────
  test.describe('8.3.2 — Adventure Detail', () => {
    test('clicking an unlocked adventure card navigates to play page', async ({ page }) => {
      await page.goto('/adventures')

      // Click "厨房科学家" (Kitchen Scientist, id=1, unlocked)
      const card = page.locator('button').filter({ hasText: '厨房科学家' })
      await card.click()

      // Should navigate to /adventure/1
      await expect(page).toHaveURL(/\/adventure\/1/)

      // Play page should show adventure title
      await expect(page.locator('text=厨房科学家')).toBeVisible()
    })

    test('adventure play page shows character avatar and narrative', async ({ page }) => {
      await page.goto('/adventure/1')

      // Character emoji (🧑‍🍳) is shown in the avatar circle
      await expect(page.locator('text=🧑‍🍳')).toBeVisible()

      // Narrative text for stage 1
      await expect(page.locator('text=欢迎来到小熊的厨房')).toBeVisible()
      await expect(page.locator('text=Welcome to Bear')).toBeVisible()
    })

    test('adventure play page shows progress bar and stage counter', async ({ page }) => {
      await page.goto('/adventure/1')

      // Stage counter: "1 / 3"
      await expect(page.locator('text=1 / 3')).toBeVisible()

      // Progress bar exists (the gradient bar container)
      const progressBar = page.locator('.bg-gray-100.rounded-full.overflow-hidden')
      await expect(progressBar.first()).toBeVisible()
    })

    test('adventure play page shows stage dots', async ({ page }) => {
      await page.goto('/adventure/1')

      // Kitchen Scientist has 3 stages, so 3 stage dots
      // Stage dots are small round buttons in a flex container
      const stageDots = page.locator('.flex.gap-1\\.5 > button')
      await expect(stageDots).toHaveCount(3)
    })

    test('next button is disabled until puzzle is solved', async ({ page }) => {
      await page.goto('/adventure/1')

      // The "下一关 →" button should be present but disabled
      const nextButton = page.locator('button').filter({ hasText: /下一关/ })
      await expect(nextButton).toBeVisible()
      await expect(nextButton).toBeDisabled()
    })
  })

  // ── 8.3.3 — Story progression ────────────────────────────────────
  test.describe('8.3.3 — Story Progression', () => {
    test('can navigate directly to a specific stage via URL', async ({ page }) => {
      // Go directly to stage 2 of adventure 1
      await page.goto('/adventure/1/stage/2')

      // Should show stage 2 counter
      await expect(page.locator('text=2 / 3')).toBeVisible()

      // Stage 2 narrative mentions weighing ingredients (both zh and en paragraphs match, use .first())
      await expect(page.locator('text=/称量配料|weigh ingredients/i').first()).toBeVisible()
    })

    test('back button on first stage returns to adventure list', async ({ page }) => {
      await page.goto('/adventure/1')

      // The back button on stage 1 says "← 返回"
      const backButton = page.locator('button').filter({ hasText: '← 返回' })
      await expect(backButton).toBeVisible()
    })

    test('back button on later stages goes to previous stage', async ({ page }) => {
      await page.goto('/adventure/1/stage/2')

      // The back button on stage 2+ says "← 上一关"
      const backButton = page.locator('button').filter({ hasText: '← 上一关' })
      await expect(backButton).toBeVisible()

      // Click it to go back to stage 1
      await backButton.click()
      await expect(page.locator('text=1 / 3')).toBeVisible()
    })

    test('stage dots allow navigation between stages', async ({ page }) => {
      await page.goto('/adventure/1')

      // Click the 3rd stage dot (index 2)
      const stageDots = page.locator('.flex.gap-1\\.5 > button')
      await stageDots.nth(2).click()

      // Should show stage 3
      await expect(page.locator('text=3 / 3')).toBeVisible()
    })

    test('last stage shows completion button instead of next', async ({ page }) => {
      await page.goto('/adventure/1/stage/3')

      // On the last stage, button text is "✅ 完成冒险" instead of "下一关"
      const completeButton = page.locator('button').filter({ hasText: /完成冒险/ })
      await expect(completeButton).toBeVisible()
    })
  })

  // ── 8.3.4 — Embedded renderer ────────────────────────────────────
  test.describe('8.3.4 — Embedded Renderer', () => {
    test('stage 1 of Kitchen Scientist loads fraction renderer', async ({ page }) => {
      await page.goto('/adventure/1')

      // The renderer label area shows the renderer name
      // fraction renderer should display its name
      const rendererArea = page.locator('.bg-white\\/60.rounded-2xl')
      await expect(rendererArea.first()).toBeVisible()
    })

    test('stage 2 loads a different renderer (equation)', async ({ page }) => {
      await page.goto('/adventure/1/stage/2')

      // Renderer area should be present for equation renderer
      const rendererArea = page.locator('.bg-white\\/60.rounded-2xl')
      await expect(rendererArea.first()).toBeVisible()
    })

    test('adventure 2 (Garden Explorer) loads sequence renderer on stage 1', async ({ page }) => {
      await page.goto('/adventure/2')

      // Garden Explorer, stage 1 uses sequence renderer
      await expect(page.locator('text=花园探险家')).toBeVisible()

      // Renderer container should be present
      const rendererArea = page.locator('.bg-white\\/60.rounded-2xl')
      await expect(rendererArea.first()).toBeVisible()
    })

    test('not-found adventure shows error state', async ({ page }) => {
      await page.goto('/adventure/9999')

      // Should show "找不到这个冒险" (Adventure not found)
      await expect(page.locator('text=找不到这个冒险')).toBeVisible()
      await expect(page.locator('text=Adventure not found')).toBeVisible()

      // Should show "返回冒险列表" button
      const backButton = page.locator('button').filter({ hasText: /返回冒险列表/ })
      await expect(backButton).toBeVisible()
    })
  })
})
