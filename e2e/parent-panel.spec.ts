import { test, expect } from '@playwright/test'

/**
 * TEST_CHECKLIST coverage:
 *   8.4.1 — Parent panel shows learning time
 *   8.4.2 — Parent panel does NOT show accuracy/score/ranking
 *   8.4.3 — Module progress is displayed
 *   8.4.4 — Settings controls (sound, haptic, language, daily limit)
 *   10.9  — Anxiety firewall: no right/wrong data visible
 */

test.describe('Parent Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/parent')
    // Wait for the panel header to be visible
    await expect(page.locator('h1')).toBeVisible()
  })

  // ── 8.4.1 Time display ───────────────────────────────────────────
  test('8.4.1 — displays learning time stat card', async ({ page }) => {
    // The overview section has 4 stat cards in a 2x2 grid.
    // One of them shows "学习时间" (zh) or "Time Spent" (en).
    const timeCard = page.locator('text=/学习时间|Time Spent/').first()
    await expect(timeCard).toBeVisible()

    // The card should also show a time value (e.g. "0 min" or "Xh Ym")
    const statSection = page.locator('.grid-cols-2').first()
    await expect(statSection).toBeVisible()

    // Verify all 4 stat cards are rendered
    const statCards = statSection.locator('> div')
    await expect(statCards).toHaveCount(4)

    // Confirm other stat labels: "已完成"/"Completed", "连续天数"/"Streak", "已探索"/"Explored"
    await expect(page.locator('text=/已完成|Completed/')).toBeVisible()
    await expect(page.locator('text=/连续天数|Streak/')).toBeVisible()
    await expect(page.locator('text=/已探索|Explored/')).toBeVisible()
  })

  // ── 8.4.2 & 10.9 — No accuracy / score / ranking ─────────────────
  test('8.4.2 + 10.9 — does NOT show accuracy, score, ranking, or error data', async ({ page }) => {
    const bodyText = await page.locator('body').innerText()

    // These terms must NOT appear anywhere on the parent panel
    const forbiddenTerms = [
      '正确率',
      'accuracy',
      '得分',
      'score',
      '排名',
      'rank',
      '错误',
      'wrong',
      'incorrect',
      '对错',
      '错题',
    ]

    for (const term of forbiddenTerms) {
      expect(
        bodyText.toLowerCase(),
        `Forbidden term "${term}" must not appear in parent panel`,
      ).not.toContain(term.toLowerCase())
    }
  })

  // ── 8.4.3 — Module progress ──────────────────────────────────────
  test('8.4.3 — displays module progress section with all 8 modules', async ({ page }) => {
    // The "模块进度" / "Module Progress" section header
    await expect(page.locator('text=/模块进度|Module Progress/')).toBeVisible()

    // 8 modules are listed: Symmetry, Fractions, Geometry, Derivatives, Equations, Matrix, Sequences, Probability
    const moduleNames = [
      '对称之美', 'Symmetry',
      '分数奇趣', 'Fractions',
      '几何探索', 'Geometry',
      '微积分启蒙', 'Derivatives',
      '方程冒险', 'Equations',
      '矩阵世界', 'Matrix',
      '序列密码', 'Sequences',
      '概率乐园', 'Probability',
    ]

    // Check that at least one language variant of each module is visible
    for (let i = 0; i < moduleNames.length; i += 2) {
      const zhName = moduleNames[i]
      const enName = moduleNames[i + 1]
      const moduleLocator = page.locator(`text=/${zhName}|${enName}/`)
      await expect(moduleLocator.first()).toBeVisible()
    }

    // Each module card should contain a completion percentage (e.g. "0%")
    const percentages = page.locator('text=/%/')
    expect(await percentages.count()).toBeGreaterThanOrEqual(8)
  })

  // ── 8.4.4 — Settings controls ────────────────────────────────────
  test('8.4.4 — settings section has sound, haptic, language, and time limit controls', async ({ page }) => {
    // Settings section header
    await expect(page.locator('text=/设置|Settings/').first()).toBeVisible()

    // Sound toggle
    const soundRow = page.locator('text=/音效|Sound/').first()
    await expect(soundRow).toBeVisible()

    // Haptic toggle
    const hapticRow = page.locator('text=/振动|Haptic/').first()
    await expect(hapticRow).toBeVisible()

    // Language select
    const langRow = page.locator('text=/语言|Language/').first()
    await expect(langRow).toBeVisible()
    const langSelect = page.locator('select').filter({ has: page.locator('option[value="zh"]') })
    await expect(langSelect.first()).toBeVisible()

    // Daily time limit select
    const timeLimitRow = page.locator('text=/每日时间限制|Daily Time Limit/').first()
    await expect(timeLimitRow).toBeVisible()
    const timeLimitSelect = page.locator('select').filter({ has: page.locator('option[value="15"]') })
    await expect(timeLimitSelect.first()).toBeVisible()
  })

  test('8.4.4 — sound toggle can be clicked', async ({ page }) => {
    // ParentPanel's ToggleRow uses bg-blue-500 (on) / bg-gray-300 (off).
    // Target the in-page toggle via the blue-500 class to avoid the off-screen SettingsDrawer.
    const soundToggle = page.locator('button.bg-blue-500, button.bg-gray-300').first()

    await soundToggle.scrollIntoViewIfNeeded()
    await expect(soundToggle).toBeVisible()

    // Default is ON (bg-blue-500)
    await expect(soundToggle).toHaveClass(/bg-blue-500/)

    // Click to toggle off
    await soundToggle.click()
    await page.waitForTimeout(200)
    await expect(soundToggle).toHaveClass(/bg-gray-300/)

    // Click to toggle back on
    await soundToggle.click()
    await page.waitForTimeout(200)
    await expect(soundToggle).toHaveClass(/bg-blue-500/)
  })

  test('8.4.4 — language select can be changed', async ({ page }) => {
    const langSelect = page.locator('select').filter({ has: page.locator('option[value="zh"]') }).first()

    // Switch to English
    await langSelect.selectOption('en')

    // After switching language, the panel header should now say "Parent Panel"
    await expect(page.locator('h1')).toHaveText('Parent Panel')

    // Switch back to Chinese
    await langSelect.selectOption('zh')
    await expect(page.locator('h1')).toHaveText('家长面板')
  })

  test('8.4.4 — daily time limit select works', async ({ page }) => {
    const timeLimitSelect = page.locator('select').filter({ has: page.locator('option[value="15"]') }).first()

    // Select 30 minutes
    await timeLimitSelect.selectOption('30')
    await expect(timeLimitSelect).toHaveValue('30')

    // Select unlimited
    await timeLimitSelect.selectOption('unlimited')
    await expect(timeLimitSelect).toHaveValue('unlimited')
  })

  // ── Navigation ────────────────────────────────────────────────────
  test('can navigate to parent panel from homepage', async ({ page }) => {
    await page.goto('/')
    // Click the parent panel button (family emoji in top-left)
    await page.locator('button').filter({ hasText: '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}' }).first().click()
    await expect(page).toHaveURL(/\/parent/)
    await expect(page.locator('h1')).toBeVisible()
  })
})
